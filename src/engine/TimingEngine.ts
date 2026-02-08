export type TimingGrade = 'perfect' | 'great' | 'good' | 'miss';

export interface ScheduledNote {
  index: number;
  note: string;
  time: number;      // absolute time in seconds from song start
  duration: number;   // duration in seconds
  beat: number;       // beat position in song
  beatDuration: number; // duration in beats (preserved for setSpeed)
  hit: boolean;
  grade: TimingGrade | null;
  hitTime: number | null;
}

// Timing windows in milliseconds
const TIMING_WINDOWS = {
  perfect: 40,
  great: 80,
  good: 130,
};

export class TimingEngine {
  bpm: number;
  speedMultiplier: number;
  private startTime: number = 0;
  noteSchedule: ScheduledNote[] = [];
  private running = false;
  private leadInBeats = 4; // beats of lead-in before first note

  constructor(bpm: number, speedMultiplier = 1.0) {
    this.bpm = bpm;
    this.speedMultiplier = speedMultiplier;
  }

  // Convert beat position to time in seconds
  beatToTime(beat: number): number {
    const effectiveBpm = this.bpm * this.speedMultiplier;
    return (beat / effectiveBpm) * 60;
  }

  // Build the schedule from song notes
  buildSchedule(notes: Array<{ note: string; beat: number; duration: number }>): void {
    this.noteSchedule = notes.map((n, i) => ({
      index: i,
      note: n.note,
      time: this.beatToTime(n.beat),
      duration: this.beatToTime(n.beat + n.duration) - this.beatToTime(n.beat),
      beat: n.beat,
      beatDuration: n.duration,
      hit: false,
      grade: null,
      hitTime: null,
    }));
  }

  start(): void {
    // Offset start so getCurrentTime() begins negative, giving lead-in
    const leadInTime = this.beatToTime(this.leadInBeats);
    this.startTime = performance.now() / 1000 + leadInTime;
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  // Get current elapsed time in seconds since song started
  // Returns negative during lead-in
  getCurrentTime(): number {
    if (!this.running) return 0;
    return performance.now() / 1000 - this.startTime;
  }

  // Get the current beat position (negative during lead-in)
  getCurrentBeat(): number {
    const elapsed = this.getCurrentTime();
    const effectiveBpm = this.bpm * this.speedMultiplier;
    return (elapsed / 60) * effectiveBpm;
  }

  // Get total song duration in seconds
  getSongDuration(): number {
    if (this.noteSchedule.length === 0) return 0;
    const lastNote = this.noteSchedule[this.noteSchedule.length - 1];
    return lastNote.time + lastNote.duration + 2; // 2 second buffer
  }

  // Grade a keypress — find the closest matching note and grade it
  gradeInput(inputNote: string, inputTime: number): {
    grade: TimingGrade;
    noteIndex: number;
    deltaMs: number;
  } | null {
    const currentTime = inputTime;
    let bestMatch: { index: number; delta: number } | null = null;

    for (let i = 0; i < this.noteSchedule.length; i++) {
      const scheduled = this.noteSchedule[i];
      if (scheduled.hit) continue;
      if (scheduled.note !== inputNote) continue;

      const delta = Math.abs(currentTime - scheduled.time) * 1000; // ms

      // Only consider notes within a reasonable window (500ms)
      if (delta > 500) continue;

      if (!bestMatch || delta < bestMatch.delta) {
        bestMatch = { index: i, delta };
      }
    }

    if (!bestMatch) return null;

    const deltaMs = bestMatch.delta;
    let grade: TimingGrade;

    if (deltaMs <= TIMING_WINDOWS.perfect) {
      grade = 'perfect';
    } else if (deltaMs <= TIMING_WINDOWS.great) {
      grade = 'great';
    } else if (deltaMs <= TIMING_WINDOWS.good) {
      grade = 'good';
    } else {
      grade = 'miss';
    }

    // Mark the note as hit
    this.noteSchedule[bestMatch.index].hit = true;
    this.noteSchedule[bestMatch.index].grade = grade;
    this.noteSchedule[bestMatch.index].hitTime = currentTime;

    return {
      grade,
      noteIndex: bestMatch.index,
      deltaMs,
    };
  }

  // Check for notes that have passed the timing window without being hit
  checkMissedNotes(): number[] {
    const currentTime = this.getCurrentTime();
    const missThreshold = TIMING_WINDOWS.good / 1000 + 0.05; // small buffer
    const missed: number[] = [];

    for (const note of this.noteSchedule) {
      if (note.hit) continue;
      if (note.grade === 'miss') continue;
      if (currentTime - note.time > missThreshold) {
        note.grade = 'miss';
        missed.push(note.index);
      }
    }

    return missed;
  }

  // Check if all notes have been processed
  isComplete(): boolean {
    if (this.noteSchedule.length === 0) return false;
    return this.noteSchedule.every(n => n.hit || n.grade === 'miss');
  }

  setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.25, Math.min(2.0, multiplier));
    // Rebuild from original beat data (not converted seconds)
    const hitState = this.noteSchedule.map(n => ({
      hit: n.hit,
      grade: n.grade,
      hitTime: n.hitTime,
    }));
    const originalNotes = this.noteSchedule.map(n => ({
      note: n.note,
      beat: n.beat,
      duration: n.beatDuration,
    }));
    this.buildSchedule(originalNotes);
    // Restore hit state
    hitState.forEach((state, i) => {
      if (i < this.noteSchedule.length) {
        this.noteSchedule[i].hit = state.hit;
        this.noteSchedule[i].grade = state.grade;
        this.noteSchedule[i].hitTime = state.hitTime;
      }
    });
  }
}
