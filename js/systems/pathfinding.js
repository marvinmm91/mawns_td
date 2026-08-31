"use strict";

PW.Pathfinding = {
  dirty: true,
  field: [],
  markDirty() {
    this.dirty = true;
  },
  compute() {
    const state = PW.state;
    const world = state.world;
    this.field = new Array(world.width * world.height).fill(Infinity);
    const queue = [];
    const ship = state.ship;
    for (let y = ship.y - 1; y <= ship.y + ship.size; y++) {
      for (let x = ship.x - 1; x <= ship.x + ship.size; x++) {
        if (!PW.Tiles.inBounds(x, y) || PW.Tiles.isShipTile(x, y)) continue;
        if (PW.Tiles.isBlockedForGround(x, y)) continue;
        const idx = PW.Tiles.idx(x, y);
        this.field[idx] = 0;
        queue.push({ x, y });
      }
    }
    let head = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (head < queue.length) {
      const current = queue[head++];
      const base = this.field[PW.Tiles.idx(current.x, current.y)];
      for (const [dx, dy] of dirs) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (!PW.Tiles.inBounds(nx, ny) || PW.Tiles.isBlockedForGround(nx, ny)) continue;
        const idx = PW.Tiles.idx(nx, ny);
        if (this.field[idx] <= base + 1) continue;
        this.field[idx] = base + 1;
        queue.push({ x: nx, y: ny });
      }
    }
    this.dirty = false;
  },
  update() {
    if (this.dirty) this.compute();
  },
  nextStepFor(enemy) {
    if (this.dirty) this.compute();
    const tx = PW.Utils.worldToTile(enemy.x);
    const ty = PW.Utils.worldToTile(enemy.y);
    if (!PW.Tiles.inBounds(tx, ty)) return null;
    let best = null;
    let bestScore = this.field[PW.Tiles.idx(tx, ty)];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (!PW.Tiles.inBounds(nx, ny) || PW.Tiles.isBlockedForGround(nx, ny)) continue;
      const score = this.field[PW.Tiles.idx(nx, ny)];
      if (score < bestScore) {
        bestScore = score;
        best = { x: nx, y: ny };
      }
    }
    if (!best || !Number.isFinite(bestScore)) return null;
    return PW.Tiles.tileCenter(best.x, best.y);
  }
};

