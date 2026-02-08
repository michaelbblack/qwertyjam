import { AudioEngine } from '../engine/AudioEngine';
import { TimingEngine, type TimingGrade } from '../engine/TimingEngine';
import { ScoreEngine, type ScoreState, type LetterGrade } from '../engine/ScoreEngine';
import { InputHandler, type KeyEvent } from './InputHandler';
import { DEFAULT_KEYMAP, buildNoteToKeysMap, type KeyMapping } from '../data/keymap';
import type { Song } from '../data/songs/types';

export type GameState = 'idle' | 'loading' | 'countdown' | 'playing' | 'paused' | 'results';

export interface GameEvent {
  type: 'noteHit' | 'noteMiss' | 'comboMilestone' | 'stateChange' | 'scoreUpdate';
  data?: unknown;
}

export type GameEventCallback = (event: GameEvent) => void;

export interface NoteHitEvent {
  noteIndex: number;
  grade: TimingGrade;
  deltaMs: number;
  note: string;
  key: string;
}

export interface GameResults {
  song: Song;
  layerIndex: number;
  score: ScoreState;
  grade: LetterGrade;
  speed: number;
}

export class GameController {
  readonly audioEngine: AudioEngine;
  readonly timingEngine: TimingEngine;
  readonly scoreEngine: ScoreEngine;
  readonly inputHandler: InputHandler;

  private state: GameState = 'idle';
  private currentSong: Song | null = null;
  private currentLayer = 0;
  private keymap: KeyMapping = DEFAULT_KEYMAP;
  private noteToKeys: Record<string, string[]>;
  private listeners: GameEventCallback[] = [];
  private animFrameId: number | null = null;
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.audioEngine = new AudioEngine();
    this.timingEngine = new TimingEngine(120);
    this.scoreEngine = new ScoreEngine();
    this.inputHandler = new InputHandler();
    this.noteToKeys = buildNoteToKeysMap(this.keymap);
  }

  getState(): GameState {
    return this.state;
  }

  private setState(newState: GameState): void {
    this.state = newState;
    this.emit({ type: 'stateChange', data: newState });
  }

  on(callback: GameEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  async loadSong(song: Song, layerIndex = 0): Promise<void> {
    this.setState('loading');
    this.currentSong = song;
    this.currentLayer = layerIndex;

    await this.audioEngine.init();

    const layer = song.layers[layerIndex];
    if (!layer) throw new Error(`Layer ${layerIndex} not found`);

    this.timingEngine.bpm = song.bpm;
    this.timingEngine.buildSchedule(layer.notes);
    this.scoreEngine.reset();

    this.setState('idle');
  }

  async startGame(): Promise<void> {
    if (!this.currentSong) throw new Error('No song loaded');

    await this.audioEngine.init();
    this.setState('countdown');

    // 3-2-1 countdown
    let count = 3;
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (count <= 0) {
          resolve();
          return;
        }
        this.emit({ type: 'stateChange', data: `countdown:${count}` });
        count--;
        this.countdownTimer = setTimeout(tick, 700);
      };
      tick();
    });

    this.setState('playing');
    this.timingEngine.start();

    // Start input handling
    this.inputHandler.start((event: KeyEvent) => {
      if (event.type !== 'down') return;
      this.handleKeyPress(event);
    });

    // Start game loop
    this.gameLoop();
  }

  private handleKeyPress(event: KeyEvent): void {
    if (this.state !== 'playing') return;

    const note = this.keymap[event.key];
    if (!note) return;

    const currentTime = this.timingEngine.getCurrentTime();
    const result = this.timingEngine.gradeInput(note, currentTime);

    if (result) {
      const scoreState = this.scoreEngine.registerHit(result.grade);

      // Play the note sound
      if (result.grade !== 'miss') {
        this.audioEngine.playNote(note, '8n', result.grade === 'perfect' ? 0.8 : 0.6);
      } else {
        this.audioEngine.playMissSound();
      }

      this.emit({
        type: 'noteHit',
        data: {
          noteIndex: result.noteIndex,
          grade: result.grade,
          deltaMs: result.deltaMs,
          note,
          key: event.key,
        } as NoteHitEvent,
      });

      this.emit({ type: 'scoreUpdate', data: scoreState });

      // Check combo milestones
      if (scoreState.combo > 0 && scoreState.combo % 25 === 0) {
        this.audioEngine.playComboSound(scoreState.combo);
        this.emit({ type: 'comboMilestone', data: scoreState.combo });
      }
    } else {
      // Key pressed but no matching note nearby — play the note anyway (free play feel)
      this.audioEngine.playNote(note, '8n', 0.3);
    }
  }

  private gameLoop = (): void => {
    if (this.state !== 'playing') return;

    // Check for missed notes
    const missed = this.timingEngine.checkMissedNotes();
    for (const noteIndex of missed) {
      const scoreState = this.scoreEngine.registerHit('miss');
      this.emit({
        type: 'noteMiss',
        data: { noteIndex },
      });
      this.emit({ type: 'scoreUpdate', data: scoreState });
    }

    // Check if song is complete
    const currentTime = this.timingEngine.getCurrentTime();
    const songDuration = this.timingEngine.getSongDuration();

    if (currentTime >= songDuration || this.timingEngine.isComplete()) {
      this.endGame();
      return;
    }

    this.animFrameId = requestAnimationFrame(this.gameLoop);
  };

  private endGame(): void {
    this.inputHandler.stop();
    this.timingEngine.stop();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.setState('results');
  }

  getResults(): GameResults | null {
    if (!this.currentSong) return null;
    return {
      song: this.currentSong,
      layerIndex: this.currentLayer,
      score: this.scoreEngine.getState(),
      grade: this.scoreEngine.getLetterGrade(),
      speed: this.timingEngine.speedMultiplier,
    };
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.inputHandler.stop();
    this.timingEngine.stop();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.setState('playing');
    this.timingEngine.start();
    this.inputHandler.start((event: KeyEvent) => {
      if (event.type !== 'down') return;
      this.handleKeyPress(event);
    });
    this.gameLoop();
  }

  setSpeed(speed: number): void {
    this.timingEngine.setSpeed(speed);
  }

  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  getCurrentLayer(): number {
    return this.currentLayer;
  }

  dispose(): void {
    this.inputHandler.stop();
    this.timingEngine.stop();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
    }
    this.audioEngine.dispose();
  }
}
