"use strict";

PW.Combat = {
  targetPriorityDefinitions: Object.freeze({
    ship: { label: "Wracknähe" },
    last: { label: "Letzter" },
    strongest: { label: "Stärkster" },
    weakest: { label: "Schwächster" }
  }),
  update(dt) {
    const state = PW.state;
    const energyBonus = state.ship.modules.energy ? 1.1 : 1;
    for (const building of state.world.buildings) {
      const def = PW.BUILDINGS[building.type];
      if (def.category !== "tower" || PW.BuildingSystem.isConstructing(building)) continue;
      const disrupted = this.disruptionAt(building.x, building.y);
      const ratePenalty = disrupted ? 0.55 : 1;
      building.cooldown = Math.max(0, building.cooldown - dt * energyBonus * ratePenalty);
      if (building.cooldown > 0) continue;
      const firstShotReady = PW.Perks.has("fireControlRadar") && (building.radarCharge || 0) >= 4;
      const target = this.findTarget(building, def, firstShotReady ? 2 : 1);
      if (!target) {
        building.radarCharge = Math.min(4, (building.radarCharge || 0) + dt);
        continue;
      }
      const scaled = this.scaledTowerDef(building, def);
      PW.ProjectileSystem.spawn(building, target, scaled);
      building.radarCharge = 0;
      building.cooldown = 1 / Math.max(0.1, scaled.rate);
    }
  },
  towerStats(def, level = 1) {
    const upgradeLevel = Math.max(1, level);
    return {
      damage: def.damage * (1 + (upgradeLevel - 1) * 0.35) * PW.Perks.towerDamageMultiplier(),
      rate: def.rate * (1 + (upgradeLevel - 1) * 0.18) * PW.Perks.towerRateMultiplier(),
      range: def.range * (1 + (upgradeLevel - 1) * 0.08),
      splash: (def.splash || 0) * (1 + (upgradeLevel - 1) * 0.08)
    };
  },
  scaledTowerDef(building, def) {
    return {
      ...def,
      ...this.towerStats(def, building.level)
    };
  },
  targetPriorityOptions(building, def) {
    return ["ship", "last", "strongest", "weakest"].map((id) => ({ id, ...this.targetPriorityDefinitions[id] }));
  },
  targetPriority(building, def) {
    const options = this.targetPriorityOptions(building, def);
    return options.some((option) => option.id === building.targetPriority) ? building.targetPriority : "ship";
  },
  targetPriorityLabel(building, def) {
    const priority = this.targetPriority(building, def);
    return this.targetPriorityDefinitions[priority].label;
  },
  targetScore(enemy, origin, ship, priority) {
    const dist = PW.Utils.distance(origin.x, origin.y, enemy.x, enemy.y);
    if (priority === "last") return -dist;
    if (priority === "strongest") return -(enemy.maxHp || enemy.hp) * 1000 + dist;
    if (priority === "weakest") return enemy.hp * 1000 + dist;
    return PW.Utils.distance(enemy.x, enemy.y, ship.x, ship.y) + dist * 0.05;
  },
  findTarget(building, def, rangeMultiplier = 1) {
    const scaled = this.scaledTowerDef(building, def);
    const origin = PW.Tiles.tileCenter(building.x, building.y);
    const rangePx = scaled.range * rangeMultiplier * PW.state.world.tileSize;
    const ship = PW.EnemySystem.shipCenter();
    const candidates = [];
    for (const enemy of PW.SpatialIndex.nearby("enemies", origin.x, origin.y, rangePx)) {
      if (enemy.hp <= 0 || enemy.remove || enemy.retreating) continue;
      const enemyDef = PW.ENEMIES[enemy.type];
      if (scaled.targets.includes(enemyDef.moveType)) candidates.push(enemy);
    }
    const priority = this.targetPriority(building, def);
    let best = null;
    let bestScore = Infinity;
    for (const enemy of candidates) {
      const score = this.targetScore(enemy, origin, ship, priority);
      if (score < bestScore) {
        best = enemy;
        bestScore = score;
      }
    }
    return best;
  },
  disruptionAt(tileX, tileY) {
    const x = PW.Utils.tileToWorld(tileX);
    const y = PW.Utils.tileToWorld(tileY);
    const maxAura = Math.max(0, ...Object.values(PW.ENEMIES).map((def) => def.aura || 0)) * PW.state.world.tileSize;
    if (maxAura <= 0) return false;
    return PW.SpatialIndex.nearby("enemies", x, y, maxAura).some((enemy) => {
      const def = PW.ENEMIES[enemy.type];
      return enemy.hp > 0 && !enemy.remove && def.aura && PW.Utils.distance(enemy.x, enemy.y, x, y) <= def.aura * PW.state.world.tileSize;
    });
  }
};
