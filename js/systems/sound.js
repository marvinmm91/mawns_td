"use strict";

PW.Sound = {
  storageKey: "planet-wrack-muted-v1",
  muted: false,
  context: null,
  lastPlayed: {},

  init() {
    try {
      this.muted = window.localStorage.getItem(this.storageKey) === "true";
    } catch (_) {
      this.muted = false;
    }
    const button = PW.state.dom.muteButton;
    if (button) button.addEventListener("click", () => this.toggle());
    const unlock = () => this.unlock();
    document.addEventListener("pointerdown", unlock, { once: true, capture: true });
    document.addEventListener("keydown", unlock, { once: true });
    this.updateMuteButton();
  },

  unlock() {
    if (this.muted) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") this.context.resume().catch(() => {});
    return this.context;
  },

  toggle() {
    this.muted = !this.muted;
    if (!this.muted) this.unlock();
    try {
      window.localStorage.setItem(this.storageKey, String(this.muted));
    } catch (_) {
      // The sound setting remains active for the current session.
    }
    this.updateMuteButton();
  },

  updateMuteButton() {
    const button = PW.state.dom.muteButton;
    if (!button) return;
    const label = this.muted ? "Sound einschalten" : "Sound ausschalten";
    button.textContent = this.muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(this.muted));
  },

  contextFor(channel, cooldown) {
    if (this.muted) return null;
    const context = this.unlock();
    if (!context) return null;
    const now = context.currentTime;
    if (now - (this.lastPlayed[channel] || -Infinity) < cooldown) return null;
    this.lastPlayed[channel] = now;
    return context;
  },

  tone(context, frequency, duration, options = {}) {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = options.type || "square";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), now + duration);
    const volume = options.volume || 0.04;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  },

  noise(context, duration, volume, cutoff = 1000) {
    const now = context.currentTime;
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, now);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(now);
  },

  towerShot(type) {
    const settings = {
      ballista: { frequency: 170, endFrequency: 85, duration: 0.07, type: "sawtooth", volume: 0.045, cooldown: 0.06 },
      catapult: { frequency: 92, endFrequency: 54, duration: 0.14, type: "triangle", volume: 0.075, cooldown: 0.12, noise: true },
      flak: { frequency: 720, endFrequency: 440, duration: 0.05, type: "square", volume: 0.035, cooldown: 0.05 },
      tesla: { frequency: 260, endFrequency: 820, duration: 0.055, type: "square", volume: 0.028, cooldown: 0.06 },
      laser: { frequency: 820, endFrequency: 1320, duration: 0.09, type: "sine", volume: 0.035, cooldown: 0.07 }
    };
    const setting = settings[type];
    if (!setting) return;
    const context = this.contextFor(`tower:${type}`, setting.cooldown);
    if (!context) return;
    this.tone(context, setting.frequency, setting.duration, setting);
    if (setting.noise) this.noise(context, 0.09, 0.035, 360);
  },

  enemyDeath(enemy) {
    const def = PW.ENEMIES[enemy.type] || {};
    const context = this.contextFor("enemyDeath", 0.045);
    if (!context) return;
    const isAir = def.moveType === "air";
    const frequency = isAir ? 350 : Math.max(72, 180 - (def.budget || 1) * 13);
    const duration = isAir ? 0.08 : Math.min(0.18, 0.08 + (def.budget || 1) * 0.012);
    this.tone(context, frequency, duration, {
      endFrequency: isAir ? 110 : Math.max(42, frequency * 0.45),
      type: isAir ? "triangle" : "sawtooth",
      volume: isAir ? 0.03 : 0.04
    });
    if ((def.budget || 0) >= 3 || isAir) this.noise(context, Math.min(0.14, duration), 0.025, isAir ? 1600 : 520);
  }
};
