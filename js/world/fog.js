"use strict";

PW.Fog = {
  init() {
    const world = PW.state.world;
    world.fog = new Array(world.width * world.height).fill(0);
    this.revealAroundPlayer(true);
  },
  update() {
    this.revealAroundPlayer(false);
  },
  revealAroundPlayer(initial) {
    const state = PW.state;
    const px = Math.floor(state.player.x / state.world.tileSize);
    const py = Math.floor(state.player.y / state.world.tileSize);
    const radius = initial ? 9 : PW.CONFIG.sight[state.phase.current];
    PW.Tiles.circleTiles(px, py, radius).forEach(({ x, y }) => {
      const idx = PW.Tiles.idx(x, y);
      state.world.fog[idx] = 2;
    });
    const edgeRadius = radius + 2;
    PW.Tiles.circleTiles(px, py, edgeRadius).forEach(({ x, y }) => {
      const idx = PW.Tiles.idx(x, y);
      if (state.world.fog[idx] === 0) state.world.fog[idx] = 1;
    });
    this.revealShipArea();
  },
  revealShipArea() {
    const ship = PW.state.ship;
    const cx = ship.x + ship.size / 2;
    const cy = ship.y + ship.size / 2;
    PW.Tiles.circleTiles(cx, cy, 8).forEach(({ x, y }) => {
      PW.state.world.fog[PW.Tiles.idx(x, y)] = 2;
    });
  },
  isKnown(x, y) {
    if (!PW.Tiles.inBounds(x, y)) return false;
    return PW.state.world.fog[PW.Tiles.idx(x, y)] > 0;
  },
  isVisible(x, y) {
    if (!PW.Tiles.inBounds(x, y)) return false;
    return PW.state.world.fog[PW.Tiles.idx(x, y)] === 2;
  },
  fadeVisibility() {
    const state = PW.state;
    for (let i = 0; i < state.world.fog.length; i++) {
      if (state.world.fog[i] === 2) state.world.fog[i] = 1;
    }
  }
};

