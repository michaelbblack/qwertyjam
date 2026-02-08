// Key-to-note mapping
// Three keyboard rows = three octave ranges
// Left-to-right = low-to-high within each row
// Number row = sharps/flats

export interface KeyMapping {
  [key: string]: string; // key -> note (e.g., 'a' -> 'C4')
}

export const DEFAULT_KEYMAP: KeyMapping = {
  // Number row — sharps/flats
  '1': 'C#3', '2': 'D#3', '3': 'F#3', '4': 'G#3', '5': 'A#3',
  '6': 'C#4', '7': 'D#4', '8': 'F#4', '9': 'G#4', '0': 'A#4',

  // Top row (QWERTY) — octave 5-6
  'q': 'C5', 'w': 'D5', 'e': 'E5', 'r': 'F5', 't': 'G5',
  'y': 'A5', 'u': 'B5', 'i': 'C6', 'o': 'D6', 'p': 'E6',

  // Home row (ASDF) — octave 4-5
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4',
  'h': 'A4', 'j': 'B4', 'k': 'C5', 'l': 'D5', ';': 'E5',

  // Bottom row (ZXCV) — octave 3-4
  'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3',
  'n': 'A3', 'm': 'B3', ',': 'C4', '.': 'D4', '/': 'E4',
};

// Reverse mapping: note -> keys (multiple keys can map to same note)
export function buildNoteToKeysMap(keymap: KeyMapping): Record<string, string[]> {
  const noteToKeys: Record<string, string[]> = {};
  for (const [key, note] of Object.entries(keymap)) {
    if (!noteToKeys[note]) noteToKeys[note] = [];
    noteToKeys[note].push(key);
  }
  return noteToKeys;
}

// Get the keyboard row for a given key
export type KeyRow = 'number' | 'top' | 'home' | 'bottom';

const ROW_KEYS: Record<KeyRow, string[]> = {
  number: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  top: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  home: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  bottom: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
};

export function getKeyRow(key: string): KeyRow | null {
  for (const [row, keys] of Object.entries(ROW_KEYS)) {
    if (keys.includes(key.toLowerCase())) return row as KeyRow;
  }
  return null;
}

export function getRowKeys(row: KeyRow): string[] {
  return ROW_KEYS[row];
}

export const ALL_ROWS: KeyRow[] = ['number', 'top', 'home', 'bottom'];

// Row colors for visual display
export const ROW_COLORS: Record<KeyRow, string> = {
  number: '#ff6b9d',  // pink for sharps
  top: '#c084fc',     // purple
  home: '#60a5fa',    // blue
  bottom: '#34d399',  // green
};
