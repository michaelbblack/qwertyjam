import type { Song } from './types';
import odeToJoy from './ode-to-joy';
import sevenNationArmy from './seven-nation-army';
import stillDre from './still-dre';
import dontStopBelievin from './dont-stop-believin';
import furElise from './fur-elise';
import clocks from './clocks';
import jump from './jump';
import amazingGrace from './amazing-grace';
import canonInD from './canon-in-d';
import greensleeves from './greensleeves';
import korobeiniki from './korobeiniki';
import habanera from './habanera';
import theEntertainer from './the-entertainer';
import mountainKing from './hall-of-the-mountain-king';
import williamTell from './william-tell';

// Ordered roughly by difficulty for a natural progression
export const SONG_LIBRARY: Song[] = [
  amazingGrace,
  odeToJoy,
  canonInD,
  greensleeves,
  sevenNationArmy,
  stillDre,
  habanera,
  korobeiniki,
  dontStopBelievin,
  furElise,
  clocks,
  theEntertainer,
  mountainKing,
  jump,
  williamTell,
];

export function getSongById(id: string): Song | undefined {
  return SONG_LIBRARY.find(s => s.id === id);
}

export type { Song, SongNote, SongLayer, SongSection } from './types';
