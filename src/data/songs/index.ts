import type { Song } from './types';
import odeToJoy from './ode-to-joy';
import sevenNationArmy from './seven-nation-army';
import stillDre from './still-dre';
import dontStopBelievin from './dont-stop-believin';
import furElise from './fur-elise';
import clocks from './clocks';
import jump from './jump';

export const SONG_LIBRARY: Song[] = [
  sevenNationArmy,
  odeToJoy,
  stillDre,
  dontStopBelievin,
  furElise,
  clocks,
  jump,
];

export function getSongById(id: string): Song | undefined {
  return SONG_LIBRARY.find(s => s.id === id);
}

export type { Song, SongNote, SongLayer, SongSection } from './types';
