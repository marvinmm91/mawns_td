"use strict";

PW.RenderEntities = {
  draw(ctx) {
    this.drawBirds(ctx);
    this.drawDrops(ctx);
    this.drawWildlife(ctx);
    this.drawEnemies(ctx);
    this.drawPlayer(ctx);
    this.drawProjectiles(ctx);
  },
  drawWorldEntities(ctx) {
    this.drawBirds(ctx);
    this.drawDrops(ctx);
    this.drawWildlife(ctx);
    this.drawEnemies(ctx);
  },
  visible(kind, pad = 1) {
    return PW.SpatialIndex.visible(kind, PW.Camera.visibleTileBounds(pad));
  },
  drawBirds(ctx) {
    for (const bird of this.visible("birds")) {
      const tileX = PW.Utils.worldToTile(bird.x);
      const tileY = PW.Utils.worldToTile(bird.y);
      if (!PW.Fog.isKnown(tileX, tileY)) continue;
      const x = bird.x - PW.state.camera.x;
      const y = bird.y - PW.state.camera.y + Math.sin(bird.age * 4 + bird.wingPhase) * 1.8;
      const size = bird.size || 9;
      if (PW.PixelArt && PW.PixelArt.drawCentered(ctx, "bird.small", x, y, size * 2, size * 2)) continue;
      this.drawBirdShape(ctx, bird, x, y);
    }
  },
  drawBirdShape(ctx, bird, x, y) {
    const size = bird.size || 9;
    const wing = Math.sin(bird.age * 12 + bird.wingPhase);
    const wingSpan = size * (1.15 + Math.abs(wing) * 0.75);
    const lift = wing * size * 0.28;
    const bodyW = Math.max(4, size * 0.72);
    const bodyH = Math.max(3, size * 0.5);
    const dir = Math.cos(bird.dir) < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(-size * 0.55, size * 0.48, size * 1.1, 2);
    ctx.fillStyle = bird.color || "#f2eddc";
    ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);
    ctx.fillStyle = "#3f4239";
    ctx.fillRect(-wingSpan, -2 - lift, wingSpan - bodyW * 0.35, 3);
    ctx.fillRect(bodyW * 0.35, -2 + lift, wingSpan - bodyW * 0.35, 3);
    ctx.fillStyle = "#f0b84d";
    ctx.fillRect(bodyW / 2 - 1, -2, 3, 2);
    ctx.fillStyle = "#2d3638";
    ctx.fillRect(-bodyW / 2 - 3, -1, 3, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bodyW * 0.08, -bodyH / 2 - 1, 1.5, 1.5);
    ctx.restore();
  },
  drawWildlife(ctx) {
    for (const critter of this.visible("wildlife")) {
      if (critter.remove || critter.hp <= 0) continue;
      const tileX = PW.Utils.worldToTile(critter.x);
      const tileY = PW.Utils.worldToTile(critter.y);
      if (!PW.Fog.isKnown(tileX, tileY)) continue;
      const def = PW.WILDLIFE.critters[critter.type];
      if (!def) continue;
      const x = critter.x - PW.state.camera.x;
      const y = critter.y - PW.state.camera.y;
      if (PW.PixelArt && PW.PixelArt.drawCentered(ctx, `wildlife.${critter.type}`, x, y, 24, 24)) {
        // Custom pixel wildlife drawn.
      } else {
        this.drawWildlifeShape(ctx, critter, def, x, y);
      }
      if (critter.hp < critter.maxHp || critter.hurtTimer > 0) {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(x - 11, y - 18, 22, 3);
        ctx.fillStyle = critter.hurtTimer > 0 ? "#f0b84d" : "#66c6a6";
        ctx.fillRect(x - 11, y - 18, 22 * Math.max(0, critter.hp / critter.maxHp), 3);
      }
    }
  },
  drawWildlifeShape(ctx, critter, def, x, y) {
    const facing = critter.vx < -1 ? -1 : 1;
    const bob = Math.sin((critter.age || 0) * 5) * 1.1;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(facing, 1);
    ctx.fillStyle = "rgba(0,0,0,.24)";
    ctx.fillRect(-11, 8, 22, 4);
    if (critter.type === "forestHopper") {
      ctx.fillStyle = "#3d5f35";
      ctx.fillRect(-8, 0, 16, 9);
      ctx.fillStyle = def.color;
      ctx.fillRect(-6, -3, 14, 10);
      ctx.fillRect(3, -8, 8, 7);
      ctx.fillStyle = def.accent;
      ctx.fillRect(5, -16, 3, 9);
      ctx.fillRect(9, -15, 3, 8);
      ctx.fillStyle = "#2d3638";
      ctx.fillRect(-10, 7, 5, 5);
      ctx.fillRect(2, 7, 5, 5);
      ctx.fillStyle = "#f2eddc";
      ctx.fillRect(7, -5, 2, 2);
      ctx.fillStyle = "#d9c39b";
      ctx.fillRect(-11, -2, 4, 4);
    } else if (critter.type === "mossBeetle") {
      ctx.fillStyle = "#242c27";
      ctx.fillRect(-13, 2, 4, 3);
      ctx.fillRect(9, 2, 4, 3);
      ctx.fillRect(-13, 8, 4, 3);
      ctx.fillRect(9, 8, 4, 3);
      ctx.fillStyle = "#3b4039";
      ctx.fillRect(-10, -5, 20, 16);
      ctx.fillStyle = def.color;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = "#6fb65d";
      ctx.fillRect(-6, -9, 6, 4);
      ctx.fillRect(1, -4, 6, 4);
      ctx.fillRect(-3, 4, 5, 4);
      ctx.fillStyle = def.accent;
      ctx.fillRect(-7, -2, 14, 2);
      ctx.fillRect(-1, -7, 2, 14);
      ctx.fillStyle = "#f2eddc";
      ctx.fillRect(6, -6, 2, 2);
      ctx.fillRect(6, -1, 2, 2);
    }
    ctx.restore();
  },
  drawPlayer(ctx) {
    const p = PW.state.player;
    const x = p.x - PW.state.camera.x;
    const y = p.y - PW.state.camera.y;
    const facing = Math.abs(p.dirX) > Math.abs(p.dirY) ? (p.dirX < 0 ? "left" : "right") : (p.dirY < 0 ? "up" : "down");
    if (!(PW.PixelArt && PW.PixelArt.drawCentered(ctx, `player.${facing}`, x, y - 1, 24, 24))) {
      ctx.fillStyle = "#2d3638";
      ctx.fillRect(x - 9, y - 8, 18, 18);
      ctx.fillStyle = "#d9c39b";
      ctx.fillRect(x - 6, y - 17, 12, 10);
      ctx.fillStyle = "#66c6a6";
      ctx.fillRect(x + p.dirX * 10 - 3, y + p.dirY * 10 - 3, 6, 6);
    }
    const target = PW.Player.targetTile();
    const ts = PW.state.world.tileSize;
    ctx.strokeStyle = "rgba(240,184,77,.75)";
    ctx.lineWidth = 2;
    ctx.strokeRect(target.x * ts - PW.state.camera.x + 3, target.y * ts - PW.state.camera.y + 3, ts - 6, ts - 6);
  },
  drawEnemies(ctx) {
    this.drawCamps(ctx);
    for (const enemy of this.visible("enemies")) {
      const def = PW.ENEMIES[enemy.type];
      const x = enemy.x - PW.state.camera.x;
      const y = enemy.y - PW.state.camera.y;
      this.drawGroundShadow(ctx, x, y + 9, 23, 4);
      const custom = PW.PixelArt && PW.PixelArt.drawCentered(ctx, `enemy.${enemy.type}`, x, y, 24, 24, { alpha: enemy.retreating ? 0.65 : 1 });
      if (!custom) this.drawEnemyShape(ctx, enemy, def, x, y);
      const stateColor = enemy.campId ? "#f0b84d" : def.moveType === "air" ? "#a9d8ff" : "#e97868";
      this.drawStateCorners(ctx, x, y, stateColor, 13);
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(x - 12, y - 17, 24, 4);
      ctx.fillStyle = "#e35d57";
      ctx.fillRect(x - 12, y - 17, 24 * Math.max(0, enemy.hp / enemy.maxHp), 4);
      if (enemy.slowTimer > 0) {
        ctx.strokeStyle = "#83e3da";
        ctx.strokeRect(x - 13, y - 13, 26, 26);
      }
      if (enemy.campKeyCarrier) {
        ctx.fillStyle = "rgba(0,0,0,.6)";
        ctx.fillRect(x - 4, y - 25, 8, 8);
        ctx.fillStyle = "#f3d36b";
        ctx.fillRect(x - 3, y - 24, 6, 6);
      }
    }
  },
  drawEnemyShape(ctx, enemy, def, x, y) {
    const color = enemy.retreating ? "#8c8c8c" : def.color;
    ctx.save();
    ctx.fillStyle = color;
    if (enemy.type === "swarm") {
      ctx.fillRect(x - 10, y - 4, 7, 7);
      ctx.fillRect(x + 1, y - 7, 8, 8);
      ctx.fillRect(x - 2, y + 3, 7, 6);
      ctx.fillStyle = "#ffe0a0";
      ctx.fillRect(x - 7, y - 2, 2, 2);
      ctx.fillRect(x + 5, y - 5, 2, 2);
    } else if (enemy.type === "crawler") {
      ctx.fillRect(x - 10, y - 7, 20, 13);
      ctx.fillStyle = "#74392f";
      ctx.fillRect(x - 13, y - 3, 4, 3);
      ctx.fillRect(x + 9, y - 3, 4, 3);
      ctx.fillRect(x - 13, y + 3, 4, 3);
      ctx.fillRect(x + 9, y + 3, 4, 3);
      ctx.fillStyle = "#f2eddc";
      ctx.fillRect(x + 4, y - 4, 3, 3);
    } else if (enemy.type === "armored") {
      ctx.fillRect(x - 11, y - 9, 22, 17);
      ctx.fillStyle = "#c6b0b8";
      ctx.fillRect(x - 8, y - 7, 16, 4);
      ctx.fillRect(x - 7, y, 14, 4);
      ctx.fillStyle = "#3a252d";
      ctx.fillRect(x + 5, y - 3, 4, 3);
    } else if (enemy.type === "breaker") {
      ctx.fillRect(x - 12, y - 10, 24, 18);
      ctx.fillStyle = "#5a211d";
      ctx.fillRect(x - 15, y - 3, 6, 9);
      ctx.fillRect(x + 9, y - 3, 6, 9);
      ctx.fillStyle = "#f0b84d";
      ctx.fillRect(x - 4, y - 13, 8, 4);
    } else if (enemy.type === "guardian") {
      ctx.fillRect(x - 13, y - 12, 26, 21);
      ctx.fillStyle = "#4d381f";
      ctx.fillRect(x - 16, y - 4, 5, 10);
      ctx.fillRect(x + 11, y - 4, 5, 10);
      ctx.fillStyle = "#d7c951";
      ctx.fillRect(x - 8, y - 9, 16, 3);
      ctx.fillRect(x - 3, y - 15, 6, 6);
    } else if (enemy.type === "drone") {
      ctx.fillRect(x - 7, y - 6, 14, 12);
      ctx.fillStyle = "#b7c2ff";
      ctx.fillRect(x - 17, y - 10, 10, 5);
      ctx.fillRect(x + 7, y - 10, 10, 5);
      ctx.fillRect(x - 17, y + 5, 10, 5);
      ctx.fillRect(x + 7, y + 5, 10, 5);
      ctx.fillStyle = "#d7f1ff";
      ctx.fillRect(x - 3, y - 2, 6, 4);
    } else if (enemy.type === "bomber") {
      ctx.fillRect(x - 5, y - 13, 10, 22);
      ctx.fillStyle = "#8b83d8";
      ctx.fillRect(x - 17, y - 4, 34, 7);
      ctx.fillStyle = "#2c285f";
      ctx.fillRect(x - 3, y + 8, 6, 7);
      ctx.fillStyle = "#f0b84d";
      ctx.fillRect(x - 2, y + 11, 4, 4);
    } else if (enemy.type === "disruptor") {
      ctx.fillRect(x - 8, y - 8, 16, 16);
      ctx.strokeStyle = "#d9a8ef";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 13, y - 13, 26, 26);
      ctx.strokeRect(x - 18, y - 5, 36, 10);
      ctx.fillStyle = "#f2d7ff";
      ctx.fillRect(x - 3, y - 3, 6, 6);
    } else {
      if (def.moveType === "air") {
        ctx.fillRect(x - 8, y - 8, 16, 16);
        ctx.fillRect(x - 16, y - 3, 32, 6);
      } else {
        ctx.fillRect(x - 10, y - 8, 20, 16);
      }
    }
    ctx.restore();
  },
  drawCamps(ctx) {
    const ts = PW.state.world.tileSize;
    for (const camp of PW.state.world.monsterCamps || []) {
      if (camp.cleared || !PW.Fog.isKnown(camp.tileX, camp.tileY)) continue;
      const x = camp.x - PW.state.camera.x;
      const y = camp.y - PW.state.camera.y;
      ctx.save();
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = "#9e493e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, camp.aggroPx || PW.CONFIG.treasure.campAggroTiles * ts, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(x - 14, y + 8, 28, 5);
      ctx.fillStyle = "#4a2f28";
      ctx.fillRect(x - 12, y - 3, 24, 13);
      ctx.fillStyle = "#7b3f34";
      ctx.fillRect(x - 9, y - 9, 18, 9);
      ctx.fillStyle = "#c66f5b";
      ctx.fillRect(x - 5, y - 13, 10, 5);
      ctx.fillStyle = "#26211d";
      ctx.fillRect(x - 7, y + 1, 14, 7);
      ctx.fillStyle = "#f0b84d";
      ctx.fillRect(x - 2, y - 17, 4, 5);
      ctx.fillStyle = "#e35d57";
      ctx.fillRect(x - 14, y - 6, 3, 8);
      ctx.fillRect(x + 11, y - 6, 3, 8);
      ctx.restore();
      this.drawStateCorners(ctx, x, y, "#e35d57", 16);
    }
  },
  drawProjectiles(ctx) {
    for (const projectile of this.visible("projectiles")) {
      if (PW.PixelArt && PW.PixelArt.drawCentered(ctx, `projectile.${projectile.sourceType}`, projectile.x - PW.state.camera.x, projectile.y - PW.state.camera.y, 12, 12)) continue;
      this.drawProjectile(ctx, projectile);
    }
  },
  drawProjectile(ctx, projectile) {
    const x = projectile.x - PW.state.camera.x;
    const y = projectile.y - PW.state.camera.y;
    const px = (projectile.prevX || projectile.x) - PW.state.camera.x;
    const py = (projectile.prevY || projectile.y) - PW.state.camera.y;
    ctx.save();
    ctx.strokeStyle = projectile.color;
    ctx.fillStyle = projectile.color;
    if (projectile.sourceType === "ballista") {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = "#fff0a0";
      ctx.fillRect(x - 2, y - 2, 4, 4);
    } else if (projectile.sourceType === "catapult") {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(x - 7, y + 4, 14, 4);
      ctx.fillStyle = "#7a7467";
      ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = "#c4b59b";
      ctx.fillRect(x - 3, y - 8, 6, 5);
      ctx.strokeStyle = "rgba(196,181,155,.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(14, projectile.splash * 18), 0, Math.PI * 2);
      ctx.stroke();
    } else if (projectile.sourceType === "flak") {
      ctx.strokeStyle = "rgba(169,216,255,.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = "#d7f1ff";
      ctx.fillRect(x - 2, y - 5, 4, 10);
      ctx.fillRect(x - 5, y - 2, 10, 4);
    } else if (projectile.sourceType === "tesla") {
      ctx.strokeStyle = "#83e3da";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = "#d7fffb";
      ctx.fillRect(x - 2, y - 2, 4, 4);
    } else if (projectile.sourceType === "laser") {
      ctx.strokeStyle = "#ffdf75";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.strokeStyle = "#fff6c2";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    ctx.restore();
  },
  drawDrops(ctx) {
    for (const drop of this.visible("drops")) {
      const res = PW.RESOURCES[drop.resource];
      if (!res) continue;
      const x = drop.x - PW.state.camera.x;
      const y = drop.y - PW.state.camera.y;
      this.drawGroundShadow(ctx, x, y + 6, 12, 3);
      ctx.fillStyle = "rgba(0,0,0,.72)";
      ctx.fillRect(x - 7, y - 7, 14, 14);
      const custom = PW.PixelArt && PW.PixelArt.drawCentered(ctx, `drop.${drop.resource}`, x, y, 16, 16);
      if (!custom) {
        ctx.fillStyle = res.color;
        ctx.fillRect(x - 5, y - 5, 10, 10);
        ctx.fillStyle = "#151515";
        ctx.font = "8px sans-serif";
        ctx.fillText(res.icon, x - 3, y + 3);
      }
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillRect(x - 5, y - 5, 4, 1);
      this.drawStateCorners(ctx, x, y, res.color, 7);
    }
  },
  drawGroundShadow(ctx, x, y, width, height) {
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, height);
  },
  drawStateCorners(ctx, x, y, color, radius) {
    const left = Math.round(x - radius);
    const top = Math.round(y - radius);
    const right = Math.round(x + radius);
    const bottom = Math.round(y + radius);
    const length = 4;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.68)";
    ctx.fillRect(left - 1, top - 1, length + 2, 2);
    ctx.fillRect(left - 1, top - 1, 2, length + 2);
    ctx.fillRect(right - length - 1, top - 1, length + 2, 2);
    ctx.fillRect(right - 1, top - 1, 2, length + 2);
    ctx.fillRect(left - 1, bottom - 1, length + 2, 2);
    ctx.fillRect(left - 1, bottom - length - 1, 2, length + 2);
    ctx.fillRect(right - length - 1, bottom - 1, length + 2, 2);
    ctx.fillRect(right - 1, bottom - length - 1, 2, length + 2);
    ctx.fillStyle = color;
    ctx.fillRect(left, top, length, 1);
    ctx.fillRect(left, top, 1, length);
    ctx.fillRect(right - length, top, length, 1);
    ctx.fillRect(right, top, 1, length);
    ctx.fillRect(left, bottom, length, 1);
    ctx.fillRect(left, bottom - length, 1, length);
    ctx.fillRect(right - length, bottom, length, 1);
    ctx.fillRect(right, bottom - length, 1, length);
    ctx.restore();
  }
};
