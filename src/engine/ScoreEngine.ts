import type { TimingGrade } from './TimingEngine';

export type LetterGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface ScoreState {
  score: number;
  combo: number;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  totalNotes: number;
  accuracy: number;
}

const GRADE_POINTS: Record<TimingGrade, number> = {
  perfect: 300,
  great: 200,
  good: 100,
  miss: 0,
};

const COMBO_MULTIPLIER_THRESHOLDS = [
  { combo: 50, multiplier: 4 },
  { combo: 25, multiplier: 3 },
  { combo: 10, multiplier: 2 },
  { combo: 0, multiplier: 1 },
];

export class ScoreEngine {
  private state: ScoreState = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    greats: 0,
    goods: 0,
    misses: 0,
    totalNotes: 0,
    accuracy: 100,
  };

  reset(): void {
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      greats: 0,
      goods: 0,
      misses: 0,
      totalNotes: 0,
      accuracy: 100,
    };
  }

  registerHit(grade: TimingGrade): ScoreState {
    this.state.totalNotes++;

    if (grade === 'miss') {
      this.state.misses++;
      this.state.combo = 0;
    } else {
      if (grade === 'perfect') this.state.perfects++;
      else if (grade === 'great') this.state.greats++;
      else if (grade === 'good') this.state.goods++;

      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }

      const basePoints = GRADE_POINTS[grade];
      const multiplier = this.getComboMultiplier();
      this.state.score += basePoints * multiplier;
    }

    this.updateAccuracy();
    return { ...this.state };
  }

  private getComboMultiplier(): number {
    for (const threshold of COMBO_MULTIPLIER_THRESHOLDS) {
      if (this.state.combo >= threshold.combo) {
        return threshold.multiplier;
      }
    }
    return 1;
  }

  private updateAccuracy(): void {
    const hitNotes = this.state.perfects + this.state.greats + this.state.goods;
    if (this.state.totalNotes === 0) {
      this.state.accuracy = 100;
    } else {
      // Weighted accuracy: perfect=100%, great=75%, good=50%, miss=0%
      const weighted =
        this.state.perfects * 100 +
        this.state.greats * 75 +
        this.state.goods * 50;
      this.state.accuracy = weighted / this.state.totalNotes;
    }
  }

  getState(): ScoreState {
    return { ...this.state };
  }

  getLetterGrade(): LetterGrade {
    const acc = this.state.accuracy;
    if (acc >= 95) return 'S';
    if (acc >= 90) return 'A';
    if (acc >= 80) return 'B';
    if (acc >= 70) return 'C';
    if (acc >= 60) return 'D';
    return 'F';
  }

  getComboMultiplierValue(): number {
    return this.getComboMultiplier();
  }
}
