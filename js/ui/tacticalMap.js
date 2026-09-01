"use strict";

PW.TacticalMap = {
  init() {
    const dom = PW.state.dom;
    dom.tacticalMapCloseButton.addEventListener("click", () => this.close());
  },
  toggle() {
    this.setOpen(!PW.state.tacticalMapOpen);
  },
  close() {
    this.setOpen(false);
  },
  setOpen(open) {
    const state = PW.state;
    state.tacticalMapOpen = Boolean(open);
    state.tacticalMapLastRender = -Infinity;
    state.dom.tacticalMap.classList.toggle("hidden", !state.tacticalMapOpen);
    state.input.keys.clear();
    state.input.pressed.clear();
    if (state.tacticalMapOpen) this.render(true);
    else PW.Bootstrap.focusGame();
  },
  render(force = false) {
    const state = PW.state;
    if (!state.tacticalMapOpen) return;
    if (!force && state.elapsed - state.tacticalMapLastRender < 0.1) return;
    const canvas = state.dom.tacticalMapCanvas;
    const world = state.world;
    if (!canvas || !world.width || !world.height) return;
    if (canvas.width !== world.width || canvas.height !== world.height) {
      canvas.width = world.width;
      canvas.height = world.height;
    }
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    this.drawTerrain(ctx, world);
    this.drawShip(ctx);
    this.drawPins(ctx);
    this.drawPlayer(ctx);
    this.drawEnemies(ctx);
    state.tacticalMapLastRender = state.elapsed;
  },
  drawTerrain(ctx, world) {
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const index = y * world.width + x;
        const tile = world.tiles[index];
        ctx.fillStyle = world.fog[index] > 0 && tile ? PW.RenderWorld.tileColor(tile) : "#101614";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  drawShip(ctx) {
    const ship = PW.state.ship;
    ctx.fillStyle = "#d7fffb";
    ctx.fillRect(ship.x, ship.y, ship.size, ship.size);
    ctx.fillStyle = "#315b63";
    ctx.fillRect(ship.x + 1, ship.y + 1, Math.max(1, ship.size - 2), Math.max(1, ship.size - 2));
  },
  drawPins(ctx) {
    for (const pin of PW.state.world.mapPins || []) {
      const definition = PW.MapPins.definitions[pin.kind];
      if (!definition) continue;
      ctx.fillStyle = definition.color;
      ctx.fillRect(pin.x - 1, pin.y - 1, 3, 3);
    }
  },
  drawPlayer(ctx) {
    const ts = PW.state.world.tileSize;
    const x = Math.floor(PW.state.player.x / ts);
    const y = Math.floor(PW.state.player.y / ts);
    ctx.fillStyle = "#66c6a6";
    ctx.fillRect(x - 1, y - 1, 3, 3);
    ctx.fillStyle = "#d7fffb";
    ctx.fillRect(x, y, 1, 1);
  },
  drawEnemies(ctx) {
    const ts = PW.state.world.tileSize;
    ctx.fillStyle = "#e35d57";
    PW.state.enemies.forEach((enemy) => {
      const x = Math.floor(enemy.x / ts);
      const y = Math.floor(enemy.y / ts);
      ctx.fillRect(x, y, 2, 2);
    });
  }
};
