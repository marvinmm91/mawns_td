"use strict";

PW.DamageVisuals = {
  building(building, amount) {
    building.hp = Math.max(0, building.hp - amount);
    building.damageFlash = 0.32;
    const pos = PW.Tiles.tileCenter(building.x, building.y);
    PW.Utils.addEffect("structureHit", pos.x, pos.y, "#e35d57", 0.28, 1);
    return building.hp;
  },
  ship(amount) {
    const ship = PW.state.ship;
    ship.hp = Math.max(0, ship.hp - amount);
    ship.damageFlash = 0.38;
    const pos = PW.EnemySystem.shipCenter();
    PW.Utils.addEffect("structureHit", pos.x, pos.y, "#e35d57", 0.34, 2.5);
    return ship.hp;
  },
  update(dt) {
    const state = PW.state;
    state.ship.damageFlash = Math.max(0, (state.ship.damageFlash || 0) - dt);
    for (const building of state.world.buildings) {
      building.damageFlash = Math.max(0, (building.damageFlash || 0) - dt);
    }
  }
};
