// Persistent player settings

export interface GameSettings {
  volume: number;        // 0-1 master volume
  inputOffsetMs: number; // positive = your inputs register late, we compensate
  scrollSpeed: number;   // 0.5-2, multiplies note approach speed
  keyHints: boolean;     // highlight upcoming keys on the keyboard
}

export const DEFAULT_SETTINGS: GameSettings = {
  volume: 0.8,
  inputOffsetMs: 0,
  scrollSpeed: 1,
  keyHints: true,
};

const STORAGE_KEY = 'keytar-settings-v1';

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      volume: clamp(Number(parsed.volume ?? DEFAULT_SETTINGS.volume), 0, 1),
      inputOffsetMs: clamp(Number(parsed.inputOffsetMs ?? 0), -200, 200),
      scrollSpeed: clamp(Number(parsed.scrollSpeed ?? 1), 0.5, 2),
      keyHints: parsed.keyHints !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable — settings just won't persist
  }
}

function clamp(v: number, min: number, max: number): number {
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min;
}
