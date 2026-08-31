"use strict";

PW.Performance = {
  profile() {
    const debug = PW.state.debug || (PW.state.debug = {});
    if (!debug.profile) {
      debug.profile = { fps: 0, frameMs: 0, updateMs: 0, renderMs: 0, workMs: 0, frames: 0 };
    }
    return debug.profile;
  },
  setEnabled(enabled) {
    const debug = PW.state.debug || (PW.state.debug = {});
    debug.enabled = Boolean(enabled);
    this.reset();
    return debug.enabled;
  },
  toggle() {
    const enabled = this.setEnabled(!(PW.state.debug && PW.state.debug.enabled));
    PW.Messages.add(enabled ? "Leistungsanzeige aktiviert." : "Leistungsanzeige deaktiviert.");
    return enabled;
  },
  reset() {
    const profile = this.profile();
    profile.fps = 0;
    profile.frameMs = 0;
    profile.updateMs = 0;
    profile.renderMs = 0;
    profile.workMs = 0;
    profile.frames = 0;
  },
  record(frameMs, updateMs, renderMs) {
    const profile = this.profile();
    const blend = profile.frames === 0 ? 1 : 0.12;
    const smooth = (previous, value) => previous + (value - previous) * blend;
    profile.fps = smooth(profile.fps, 1000 / Math.max(0.001, frameMs));
    profile.frameMs = smooth(profile.frameMs, frameMs);
    profile.updateMs = smooth(profile.updateMs, updateMs);
    profile.renderMs = smooth(profile.renderMs, renderMs);
    profile.workMs = smooth(profile.workMs, updateMs + renderMs);
    profile.frames += 1;
  },
  snapshot() {
    const profile = this.profile();
    return {
      enabled: Boolean(PW.state.debug && PW.state.debug.enabled),
      fps: profile.fps,
      frameMs: profile.frameMs,
      updateMs: profile.updateMs,
      renderMs: profile.renderMs,
      workMs: profile.workMs,
      frames: profile.frames
    };
  }
};

PW.GameLoop = {
  start() {
    const state = PW.state;
    state.running = true;
    state.lastTime = performance.now();
    requestAnimationFrame((time) => this.frame(time));
  },
  frame(time) {
    const state = PW.state;
    const profiling = Boolean(state.debug && state.debug.enabled);
    const rawDt = (time - state.lastTime) / 1000;
    state.lastTime = time;
    const dt = Math.min(0.05, Math.max(0, rawDt));
    let updateMs = 0;
    if (state.running && !state.paused && !state.reportOpen) {
      const updateStartedAt = profiling ? performance.now() : 0;
      this.update(dt);
      if (profiling) updateMs = performance.now() - updateStartedAt;
    }
    const renderStartedAt = profiling ? performance.now() : 0;
    PW.Render.draw();
    if (profiling) PW.Performance.record(rawDt * 1000, updateMs, performance.now() - renderStartedAt);
    PW.Input.endFrame();
    if (state.running) requestAnimationFrame((next) => this.frame(next));
  },
  update(dt) {
    const state = PW.state;
    state.elapsed += dt;
    PW.DayNight.update(dt);
    PW.Player.update(dt);
    PW.Camera.update();
    PW.Fog.update();
    PW.Pathfinding.update();
    PW.DamageVisuals.update(dt);
    PW.TreasureSystem.update(dt);
    PW.MapPins.update();
    PW.WildlifeSystem.update(dt);
    PW.Spawning.update(dt);
    PW.EnemySystem.update(dt);
    PW.Combat.update(dt);
    PW.ProjectileSystem.update(dt);
    PW.DropSystem.update(dt);
    PW.RenderEffects.update(dt);
    PW.Messages.update(dt);
    PW.Save.update(dt);
    PW.UI.renderHud();
  }
};
