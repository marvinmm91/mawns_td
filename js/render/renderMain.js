"use strict";

PW.Render = {
  draw() {
    const state = PW.state;
    const ctx = state.ctx;
    if (!ctx) return;
    const scale = state.camera.pixelRatio || window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0b0d0d";
    ctx.fillRect(0, 0, state.camera.w, state.camera.h);
    PW.RenderWorld.draw(ctx);
    PW.RenderEntities.drawWorldEntities(ctx);
    PW.RenderEffects.draw(ctx);
    PW.RenderFog.draw(ctx);
    PW.RenderEntities.drawPlayer(ctx);
    this.drawOverlay(ctx);
    this.drawPerformanceOverlay(ctx);
  },
  drawOverlay(ctx) {
    const state = PW.state;
    const target = this.buildTargetTile();
    if (state.player.selectedTool === "build") {
      const ts = state.world.tileSize;
      const def = PW.BUILDINGS[state.selectedBuild];
      const blueprintMode = state.buildMode === "blueprint";
      const ok = def && state.unlockedBuildings.has(state.selectedBuild) && (blueprintMode
        ? PW.BuildingSystem.canPlaceBlueprint(state.selectedBuild, target.x, target.y)
        : PW.BuildingSystem.canPlaceBuilding(state.selectedBuild, target.x, target.y) && PW.Utils.canAfford(def.cost));
      const sx = target.x * ts - state.camera.x;
      const sy = target.y * ts - state.camera.y;
      if (def) {
        ctx.save();
        ctx.translate(sx, sy);
        PW.Icons.drawBuilding(ctx, state.selectedBuild, ts, ok ? (blueprintMode ? 0.38 : 0.62) : 0.24);
        ctx.restore();
        if (def.category === "tower") {
          const cx = sx + ts / 2;
          const cy = sy + ts / 2;
          ctx.strokeStyle = ok ? (blueprintMode ? "rgba(131,227,218,.38)" : "rgba(102,198,166,.32)") : "rgba(227,93,87,.24)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, def.range * ts, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = ok ? (blueprintMode ? "rgba(131,227,218,.95)" : "rgba(110,195,110,.95)") : "rgba(227,93,87,.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
    } else if (state.mouse.inside) {
      const ts = state.world.tileSize;
      ctx.strokeStyle = "rgba(242,237,220,.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(state.mouse.tileX * ts - state.camera.x + 2, state.mouse.tileY * ts - state.camera.y + 2, ts - 4, ts - 4);
    }
    if (state.ship.launchActive) {
      const pct = 1 - state.ship.launchTimer / state.ship.launchDuration;
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(state.camera.w / 2 - 180, 18, 360, 18);
      ctx.fillStyle = "#f0b84d";
      ctx.fillRect(state.camera.w / 2 - 180, 18, 360 * pct, 18);
      ctx.strokeStyle = "#f2eddc";
      ctx.strokeRect(state.camera.w / 2 - 180, 18, 360, 18);
    }
  },
  drawPerformanceOverlay(ctx) {
    const state = PW.state;
    if (!state.debug || !state.debug.enabled || !state.debug.profile) return;
    const profile = state.debug.profile;
    const rows = [
      `FPS ${profile.fps.toFixed(1)}  Frame ${profile.frameMs.toFixed(1)} ms`,
      `Update ${profile.updateMs.toFixed(2)} ms`,
      `Render ${profile.renderMs.toFixed(2)} ms`,
      `Arbeit ${profile.workMs.toFixed(2)} ms`,
      `Gegner ${state.enemies.length}  Tuerme ${state.world.buildings.length}`
    ];
    ctx.save();
    ctx.fillStyle = "rgba(10, 14, 13, .84)";
    ctx.fillRect(10, 10, 218, 92);
    ctx.strokeStyle = "rgba(131, 227, 218, .65)";
    ctx.strokeRect(10.5, 10.5, 217, 91);
    ctx.fillStyle = "#d7fffb";
    ctx.font = "12px monospace";
    ctx.textBaseline = "top";
    rows.forEach((row, index) => ctx.fillText(row, 18, 18 + index * 16));
    ctx.restore();
  },
  buildTargetTile() {
    const state = PW.state;
    if (state.mouse.inside && PW.Tiles.inBounds(state.mouse.tileX, state.mouse.tileY)) {
      return { x: state.mouse.tileX, y: state.mouse.tileY };
    }
    return PW.Player.targetTile();
  }
};
