"use strict";

PW.Camera = {
  zoomLevels: [1, 1.5, 2],
  resize() {
    const state = PW.state;
    const rect = state.canvas.getBoundingClientRect();
    const deviceScale = window.devicePixelRatio || 1;
    const zoom = this.zoomLevels.includes(state.camera.zoom) ? state.camera.zoom : 1;
    state.camera.zoom = zoom;
    state.canvas.width = Math.floor(rect.width * deviceScale);
    state.canvas.height = Math.floor(rect.height * deviceScale);
    state.camera.pixelRatio = deviceScale * zoom;
    state.ctx.setTransform(state.camera.pixelRatio, 0, 0, state.camera.pixelRatio, 0, 0);
    state.camera.w = rect.width / zoom;
    state.camera.h = rect.height / zoom;
    this.update();
  },
  cycleZoom() {
    const state = PW.state;
    const current = this.zoomLevels.indexOf(state.camera.zoom);
    state.camera.zoom = this.zoomLevels[(Math.max(0, current) + 1) % this.zoomLevels.length];
    this.resize();
    PW.Messages.add(`Zoom: ${state.camera.zoom.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x.`, "ok");
    return state.camera.zoom;
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
