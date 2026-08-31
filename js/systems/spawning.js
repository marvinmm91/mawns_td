"use strict";

PW.Spawning = {
  directions: ["n", "s", "e", "w", "ne", "nw", "se", "sw"],
  startNight(finalMode = false) {
    const state = PW.state;
    const night = state.phase.night;
    const waveDef = this.waveForNight(night);
    const budget = PW.Autobalance.effectiveThreatBudgetForNight(night) * (finalMode ? 0.58 : 1);
    state.wave = {
      active: true,
      finalMode,
      budgetRemaining: budget,
      pulseTimer: 1.4,
      pulseIndex: 0,
      plannedDirections: this.pickDirections(waveDef.directions + (finalMode ? 1 : 0)),
      spawnedThisNight: 0,
      gameMode: PW.GameModes.profile().id,
      waveDef
    };
    state.phase.warningDirections = state.wave.plannedDirections;
    PW.Messages.add(`${waveDef.note} Angriff aus ${state.wave.plannedDirections.map(PW.Utils.directionName).join(", ")}.`, "danger");
  },
  waveForNight(night) {
    return PW.WAVES.find((wave) => wave.night === Math.min(night, 10)) || PW.WAVES[PW.WAVES.length - 1];
  },
  pickDirections(count) {
    const rng = PW.state.rng;
    const pool = [...this.directions];
    const result = [];
    while (result.length < Math.min(count, pool.length)) {
      const index = rng.int(0, pool.length - 1);
      result.push(pool.splice(index, 1)[0]);
    }
    return result;
  },
  update(dt) {
    const state = PW.state;
    if (!state.wave.active || state.phase.current !== "night") return;
    if (state.wave.budgetRemaining <= 0) return;
    state.wave.pulseTimer -= dt;
    if (state.wave.pulseTimer > 0) return;
    this.spawnPulse();
    state.wave.pulseIndex += 1;
    const pressure = state.wave.finalMode ? 4.5 : 7.0;
    state.wave.pulseTimer = Math.max(2.4, pressure - Math.min(3, state.phase.night * 0.24) + state.rng.float(-0.8, 0.8));
  },
  spawnPulse() {
    const state = PW.state;
    const wave = state.wave;
    const budgetTarget = Math.min(wave.budgetRemaining, Math.max(3, wave.budgetRemaining * 0.18 + state.phase.night * 0.55));
    let spent = 0;
    let guard = 0;
    while (spent < budgetTarget && wave.budgetRemaining > 0.4 && guard < 16) {
      guard++;
      const remainingBudget = Math.min(wave.budgetRemaining, budgetTarget - spent);
      const type = this.pickEnemyType(wave.waveDef, remainingBudget);
      if (!type) break;
      const def = PW.ENEMIES[type];
      const count = this.packSizeFor(type, remainingBudget);
      if (count < 1) break;
      const dir = state.rng.pick(wave.plannedDirections);
      const anchor = this.spawnPosition(dir);
      for (let index = 0; index < count; index += 1) {
        const pos = index === 0 ? anchor : this.packPosition(anchor, def);
        PW.EnemySystem.spawn(type, pos.x, pos.y);
        spent += def.budget;
        wave.budgetRemaining -= def.budget;
        wave.spawnedThisNight += 1;
      }
    }
  },
  packSizeFor(type, budget) {
    const def = PW.ENEMIES[type];
    const maxCount = Math.max(1, Math.floor(budget / def.budget));
    if (!def.packSize) return 1;
    return Math.min(maxCount, PW.state.rng.int(def.packSize[0], def.packSize[1]));
  },
  packPosition(anchor, def) {
    const state = PW.state;
    const spread = (def.packSpread || 0.5) * state.world.tileSize;
    const x = PW.Utils.clamp(anchor.x + state.rng.float(-spread, spread), state.world.tileSize * 2, (state.world.width - 2) * state.world.tileSize);
    const y = PW.Utils.clamp(anchor.y + state.rng.float(-spread, spread), state.world.tileSize * 2, (state.world.height - 2) * state.world.tileSize);
    const tileX = PW.Utils.worldToTile(x);
    const tileY = PW.Utils.worldToTile(y);
    if (def.moveType === "ground" && PW.Tiles.isBlockedForGround(tileX, tileY)) return anchor;
    return { x, y };
  },
  pickEnemyType(waveDef, maxBudget) {
    const state = PW.state;
    let types = waveDef.enemies.filter((id) => {
      const def = PW.ENEMIES[id];
      const minimumGroupBudget = def.budget * (def.packSize ? def.packSize[0] : 1);
      return minimumGroupBudget <= maxBudget;
    });
    if (waveDef.droneCap && state.wave.spawnedThisNight >= 10) types = types.filter((id) => id !== "drone");
    if (!types.length) return null;
    const entries = types.map((id) => {
      const def = PW.ENEMIES[id];
      let weight = 1 / def.budget;
      if (def.moveType === "air" && state.phase.night < 5) weight *= 0.45;
      if (id === "guardian" && !state.wave.finalMode) weight *= 0.25;
      if (state.balance.nextHints.includes("air")) weight *= def.moveType === "air" ? 0.82 : 1.08;
      return { value: id, weight };
    });
    return PW.Utils.weightedPick(entries, state.rng);
  },
  spawnPosition(direction) {
    const state = PW.state;
    const w = state.world.width;
    const h = state.world.height;
    const ts = state.world.tileSize;
    const margin = 3;
    let x;
    let y;
    if (direction.includes("n")) y = margin;
    else if (direction.includes("s")) y = h - margin - 1;
    else y = state.rng.int(8, h - 9);
    if (direction.includes("w")) x = margin;
    else if (direction.includes("e")) x = w - margin - 1;
    else x = state.rng.int(8, w - 9);
    let guard = 0;
    while (PW.Tiles.isBlockedForGround(x, y) && guard < 60) {
      x += state.rng.int(-2, 2);
      y += state.rng.int(-2, 2);
      x = PW.Utils.clamp(x, 2, w - 3);
      y = PW.Utils.clamp(y, 2, h - 3);
      guard++;
    }
    return { x: x * ts + ts / 2, y: y * ts + ts / 2 };
  }
};
