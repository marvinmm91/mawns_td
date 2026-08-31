"use strict";

PW.WildlifeSystem = {
  generateInitial() {
    const state = PW.state;
    const world = state.world;
    world.birds = [];
    world.wildlife = [];
    state.fauna = state.fauna || {};
    state.fauna.birdTarget = state.rng.int(PW.WILDLIFE.birds.target[0], PW.WILDLIFE.birds.target[1]);
    state.fauna.critterTarget = state.rng.int(PW.WILDLIFE.critterTarget[0], PW.WILDLIFE.critterTarget[1]);
    state.fauna.critterRespawnTimer = state.rng.float(PW.WILDLIFE.respawnEvery[0], PW.WILDLIFE.respawnEvery[1]);
    Object.keys(PW.WILDLIFE.critters).forEach((id) => this.spawnCritter(id));
    for (let i = 0; i < 5; i++) this.spawnBird({
      x: PW.Utils.worldToTile(state.player.x),
      y: PW.Utils.worldToTile(state.player.y),
      radius: 8
    });
    this.ensurePopulation();
  },

  ensurePopulation() {
    const state = PW.state;
    const world = state.world;
    world.birds = (world.birds || []).filter((bird) => Number.isFinite(bird.x) && Number.isFinite(bird.y));
    world.birds.forEach((bird) => {
      bird.dir = Number.isFinite(bird.dir) ? bird.dir : state.rng.float(0, Math.PI * 2);
      bird.speed = Number.isFinite(bird.speed) ? bird.speed : state.rng.float(PW.WILDLIFE.birds.speed[0], PW.WILDLIFE.birds.speed[1]);
      bird.size = Number.isFinite(bird.size) ? bird.size : state.rng.float(PW.WILDLIFE.birds.size[0], PW.WILDLIFE.birds.size[1]);
      bird.color = bird.color || state.rng.pick(PW.WILDLIFE.birds.colors);
      bird.wingPhase = Number.isFinite(bird.wingPhase) ? bird.wingPhase : state.rng.float(0, Math.PI * 2);
      bird.turnTimer = Number.isFinite(bird.turnTimer) ? bird.turnTimer : state.rng.float(0.8, 2.4);
      bird.age = Number.isFinite(bird.age) ? bird.age : 0;
    });
    world.wildlife = (world.wildlife || []).filter((critter) => {
      const def = PW.WILDLIFE.critters[critter.type];
      return Boolean(def && Number.isFinite(critter.x) && Number.isFinite(critter.y));
    });
    world.wildlife.forEach((critter) => {
      const def = PW.WILDLIFE.critters[critter.type];
      critter.maxHp = Number.isFinite(critter.maxHp) ? critter.maxHp : def.hp;
      critter.hp = Number.isFinite(critter.hp) ? Math.max(1, Math.min(critter.hp, critter.maxHp)) : critter.maxHp;
      critter.radius = Number.isFinite(critter.radius) ? critter.radius : def.radius;
      critter.homeX = Number.isFinite(critter.homeX) ? critter.homeX : critter.x;
      critter.homeY = Number.isFinite(critter.homeY) ? critter.homeY : critter.y;
      critter.targetX = Number.isFinite(critter.targetX) ? critter.targetX : critter.homeX;
      critter.targetY = Number.isFinite(critter.targetY) ? critter.targetY : critter.homeY;
      critter.vx = Number.isFinite(critter.vx) ? critter.vx : 0;
      critter.vy = Number.isFinite(critter.vy) ? critter.vy : 0;
      critter.age = Number.isFinite(critter.age) ? critter.age : 0;
      critter.wanderTimer = Number.isFinite(critter.wanderTimer) ? critter.wanderTimer : state.rng.float(0.8, 1.8);
      critter.fleeTimer = Number.isFinite(critter.fleeTimer) ? critter.fleeTimer : 0;
      critter.hurtTimer = Number.isFinite(critter.hurtTimer) ? critter.hurtTimer : 0;
    });
    state.fauna = state.fauna || { birdTarget: 0, critterTarget: 0, critterRespawnTimer: 0 };
    if (!state.fauna.birdTarget) state.fauna.birdTarget = state.rng.int(PW.WILDLIFE.birds.target[0], PW.WILDLIFE.birds.target[1]);
    if (!state.fauna.critterTarget) state.fauna.critterTarget = state.rng.int(PW.WILDLIFE.critterTarget[0], PW.WILDLIFE.critterTarget[1]);
    if (!Number.isFinite(state.fauna.critterRespawnTimer)) {
      state.fauna.critterRespawnTimer = state.rng.float(PW.WILDLIFE.respawnEvery[0], PW.WILDLIFE.respawnEvery[1]);
    }
    while (world.birds.length < state.fauna.birdTarget) this.spawnBird();
    while (this.activeCritters().length < state.fauna.critterTarget) {
      if (!this.spawnCritter()) break;
    }
  },

  update(dt) {
    const state = PW.state;
    const world = state.world;
    world.birds = world.birds || [];
    world.wildlife = world.wildlife || [];
    state.fauna = state.fauna || { birdTarget: 0, critterTarget: 0, critterRespawnTimer: 0 };
    if (!Number.isFinite(state.fauna.critterRespawnTimer)) {
      state.fauna.critterRespawnTimer = state.rng.float(PW.WILDLIFE.respawnEvery[0], PW.WILDLIFE.respawnEvery[1]);
    }
    this.updateBirds(dt);
    this.updateCritters(dt);
    if (world.birds.length < (state.fauna.birdTarget || 0)) this.spawnBird();
    const living = this.activeCritters().length;
    if (living < (state.fauna.critterTarget || 0)) {
      state.fauna.critterRespawnTimer -= dt;
      if (state.fauna.critterRespawnTimer <= 0) {
        this.spawnCritter();
        state.fauna.critterRespawnTimer = state.rng.float(PW.WILDLIFE.respawnEvery[0], PW.WILDLIFE.respawnEvery[1]);
      }
    }
  },

  activeCritters() {
    return (PW.state.world.wildlife || []).filter((critter) => !critter.remove && critter.hp > 0);
  },

  spawnBird(origin = null) {
    const state = PW.state;
    const rng = state.rng;
    const world = state.world;
    const ts = world.tileSize;
    const tileX = origin ? PW.Utils.clamp(origin.x + rng.float(-origin.radius, origin.radius), 2, world.width - 2) : rng.float(2, world.width - 2);
    const tileY = origin ? PW.Utils.clamp(origin.y + rng.float(-origin.radius, origin.radius), 2, world.height - 2) : rng.float(2, world.height - 2);
    world.birds.push({
      id: `bird-${Date.now()}-${world.birds.length}-${rng.int(0, 99999)}`,
      x: tileX * ts + rng.float(-8, 8),
      y: tileY * ts + rng.float(-8, 8),
      dir: rng.float(0, Math.PI * 2),
      speed: rng.float(PW.WILDLIFE.birds.speed[0], PW.WILDLIFE.birds.speed[1]),
      size: rng.float(PW.WILDLIFE.birds.size[0], PW.WILDLIFE.birds.size[1]),
      color: rng.pick(PW.WILDLIFE.birds.colors),
      wingPhase: rng.float(0, Math.PI * 2),
      turnTimer: rng.float(0.8, 2.4),
      age: rng.float(0, 10)
    });
  },

  spawnCritter(type = null) {
    const state = PW.state;
    const rng = state.rng;
    const ids = Object.keys(PW.WILDLIFE.critters);
    const id = type || rng.pick(ids);
    const def = PW.WILDLIFE.critters[id];
    if (!def) return false;
    const spot = this.findCritterSpawn(def);
    if (!spot) return false;
    state.world.wildlife.push({
      id: `wild-${Date.now()}-${state.world.wildlife.length}-${rng.int(0, 99999)}`,
      type: id,
      x: spot.x,
      y: spot.y,
      homeX: spot.x,
      homeY: spot.y,
      hp: def.hp,
      maxHp: def.hp,
      radius: def.radius,
      vx: 0,
      vy: 0,
      age: rng.float(0, 10),
      wanderTimer: rng.float(0.2, 2.2),
      targetX: spot.x,
      targetY: spot.y,
      fleeTimer: 0,
      hurtTimer: 0
    });
    return true;
  },

  findCritterSpawn(def) {
    const state = PW.state;
    const rng = state.rng;
    const world = state.world;
    const shipCx = state.ship.x + state.ship.size / 2;
    const shipCy = state.ship.y + state.ship.size / 2;
    const playerTx = PW.Utils.worldToTile(state.player.x);
    const playerTy = PW.Utils.worldToTile(state.player.y);
    for (let guard = 0; guard < 5000; guard++) {
      const x = rng.int(2, world.width - 3);
      const y = rng.int(2, world.height - 3);
      const tile = PW.Tiles.get(x, y);
      if (!this.validCritterTile(x, y)) continue;
      if (!this.matchesPreferredTile(tile, def)) continue;
      if (Math.hypot(x - shipCx, y - shipCy) < 13) continue;
      if (Math.hypot(x - playerTx, y - playerTy) < 7) continue;
      const tooClose = (world.wildlife || []).some((critter) => {
        return !critter.remove && PW.Utils.distance(PW.Utils.tileToWorld(x), PW.Utils.tileToWorld(y), critter.x, critter.y) < world.tileSize * 2.1;
      });
      if (tooClose) continue;
      const center = PW.Tiles.tileCenter(x, y);
      return {
        x: center.x + rng.float(-4, 4),
        y: center.y + rng.float(-4, 4)
      };
    }
    return null;
  },

  matchesPreferredTile(tile, def) {
    if (!tile || !def.preferredTiles.includes(tile.kind)) return false;
    if (tile.kind === "soil" && (tile.forest || 0) < 0.32) return false;
    return true;
  },

  validCritterTile(x, y) {
    const tile = PW.Tiles.get(x, y);
    if (!tile || tile.blocked || PW.Tiles.isWaterKind(tile.kind)) return false;
    if (PW.Tiles.isShipTile(x, y)) return false;
    if (PW.Tiles.getResource(x, y) || PW.Tiles.getBuilding(x, y) || PW.Tiles.getChest(x, y) || PW.Tiles.getCamp(x, y)) return false;
    return true;
  },

  updateBirds(dt) {
    const state = PW.state;
    const world = state.world;
    const maxX = world.width * world.tileSize;
    const maxY = world.height * world.tileSize;
    const margin = 80;
    for (const bird of world.birds) {
      bird.age += dt;
      bird.turnTimer -= dt;
      if (bird.turnTimer <= 0) {
        bird.dir += state.rng.float(-0.55, 0.55);
        bird.turnTimer = state.rng.float(0.8, 2.5);
      }
      bird.x += Math.cos(bird.dir) * bird.speed * dt;
      bird.y += Math.sin(bird.dir) * bird.speed * dt;
      if (bird.x < -margin) bird.x = maxX + margin;
      if (bird.x > maxX + margin) bird.x = -margin;
      if (bird.y < -margin) bird.y = maxY + margin;
      if (bird.y > maxY + margin) bird.y = -margin;
    }
  },

  updateCritters(dt) {
    const state = PW.state;
    const rng = state.rng;
    for (const critter of state.world.wildlife) {
      if (critter.remove || critter.hp <= 0) continue;
      const def = PW.WILDLIFE.critters[critter.type];
      if (!def) {
        critter.remove = true;
        continue;
      }
      critter.age += dt;
      critter.hurtTimer = Math.max(0, (critter.hurtTimer || 0) - dt);
      critter.fleeTimer = Math.max(0, (critter.fleeTimer || 0) - dt);
      critter.wanderTimer = Math.max(0, (critter.wanderTimer || 0) - dt);

      const playerDist = PW.Utils.distance(critter.x, critter.y, state.player.x, state.player.y);
      if (playerDist < def.fleeRange) critter.fleeTimer = Math.max(critter.fleeTimer, rng.float(0.7, 1.5));

      let dx = 0;
      let dy = 0;
      if (critter.fleeTimer > 0) {
        dx = critter.x - state.player.x;
        dy = critter.y - state.player.y;
        if (Math.hypot(dx, dy) < 1) {
          dx = rng.float(-1, 1);
          dy = rng.float(-1, 1);
        }
      } else {
        const targetDist = PW.Utils.distance(critter.x, critter.y, critter.targetX, critter.targetY);
        if (targetDist < 6 || critter.wanderTimer <= 0) this.pickWanderTarget(critter, def);
        dx = critter.targetX - critter.x;
        dy = critter.targetY - critter.y;
        if (PW.Utils.distance(critter.x, critter.y, critter.homeX, critter.homeY) > def.homeRadius * state.world.tileSize) {
          dx = critter.homeX - critter.x;
          dy = critter.homeY - critter.y;
        }
      }

      const len = Math.hypot(dx, dy);
      if (len > 0.5) {
        const speed = def.speed * (critter.fleeTimer > 0 ? 1.55 : 1) * (0.88 + Math.sin(critter.age * 1.7) * 0.08);
        critter.vx = (dx / len) * speed;
        critter.vy = (dy / len) * speed;
        this.tryMove(critter, critter.vx * dt, critter.vy * dt);
      } else {
        critter.vx *= 0.82;
        critter.vy *= 0.82;
      }
    }
    state.world.wildlife = state.world.wildlife.filter((critter) => !critter.remove);
  },

  pickWanderTarget(critter, def) {
    const rng = PW.state.rng;
    const ts = PW.state.world.tileSize;
    for (let i = 0; i < 18; i++) {
      const angle = rng.float(0, Math.PI * 2);
      const distance = rng.float(ts * 0.4, def.homeRadius * ts);
      const tx = PW.Utils.worldToTile(critter.homeX + Math.cos(angle) * distance);
      const ty = PW.Utils.worldToTile(critter.homeY + Math.sin(angle) * distance);
      if (!this.validCritterTile(tx, ty)) continue;
      const tile = PW.Tiles.get(tx, ty);
      if (!this.matchesPreferredTile(tile, def) && rng.chance(0.7)) continue;
      const center = PW.Tiles.tileCenter(tx, ty);
      critter.targetX = center.x + rng.float(-5, 5);
      critter.targetY = center.y + rng.float(-5, 5);
      critter.wanderTimer = rng.float(1.2, 3.8);
      return;
    }
    critter.targetX = critter.homeX;
    critter.targetY = critter.homeY;
    critter.wanderTimer = rng.float(0.8, 1.8);
  },

  tryMove(critter, dx, dy) {
    const nextX = critter.x + dx;
    if (this.canOccupy(nextX, critter.y, critter.radius)) critter.x = nextX;
    else critter.wanderTimer = 0;
    const nextY = critter.y + dy;
    if (this.canOccupy(critter.x, nextY, critter.radius)) critter.y = nextY;
    else critter.wanderTimer = 0;
  },

  canOccupy(x, y, radius) {
    const points = [
      [x - radius, y - radius],
      [x + radius, y - radius],
      [x - radius, y + radius],
      [x + radius, y + radius],
      [x, y]
    ];
    return points.every(([px, py]) => this.validMovementTile(PW.Utils.worldToTile(px), PW.Utils.worldToTile(py)));
  },

  validMovementTile(x, y) {
    const tile = PW.Tiles.get(x, y);
    if (!tile || tile.blocked || PW.Tiles.isWaterKind(tile.kind)) return false;
    if (PW.Tiles.isShipTile(x, y)) return false;
    if (PW.Tiles.getResource(x, y) || PW.Tiles.getBuilding(x, y) || PW.Tiles.getChest(x, y) || PW.Tiles.getCamp(x, y)) return false;
    return true;
  },

  atTile(tileX, tileY) {
    const center = PW.Tiles.tileCenter(tileX, tileY);
    const ts = PW.state.world.tileSize;
    let best = null;
    let bestDist = Infinity;
    for (const critter of this.activeCritters()) {
      const dist = PW.Utils.distance(center.x, center.y, critter.x, critter.y);
      if (dist > Math.max(ts * 0.55, (critter.radius || 8) + ts * 0.28)) continue;
      if (dist < bestDist) {
        best = critter;
        bestDist = dist;
      }
    }
    return best;
  },

  attackAt(tileX, tileY) {
    const critter = this.atTile(tileX, tileY);
    if (!critter) return false;
    const tool = PW.state.player.selectedTool;
    if (tool !== "axe" && tool !== "pickaxe") {
      PW.Messages.add("Wildtier: Axt oder Spitzhacke benutzen.");
      return true;
    }
    const damage = tool === "axe" ? 10 : 9;
    this.damage(critter, damage);
    return true;
  },

  damage(critter, amount) {
    const def = PW.WILDLIFE.critters[critter.type];
    if (!def || critter.remove) return;
    critter.hp = Math.max(0, critter.hp - amount);
    critter.hurtTimer = 0.32;
    critter.fleeTimer = Math.max(critter.fleeTimer || 0, 1.5);
    PW.Utils.addEffect("wildlifePoof", critter.x, critter.y, def.color, 0.32, 0.9);
    if (critter.hp <= 0) {
      this.dropRewards(critter, def);
      critter.remove = true;
      PW.Messages.add(`${def.name} erlegt.`, "ok");
    } else {
      PW.Messages.add(`${def.name} getroffen (${Math.ceil(critter.hp)}/${critter.maxHp}).`);
    }
  },

  dropRewards(critter, def) {
    const rng = PW.state.rng;
    Object.entries(def.rewards || {}).forEach(([resource, spec]) => {
      const [chance, min, max] = spec;
      if (!rng.chance(chance)) return;
      PW.DropSystem.spawn(resource, rng.int(min, max), critter.x, critter.y);
    });
  },

  rewardText(def) {
    return Object.entries(def.rewards || {}).map(([resource, spec]) => {
      const [chance, min, max] = spec;
      const amount = min === max ? String(min) : `${min}-${max}`;
      const suffix = chance >= 1 ? "" : ` (${Math.round(chance * 100)}%)`;
      return `${PW.RESOURCES[resource].name} ${amount}${suffix}`;
    }).join(", ");
  }
};
