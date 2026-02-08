import type { Song } from './types';

// Seven Nation Army - iconic riff, very few notes
const sevenNationArmy: Song = {
  id: 'seven-nation-army',
  title: 'Seven Nation Army',
  artist: 'The White Stripes',
  bpm: 124,
  timeSignature: [4, 4],
  genre: 'Rock',
  difficulty: 1,
  layers: [
    {
      name: 'Simple Riff',
      description: 'The iconic guitar riff simplified',
      notes: [
        // Main riff pattern (E-E-G-E-D-C-B) x repeats
        // Phrase 1
        { note: 'E4', beat: 0, duration: 1.5 },
        { note: 'E4', beat: 2, duration: 0.5 },
        { note: 'G4', beat: 3, duration: 1 },
        { note: 'E4', beat: 4.5, duration: 1 },
        { note: 'D4', beat: 6, duration: 1 },
        { note: 'C4', beat: 7.5, duration: 1.5 },
        { note: 'B3', beat: 9, duration: 3 },
        // Phrase 2 (repeat)
        { note: 'E4', beat: 14, duration: 1.5 },
        { note: 'E4', beat: 16, duration: 0.5 },
        { note: 'G4', beat: 17, duration: 1 },
        { note: 'E4', beat: 18.5, duration: 1 },
        { note: 'D4', beat: 20, duration: 1 },
        { note: 'C4', beat: 21.5, duration: 1.5 },
        { note: 'D4', beat: 23, duration: 1 },
        { note: 'C4', beat: 24.5, duration: 1 },
        { note: 'B3', beat: 26, duration: 2 },
        // Phrase 3 (repeat)
        { note: 'E4', beat: 28, duration: 1.5 },
        { note: 'E4', beat: 30, duration: 0.5 },
        { note: 'G4', beat: 31, duration: 1 },
        { note: 'E4', beat: 32.5, duration: 1 },
        { note: 'D4', beat: 34, duration: 1 },
        { note: 'C4', beat: 35.5, duration: 1.5 },
        { note: 'B3', beat: 37, duration: 3 },
        // Phrase 4
        { note: 'E4', beat: 42, duration: 1.5 },
        { note: 'E4', beat: 44, duration: 0.5 },
        { note: 'G4', beat: 45, duration: 1 },
        { note: 'E4', beat: 46.5, duration: 1 },
        { note: 'D4', beat: 48, duration: 1 },
        { note: 'C4', beat: 49.5, duration: 1.5 },
        { note: 'D4', beat: 51, duration: 1 },
        { note: 'C4', beat: 52.5, duration: 1 },
        { note: 'B3', beat: 54, duration: 2 },
      ],
    },
    {
      name: 'Full Riff',
      description: 'Complete riff with proper rhythmic feel',
      unlockThreshold: 70,
      notes: [
        // Riff with more precise rhythm and octave variations
        { note: 'E3', beat: 0, duration: 1.5 },
        { note: 'E3', beat: 2, duration: 0.5 },
        { note: 'G3', beat: 3, duration: 0.75 },
        { note: 'E3', beat: 4.5, duration: 0.75 },
        { note: 'D3', beat: 5.5, duration: 0.75 },
        { note: 'C3', beat: 7, duration: 1.5 },
        { note: 'B3', beat: 9, duration: 3 },
        // variation
        { note: 'E3', beat: 14, duration: 1.5 },
        { note: 'E3', beat: 16, duration: 0.5 },
        { note: 'G3', beat: 17, duration: 0.75 },
        { note: 'E3', beat: 18.5, duration: 0.75 },
        { note: 'D3', beat: 19.5, duration: 0.75 },
        { note: 'C3', beat: 21, duration: 1 },
        { note: 'D3', beat: 22.5, duration: 0.75 },
        { note: 'C3', beat: 23.5, duration: 0.75 },
        { note: 'B3', beat: 25, duration: 3 },
        // Higher octave repeat
        { note: 'E4', beat: 28, duration: 1.5 },
        { note: 'E4', beat: 30, duration: 0.5 },
        { note: 'G4', beat: 31, duration: 0.75 },
        { note: 'E4', beat: 32.5, duration: 0.75 },
        { note: 'D4', beat: 33.5, duration: 0.75 },
        { note: 'C4', beat: 35, duration: 1.5 },
        { note: 'B3', beat: 37, duration: 3 },
        // Ending
        { note: 'E4', beat: 42, duration: 1.5 },
        { note: 'E4', beat: 44, duration: 0.5 },
        { note: 'G4', beat: 45, duration: 0.75 },
        { note: 'E4', beat: 46.5, duration: 0.75 },
        { note: 'D4', beat: 47.5, duration: 0.75 },
        { note: 'C4', beat: 49, duration: 1 },
        { note: 'D4', beat: 50.5, duration: 0.75 },
        { note: 'C4', beat: 51.5, duration: 0.75 },
        { note: 'B3', beat: 53, duration: 3 },
      ],
    },
  ],
};

export default sevenNationArmy;
