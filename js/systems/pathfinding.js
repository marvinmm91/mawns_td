"use strict";

PW.Pathfinding = {
  dirty: true,
  field: [],
  directField: [],
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
    this.computeDirectField();
    this.dirty = false;
  },
  computeDirectField() {
    const state = PW.state;
    const world = state.world;
    const size = world.width * world.height;
    const field = new Array(size).fill(Infinity);
    const queue = [];
    const push = (entry) => {
      queue.push(entry);
      let index = queue.length - 1;
      while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (queue[parent].cost <= entry.cost) break;
        queue[index] = queue[parent];
        index = parent;
      }
      queue[index] = entry;
    };
    const pop = () => {
      const first = queue[0];
      const last = queue.pop();
      if (queue.length && last) {
        let index = 0;
        while (index * 2 + 1 < queue.length) {
          let child = index * 2 + 1;
          if (child + 1 < queue.length && queue[child + 1].cost < queue[child].cost) child += 1;
          if (queue[child].cost >= last.cost) break;
          queue[index] = queue[child];
          index = child;
        }
        queue[index] = last;
      }
      return first;
    };
    const ship = state.ship;
    for (let y = ship.y - 1; y <= ship.y + ship.size; y++) {
      for (let x = ship.x - 1; x <= ship.x + ship.size; x++) {
        if (!PW.Tiles.inBounds(x, y) || PW.Tiles.isShipTile(x, y) || this.isBlockedForDirectRoute(x, y)) continue;
        const index = PW.Tiles.idx(x, y);
        field[index] = 0;
        push({ x, y, cost: 0 });
      }
    }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length) {
      const current = pop();
      if (!current || current.cost !== field[PW.Tiles.idx(current.x, current.y)]) continue;
      for (const [dx, dy] of dirs) {
        const x = current.x + dx;
        const y = current.y + dy;
        if (!PW.Tiles.inBounds(x, y) || this.isBlockedForDirectRoute(x, y)) continue;
        const index = PW.Tiles.idx(x, y);
        const cost = current.cost + this.directRouteCost(x, y);
        if (field[index] <= cost) continue;
        field[index] = cost;
        push({ x, y, cost });
      }
    }
    this.directField = field;
  },
  isBlockedForDirectRoute(x, y) {
    const tile = PW.Tiles.get(x, y);
    if (!tile || tile.blocked || PW.Tiles.getResource(x, y) || PW.Tiles.getChest(x, y) || PW.Tiles.getCamp(x, y) || PW.Tiles.getOutpost(x, y)) return true;
    return false;
  },
  directRouteCost(x, y) {
    const building = PW.Tiles.getBuilding(x, y);
    return building && PW.BUILDINGS[building.type] && PW.BUILDINGS[building.type].blocksGround ? PW.CONFIG.pathfinding.directStructureCost : 1;
  },
  update() {
    if (this.dirty) this.compute();
  },
  nextStepFor(enemy) {
    return this.routeInfoFor(enemy).pathStep;
  },
  routeInfoFor(enemy) {
    if (this.dirty) this.compute();
    const tx = PW.Utils.worldToTile(enemy.x);
    const ty = PW.Utils.worldToTile(enemy.y);
    if (!PW.Tiles.inBounds(tx, ty)) return { hasPath: false, pathStep: null, breakthroughStep: null, blockadeTarget: null, directTarget: null };
    const hasPath = Number.isFinite(this.field[PW.Tiles.idx(tx, ty)]);
    const pathTile = this.bestStepFor(tx, ty, this.field, false);
    const directTile = this.bestStepFor(tx, ty, this.directField, true);
    const directTarget = directTile && this.defenseAt(directTile.x, directTile.y);
    return {
      hasPath,
      pathStep: pathTile && PW.Tiles.tileCenter(pathTile.x, pathTile.y),
      breakthroughStep: directTile && PW.Tiles.tileCenter(directTile.x, directTile.y),
      blockadeTarget: hasPath ? null : directTarget,
      directTarget
    };
  },
  defenseAt(x, y) {
    const building = PW.Tiles.getBuilding(x, y);
    const def = building && PW.BUILDINGS[building.type];
    return def && (def.category === "tower" || def.category === "wall") ? building : null;
  },
  bestStepFor(tx, ty, field, allowStructures) {
    const current = field[PW.Tiles.idx(tx, ty)];
    if (!Number.isFinite(current)) return null;
    let best = null;
    let bestScore = current;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (!PW.Tiles.inBounds(nx, ny) || (!allowStructures && PW.Tiles.isBlockedForGround(nx, ny)) || (allowStructures && this.isBlockedForDirectRoute(nx, ny))) continue;
      const score = field[PW.Tiles.idx(nx, ny)];
      if (score < bestScore) {
        bestScore = score;
        best = { x: nx, y: ny };
      }
    }
    return best;
  }
};
