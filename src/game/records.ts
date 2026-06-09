import type { LetterGrade } from '../engine/ScoreEngine';

export interface SongRecord {
  score: number;
  accuracy: number;
  grade: LetterGrade;
  maxCombo: number;
  fullCombo: boolean;
  plays: number;
}

export interface RecordUpdate {
  record: SongRecord;
  newBestScore: boolean;
  newBestAccuracy: boolean;
  firstPlay: boolean;
}

const STORAGE_KEY = 'keytar-records-v1';

const GRADE_ORDER: Record<LetterGrade, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, F: 0 };

function recordKey(songId: string, layerIndex: number): string {
  return `${songId}:${layerIndex}`;
}

function loadAll(): Record<string, SongRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(records: Record<string, SongRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage unavailable (private mode, quota) — records just won't persist
  }
}

export function getRecord(songId: string, layerIndex: number): SongRecord | null {
  return loadAll()[recordKey(songId, layerIndex)] ?? null;
}

// Best grade across all layers of a song (for the song card badge)
export function getBestGradeForSong(songId: string, layerCount: number): LetterGrade | null {
  const all = loadAll();
  let best: LetterGrade | null = null;
  for (let i = 0; i < layerCount; i++) {
    const rec = all[recordKey(songId, i)];
    if (rec && (best === null || GRADE_ORDER[rec.grade] > GRADE_ORDER[best])) {
      best = rec.grade;
    }
  }
  return best;
}

export function saveResult(
  songId: string,
  layerIndex: number,
  result: { score: number; accuracy: number; grade: LetterGrade; maxCombo: number; fullCombo: boolean },
): RecordUpdate {
  const all = loadAll();
  const key = recordKey(songId, layerIndex);
  const prev = all[key];

  const firstPlay = !prev;
  const newBestScore = !prev || result.score > prev.score;
  const newBestAccuracy = !prev || result.accuracy > prev.accuracy;

  const record: SongRecord = {
    score: Math.max(result.score, prev?.score ?? 0),
    accuracy: Math.max(result.accuracy, prev?.accuracy ?? 0),
    grade:
      !prev || GRADE_ORDER[result.grade] > GRADE_ORDER[prev.grade] ? result.grade : prev.grade,
    maxCombo: Math.max(result.maxCombo, prev?.maxCombo ?? 0),
    fullCombo: result.fullCombo || (prev?.fullCombo ?? false),
    plays: (prev?.plays ?? 0) + 1,
  };

  all[key] = record;
  saveAll(all);

  return { record, newBestScore, newBestAccuracy, firstPlay };
}
