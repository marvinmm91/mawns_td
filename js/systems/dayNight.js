"use strict";

PW.DayNight = {
  update(dt) {
    const state = PW.state;
    if (state.gameOver || state.victory) return;
    state.phase.timer -= dt;
    if (state.ship.launchActive) PW.Progression.updateLaunch(dt);
    if (state.victory) return;
    if (state.phase.timer <= 0) this.advancePhase();
  },
  advancePhase() {
    const state = PW.state;
    if (state.phase.current === "day") this.setPhase("dusk");
    else if (state.phase.current === "dusk") this.beginNight();
    else if (state.phase.current === "night") this.beginDawn();
    else this.beginDay();
  },
  setPhase(phase) {
    const state = PW.state;
    const night = state.phase.night;
    let duration = PW.CONFIG.phases[phase];
    if (phase === "day") duration = Math.max(PW.CONFIG.phaseGrowth.dayMin, duration - night * PW.CONFIG.phaseGrowth.dayShrinkPerNight);
    if (phase === "night") duration = Math.min(PW.CONFIG.phaseGrowth.nightMax, duration + Math.max(0, night - 1) * PW.CONFIG.phaseGrowth.nightGrowPerNight);
    state.phase.current = phase;
    state.phase.duration = duration;
    state.phase.timer = duration;
    PW.Fog.fadeVisibility();
    PW.Fog.update();
    PW.UI.renderHud();
  },
  beginNight(finalMode = false) {
    const state = PW.state;
    state.phase.night += 1;
    this.setPhase("night");
    state.nightStats = {
      night: state.phase.night,
      shipStartHp: state.ship.hp,
      shipDamageTaken: 0,
      airDamage: 0,
      wallDamage: 0,
      wallsDestroyed: 0,
      kills: 0,
      killDistanceSum: 0,
      startedAt: state.elapsed
    };
    PW.Spawning.startNight(finalMode);
    PW.Progression.refreshUnlocks();
    PW.Save.save(false);
  },
  beginDawn() {
    const state = PW.state;
    state.wave.active = false;
    PW.EnemySystem.retreatAll();
    this.setPhase("dawn");
    PW.Autobalance.evaluateNight();
    PW.UI.showMorningReport();
    PW.Save.save(false);
  },
  beginDay() {
    PW.state.enemies = PW.state.enemies.filter((enemy) => !enemy.retreating);
    this.setPhase("day");
    PW.Progression.refreshUnlocks();
    PW.Messages.add("Tagphase: reparieren, bauen, erkunden.");
  },
  forceFinalNight() {
    const state = PW.state;
    state.ship.launchActive = true;
    state.ship.launchTimer = state.ship.launchDuration;
    state.phase.night += 1;
    this.setPhase("night");
    state.phase.duration = state.ship.launchDuration;
    state.phase.timer = state.ship.launchDuration;
    state.nightStats = {
      night: state.phase.night,
      shipStartHp: state.ship.hp,
      shipDamageTaken: 0,
      airDamage: 0,
      wallDamage: 0,
      wallsDestroyed: 0,
      kills: 0,
      killDistanceSum: 0,
      startedAt: state.elapsed,
      finalMode: true
    };
    PW.Spawning.startNight(true);
    PW.Messages.add("Startsequenz aktiviert. Halte das Wrack bis zum Abheben.", "danger");
  }
};
