"use strict";

PW.Development = {
  defaults() {
    return {
      waveMultiplier: 1,
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      enemySpeedMultiplier: 1,
      timeScale: 1
    };
  },
  state() {
    const state = PW.state;
    state.development = { ...this.defaults(), ...(state.development || {}) };
    return state.development;
  },
  factor(id) {
    const value = Number(this.state()[id]);
    return Number.isFinite(value) ? value : 1;
  },
  setFactor(id, value) {
    if (!(id in this.defaults())) return false;
    const next = Math.max(0.5, Math.min(3, Number(value) || 1));
    this.state()[id] = next;
    PW.Save.save(false);
    return true;
  },
  startNextNight() {
    const state = PW.state;
    if (state.paused || state.gameOver || state.victory || state.ship.launchActive || state.phase.current === "night" || state.wave.active) return false;
    PW.DayNight.beginNight();
    PW.Messages.add("Entwicklungsmodus: Die naechste Nacht beginnt.", "danger");
    return true;
  }
};
