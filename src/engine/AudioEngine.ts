import * as Tone from 'tone';

export type VoicePreset = 'piano' | 'organ' | 'pluck' | 'pad';

export const GENRE_VOICE_MAP: Record<string, VoicePreset> = {
  'Classical': 'piano',
  'Rock': 'organ',
  'Hip-Hop': 'pluck',
  'Alternative': 'pad',
};

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private compressor: Tone.Compressor | null = null;
  private initialized = false;
  private _volume = 0.8;

  async init(): Promise<void> {
    if (this.initialized) return;

    await Tone.start();
    console.log('[AudioEngine] Tone.start() complete, context state:', Tone.getContext().state);

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
    console.log('[AudioEngine] Init complete, synth created');
  }

  // Voice presets are accepted but don't change the synth for now
  // (isolating whether voice switching is the cause of silence)
  setVoice(_preset: VoicePreset): void {
    // no-op for debugging
  }

  setVoiceForGenre(genre: string): void {
    const preset = GENRE_VOICE_MAP[genre] || 'piano';
    this.setVoice(preset);
  }

  playNote(note: string, duration: string | number = '8n', velocity = 0.7): void {
    if (!this.synth) {
      console.warn('[AudioEngine] playNote: no synth');
      return;
    }
    try {
      this.synth.triggerAttackRelease(note, duration, Tone.now(), velocity);
    } catch (e) {
      console.error('[AudioEngine] playNote error:', e);
    }
  }

  attackNote(note: string, velocity = 0.7): void {
    if (!this.synth) {
      console.warn('[AudioEngine] attackNote: no synth');
      return;
    }
    try {
      console.log('[AudioEngine] attackNote:', note, velocity);
      this.synth.triggerAttack(note, Tone.now(), velocity);
    } catch (e) {
      console.error('[AudioEngine] attackNote error:', e);
    }
  }

  releaseNote(note: string): void {
    if (!this.synth) return;
    try {
      this.synth.triggerRelease(note, Tone.now());
    } catch (e) {
      console.error('[AudioEngine] releaseNote error:', e);
    }
  }

  playMissSound(): void {
    if (!this.synth) return;
    try {
      this.synth.triggerAttackRelease('C2', '32n', Tone.now(), 0.15);
    } catch (e) {
      console.error('[AudioEngine] playMissSound error:', e);
    }
  }

  playComboSound(combo: number): void {
    if (!this.synth) return;
    if (combo % 25 === 0 && combo > 0) {
      try {
        this.synth.triggerAttackRelease('C7', '16n', Tone.now(), 0.3);
        setTimeout(() => {
          this.synth?.triggerAttackRelease('E7', '16n', Tone.now(), 0.3);
        }, 60);
        setTimeout(() => {
          this.synth?.triggerAttackRelease('G7', '16n', Tone.now(), 0.3);
        }, 120);
      } catch (e) {
        console.error('[AudioEngine] playComboSound error:', e);
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
      console.log('[AudioEngine] Metronome synth created');
    }
    try {
      const note = accent ? 'C5' : 'C4';
      this.metronomeSynth.triggerAttackRelease(note, '32n', Tone.now());
    } catch (e) {
      console.error('[AudioEngine] playMetronomeTick error:', e);
    }
  }

  setVolume(level: number): void {
    this._volume = Math.max(0, Math.min(1, level));
    if (this.synth) {
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
