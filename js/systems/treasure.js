"use strict";

PW.TreasureSystem = {
  generateInitial() {
    const state = PW.state;
    state.world.treasureChests = [];
    state.world.monsterCamps = [];
    const campCount = state.rng.int(PW.CONFIG.treasure.campCount[0], PW.CONFIG.treasure.campCount[1]);
    state.treasure = {
      chestRespawnTimer: 0,
      campRespawnTimer: 0,
      campTarget: campCount
    };
    for (let i = 0; i < campCount; i++) this.spawnCamp();
    const chestCount = state.rng.int(PW.CONFIG.treasure.minActiveChests, PW.CONFIG.treasure.maxActiveChests);
    for (let i = 0; i < chestCount; i++) this.spawnChest();
  },

  update(dt) {
    const state = PW.state;
    if (!state.world.treasureChests) state.world.treasureChests = [];
    if (!state.world.monsterCamps) state.world.monsterCamps = [];
    if (!state.treasure) state.treasure = { chestRespawnTimer: 0, campRespawnTimer: 0, campTarget: PW.CONFIG.treasure.campCount[0] };
    if (!state.treasure.campTarget) state.treasure.campTarget = Math.max(PW.CONFIG.treasure.campCount[0], state.world.monsterCamps.filter((camp) => !camp.cleared).length);
    state.treasure.chestRespawnTimer = Math.max(0, state.treasure.chestRespawnTimer - dt);
    state.treasure.campRespawnTimer = Math.max(0, state.treasure.campRespawnTimer - dt);

    const activeChests = state.world.treasureChests.filter((chest) => !chest.opened).length;
    if (activeChests < PW.CONFIG.treasure.minActiveChests && state.treasure.chestRespawnTimer <= 0) {
      this.spawnChest();
      state.treasure.chestRespawnTimer = PW.CONFIG.treasure.chestRespawnEvery;
    } else if (activeChests < PW.CONFIG.treasure.maxActiveChests && state.treasure.chestRespawnTimer <= 0 && state.rng.chance(0.35)) {
      this.spawnChest();
      state.treasure.chestRespawnTimer = PW.CONFIG.treasure.chestRespawnEvery;
    }

    const targetCamps = state.treasure.campTarget;
    const activeCamps = state.world.monsterCamps.filter((camp) => !camp.cleared).length;
    if (activeCamps < targetCamps && state.treasure.campRespawnTimer <= 0) {
      this.spawnCamp();
      state.treasure.campRespawnTimer = PW.CONFIG.treasure.campRespawnEvery;
    }
  },

  campById(id) {
    return (PW.state.world.monsterCamps || []).find((camp) => camp.id === id) || null;
  },

  chestAt(x, y) {
    return (PW.state.world.treasureChests || []).find((chest) => !chest.opened && chest.x === x && chest.y === y) || null;
  },

  openChestAt(x, y) {
    const chest = this.chestAt(x, y);
    if (!chest) return false;
    const keys = PW.state.inventory.key || 0;
    if (keys < 1) {
      PW.Messages.add("Diese Truhe braucht einen Schlüssel.");
      PW.UI.inspectTile(x, y);
      return true;
    }
    PW.state.inventory.key = keys - 1;
    const source = { x: PW.Utils.tileToWorld(chest.x), y: PW.Utils.tileToWorld(chest.y) };
    Object.entries(chest.rewards).forEach(([id, amount]) => PW.Utils.addInventory(id, amount, source));
    chest.opened = true;
    PW.Utils.addEffect("treasureOpen", PW.Utils.tileToWorld(chest.x), PW.Utils.tileToWorld(chest.y), "#f3d36b", 0.75, 1.4);
    PW.Messages.add(`Schatztruhe geöffnet: ${PW.Utils.costText(chest.rewards)}.`, "ok");
    PW.UI.refreshInventoryDependentPanel();
    return true;
  },

  spawnChest() {
    const tile = this.findFreeTile({ minShipDistance: 16, avoidCamps: 7, avoidChests: 12 });
    if (!tile) return null;
    const chest = {
      id: `chest-${Date.now()}-${Math.random()}`,
      x: tile.x,
      y: tile.y,
      opened: false,
      rewards: this.rollRewards(),
      variant: PW.state.rng.int(0, 2)
    };
    PW.state.world.treasureChests.push(chest);
    return chest;
  },

  spawnCamp() {
    const tile = this.findFreeTile({ minShipDistance: 18, avoidCamps: 13, avoidChests: 6 });
    if (!tile) return null;
    const ts = PW.state.world.tileSize;
    const camp = {
      id: `camp-${Date.now()}-${Math.random()}`,
      x: tile.x * ts + ts / 2,
      y: tile.y * ts + ts / 2,
      tileX: tile.x,
      tileY: tile.y,
      leashPx: PW.CONFIG.treasure.campLeashTiles * ts,
      aggroPx: PW.CONFIG.treasure.campAggroTiles * ts,
      cleared: false,
      keyDropped: false,
      enemyIds: []
    };
    PW.state.world.monsterCamps.push(camp);
    this.spawnCampEnemies(camp);
    return camp;
  },

  spawnCampEnemies(camp) {
    const state = PW.state;
    const strength = this.campStrength(camp);
    const types = this.enemyMix(strength);
    const carrierIndex = state.rng.int(0, types.length - 1);
    types.forEach((type, index) => {
      const pos = this.enemyPositionNear(camp);
      const enemy = PW.EnemySystem.spawn(type, pos.x, pos.y, {
        campId: camp.id,
        campX: camp.x,
        campY: camp.y,
        campLeash: camp.leashPx,
        campAggro: camp.aggroPx,
        campKeyCarrier: index === carrierIndex
      });
      camp.enemyIds.push(enemy.id);
    });
  },

  campStrength(camp) {
    const ship = PW.EnemySystem.shipCenter();
    const distTiles = PW.Utils.distance(camp.x, camp.y, ship.x, ship.y) / PW.state.world.tileSize;
    return Math.max(1, Math.min(4, Math.floor(distTiles / 15)));
  },

  enemyMix(strength) {
    const rng = PW.state.rng;
    if (strength <= 1) return Array.from({ length: rng.int(3, 4) }, () => rng.pick(["crawler", "swarm"]));
    if (strength === 2) return ["armored"].concat(Array.from({ length: rng.int(3, 5) }, () => rng.pick(["crawler", "swarm"])));
    if (strength === 3) return ["armored", "breaker"].concat(Array.from({ length: rng.int(3, 5) }, () => rng.pick(["crawler", "swarm", "armored"])));
    return ["guardian", "breaker"].concat(Array.from({ length: rng.int(4, 6) }, () => rng.pick(["crawler", "armored", "breaker"])));
  },

  enemyPositionNear(camp) {
    const rng = PW.state.rng;
    for (let i = 0; i < 30; i++) {
      const angle = rng.float(0, Math.PI * 2);
      const radius = rng.float(10, 42);
      const x = camp.x + Math.cos(angle) * radius;
      const y = camp.y + Math.sin(angle) * radius;
      if (!PW.Tiles.isBlockedForGround(PW.Utils.worldToTile(x), PW.Utils.worldToTile(y))) return { x, y };
    }
    return { x: camp.x, y: camp.y };
  },

  noteEnemyKilled(enemy) {
    const camp = this.campById(enemy.campId);
    if (!camp) return;
    if (enemy.campKeyCarrier) camp.keyDropped = true;
    const anyAlive = PW.state.enemies.some((item) => item !== enemy && item.campId === camp.id && item.hp > 0 && !item.remove);
    if (!anyAlive) {
      camp.cleared = true;
      PW.Utils.addEffect("campClear", camp.x, camp.y, "#66c6a6", 0.8, 1.6);
      PW.Messages.add("Monsterhorde besiegt.", "ok");
    }
  },

  rollRewards() {
    const rng = PW.state.rng;
    const rewards = {
      wood: rng.int(22, 48),
      stone: rng.int(18, 42),
      scrap: rng.int(10, 26)
    };
    if (rng.chance(0.72)) rewards.iron = rng.int(6, 16);
    if (rng.chance(0.45)) rewards.gold = rng.int(3, 10);
    if (rng.chance(0.38)) rewards.crystal = rng.int(3, 9);
    if (rng.chance(0.42)) rewards.parts = rng.int(1, 4);
    return rewards;
  },

  findFreeTile(options) {
    const state = PW.state;
    const rng = state.rng;
    const shipCx = state.ship.x + state.ship.size / 2;
    const shipCy = state.ship.y + state.ship.size / 2;
    for (let i = 0; i < 600; i++) {
      const x = rng.int(3, state.world.width - 4);
      const y = rng.int(3, state.world.height - 4);
      if (!PW.Tiles.canBuildAt(x, y)) continue;
      if (Math.hypot(x - shipCx, y - shipCy) < options.minShipDistance) continue;
      if (this.tooCloseToChest(x, y, options.avoidChests)) continue;
      if (this.tooCloseToCamp(x, y, options.avoidCamps)) continue;
      return { x, y };
    }
    return null;
  },

  tooCloseToChest(x, y, minTiles) {
    return (PW.state.world.treasureChests || []).some((chest) => !chest.opened && Math.hypot(chest.x - x, chest.y - y) < minTiles);
  },

  tooCloseToCamp(x, y, minTiles) {
    return (PW.state.world.monsterCamps || []).some((camp) => !camp.cleared && Math.hypot(camp.tileX - x, camp.tileY - y) < minTiles);
  }
};
