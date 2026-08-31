"use strict";

PW.GameLoop = {
  start() {
    const state = PW.state;
    state.running = true;
    state.lastTime = performance.now();
    requestAnimationFrame((time) => this.frame(time));
  },
  frame(time) {
    const state = PW.state;
    const rawDt = (time - state.lastTime) / 1000;
    state.lastTime = time;
    const dt = Math.min(0.05, Math.max(0, rawDt));
    if (state.running && !state.paused && !state.reportOpen) {
      this.update(dt);
    }
    PW.Render.draw();
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
    PW.TreasureSystem.update(dt);
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
