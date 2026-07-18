// Player progression: XP, levels, lifetime stats, and achievements
import type { GameResults } from './GameController';
import { GENRE_VOICE_MAP } from '../engine/AudioEngine';
import { SONG_LIBRARY } from '../data/songs';

export interface LifetimeStats {
  plays: number;
  notesHit: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  totalScore: number;
  bestCombo: number;
  playTimeSec: number;
  songsPlayed: string[];
  genresPlayed: string[];
  fullCombos: number;
  sRanks: number;
}

export interface AchievementDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface ProgressState {
  xp: number;
  stats: LifetimeStats;
  achievements: Record<string, number>; // id -> unlock timestamp
}

export interface LevelInfo {
  level: number;
  intoLevel: number;   // xp earned within the current level
  neededForNext: number; // xp needed to go from this level to the next
  progress: number;    // 0-1 through the current level
}

export interface ProgressUpdate {
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  levelInfo: LevelInfo;
  newAchievements: AchievementDef[];
}

const STORAGE_KEY = 'keytar-progress-v1';

const EMPTY_STATS: LifetimeStats = {
  plays: 0,
  notesHit: 0,
  perfects: 0,
  greats: 0,
  goods: 0,
  misses: 0,
  totalScore: 0,
  bestCombo: 0,
  playTimeSec: 0,
  songsPlayed: [],
  genresPlayed: [],
  fullCombos: 0,
  sRanks: 0,
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-song', icon: '🎵', name: 'First Steps', desc: 'Complete your first song' },
  { id: 'full-combo', icon: '⚡', name: 'Flawless', desc: 'Finish a song with no misses' },
  { id: 's-rank', icon: '🌟', name: 'Superstar', desc: 'Earn an S grade' },
  { id: 'combo-50', icon: '🔥', name: 'Half Century', desc: 'Reach a 50 combo' },
  { id: 'combo-100', icon: '💯', name: 'Century', desc: 'Reach a 100 combo' },
  { id: 'precision', icon: '🎯', name: 'Precision', desc: '90% perfect hits in one song' },
  { id: 'speed-125', icon: '🚀', name: 'Overdrive', desc: 'Clear a song at 1.25x+ with 80%+ accuracy' },
  { id: 'speed-200', icon: '🌪️', name: 'Ludicrous Speed', desc: 'Clear a song at 2x speed' },
  { id: 'explorer', icon: '🗺️', name: 'Crate Digger', desc: 'Play every song in the library' },
  { id: 'five-a', icon: '🏅', name: 'Honor Roll', desc: 'A grade or better on 5 different songs' },
  { id: 'all-voices', icon: '🎹', name: 'Multi-Instrumentalist', desc: 'Play songs using all 4 synth voices' },
  { id: 'notes-1000', icon: '🎼', name: 'Thousand Notes', desc: 'Hit 1,000 notes lifetime' },
  { id: 'notes-10000', icon: '🎻', name: 'Ten Thousand Hours', desc: 'Hit 10,000 notes lifetime' },
  { id: 'plays-25', icon: '📀', name: 'Regular', desc: 'Play 25 songs' },
  { id: 'plays-100', icon: '💿', name: 'Resident', desc: 'Play 100 songs' },
  { id: 'level-5', icon: '⭐', name: 'Rising Star', desc: 'Reach level 5' },
  { id: 'level-10', icon: '👑', name: 'Virtuoso', desc: 'Reach level 10' },
];

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { xp: 0, stats: { ...EMPTY_STATS }, achievements: {} };
    const parsed = JSON.parse(raw);
    return {
      xp: Number(parsed.xp) || 0,
      stats: { ...EMPTY_STATS, ...(parsed.stats ?? {}) },
      achievements: parsed.achievements ?? {},
    };
  } catch {
    return { xp: 0, stats: { ...EMPTY_STATS }, achievements: {} };
  }
}

function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — progress just won't persist
  }
}

// XP needed to advance FROM a given level to the next
function xpCostForLevel(level: number): number {
  return 500 + (level - 1) * 250;
}

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpCostForLevel(level)) {
    remaining -= xpCostForLevel(level);
    level++;
  }
  return {
    level,
    intoLevel: remaining,
    neededForNext: xpCostForLevel(level),
    progress: remaining / xpCostForLevel(level),
  };
}

function xpForResult(results: GameResults): number {
  const { score, grade } = results;
  let xp = Math.round(score.score / 50) + 25; // base + clear bonus
  if (score.misses === 0 && score.totalNotes > 0) xp += 150;
  if (score.accuracy >= 95) xp += 100;
  else if (score.accuracy >= 90) xp += 50;
  if (grade === 'S') xp += 75;
  return xp;
}

// Number of distinct songs with an A grade or better, from the records store
function countHighGradeSongs(): number {
  try {
    const raw = localStorage.getItem('keytar-records-v1');
    if (!raw) return 0;
    const records = JSON.parse(raw) as Record<string, { grade: string }>;
    const songs = new Set<string>();
    for (const [key, rec] of Object.entries(records)) {
      if (rec.grade === 'S' || rec.grade === 'A') {
        songs.add(key.split(':')[0]);
      }
    }
    return songs.size;
  } catch {
    return 0;
  }
}

export function recordGameResult(results: GameResults): ProgressUpdate {
  const state = loadProgress();
  const { score, song, speed, grade } = results;

  const levelBefore = getLevelInfo(state.xp).level;
  const xpGained = xpForResult(results);
  state.xp += xpGained;

  // Update lifetime stats
  const s = state.stats;
  s.plays++;
  s.perfects += score.perfects;
  s.greats += score.greats;
  s.goods += score.goods;
  s.misses += score.misses;
  s.notesHit += score.perfects + score.greats + score.goods;
  s.totalScore += score.score;
  s.bestCombo = Math.max(s.bestCombo, score.maxCombo);
  if (!s.songsPlayed.includes(song.id)) s.songsPlayed.push(song.id);
  if (!s.genresPlayed.includes(song.genre)) s.genresPlayed.push(song.genre);
  const fullCombo = score.misses === 0 && score.totalNotes > 0;
  if (fullCombo) s.fullCombos++;
  if (grade === 'S') s.sRanks++;
  // Approximate play time from the chart length at the played speed
  const layer = song.layers[results.layerIndex];
  if (layer && layer.notes.length > 0) {
    const lastNote = layer.notes[layer.notes.length - 1];
    const beats = lastNote.beat + lastNote.duration;
    s.playTimeSec += Math.round((beats / (song.bpm * speed)) * 60);
  }

  const levelInfo = getLevelInfo(state.xp);

  // Evaluate achievements
  const voicesPlayed = new Set(s.genresPlayed.map(g => GENRE_VOICE_MAP[g] ?? 'piano'));
  const checks: Record<string, boolean> = {
    'first-song': s.plays >= 1,
    'full-combo': fullCombo || s.fullCombos > 0,
    's-rank': grade === 'S' || s.sRanks > 0,
    'combo-50': s.bestCombo >= 50,
    'combo-100': s.bestCombo >= 100,
    'precision': score.totalNotes >= 20 && score.perfects / score.totalNotes >= 0.9,
    'speed-125': speed >= 1.25 && score.accuracy >= 80,
    'speed-200': speed >= 2 && score.accuracy >= 60,
    'explorer': s.songsPlayed.length >= SONG_LIBRARY.length,
    'five-a': countHighGradeSongs() >= 5,
    'all-voices': voicesPlayed.size >= 4,
    'notes-1000': s.notesHit >= 1000,
    'notes-10000': s.notesHit >= 10000,
    'plays-25': s.plays >= 25,
    'plays-100': s.plays >= 100,
    'level-5': levelInfo.level >= 5,
    'level-10': levelInfo.level >= 10,
  };

  const newAchievements: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (checks[def.id] && !state.achievements[def.id]) {
      state.achievements[def.id] = Date.now();
      newAchievements.push(def);
    }
  }

  saveProgress(state);

  return {
    xpGained,
    levelBefore,
    levelAfter: levelInfo.level,
    levelInfo,
    newAchievements,
  };
}
