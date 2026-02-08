export interface SongNote {
  note: string;    // e.g., "G4", "C#3"
  beat: number;    // beat position in song
  duration: number; // duration in beats
}

export interface SongLayer {
  name: string;
  notes: SongNote[];
  unlockThreshold?: number; // accuracy % needed on previous layer
  description?: string;
}

export interface SongSection {
  name: string;
  startBeat: number;
  endBeat: number;
  unlockOrder: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  timeSignature: [number, number];
  genre: string;
  difficulty: number; // 1-5
  sections?: SongSection[];
  layers: SongLayer[];
}
