"use strict";

PW.RenderFog = {
  draw(ctx) {
    const state = PW.state;
    const ts = state.world.tileSize;
    const bounds = PW.Camera.visibleTileBounds(0);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const fog = state.world.fog[PW.Tiles.idx(x, y)];
        if (fog === 2) continue;
        const sx = x * ts - state.camera.x;
        const sy = y * ts - state.camera.y;
        ctx.fillStyle = fog === 1 ? "rgba(0,0,0,.42)" : "rgba(0,0,0,.92)";
        ctx.fillRect(sx, sy, ts, ts);
      }
    }
    if (state.phase.current === "night") {
      ctx.fillStyle = "rgba(34, 42, 91, .34)";
      ctx.fillRect(0, 0, state.camera.w, state.camera.h);
    } else if (state.phase.current === "dusk") {
      ctx.fillStyle = "rgba(143, 84, 61, .18)";
      ctx.fillRect(0, 0, state.camera.w, state.camera.h);
    } else if (state.phase.current === "dawn") {
      ctx.fillStyle = "rgba(92, 122, 120, .16)";
      ctx.fillRect(0, 0, state.camera.w, state.camera.h);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
};
