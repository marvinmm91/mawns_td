"use strict";

PW.MapGenerator = {
  generate() {
    const state = PW.state;
    const rng = state.rng;
    const world = state.world;
    world.tiles = [];
    world.resources = [];
    world.resourceMap.clear();
    world.birds = [];
    world.wildlife = [];
    world.treasureChests = [];
    world.monsterCamps = [];
    world.buildings = [];
    world.buildingMap.clear();
    world.waterways = { river: [], brooks: [] };
    this.biomeCenters = this.makeBiomeCenters();

    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const edge = Math.min(x, y, world.width - 1 - x, world.height - 1 - y);
        const scores = this.biomeScores(x, y);
        const blocked = edge < 1 || rng.next() < 0.014;
        const variant = rng.int(0, 3);
        const kind = blocked ? "ridge" : this.groundKind(scores);
        world.tiles.push({ x, y, kind, blocked, variant, forest: scores.forest, wetness: scores.wetness });
      }
    }

    this.carveWaterways();
    this.softWaterEdges();
    this.clearArea(state.ship.x + state.ship.size / 2, state.ship.y + state.ship.size / 2, 8);
    this.clearArea(Math.floor(state.player.x / world.tileSize), Math.floor(state.player.y / world.tileSize), 4);
    this.scatterResources();
    if (PW.TreasureSystem) PW.TreasureSystem.generateInitial();
    if (PW.WildlifeSystem) PW.WildlifeSystem.generateInitial();
    PW.Fog.init();
  },

  clearArea(cx, cy, radius) {
    PW.Tiles.circleTiles(cx, cy, radius).forEach(({ x, y }) => {
      const tile = PW.Tiles.get(x, y);
      if (tile) {
        tile.blocked = false;
        tile.kind = "soil";
        tile.forest = 0;
        tile.wetness = 0;
        tile.ford = false;
      }
      this.removeResourceAt(x, y);
    });
  },

  removeResourceAt(x, y) {
    const world = PW.state.world;
    const key = PW.Utils.tileKey(x, y);
    const node = world.resourceMap.get(key);
    if (!node) return;
    world.resourceMap.delete(key);
    world.resources = world.resources.filter((item) => item !== node);
  },

  addResource(type, x, y) {
    const world = PW.state.world;
    const def = PW.RESOURCE_NODES[type];
    if (!def || !PW.Tiles.inBounds(x, y) || PW.Tiles.isShipTile(x, y)) return false;
    const tile = PW.Tiles.get(x, y);
    if (!tile || tile.blocked || PW.Tiles.isWaterKind(tile.kind) || PW.Tiles.getResource(x, y) || PW.Tiles.getBuilding(x, y)) return false;
    const rng = PW.state.rng;
    const scale = rng.float(0.78, 1.28);
    const amount = Math.max(1, Math.round(rng.int(def.amount[0], def.amount[1]) * (0.88 + scale * 0.14)));
    const hp = this.rollResourceHp(type);
    const node = {
      id: `res-${world.resources.length + 1}-${Date.now()}`,
      type,
      x,
      y,
      hp,
      maxHp: hp,
      hpRange: this.resourceHpRange(type),
      amount,
      variant: rng.int(0, 4),
      scale,
      offsetX: rng.float(-3.5, 3.5),
      offsetY: rng.float(-3.5, 3.5),
      shape: rng.int(0, 3)
    };
    world.resources.push(node);
    world.resourceMap.set(PW.Utils.tileKey(x, y), node);
    return true;
  },

  rollResourceHp(type) {
    const hpRange = this.resourceHpRange(type);
    return PW.state.rng.int(hpRange[0], hpRange[1]);
  },

  resourceHpRange(type) {
    const def = PW.RESOURCE_NODES[type];
    if (!def) return [1, 1];
    return Array.isArray(def.hp) ? def.hp : [def.hp, def.hp];
  },

  normalizeResourceHp(node) {
    const def = PW.RESOURCE_NODES[node.type];
    if (!def) return;
    const hpRange = this.resourceHpRange(node.type);
    const minHp = hpRange[0];
    const maxHp = hpRange[1];
    if (Array.isArray(node.hpRange) && node.hpRange[0] === minHp && node.hpRange[1] === maxHp && node.maxHp >= minHp && node.maxHp <= maxHp) return;
    const wasDamaged = node.maxHp > 0 && node.hp < node.maxHp;
    const hp = this.rollResourceHp(node.type);
    node.maxHp = hp;
    node.hpRange = hpRange.slice();
    node.hp = wasDamaged ? Math.max(1, Math.min(hp, Math.ceil(hp * 0.5))) : hp;
  },

  scatterResources() {
    const state = PW.state;
    const rng = state.rng;
    const shipCx = state.ship.x + state.ship.size / 2;
    const shipCy = state.ship.y + state.ship.size / 2;
    const attempts = Math.round(state.world.width * state.world.height * 0.23);
    for (let i = 0; i < attempts; i++) {
      const x = rng.int(2, state.world.width - 3);
      const y = rng.int(2, state.world.height - 3);
      const tile = PW.Tiles.get(x, y);
      if (!tile || tile.blocked || PW.Tiles.isWaterKind(tile.kind)) continue;
      const d = Math.hypot(x - shipCx, y - shipCy);
      const type = this.pickResourceForTile(tile, d);
      if (type) this.addResource(type, x, y);
    }

    this.ensureResourceRing("iron", 22, 38, 7);
    this.ensureResourceRing("gold", 46, 66, 6);
    this.ensureResourceRing("crystal", 48, 70, 6);
  },

  pickResourceForTile(tile, distanceToShip) {
    const rng = PW.state.rng;
    if (distanceToShip < 10) return null;
    const roll = rng.next();
    const forest = tile.forest || 0;
    const wetness = tile.wetness || 0;
    if (tile.kind === "forestFloor" || forest > 0.58) {
      if (roll < 0.54) return "tree";
      if (roll < 0.66) return "rock";
      if (distanceToShip > 24 && roll < 0.72) return "iron";
      return null;
    }
    if (tile.kind === "wetland" || wetness > 0.58) {
      if (roll < 0.2) return "tree";
      if (roll < 0.36) return "rock";
      if (distanceToShip > 30 && roll < 0.48) return "crystal";
      if (distanceToShip > 24 && roll < 0.55) return "iron";
      return null;
    }
    if (distanceToShip < 26) {
      if (roll < 0.38) return "tree";
      if (roll < 0.62) return "rock";
      if (distanceToShip > 18 && roll < 0.68) return "iron";
      return null;
    }
    if (roll < 0.26) return "tree";
    if (roll < 0.43) return "rock";
    if (roll < 0.55) return "iron";
    if (distanceToShip > 42 && roll < 0.61) return "gold";
    if (distanceToShip > 42 && roll < 0.67) return "crystal";
    return null;
  },

  makeBiomeCenters() {
    const state = PW.state;
    const rng = state.rng;
    const forests = [];
    const wetlands = [];
    for (let i = 0; i < 13; i++) {
      forests.push({
        x: rng.float(8, state.world.width - 8),
        y: rng.float(8, state.world.height - 8),
        radius: rng.float(9, 20),
        strength: rng.float(0.72, 1.15)
      });
    }
    for (let i = 0; i < 7; i++) {
      wetlands.push({
        x: rng.float(8, state.world.width - 8),
        y: rng.float(8, state.world.height - 8),
        radius: rng.float(11, 24),
        strength: rng.float(0.55, 0.95)
      });
    }
    return { forests, wetlands };
  },

  biomeScores(x, y) {
    let forest = 0;
    let wetness = 0;
    for (const center of this.biomeCenters.forests) {
      const influence = 1 - Math.hypot(x - center.x, y - center.y) / center.radius;
      if (influence > 0) forest = Math.max(forest, influence * center.strength);
    }
    for (const center of this.biomeCenters.wetlands) {
      const influence = 1 - Math.hypot(x - center.x, y - center.y) / center.radius;
      if (influence > 0) wetness = Math.max(wetness, influence * center.strength);
    }
    forest = PW.Utils.clamp(forest + this.coordNoise(x, y, 3) * 0.24 - 0.12, 0, 1);
    wetness = PW.Utils.clamp(wetness + this.coordNoise(x, y, 9) * 0.18 - 0.08, 0, 1);
    return { forest, wetness };
  },

  groundKind(scores) {
    if (scores.wetness > 0.6 && scores.forest < 0.72) return "wetland";
    if (scores.forest > 0.48) return "forestFloor";
    return "soil";
  },

  coordNoise(x, y, salt) {
    const value = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719 + PW.state.seed * 0.0001) * 43758.5453;
    return value - Math.floor(value);
  },

  carveWaterways() {
    const state = PW.state;
    const rng = state.rng;
    const horizontal = rng.chance(0.5);
    const margin = 14;
    const shipCx = state.ship.x + state.ship.size / 2;
    const shipCy = state.ship.y + state.ship.size / 2;
    let start;
    let end;
    if (horizontal) {
      const baseY = this.awayFromCenter(rng.int(margin, state.world.height - margin), shipCy, 17, margin, state.world.height - margin);
      start = { x: 0, y: baseY + rng.int(-8, 8) };
      end = { x: state.world.width - 1, y: this.awayFromCenter(baseY + rng.int(-18, 18), shipCy, 17, margin, state.world.height - margin) };
    } else {
      const baseX = this.awayFromCenter(rng.int(margin, state.world.width - margin), shipCx, 17, margin, state.world.width - margin);
      start = { x: baseX + rng.int(-8, 8), y: 0 };
      end = { x: this.awayFromCenter(baseX + rng.int(-18, 18), shipCx, 17, margin, state.world.width - margin), y: state.world.height - 1 };
    }
    const river = this.makeMeanderPath(start, end, 150, horizontal ? state.world.height * 0.08 : state.world.width * 0.08);
    state.world.waterways.river = river;
    this.carvePath(river, rng.float(1.65, 2.25), true);
    [0.22, 0.48, 0.74].forEach((t) => this.markFord(river[Math.floor(river.length * t)], 3.1));

    const brookCount = rng.int(1, 2);
    for (let i = 0; i < brookCount; i++) {
      const join = river[Math.floor(river.length * rng.float(0.22, 0.78))];
      const source = this.brookSourceNearEdge(join);
      const brook = this.makeMeanderPath(source, join, 80, 8);
      state.world.waterways.brooks.push(brook);
      this.carvePath(brook, rng.float(0.55, 0.9), false);
      this.markFord(brook[Math.floor(brook.length * 0.48)], 1.5);
    }
  },

  awayFromCenter(value, center, minDistance, min, max) {
    if (Math.abs(value - center) >= minDistance) return PW.Utils.clamp(value, min, max);
    const dir = value < center ? -1 : 1;
    return PW.Utils.clamp(center + dir * minDistance, min, max);
  },

  makeMeanderPath(start, end, steps, wiggle) {
    const state = PW.state;
    const rng = state.rng;
    const phaseA = rng.float(0, Math.PI * 2);
    const phaseB = rng.float(0, Math.PI * 2);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bx = start.x + dx * t;
      const by = start.y + dy * t;
      const sway = Math.sin(t * Math.PI * 2 + phaseA) * wiggle + Math.sin(t * Math.PI * 5 + phaseB) * wiggle * 0.35;
      const jitter = (this.coordNoise(Math.round(bx), Math.round(by), 17) - 0.5) * wiggle * 0.45;
      path.push({
        x: PW.Utils.clamp(bx + nx * (sway + jitter), 1, state.world.width - 2),
        y: PW.Utils.clamp(by + ny * (sway + jitter), 1, state.world.height - 2)
      });
    }
    return path;
  },

  brookSourceNearEdge(join) {
    const state = PW.state;
    const rng = state.rng;
    const side = rng.pick(["n", "s", "e", "w"]);
    if (side === "n") return { x: PW.Utils.clamp(join.x + rng.int(-34, 34), 3, state.world.width - 4), y: 3 };
    if (side === "s") return { x: PW.Utils.clamp(join.x + rng.int(-34, 34), 3, state.world.width - 4), y: state.world.height - 4 };
    if (side === "e") return { x: state.world.width - 4, y: PW.Utils.clamp(join.y + rng.int(-34, 34), 3, state.world.height - 4) };
    return { x: 3, y: PW.Utils.clamp(join.y + rng.int(-34, 34), 3, state.world.height - 4) };
  },

  carvePath(path, radius, deep) {
    for (const point of path) {
      const cx = Math.round(point.x);
      const cy = Math.round(point.y);
      const r = Math.ceil(radius + 1);
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          const tile = PW.Tiles.get(x, y);
          if (!tile) continue;
          const dist = Math.hypot(point.x - x, point.y - y);
          if (dist > radius) continue;
          const shallow = !deep || dist > radius - 0.55;
          tile.kind = shallow ? "shallowWater" : "water";
          tile.blocked = !shallow;
          tile.wetness = 1;
          tile.forest = Math.min(tile.forest || 0, 0.25);
        }
      }
    }
  },

  markFord(point, radius) {
    if (!point) return;
    const cx = Math.round(point.x);
    const cy = Math.round(point.y);
    for (let y = cy - Math.ceil(radius); y <= cy + Math.ceil(radius); y++) {
      for (let x = cx - Math.ceil(radius); x <= cx + Math.ceil(radius); x++) {
        const tile = PW.Tiles.get(x, y);
        if (!tile || !PW.Tiles.isWaterKind(tile.kind)) continue;
        if (Math.hypot(point.x - x, point.y - y) > radius) continue;
        tile.kind = "shallowWater";
        tile.blocked = false;
        tile.ford = true;
      }
    }
  },

  softWaterEdges() {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    for (const tile of PW.state.world.tiles) {
      if (PW.Tiles.isWaterKind(tile.kind) || tile.kind === "ridge") continue;
      const touchesWater = dirs.some(([dx, dy]) => {
        const other = PW.Tiles.get(tile.x + dx, tile.y + dy);
        return other && PW.Tiles.isWaterKind(other.kind);
      });
      if (!touchesWater) continue;
      tile.wetness = Math.max(tile.wetness || 0, 0.68);
      if ((tile.forest || 0) < 0.62) tile.kind = "wetland";
    }
  },

  ensureResourceRing(type, minR, maxR, count) {
    const state = PW.state;
    const rng = state.rng;
    const cx = state.ship.x + state.ship.size / 2;
    const cy = state.ship.y + state.ship.size / 2;
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < 600) {
      guard++;
      const angle = rng.float(0, Math.PI * 2);
      const r = rng.float(minR, maxR);
      const x = Math.round(cx + Math.cos(angle) * r);
      const y = Math.round(cy + Math.sin(angle) * r);
      if (this.addResource(type, x, y)) placed++;
    }
  }
};
