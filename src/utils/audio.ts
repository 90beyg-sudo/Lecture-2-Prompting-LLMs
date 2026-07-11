/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class GameAudioManager {
  private ctx: AudioContext | null = null;
  private bgmIntervalId: any = null;
  private isBgmPlaying: boolean = false;
  private isMuted: boolean = false;
  private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];

  constructor() {
    // Lazy-loaded to comply with browser autoplay security constraints
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch((err) => console.log("AudioContext resume failed:", err));
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    localStorage.setItem("snake_arcade_muted", mute ? "true" : "false");
    if (mute) {
      this.stopBGMInternal();
    } else {
      if (this.isBgmPlaying) {
        // Restart it
        this.isBgmPlaying = false; 
        this.startBGM();
      }
    }
  }

  public getMutedState(): boolean {
    const saved = localStorage.getItem("snake_arcade_muted");
    if (saved === "true") {
      return true;
    }
    return false;
  }

  public toggleMute(): boolean {
    const nextMute = !this.isMuted;
    this.setMute(nextMute);
    return nextMute;
  }

  public isCurrentlyMuted(): boolean {
    return this.isMuted;
  }

  public playEat() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // Crisp retro slide-up tone
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.12); // C6

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }

  public playCrash() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      // 1. Bass slide down
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);

      // 2. High crash explosion touch
      const noiseOsc = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();

      noiseOsc.type = "sawtooth";
      noiseOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
      noiseOsc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.3);

      noiseGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.35);

      noiseOsc.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseOsc.start();
      noiseOsc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }

  private stopBGMInternal() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.activeOscillators.forEach(({ osc, gain }) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  public startBGM() {
    this.initCtx();
    
    // Check local storage init for mute
    if (this.getMutedState()) {
      this.isMuted = true;
    }

    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    if (this.isMuted || !this.ctx) return;

    let step = 0;
    // Elegant Cyberpunk Melodic Arpeggios (Am, Fmaj7, Cmaj7, G)
    const chords = [
      [220.00, 261.63, 329.63, 392.00], // Am7 (A2, C3, E3, G3)
      [174.61, 220.00, 261.63, 349.23], // Fmaj7
      [261.63, 329.63, 392.00, 523.25], // Cmaj7
      [196.00, 246.94, 293.66, 392.00]  // G6
    ];

    const playSequence = () => {
      if (!this.ctx || this.isMuted || !this.isBgmPlaying) return;

      const t = this.ctx.currentTime;
      const chordIdx = Math.floor(step / 4) % chords.length;
      const noteIdx = step % 4;
      const frequency = chords[chordIdx][noteIdx];

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Use soft triangle waves for low-pass ambient vibes
        osc.type = "triangle";
        osc.frequency.setValueAtTime(frequency, t);

        // Low volume ambient vibe arpeggios
        const baseVolume = 0.04;
        gain.gain.setValueAtTime(baseVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.45);

        const oscPair = { osc, gain };
        this.activeOscillators.push(oscPair);
        
        // Retain only last active oscillators
        if (this.activeOscillators.length > 8) {
          const old = this.activeOscillators.shift();
          if (old) {
            try { old.osc.stop(); } catch(e) {}
          }
        }
      } catch (e) {
        console.warn("BGM generator encountered a warning:", e);
      }

      step++;
    };

    // Trigger first note immediately
    playSequence();
    this.bgmIntervalId = setInterval(playSequence, 350); // Fast retro chiptune pace
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    this.stopBGMInternal();
  }
}

export const audioManager = new GameAudioManager();
