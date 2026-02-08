import * as Tone from 'tone';

export type VoicePreset = 'piano' | 'organ' | 'pluck' | 'pad';

const VOICE_CONFIGS: Record<VoicePreset, {
  oscillator: { type: string };
  envelope: { attack: number; decay: number; sustain: number; release: number };
}> = {
  piano: {
    oscillator: { type: 'triangle8' },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.8 },
  },
  organ: {
    oscillator: { type: 'sawtooth8' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.75, release: 0.3 },
  },
  pluck: {
    oscillator: { type: 'square4' },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.08, release: 0.4 },
  },
  pad: {
    oscillator: { type: 'sine4' },
    envelope: { attack: 0.06, decay: 0.4, sustain: 0.55, release: 1.5 },
  },
};

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
  private currentVoice: VoicePreset = 'piano';

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

    this.buildSynth(this.currentVoice);
    this.initialized = true;
  }

  private buildSynth(preset: VoicePreset): void {
    if (!this.reverb) return;
    this.synth?.dispose();
    const config = VOICE_CONFIGS[preset];
    // Clone config to prevent Tone.js from mutating VOICE_CONFIGS
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: config.oscillator.type } as Tone.OmniOscillatorOptions,
      envelope: { ...config.envelope },
      volume: -6,
    }).connect(this.reverb);
    this.synth.maxPolyphony = 16;
    this.setVolume(this._volume);
  }

  setVoice(preset: VoicePreset): void {
    if (preset === this.currentVoice && this.synth) return;
    this.currentVoice = preset;
    if (!this.initialized) return;
    this.buildSynth(preset);
  }

  setVoiceForGenre(genre: string): void {
    const preset = GENRE_VOICE_MAP[genre] || 'piano';
    this.setVoice(preset);
  }

  playNote(note: string, duration: string | number = '8n', velocity = 0.7): void {
    if (!this.synth) return;
    try {
      this.synth.triggerAttackRelease(note, duration, Tone.now(), velocity);
    } catch (e) {
      console.error('playNote error:', e);
    }
  }

  attackNote(note: string, velocity = 0.7): void {
    if (!this.synth) return;
    try {
      this.synth.triggerAttack(note, Tone.now(), velocity);
    } catch (e) {
      console.error('attackNote error:', e);
    }
  }

  releaseNote(note: string): void {
    if (!this.synth) return;
    try {
      this.synth.triggerRelease(note, Tone.now());
    } catch (e) {
      console.error('releaseNote error:', e);
    }
  }

  // Release all currently sounding notes
  releaseAll(): void {
    if (!this.synth) return;
    try {
      this.synth.releaseAll(Tone.now());
    } catch (e) {
      console.error('releaseAll error:', e);
    }
  }

  playMissSound(): void {
    if (!this.synth) return;
    try {
      this.synth.triggerAttackRelease('C2', '32n', Tone.now(), 0.15);
    } catch (e) {
      console.error('playMissSound error:', e);
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
        console.error('playComboSound error:', e);
      }
    }
  }

  private metronomeSynth: Tone.MembraneSynth | null = null;

  playMetronomeTick(accent: boolean): void {
    if (!this.metronomeSynth) {
      this.metronomeSynth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.03 },
        volume: -4,
      }).toDestination();
    }
    try {
      const note = accent ? 'G5' : 'C5';
      this.metronomeSynth.triggerAttackRelease(note, '64n', Tone.now());
    } catch (e) {
      console.error('playMetronomeTick error:', e);
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
