"use strict";

PW.ProjectileSystem = {
  spawn(tower, enemy, def) {
    const origin = PW.Tiles.tileCenter(tower.x, tower.y);
    if (tower.type === "laser") {
      PW.Utils.addEffect("laserBeam", (origin.x + enemy.x) / 2, (origin.y + enemy.y) / 2, this.colorFor(tower.type), 0.16, 1, {
        x1: origin.x,
        y1: origin.y,
        x2: enemy.x,
        y2: enemy.y
      });
      PW.Utils.addEffect("laserHit", enemy.x, enemy.y, this.colorFor(tower.type), 0.22, 1);
      PW.EnemySystem.damage(enemy, def.damage, tower.type);
      return;
    }
    PW.state.projectiles.push({
      x: origin.x,
      y: origin.y,
      prevX: origin.x,
      prevY: origin.y,
      targetId: enemy.id,
      damage: def.damage,
      speed: def.projectileSpeed,
      splash: def.splash || 0,
      slow: def.slow || 0,
      slowTime: def.slowTime || 0,
      color: this.colorFor(tower.type),
      life: 2.4,
      sourceType: tower.type
    });
  },
  colorFor(type) {
    if (type === "flak") return "#a9d8ff";
    if (type === "laser") return "#ffdf75";
    if (type === "tesla") return "#83e3da";
    if (type === "catapult") return "#c4b59b";
    return "#f0b84d";
  },
  update(dt) {
    const state = PW.state;
    for (const projectile of state.projectiles) {
      projectile.life -= dt;
      const target = state.enemies.find((enemy) => enemy.id === projectile.targetId);
      if (!target || target.hp <= 0) {
        projectile.remove = true;
        continue;
      }
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 12) {
        this.hit(projectile, target);
        projectile.remove = true;
        continue;
      }
      projectile.prevX = projectile.x;
      projectile.prevY = projectile.y;
      projectile.x += (dx / Math.max(1, dist)) * projectile.speed * dt;
      projectile.y += (dy / Math.max(1, dist)) * projectile.speed * dt;
      if (projectile.life <= 0) projectile.remove = true;
    }
    state.projectiles = state.projectiles.filter((projectile) => !projectile.remove);
  },
  hit(projectile, target) {
    if (projectile.splash > 0) {
      const radius = projectile.splash * PW.state.world.tileSize;
      for (const enemy of PW.state.enemies) {
        if (PW.ENEMIES[enemy.type].moveType !== PW.ENEMIES[target.type].moveType) continue;
        const dist = PW.Utils.distance(enemy.x, enemy.y, target.x, target.y);
        if (dist <= radius) PW.EnemySystem.damage(enemy, projectile.damage * (enemy === target ? 1 : 0.62), projectile.sourceType);
      }
      PW.Utils.addEffect("catapultSplash", target.x, target.y, projectile.color, 0.58, projectile.splash);
      return;
    }
    if (projectile.slow) {
      target.slowFactor = Math.min(target.slowFactor, 1 - projectile.slow);
      target.slowTimer = Math.max(target.slowTimer, projectile.slowTime);
      PW.Utils.addEffect("teslaPulse", target.x, target.y, projectile.color, 0.42, 1.2);
    } else if (projectile.sourceType === "flak") {
      PW.Utils.addEffect("flakBurst", target.x, target.y, projectile.color, 0.34, 1);
    } else if (projectile.sourceType === "laser") {
      PW.Utils.addEffect("laserHit", target.x, target.y, projectile.color, 0.28, 1);
    } else {
      PW.Utils.addEffect("boltHit", target.x, target.y, projectile.color, 0.25, 0.85);
    }
    PW.EnemySystem.damage(target, projectile.damage, projectile.sourceType);
  }
};
