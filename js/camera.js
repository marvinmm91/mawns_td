"use strict";

PW.Camera = {
  resize() {
    const state = PW.state;
    const rect = state.canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    state.canvas.width = Math.floor(rect.width * scale);
    state.canvas.height = Math.floor(rect.height * scale);
    state.camera.pixelRatio = scale;
    state.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    state.camera.w = rect.width;
    state.camera.h = rect.height;
    this.update();
  },
  update() {
    const state = PW.state;
    const worldW = state.world.width * state.world.tileSize;
    const worldH = state.world.height * state.world.tileSize;
    state.camera.x = PW.Utils.clamp(state.player.x - state.camera.w / 2, 0, Math.max(0, worldW - state.camera.w));
    state.camera.y = PW.Utils.clamp(state.player.y - state.camera.h / 2, 0, Math.max(0, worldH - state.camera.h));
  },
  toScreenX(x) {
    return x - PW.state.camera.x;
  },
  toScreenY(y) {
    return y - PW.state.camera.y;
  },
  visibleTileBounds(pad = 2) {
    const state = PW.state;
    const ts = state.world.tileSize;
    return {
      minX: Math.max(0, Math.floor(state.camera.x / ts) - pad),
      minY: Math.max(0, Math.floor(state.camera.y / ts) - pad),
      maxX: Math.min(state.world.width - 1, Math.ceil((state.camera.x + state.camera.w) / ts) + pad),
      maxY: Math.min(state.world.height - 1, Math.ceil((state.camera.y + state.camera.h) / ts) + pad)
    };
  }
};
