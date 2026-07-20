import { create } from 'zustand';
import { GameController, type GameState, type GameResults, type NoteHitEvent } from './GameController';
import type { ScoreState } from '../engine/ScoreEngine';
import type { TimingGrade } from '../engine/TimingEngine';
import type { Song } from '../data/songs/types';
import { saveResult, type RecordUpdate } from './records';
import { recordGameResult, type ProgressUpdate } from './progression';
import { loadSettings, saveSettings, type GameSettings } from './settings';

// Screens
export type Screen = 'title' | 'songSelect' | 'game' | 'results' | 'profile';

export interface RecentHit {
  grade: TimingGrade;
  key: string;
  note: string;
  deltaMs: number; // signed: negative = early, positive = late
  timestamp: number;
}

export interface Toast {
  id: number;
  icon: string;
  title: string;
  desc: string;
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
  lastDeltaMs: number | null;

  // Results metadata
  recordInfo: RecordUpdate | null;
  progressInfo: ProgressUpdate | null;

  // Settings
  settings: GameSettings;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  updateSettings: (patch: Partial<GameSettings>) => void;

  // Toasts (achievement popups etc.)
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;

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
const initialSettings = loadSettings();
controller.inputOffsetMs = initialSettings.inputOffsetMs;
controller.audioEngine.setVolume(initialSettings.volume);

let toastCounter = 0;

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
            // Persist the run: records, XP, achievements — then show results
            const results = controller.getResults();
            let recordInfo: RecordUpdate | null = null;
            let progressInfo: ProgressUpdate | null = null;
            if (results) {
              recordInfo = saveResult(results.song.id, results.layerIndex, {
                score: results.score.score,
                accuracy: results.score.accuracy,
                grade: results.grade,
                maxCombo: results.score.maxCombo,
                fullCombo: results.score.misses === 0 && results.score.totalNotes > 0,
              });
              progressInfo = recordGameResult(results);
              controller.audioEngine.playResultJingle(results.grade);
              // Toast each new achievement
              for (const ach of progressInfo.newAchievements) {
                get().pushToast({ icon: ach.icon, title: ach.name, desc: ach.desc });
              }
              if (progressInfo.levelAfter > progressInfo.levelBefore) {
                get().pushToast({
                  icon: '🆙',
                  title: `Level ${progressInfo.levelAfter}!`,
                  desc: 'Keep playing to unlock more',
                });
              }
            }
            set({ screen: 'results', recordInfo, progressInfo });
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
            deltaMs: hit.deltaMs,
            timestamp: Date.now(),
          },
        ].slice(-10);
        set({
          recentHits: newHits,
          lastGrade: hit.grade,
          lastDeltaMs: hit.deltaMs,
        });
        break;
      }
      case 'noteMiss': {
        // Timed-out note (never pressed) — no timing delta to show
        set({ lastGrade: 'miss', lastDeltaMs: null });
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
    lastDeltaMs: null,
    recordInfo: null,
    progressInfo: null,

    settings: initialSettings,
    settingsOpen: false,
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    updateSettings: (patch) => {
      const settings = { ...get().settings, ...patch };
      saveSettings(settings);
      controller.inputOffsetMs = settings.inputOffsetMs;
      controller.audioEngine.setVolume(settings.volume);
      set({ settings });
    },

    toasts: [],
    pushToast: (toast) => {
      const id = ++toastCounter;
      set({ toasts: [...get().toasts, { ...toast, id }] });
      setTimeout(() => get().dismissToast(id), 4500);
    },
    dismissToast: (id) => {
      set({ toasts: get().toasts.filter(t => t.id !== id) });
    },

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
        lastDeltaMs: null,
        recordInfo: null,
        progressInfo: null,
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
      controller.audioEngine.releaseAll();
      set({
        screen: 'songSelect',
        gameState: 'idle',
        scoreState: null,
        countdownValue: null,
        recentHits: [],
        lastGrade: null,
        lastDeltaMs: null,
      });
    },
  };
});
