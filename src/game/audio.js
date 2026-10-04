// Procedural arcade sound via Web Audio API. No external assets.
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.musicVolume = 0.4;
    this.sfxVolume = 0.6;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicStarted = false;
    this.currentTrack = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicOn ? this.musicVolume : 0;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxOn ? this.sfxVolume : 0;
    this.sfxGain.connect(this.master);
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMusic(on) {
    this.musicOn = on;
    if (this.musicGain) this.musicGain.gain.value = on ? this.musicVolume : 0;
  }
  setSfx(on) {
    this.sfxOn = on;
    if (this.sfxGain) this.sfxGain.gain.value = on ? this.sfxVolume : 0;
  }
  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.musicGain && this.musicOn) this.musicGain.gain.value = v;
  }
  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this.sfxGain && this.sfxOn) this.sfxGain.gain.value = v;
  }

  // --- SFX ---
  beep(freq, dur, type = "sine", vol = 0.5, slideTo = null) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.4) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
  }

  collect() { this.beep(660, 0.12, "triangle", 0.5, 990); }
  collectGold() { this.beep(523, 0.1, "triangle", 0.5); setTimeout(() => this.beep(784, 0.14, "triangle", 0.5, 1046), 80); }
  nearMiss() { this.beep(880, 0.1, "sine", 0.35, 1320); }
  combo(level) { const f = 440 + level * 80; this.beep(f, 0.12, "square", 0.3, f * 1.5); }
  dash() { this.beep(220, 0.25, "sawtooth", 0.4, 880); }
  shield() { this.beep(330, 0.3, "sine", 0.4, 660); }
  slow() { this.beep(523, 0.4, "sine", 0.35, 261); }
  hit() { this.noise(0.3, 0.5); this.beep(140, 0.3, "sawtooth", 0.4, 60); }
  wave() { this.beep(440, 0.1, "square", 0.3); setTimeout(() => this.beep(660, 0.14, "square", 0.3), 100); }
  achievement() { this.beep(659, 0.12, "triangle", 0.4); setTimeout(() => this.beep(880, 0.18, "triangle", 0.4), 120); }
  gameOver() { this.beep(440, 0.3, "sawtooth", 0.4, 220); setTimeout(() => this.beep(220, 0.5, "sawtooth", 0.4, 80), 200); }
  click() { this.beep(440, 0.05, "square", 0.2); }

  // --- Music: simple looping arpeggio ---
  startMusic(track = "menu") {
    if (!this.ctx) return;
    if (this.musicStarted && this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    this.musicStarted = true;
    this.musicStep = 0;
    const tempo = track === "game" ? 0.16 : 0.22;
    const scales = {
      menu: [220, 277, 330, 392, 440, 392, 330, 277],
      game: [196, 247, 294, 349, 392, 349, 294, 247, 196, 247, 330, 392],
    };
    const bass = { menu: [110, 110, 138, 138], game: [98, 98, 123, 123] };
    const seq = scales[track] || scales.menu;
    const bassSeq = bass[track] || bass.menu;
    this.musicTimer = setInterval(() => {
      if (!this.musicOn || !this.ctx) return;
      const t = this.ctx.currentTime;
      const note = seq[this.musicStep % seq.length];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = note;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + tempo * 1.6);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + tempo * 1.8);
      if (this.musicStep % 2 === 0) {
        const b = bassSeq[(this.musicStep / 2) % bassSeq.length];
        const bo = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        bo.type = "sine";
        bo.frequency.value = b;
        bg.gain.setValueAtTime(0.0001, t);
        bg.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + tempo * 2);
        bo.connect(bg);
        bg.connect(this.musicGain);
        bo.start(t);
        bo.stop(t + tempo * 2.2);
      }
      this.musicStep++;
    }, tempo * 1000);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
    this.musicStarted = false;
    this.currentTrack = null;
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) this.ctx.close();
    this.ctx = null;
  }
}

export const audioManager = new AudioManager();