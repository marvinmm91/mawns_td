"use strict";

PW.DropSystem = {
  spawnForEnemy(enemy) {
    const state = PW.state;
    const def = PW.ENEMIES[enemy.type];
    if (enemy.campKeyCarrier) {
      this.spawn("key", 1, enemy.x, enemy.y);
      PW.Messages.add("Ein Schluessel wurde fallen gelassen.", "ok");
    }
    const dropBonus = state.balance.dropBonus || 0;
    Object.entries(def.drops || {}).forEach(([id, spec]) => {
      const [chance, min, max] = spec;
      const adjustedChance = PW.Utils.clamp(chance + dropBonus, 0, 1);
      if (!state.rng.chance(adjustedChance)) return;
      const amount = state.rng.int(min, max);
      this.spawn(id, amount, enemy.x, enemy.y);
    });
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
        PW.Utils.addInventory(drop.resource, drop.amount);
        PW.Messages.add(`${PW.RESOURCES[drop.resource].name} +${drop.amount}`, "ok");
        drop.remove = true;
      } else if (dist < PW.CONFIG.dropMagnetRadius) {
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
