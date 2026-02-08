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
  private heldNotes: Map<string, string> = new Map(); // key -> note being sustained
  metronomeEnabled = false;
  private lastMetronomeBeat = -1;

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
    this.heldNotes.clear();
    this.lastMetronomeBeat = -1;
    this.inputHandler.start((event: KeyEvent) => {
      if (event.type === 'down') {
        this.handleKeyPress(event);
      } else if (event.type === 'up') {
        this.handleKeyRelease(event);
      }
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

      // Sustain: start the note and track it for release
      if (result.grade !== 'miss') {
        this.audioEngine.attackNote(note, result.grade === 'perfect' ? 0.8 : 0.6);
        this.heldNotes.set(event.key, note);
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
      // Key pressed but no matching note nearby — play sustained note (free play feel)
      this.audioEngine.attackNote(note, 0.3);
      this.heldNotes.set(event.key, note);
    }
  }

  private handleKeyRelease(event: KeyEvent): void {
    const note = this.heldNotes.get(event.key);
    if (note) {
      this.audioEngine.releaseNote(note);
      this.heldNotes.delete(event.key);
    }
  }

  private gameLoop = (): void => {
    if (this.state !== 'playing') return;

    // Metronome
    if (this.metronomeEnabled) {
      const beat = Math.floor(this.timingEngine.getCurrentBeat());
      if (beat > this.lastMetronomeBeat && beat >= 0) {
        this.lastMetronomeBeat = beat;
        const ts = this.currentSong?.timeSignature?.[0] ?? 4;
        this.audioEngine.playMetronomeTick(beat % ts === 0);
      }
    }

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
    this.heldNotes.clear();
    this.inputHandler.start((event: KeyEvent) => {
      if (event.type === 'down') {
        this.handleKeyPress(event);
      } else if (event.type === 'up') {
        this.handleKeyRelease(event);
      }
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
