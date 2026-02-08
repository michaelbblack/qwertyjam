import * as Tone from 'tone';

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private compressor: Tone.Compressor | null = null;
  private initialized = false;
  private _volume = 0.8;

  async init(): Promise<void> {
    if (this.initialized) return;

    await Tone.start();

    this.compressor = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.1,
    }).toDestination();

    this.reverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.2,
    }).connect(this.compressor);

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle8',
      },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 0.8,
      },
      volume: -6,
    }).connect(this.reverb);
    this.synth.maxPolyphony = 16;

    this.setVolume(this._volume);
    this.initialized = true;
  }

  playNote(note: string, duration: string | number = '8n', velocity = 0.7): void {
    if (!this.synth) return;
    try {
      this.synth.triggerAttackRelease(note, duration, undefined, velocity);
    } catch {
      // Ignore invalid note errors
    }
  }

  attackNote(note: string, velocity = 0.7): void {
    if (!this.synth) return;
    try {
      this.synth.triggerAttack(note, undefined, velocity);
    } catch {
      // Ignore
    }
  }

  releaseNote(note: string): void {
    if (!this.synth) return;
    try {
      this.synth.triggerRelease(note);
    } catch {
      // Ignore
    }
  }

  playMissSound(): void {
    if (!this.synth) return;
    // Play a dissonant buzz for misses
    try {
      this.synth.triggerAttackRelease('C2', '32n', undefined, 0.15);
    } catch {
      // Ignore
    }
  }

  playComboSound(combo: number): void {
    if (!this.synth) return;
    // Higher pitch ding at milestone combos
    if (combo % 25 === 0 && combo > 0) {
      try {
        this.synth.triggerAttackRelease('C7', '16n', undefined, 0.3);
        setTimeout(() => {
          this.synth?.triggerAttackRelease('E7', '16n', undefined, 0.3);
        }, 60);
        setTimeout(() => {
          this.synth?.triggerAttackRelease('G7', '16n', undefined, 0.3);
        }, 120);
      } catch {
        // Ignore
      }
    }
  }

  private metronomeSynth: Tone.MembraneSynth | null = null;

  playMetronomeTick(accent: boolean): void {
    if (!this.metronomeSynth) {
      this.metronomeSynth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
        volume: -12,
      }).toDestination();
    }
    try {
      const note = accent ? 'C5' : 'C4';
      this.metronomeSynth.triggerAttackRelease(note, '32n');
    } catch {
      // Ignore
    }
  }

  setVolume(level: number): void {
    this._volume = Math.max(0, Math.min(1, level));
    if (this.synth) {
      // Map 0-1 to -40..0 dB
      const db = this._volume === 0 ? -Infinity : -40 + this._volume * 40;
      this.synth.volume.value = db;
    }
  }

  getVolume(): number {
    return this._volume;
  }

  isReady(): boolean {
    return this.initialized;
  }

  dispose(): void {
    this.synth?.dispose();
    this.reverb?.dispose();
    this.compressor?.dispose();
    this.metronomeSynth?.dispose();
    this.synth = null;
    this.reverb = null;
    this.compressor = null;
    this.metronomeSynth = null;
    this.initialized = false;
  }
}
