"use strict";

PW.DropSystem = {
  lootProfiles: Object.freeze([
    { maxHp: 12, chance: 0.4, amounts: [1, 1], weights: { scrap: 34, wood: 25, stone: 22, iron: 12, parts: 3, crystal: 3, gold: 1 } },
    { maxHp: 60, chance: 1, amounts: [1, 2], weights: { scrap: 34, wood: 25, stone: 22, iron: 12, parts: 3, crystal: 3, gold: 1 } },
    { maxHp: 110, chance: 1, amounts: [1, 2], weights: { scrap: 34, wood: 23, stone: 20, iron: 13, parts: 4, crystal: 4, gold: 2 } },
    { maxHp: 180, chance: 1, amounts: [2, 3], weights: { scrap: 33, wood: 20, stone: 18, iron: 14, parts: 6, crystal: 6, gold: 3 } },
    { maxHp: Infinity, chance: 1, amounts: [3, 4], weights: { scrap: 30, wood: 17, stone: 15, iron: 16, parts: 9, crystal: 8, gold: 5 } }
  ]),
  lootProfileFor(def) {
    return this.lootProfiles.find((profile) => def.hp <= profile.maxHp);
  },
  rollResource(weights) {
    const totalWeight = Object.values(weights).reduce((total, weight) => total + weight, 0);
    let roll = PW.state.rng.float(0, totalWeight);
    for (const [resource, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) return resource;
    }
    return "scrap";
  },
  spawnForEnemy(enemy) {
    const state = PW.state;
    const def = PW.ENEMIES[enemy.type];
    if (enemy.campKeyCarrier) {
      this.spawn("key", 1, enemy.x, enemy.y);
      PW.Messages.add("Ein Schlüssel wurde fallen gelassen.", "ok");
    }
    const profile = this.lootProfileFor(def);
    const dropBonus = state.balance.dropBonus || 0;
    let rolls = state.rng.chance(profile.chance) ? state.rng.int(...profile.amounts) : 0;
    if (state.rng.chance(dropBonus)) rolls += 1;
    if (state.rng.chance(PW.Perks.extraEnemyDropChance())) rolls += 1;
    const rewards = {};
    for (let index = 0; index < rolls; index += 1) {
      const resource = this.rollResource(profile.weights);
      rewards[resource] = (rewards[resource] || 0) + 1;
    }
    Object.entries(rewards).forEach(([resource, amount]) => this.spawn(resource, amount, enemy.x, enemy.y));
  },
  spawn(resource, amount, x, y) {
    const state = PW.state;
    const drop = {
      id: `drop-${Date.now()}-${Math.random()}`,
      resource,
      amount,
      x: x + state.rng.float(-8, 8),
      y: y + state.rng.float(-8, 8),
      life: 999
    };
    state.drops.push(drop);
    PW.SpatialIndex.add("drops", drop);
  },
  update(dt) {
    const state = PW.state;
    for (const drop of state.drops) {
      drop.life -= dt;
      const dist = PW.Utils.distance(drop.x, drop.y, state.player.x, state.player.y);
      if (dist < PW.CONFIG.dropPickupRadius) {
        PW.Utils.addInventory(drop.resource, drop.amount, drop);
        drop.remove = true;
      } else if (dist < PW.Perks.magnetRadius()) {
        const speed = PW.CONFIG.dropMagnetSpeed * dt;
        drop.x += (state.player.x - drop.x) / dist * Math.min(speed, dist);
        drop.y += (state.player.y - drop.y) / dist * Math.min(speed, dist);
      }
      if (!drop.remove) PW.SpatialIndex.update("drops", drop);
    }
    const removed = state.drops.filter((drop) => drop.remove || drop.life <= 0);
    state.drops = state.drops.filter((drop) => !drop.remove && drop.life > 0);
    removed.forEach((drop) => PW.SpatialIndex.remove("drops", drop));
  }
};
