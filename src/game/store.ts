import { create } from 'zustand';
import { GameController, type GameState, type GameResults, type NoteHitEvent } from './GameController';
import type { ScoreState } from '../engine/ScoreEngine';
import type { TimingGrade } from '../engine/TimingEngine';
import type { Song } from '../data/songs/types';

// Screens
export type Screen = 'title' | 'songSelect' | 'game' | 'results';

interface RecentHit {
  grade: TimingGrade;
  key: string;
  note: string;
  timestamp: number;
}

interface GameStore {
  // Navigation
  screen: Screen;
  setScreen: (screen: Screen) => void;

  // Game controller (singleton)
  controller: GameController;

  // Game state mirror (reactive)
  gameState: GameState;
  scoreState: ScoreState | null;
  countdownValue: number | null;

  // Current song info
  selectedSong: Song | null;
  selectedLayer: number;

  // Visual feedback state
  recentHits: RecentHit[];
  pressedKeys: Set<string>;
  lastGrade: TimingGrade | null;

  // Speed control
  speed: number;

  // Metronome
  metronome: boolean;

  // Actions
  selectSong: (song: Song, layer?: number) => void;
  startGame: () => Promise<void>;
  setSpeed: (speed: number) => void;
  toggleMetronome: () => void;
  getResults: () => GameResults | null;
  returnToMenu: () => void;
}

const controller = new GameController();

export const useGameStore = create<GameStore>((set, get) => {
  // Set up controller event listeners
  controller.on((event) => {
    switch (event.type) {
      case 'stateChange': {
        const data = event.data as string;
        if (typeof data === 'string' && data.startsWith('countdown:')) {
          const val = parseInt(data.split(':')[1]);
          set({ countdownValue: val, gameState: 'countdown' });
        } else {
          set({
            gameState: data as GameState,
            countdownValue: null,
          });
          if (data === 'results') {
            set({ screen: 'results' });
          }
        }
        break;
      }
      case 'noteHit': {
        const hit = event.data as NoteHitEvent;
        const recentHits = get().recentHits;
        const newHits = [
          ...recentHits.filter(h => Date.now() - h.timestamp < 500),
          {
            grade: hit.grade,
            key: hit.key,
            note: hit.note,
            timestamp: Date.now(),
          },
        ].slice(-10);
        set({
          recentHits: newHits,
          lastGrade: hit.grade,
        });
        break;
      }
      case 'noteMiss': {
        set({ lastGrade: 'miss' });
        break;
      }
      case 'scoreUpdate': {
        set({ scoreState: event.data as ScoreState });
        break;
      }
    }
  });

  return {
    screen: 'title',
    setScreen: (screen) => set({ screen }),

    controller,

    gameState: 'idle',
    scoreState: null,
    countdownValue: null,

    selectedSong: null,
    selectedLayer: 0,

    recentHits: [],
    pressedKeys: new Set(),
    lastGrade: null,

    speed: 1.0,
    metronome: false,

    selectSong: (song, layer = 0) => {
      set({ selectedSong: song, selectedLayer: layer });
    },

    startGame: async () => {
      const { selectedSong, selectedLayer, speed, metronome } = get();
      if (!selectedSong) return;

      await controller.loadSong(selectedSong, selectedLayer);
      controller.setSpeed(speed);
      controller.metronomeEnabled = metronome;
      set({
        screen: 'game',
        scoreState: null,
        recentHits: [],
        lastGrade: null,
      });
      await controller.startGame();
    },

    setSpeed: (speed) => {
      set({ speed });
      controller.setSpeed(speed);
    },

    toggleMetronome: () => {
      const next = !get().metronome;
      set({ metronome: next });
      controller.metronomeEnabled = next;
    },

    getResults: () => controller.getResults(),

    returnToMenu: () => {
      controller.inputHandler.stop();
      controller.timingEngine.stop();
      set({
        screen: 'songSelect',
        gameState: 'idle',
        scoreState: null,
        countdownValue: null,
        recentHits: [],
        lastGrade: null,
      });
    },
  };
});
