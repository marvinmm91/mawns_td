"use strict";

PW.DamageVisuals = {
  building(building, amount) {
    building.hp = Math.max(0, building.hp - amount);
    building.damageFlash = 0.32;
    const pos = PW.Tiles.tileCenter(building.x, building.y);
    PW.Utils.addEffect("structureHit", pos.x, pos.y, "#e35d57", 0.28, 1);
    return building.hp;
  },
  shipDamageResistance() {
    const ship = PW.state.ship;
    const maximum = PW.Autobalance.difficultyProfile().shipDamageResistanceMax || 0;
    const healthRatio = ship.maxHp > 0 ? ship.hp / ship.maxHp : 0;
    return PW.Utils.clamp((1 - healthRatio) * maximum, 0, maximum);
  },
  ship(amount) {
    const ship = PW.state.ship;
    const damage = Math.max(0, Number(amount) || 0) * (1 - this.shipDamageResistance());
    const appliedDamage = Math.min(ship.hp, damage);
    ship.hp = Math.max(0, ship.hp - appliedDamage);
    ship.damageFlash = 0.38;
    const pos = PW.EnemySystem.shipCenter();
    PW.Utils.addEffect("structureHit", pos.x, pos.y, "#e35d57", 0.34, 2.5);
    return appliedDamage;
  },
  update(dt) {
    const state = PW.state;
    state.ship.damageFlash = Math.max(0, (state.ship.damageFlash || 0) - dt);
    for (const building of state.world.buildings) {
      building.damageFlash = Math.max(0, (building.damageFlash || 0) - dt);
    }
  }
};
