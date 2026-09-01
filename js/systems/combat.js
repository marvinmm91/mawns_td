"use strict";

PW.Combat = {
  targetPriorityDefinitions: Object.freeze({
    ship: { label: "Wracknah" },
    nearest: { label: "Nächster" },
    strongest: { label: "Stärkster" },
    breaker: { label: "Brecher zuerst" },
    air: { label: "Luft zuerst" }
  }),
  update(dt) {
    const state = PW.state;
    const energyBonus = state.ship.modules.energy ? 1.1 : 1;
    for (const building of state.world.buildings) {
      const def = PW.BUILDINGS[building.type];
      if (def.category !== "tower") continue;
      const disrupted = this.disruptionAt(building.x, building.y);
      const ratePenalty = disrupted ? 0.55 : 1;
      building.cooldown = Math.max(0, building.cooldown - dt * energyBonus * ratePenalty);
      if (building.cooldown > 0) continue;
      const target = this.findTarget(building, def);
      if (!target) continue;
      const scaled = this.scaledTowerDef(building, def);
      PW.ProjectileSystem.spawn(building, target, scaled);
      building.cooldown = 1 / Math.max(0.1, scaled.rate);
    }
  },
  towerStats(def, level = 1) {
    const upgradeLevel = Math.max(1, level);
    return {
      damage: def.damage * (1 + (upgradeLevel - 1) * 0.35),
      rate: def.rate * (1 + (upgradeLevel - 1) * 0.18),
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
    const options = ["ship", "nearest", "strongest", "breaker"];
    if (def.targets.includes("ground") && def.targets.includes("air")) options.push("air");
    return options.map((id) => ({ id, ...this.targetPriorityDefinitions[id] }));
  },
  targetPriority(building, def) {
    const options = this.targetPriorityOptions(building, def);
    return options.some((option) => option.id === building.targetPriority) ? building.targetPriority : "ship";
  },
  targetPriorityLabel(building, def) {
    const priority = this.targetPriority(building, def);
    return this.targetPriorityDefinitions[priority].label;
  },
  preferredCandidates(candidates, priority) {
    if (priority === "air") {
      const airTargets = candidates.filter((enemy) => PW.ENEMIES[enemy.type].moveType === "air");
      return airTargets.length ? airTargets : candidates;
    }
    if (priority === "breaker") {
      const breakers = candidates.filter((enemy) => enemy.type === "breaker");
      return breakers.length ? breakers : candidates;
    }
    return candidates;
  },
  targetScore(enemy, origin, ship, priority) {
    const dist = PW.Utils.distance(origin.x, origin.y, enemy.x, enemy.y);
    if (priority === "nearest") return dist;
    if (priority === "strongest") return -(enemy.maxHp || enemy.hp) * 1000 + dist;
    return PW.Utils.distance(enemy.x, enemy.y, ship.x, ship.y) + dist * 0.05;
  },
  findTarget(building, def) {
    const scaled = this.scaledTowerDef(building, def);
    const origin = PW.Tiles.tileCenter(building.x, building.y);
    const rangePx = scaled.range * PW.state.world.tileSize;
    const ship = PW.EnemySystem.shipCenter();
    const candidates = [];
    for (const enemy of PW.SpatialIndex.nearby("enemies", origin.x, origin.y, rangePx)) {
      if (enemy.hp <= 0 || enemy.remove || enemy.retreating) continue;
      const enemyDef = PW.ENEMIES[enemy.type];
      if (scaled.targets.includes(enemyDef.moveType)) candidates.push(enemy);
    }
    const priority = this.targetPriority(building, def);
    const preferred = this.preferredCandidates(candidates, priority);
    let best = null;
    let bestScore = Infinity;
    for (const enemy of preferred) {
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
