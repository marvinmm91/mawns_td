"use strict";

PW.RenderEffects = {
  update(dt) {
    const state = PW.state;
    state.effects.forEach((effect) => { effect.life -= dt; });
    state.effects = state.effects.filter((effect) => effect.life > 0 && !this.isOutsideCamera(effect));
  },
  isOutsideCamera(effect) {
    const state = PW.state;
    const padding = PW.CONFIG.effects.cullPadding;
    const left = state.camera.x - padding;
    const top = state.camera.y - padding;
    const right = state.camera.x + state.camera.w + padding;
    const bottom = state.camera.y + state.camera.h + padding;
    const points = effect.type === "laserBeam"
      ? [{ x: effect.x1, y: effect.y1 }, { x: effect.x2, y: effect.y2 }]
      : [{ x: effect.x, y: effect.y }];
    return points.every((point) => point.x < left || point.x > right || point.y < top || point.y > bottom);
  },
  draw(ctx) {
    for (const effect of PW.state.effects) {
      const t = effect.life / effect.maxLife;
      const x = effect.x - PW.state.camera.x;
      const y = effect.y - PW.state.camera.y;
      ctx.globalAlpha = Math.max(0, t);
      if (effect.type === "floatingText") {
        const progress = 1 - t;
        const rise = effect.rise * (1 - (1 - progress) * (1 - progress));
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 3.4) * Math.min(1, (1 - progress) * 8);
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(8,12,11,.88)";
        ctx.strokeText(effect.text, x + effect.offsetX, y + effect.offsetY - rise);
        ctx.fillStyle = effect.color;
        ctx.fillText(effect.text, x + effect.offsetX, y + effect.offsetY - rise);
        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }
      if (PW.PixelArt && PW.PixelArt.drawCentered(ctx, `effect.${effect.type}`, x, y, 16 * effect.size, 16 * effect.size)) {
        ctx.globalAlpha = 1;
        continue;
      }
      if (effect.type === "laserBeam") {
        const x1 = effect.x1 - PW.state.camera.x;
        const y1 = effect.y1 - PW.state.camera.y;
        const x2 = effect.x2 - PW.state.camera.x;
        const y2 = effect.y2 - PW.state.camera.y;
        ctx.globalAlpha = Math.max(0, t) * 0.55;
        ctx.strokeStyle = "#ffdf75";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = Math.max(0, t);
        ctx.strokeStyle = "#fff6c2";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (effect.type === "catapultSplash") {
        const radius = (1 - t) * 30 * effect.size;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(196,181,155,${0.16 * t})`;
        ctx.fillRect(x - radius, y - radius * 0.5, radius * 2, radius);
        ctx.fillStyle = `rgba(240,184,77,${0.28 * t})`;
        ctx.fillRect(x - 10 * effect.size, y - 10 * effect.size, 20 * effect.size, 20 * effect.size);
      } else if (effect.type === "flakBurst") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * (18 * (1 - t)), y + Math.sin(angle) * (18 * (1 - t)));
          ctx.stroke();
        }
      } else if (effect.type === "teslaPulse") {
        ctx.strokeStyle = "#83e3da";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 18 * (1 - t), y - 18 * (1 - t), 36 * (1 - t), 36 * (1 - t));
        ctx.fillStyle = `rgba(131,227,218,${0.22 * t})`;
        ctx.fillRect(x - 14, y - 14, 28, 28);
      } else if (effect.type === "laserHit") {
        ctx.strokeStyle = "#fff6c2";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 16 * t, y - 16 * t);
        ctx.lineTo(x + 16 * t, y + 16 * t);
        ctx.moveTo(x + 16 * t, y - 16 * t);
        ctx.lineTo(x - 16 * t, y + 16 * t);
        ctx.stroke();
      } else if (effect.type === "boltHit") {
        ctx.fillStyle = effect.color;
        ctx.fillRect(x - 8 * effect.size, y - 2, 16 * effect.size, 4);
        ctx.fillRect(x - 2, y - 8 * effect.size, 4, 16 * effect.size);
      } else if (effect.type === "treasureOpen") {
        const radius = (1 - t) * 24 * effect.size;
        ctx.strokeStyle = "#f3d36b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,240,160,${0.42 * t})`;
        ctx.fillRect(x - 12, y - 18 - radius * 0.25, 24, 7);
        ctx.fillRect(x - 5, y - 28 - radius * 0.2, 10, 10);
      } else if (effect.type === "campClear") {
        ctx.strokeStyle = "#66c6a6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, (1 - t) * 28 * effect.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(102,198,166,${0.24 * t})`;
        ctx.fillRect(x - 18, y - 6, 36, 12);
      } else if (effect.type === "outpostClaim") {
        const radius = (1 - t) * 28 * effect.size;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.fillStyle = `rgba(215,255,251,${0.28 * t})`;
        ctx.fillRect(x - 5, y - 18, 10, 26);
      } else if (effect.type === "outpostAlert") {
        const radius = (1 - t) * 32 * effect.size;
        ctx.strokeStyle = "#e35d57";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (effect.type === "structureHit") {
        const radius = 10 + (1 - t) * 14 * effect.size;
        ctx.strokeStyle = "#f0b84d";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.fillStyle = "#e35d57";
        ctx.fillRect(x - 3, y - radius - 3, 6, 6);
      } else if (effect.type === "wildlifePoof") {
        ctx.fillStyle = `rgba(111,182,93,${0.45 * t})`;
        ctx.fillRect(x - 10 - (1 - t) * 10, y - 5, 8, 8);
        ctx.fillStyle = `rgba(217,195,155,${0.5 * t})`;
        ctx.fillRect(x + 2 + (1 - t) * 8, y - 12, 7, 7);
        ctx.fillStyle = `rgba(240,184,77,${0.46 * t})`;
        ctx.fillRect(x - 2, y + 5 + (1 - t) * 7, 6, 6);
      } else if (effect.type === "enemySwarmBite") {
        ctx.fillStyle = effect.color;
        ctx.fillRect(x - 10 * effect.size, y - 5, 6, 10);
        ctx.fillRect(x + 4 * effect.size, y - 5, 6, 10);
      } else if (effect.type === "enemyClaw") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 13 + i * 7, y - 12);
          ctx.lineTo(x - 5 + i * 7, y + 12);
          ctx.stroke();
        }
      } else if (effect.type === "enemySlam") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 15 * effect.size, y - 9 * effect.size, 30 * effect.size, 18 * effect.size);
      } else if (effect.type === "enemyBreakerHit") {
        ctx.fillStyle = effect.color;
        ctx.fillRect(x - 18 * effect.size, y - 4, 36 * effect.size, 8);
        ctx.fillStyle = "rgba(227,93,87,.55)";
        ctx.fillRect(x - 8, y - 15 * effect.size, 16, 30 * effect.size);
      } else if (effect.type === "enemyGuardianHit") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, (1 - t) * 22 * effect.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(215,201,81,${0.22 * t})`;
        ctx.fillRect(x - 18, y - 18, 36, 36);
      } else if (effect.type === "enemyDroneZap") {
        ctx.strokeStyle = "#d7f1ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 16, y - 10);
        ctx.lineTo(x - 4, y + 1);
        ctx.lineTo(x - 12, y + 1);
        ctx.lineTo(x + 5, y + 14);
        ctx.stroke();
      } else if (effect.type === "enemyBomb") {
        const radius = (1 - t) * 24 * effect.size;
        ctx.fillStyle = `rgba(240,184,77,${0.35 * t})`;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.strokeStyle = "#e35d57";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - radius * 0.7, y - radius * 0.7, radius * 1.4, radius * 1.4);
      } else if (effect.type === "enemyDisrupt") {
        ctx.strokeStyle = "#d9a8ef";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 20 * (1 - t), y - 20 * (1 - t), 40 * (1 - t), 40 * (1 - t));
        ctx.strokeRect(x - 28 * (1 - t), y - 8, 56 * (1 - t), 16);
      } else if (effect.type === "splash") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, (1 - t) * 26 * effect.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (effect.type === "damage") {
        ctx.fillStyle = effect.color;
        ctx.fillRect(x - 18 * effect.size, y - 18 * effect.size, 36 * effect.size, 36 * effect.size);
      } else {
        ctx.fillStyle = effect.color;
        ctx.fillRect(x - 6 * effect.size, y - 6 * effect.size, 12 * effect.size, 12 * effect.size);
      }
      ctx.globalAlpha = 1;
    }
  }
};
