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
    const next = Number(value);
    if (!Number.isFinite(next)) return false;
    this.state()[id] = next;
    PW.Save.save(false);
    return true;
  },
  adjustFactor(id, amount) {
    const next = Math.round((this.factor(id) + amount) * 20) / 20;
    return this.setFactor(id, next);
  },
  startNextNight() {
    const state = PW.state;
    if (state.paused || state.gameOver || state.victory || state.ship.launchActive || state.phase.current === "night" || state.wave.active) return false;
    PW.DayNight.beginNight();
    PW.Messages.add("Entwicklungsmodus: Die nächste Nacht beginnt.", "danger");
    return true;
  }
};
