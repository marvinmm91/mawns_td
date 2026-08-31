"use strict";

PW.Combat = {
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
      PW.ProjectileSystem.spawn(building, target, this.scaledTowerDef(building, def));
      building.cooldown = 1 / Math.max(0.1, def.rate * (1 + (building.level - 1) * 0.18));
    }
  },
  scaledTowerDef(building, def) {
    return {
      ...def,
      damage: def.damage * (1 + (building.level - 1) * 0.35),
      range: def.range * (1 + (building.level - 1) * 0.08),
      splash: (def.splash || 0) * (1 + (building.level - 1) * 0.08)
    };
  },
  findTarget(building, def) {
    const scaled = this.scaledTowerDef(building, def);
    const origin = PW.Tiles.tileCenter(building.x, building.y);
    const rangePx = scaled.range * PW.state.world.tileSize;
    const ship = PW.EnemySystem.shipCenter();
    let best = null;
    let bestScore = Infinity;
    for (const enemy of PW.SpatialIndex.nearby("enemies", origin.x, origin.y, rangePx)) {
      if (enemy.hp <= 0 || enemy.remove || enemy.retreating) continue;
      const enemyDef = PW.ENEMIES[enemy.type];
      if (!scaled.targets.includes(enemyDef.moveType)) continue;
      const dist = PW.Utils.distance(origin.x, origin.y, enemy.x, enemy.y);
      const score = PW.Utils.distance(enemy.x, enemy.y, ship.x, ship.y) + dist * 0.05;
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
