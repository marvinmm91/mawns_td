"use strict";

PW.EnemySystem = {
  spawn(type, x, y, options = {}) {
    const def = PW.ENEMIES[type];
    const night = Math.max(1, PW.state.phase.night);
    const hpScale = (1 + Math.max(0, night - 1) * 0.07 + PW.state.balance.drift * 0.25) * PW.Development.factor("enemyHpMultiplier");
    const enemy = {
      id: `enemy-${Date.now()}-${PW.state.enemies.length}-${Math.random()}`,
      type,
      x,
      y,
      hp: Math.round(def.hp * hpScale),
      maxHp: Math.round(def.hp * hpScale),
      speed: def.speed * (1 + Math.max(0, night - 1) * 0.012) * PW.Development.factor("enemySpeedMultiplier") * PW.state.rng.float(1, 1.1),
      attackCooldown: PW.state.rng.float(0, def.attackCooldown),
      slowTimer: 0,
      slowFactor: 1,
      retreating: false,
      reachedShip: false,
      waveId: options.waveId || null,
      campId: options.campId || null,
      campX: options.campX || null,
      campY: options.campY || null,
      campLeash: options.campLeash || 0,
      campAggro: options.campAggro || 0,
      campKeyCarrier: options.campKeyCarrier === true,
      outpostId: options.outpostId || null,
      outpostX: options.outpostX || null,
      outpostY: options.outpostY || null,
      outpostLeash: options.outpostLeash || 0
    };
    PW.state.enemies.push(enemy);
    PW.SpatialIndex.add("enemies", enemy);
    return enemy;
  },
  update(dt) {
    const state = PW.state;
    for (const enemy of state.enemies) {
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
      if (enemy.retreating) this.updateRetreat(enemy, dt);
      else this.updateAttack(enemy, dt);
      if (enemy.hp > 0 && !enemy.remove) PW.SpatialIndex.update("enemies", enemy);
    }
    const removed = state.enemies.filter((enemy) => enemy.hp <= 0 || enemy.remove);
    state.enemies = state.enemies.filter((enemy) => enemy.hp > 0 && !enemy.remove);
    removed.forEach((enemy) => PW.SpatialIndex.remove("enemies", enemy));
  },
  updateAttack(enemy, dt) {
    const def = PW.ENEMIES[enemy.type];
    if (enemy.campId) {
      this.updateCamp(enemy, def, dt);
      return;
    }
    if (enemy.outpostId) {
      this.updateOutpostGuard(enemy, def, dt);
      return;
    }
    if (this.attackShipIfClose(enemy, def)) return;
    let route = null;
    if (def.moveType === "ground") {
      const mode = PW.GameModes.profile();
      if (mode.structureTargeting === "blockade") {
        route = PW.Pathfinding.routeInfoFor(enemy);
        if (!route.hasPath) {
          if (this.attackBuilding(enemy, def, route.blockadeTarget, PW.state.world.tileSize * 0.9, mode.breakthroughDamageMultiplier || mode.structureDamageMultiplier)) return;
          if (route.breakthroughStep) {
            this.moveToward(enemy, route.breakthroughStep.x, route.breakthroughStep.y, dt);
            return;
          }
        }
      } else if (mode.structureTargeting === "direct-path") {
        route = PW.Pathfinding.routeInfoFor(enemy);
        if (route.directTarget) {
          if (this.attackBuilding(enemy, def, route.directTarget, PW.state.world.tileSize * 0.9, mode.structureDamageMultiplier)) return;
          if (route.breakthroughStep) {
            this.moveToward(enemy, route.breakthroughStep.x, route.breakthroughStep.y, dt);
            return;
          }
        }
        if (!route.hasPath && route.breakthroughStep) {
          this.moveToward(enemy, route.breakthroughStep.x, route.breakthroughStep.y, dt);
          return;
        }
      }
    }

    let target;
    if (def.moveType === "air") {
      target = this.shipCenter();
    } else {
      target = (route || PW.Pathfinding.routeInfoFor(enemy)).pathStep || this.shipCenter();
    }
    this.moveToward(enemy, target.x, target.y, dt);
  },
  updateCamp(enemy, def, dt) {
    const camp = PW.TreasureSystem && PW.TreasureSystem.campById(enemy.campId);
    if (!camp || camp.cleared) {
      enemy.campId = null;
      this.updateAttack(enemy, dt);
      return;
    }
    const target = this.findCampBuildingTarget(enemy, camp);
    if (target) {
      if (this.attackBuilding(enemy, def, target, PW.CONFIG.treasure.campAttackRange)) return;
      this.moveToward(enemy, PW.Utils.tileToWorld(target.x), PW.Utils.tileToWorld(target.y), dt);
      return;
    }
    const dist = PW.Utils.distance(enemy.x, enemy.y, camp.x, camp.y);
    const roamRadius = Math.max(18, camp.leashPx * 0.34);
    if (dist > roamRadius) {
      this.moveToward(enemy, camp.x, camp.y, dt);
    } else if (!enemy.roamTimer || enemy.roamTimer <= 0) {
      enemy.roamTimer = PW.state.rng.float(1.2, 3.4);
      const angle = PW.state.rng.float(0, Math.PI * 2);
      const radius = PW.state.rng.float(10, roamRadius);
      enemy.roamX = camp.x + Math.cos(angle) * radius;
      enemy.roamY = camp.y + Math.sin(angle) * radius;
    } else {
      enemy.roamTimer -= dt;
      this.moveToward(enemy, enemy.roamX, enemy.roamY, dt * 0.45);
    }
  },
  updateOutpostGuard(enemy, def, dt) {
    const outpost = PW.OutpostSystem && PW.OutpostSystem.byId(enemy.outpostId);
    if (!outpost || outpost.status !== "active") {
      enemy.outpostId = null;
      this.updateAttack(enemy, def, dt);
      return;
    }
    const anchor = { x: PW.Utils.tileToWorld(outpost.x), y: PW.Utils.tileToWorld(outpost.y), aggroPx: outpost.guardRadius };
    const target = this.findCampBuildingTarget(enemy, anchor);
    if (target) {
      if (this.attackBuilding(enemy, def, target, PW.CONFIG.treasure.campAttackRange)) return;
      this.moveToward(enemy, PW.Utils.tileToWorld(target.x), PW.Utils.tileToWorld(target.y), dt);
      return;
    }
    const dist = PW.Utils.distance(enemy.x, enemy.y, anchor.x, anchor.y);
    const roamRadius = Math.max(18, outpost.guardRadius * 0.3);
    if (dist > roamRadius) {
      this.moveToward(enemy, anchor.x, anchor.y, dt);
    } else if (!enemy.roamTimer || enemy.roamTimer <= 0) {
      enemy.roamTimer = PW.state.rng.float(1.1, 2.7);
      const angle = PW.state.rng.float(0, Math.PI * 2);
      const radius = PW.state.rng.float(8, roamRadius);
      enemy.roamX = anchor.x + Math.cos(angle) * radius;
      enemy.roamY = anchor.y + Math.sin(angle) * radius;
    } else {
      enemy.roamTimer -= dt;
      this.moveToward(enemy, enemy.roamX, enemy.roamY, dt * 0.45);
    }
  },
  findCampBuildingTarget(enemy, camp) {
    let best = null;
    let bestDist = Infinity;
    for (const building of PW.SpatialIndex.nearby("buildings", camp.x, camp.y, camp.aggroPx)) {
      const def = PW.BUILDINGS[building.type];
      if (!def || (def.category !== "tower" && def.category !== "wall")) continue;
      const bx = PW.Utils.tileToWorld(building.x);
      const by = PW.Utils.tileToWorld(building.y);
      const campDist = PW.Utils.distance(camp.x, camp.y, bx, by);
      if (campDist > camp.aggroPx) continue;
      const dist = PW.Utils.distance(enemy.x, enemy.y, bx, by);
      if (dist < bestDist) {
        best = building;
        bestDist = dist;
      }
    }
    return best;
  },
  attackBuilding(enemy, def, building, rangePx, damageMultiplier = 1) {
    if (!building) return false;
    const bx = PW.Utils.tileToWorld(building.x);
    const by = PW.Utils.tileToWorld(building.y);
    if (PW.Utils.distance(enemy.x, enemy.y, bx, by) > rangePx) return false;
    if (enemy.attackCooldown <= 0) {
      const damage = (def.wallDamage || def.damage) * damageMultiplier * PW.Development.factor("enemyDamageMultiplier");
      PW.DamageVisuals.building(building, damage);
      enemy.attackCooldown = def.attackCooldown;
      if (PW.state.nightStats) PW.state.nightStats.wallDamage += damage;
      this.addAttackEffect(enemy, def, bx, by, 0.8);
      if (building.hp <= 0) {
        PW.BuildingSystem.destroy(building);
        if (PW.state.nightStats) PW.state.nightStats.wallsDestroyed += 1;
      }
    }
    return true;
  },
  updateRetreat(enemy, dt) {
    const cx = PW.state.world.width * PW.state.world.tileSize / 2;
    const cy = PW.state.world.height * PW.state.world.tileSize / 2;
    const dx = enemy.x - cx;
    const dy = enemy.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / len) * enemy.speed * 1.35 * dt;
    enemy.y += (dy / len) * enemy.speed * 1.35 * dt;
    const tx = PW.Utils.worldToTile(enemy.x);
    const ty = PW.Utils.worldToTile(enemy.y);
    if (tx < 1 || ty < 1 || tx > PW.state.world.width - 2 || ty > PW.state.world.height - 2) enemy.remove = true;
  },
  moveToward(enemy, x, y, dt) {
    const dx = x - enemy.x;
    const dy = y - enemy.y;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const speed = enemy.speed * enemy.slowFactor;
    enemy.x += (dx / len) * speed * dt;
    enemy.y += (dy / len) * speed * dt;
  },
  shipCenter() {
    const ship = PW.state.ship;
    const ts = PW.state.world.tileSize;
    return { x: (ship.x + ship.size / 2) * ts, y: (ship.y + ship.size / 2) * ts };
  },
  attackShipIfClose(enemy, def) {
    const center = this.shipCenter();
    const dist = PW.Utils.distance(enemy.x, enemy.y, center.x, center.y);
    const range = (PW.state.ship.size * PW.state.world.tileSize) / 2 + 18;
    if (dist > range) return false;
    if (enemy.attackCooldown <= 0) {
      const damage = Math.ceil(def.damage * (PW.state.ship.launchActive ? 0.35 : 1) * PW.Development.factor("enemyDamageMultiplier"));
      PW.DamageVisuals.ship(damage);
        if (PW.state.nightStats) {
          PW.state.nightStats.shipDamageTaken += damage;
          if (def.moveType === "air") PW.state.nightStats.airDamage += damage;
        }
      enemy.attackCooldown = def.attackCooldown;
      enemy.reachedShip = true;
      this.addAttackEffect(enemy, def, center.x, center.y, 1.8);
      if (PW.state.ship.hp <= 0) PW.Progression.lose();
    }
    return true;
  },
  damage(enemy, amount, sourceType) {
    const multiplier = this.damageMultiplier(enemy, sourceType);
    const dealt = amount * multiplier;
    enemy.hp -= dealt;
    PW.Utils.addEffect("hit", enemy.x, enemy.y, "#f7e6a1", 0.22, 0.8);
    PW.Utils.addDamageFeedback(enemy, dealt);
    if (enemy.hp <= 0) {
      if (PW.state.nightStats) {
        PW.state.nightStats.kills += 1;
        PW.state.nightStats.killDistanceSum += PW.Utils.distance(enemy.x, enemy.y, this.shipCenter().x, this.shipCenter().y);
      }
      PW.DropSystem.spawnForEnemy(enemy, sourceType);
      if (enemy.campId && PW.TreasureSystem) PW.TreasureSystem.noteEnemyKilled(enemy);
      if (enemy.outpostId && PW.OutpostSystem) PW.OutpostSystem.noteEnemyKilled(enemy);
    }
    return dealt;
  },
  damageMultiplier(enemy, sourceType) {
    const def = PW.ENEMIES[enemy.type];
    if (!def || !sourceType) return 1;
    return PW.Utils.clamp((def.damageTaken && def.damageTaken[sourceType]) || 1, 0.1, 3);
  },
  addAttackEffect(enemy, def, x, y, size) {
    const effect = this.attackEffectFor(enemy.type, def);
    PW.Utils.addEffect(effect.type, x, y, effect.color, effect.life, size);
  },
  attackEffectFor(type, def) {
    if (type === "swarm") return { type: "enemySwarmBite", color: "#d08b51", life: 0.24 };
    if (type === "crawler") return { type: "enemyClaw", color: "#bd6654", life: 0.3 };
    if (type === "armored") return { type: "enemySlam", color: "#c6b0b8", life: 0.38 };
    if (type === "breaker") return { type: "enemyBreakerHit", color: "#f0b84d", life: 0.42 };
    if (type === "guardian") return { type: "enemyGuardianHit", color: "#d7c951", life: 0.5 };
    if (type === "drone") return { type: "enemyDroneZap", color: "#b7c2ff", life: 0.32 };
    if (type === "bomber") return { type: "enemyBomb", color: "#f0b84d", life: 0.48 };
    if (type === "disruptor") return { type: "enemyDisrupt", color: "#d9a8ef", life: 0.45 };
    return { type: def.moveType === "air" ? "enemyDroneZap" : "enemyClaw", color: def.color, life: 0.34 };
  },
};
