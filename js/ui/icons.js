"use strict";

PW.Icons = {
  resourceCanvas(id, size = 20) {
    const canvas = document.createElement("canvas");
    canvas.className = "resource-icon";
    canvas.width = size;
    canvas.height = size;
    canvas.setAttribute("aria-hidden", "true");
    this.drawResource(canvas.getContext("2d"), id, size);
    return canvas;
  },
  perkCanvas(size = 20) {
    const canvas = document.createElement("canvas");
    canvas.className = "resource-icon perk-icon";
    canvas.width = size;
    canvas.height = size;
    canvas.setAttribute("aria-hidden", "true");
    this.drawPerkCoin(canvas.getContext("2d"), size);
    return canvas;
  },
  buildingCanvas(id, size = 32) {
    const canvas = document.createElement("canvas");
    canvas.className = "build-preview";
    canvas.width = size;
    canvas.height = size;
    canvas.setAttribute("aria-hidden", "true");
    this.drawBuilding(canvas.getContext("2d"), id, size);
    return canvas;
  },
  enemyCanvas(id, size = 48) {
    const canvas = document.createElement("canvas");
    canvas.className = "enemy-preview";
    canvas.width = size;
    canvas.height = size;
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("2d");
    const def = PW.ENEMIES[id];
    if (!def) return canvas;
    if (!(PW.PixelArt && PW.PixelArt.drawCentered(ctx, `enemy.${id}`, size / 2, size / 2, size, size))) {
      ctx.save();
      ctx.scale(size / 48, size / 48);
      if (PW.RenderEntities && PW.RenderEntities.drawEnemyShape) {
        PW.RenderEntities.drawEnemyShape(ctx, { type: id, retreating: false }, def, 24, 24);
      } else {
        ctx.fillStyle = def.color;
        ctx.fillRect(12, 12, 24, 24);
      }
      ctx.restore();
    }
    return canvas;
  },
  toolCanvas(id, size = 28) {
    const canvas = document.createElement("canvas");
    canvas.className = "tool-icon";
    canvas.width = size;
    canvas.height = size;
    canvas.setAttribute("aria-hidden", "true");
    this.drawTool(canvas.getContext("2d"), id, size);
    return canvas;
  },
  drawResource(ctx, id, size = 20, clear = true) {
    const s = size / 20;
    if (clear) ctx.clearRect(0, 0, size, size);
    if (PW.PixelArt && PW.PixelArt.draw(ctx, `resourceIcon.${id}`, 0, 0, size, size)) return;
    if (id === "wood") {
      ctx.fillStyle = "#5a3d25";
      ctx.fillRect(7 * s, 4 * s, 7 * s, 13 * s);
      ctx.fillStyle = "#79a95b";
      ctx.fillRect(4 * s, 2 * s, 12 * s, 7 * s);
      ctx.fillStyle = "#4f7d43";
      ctx.fillRect(2 * s, 7 * s, 16 * s, 7 * s);
    } else if (id === "stone") {
      ctx.fillStyle = "#595c58";
      ctx.fillRect(3 * s, 8 * s, 14 * s, 8 * s);
      ctx.fillStyle = "#8b8f86";
      ctx.fillRect(5 * s, 5 * s, 11 * s, 8 * s);
      ctx.fillStyle = "#b6b9af";
      ctx.fillRect(8 * s, 6 * s, 4 * s, 3 * s);
    } else if (id === "iron") {
      ctx.fillStyle = "#47565b";
      ctx.fillRect(3 * s, 7 * s, 15 * s, 10 * s);
      ctx.fillStyle = "#9fc7d1";
      ctx.fillRect(7 * s, 4 * s, 8 * s, 9 * s);
    } else if (id === "gold") {
      ctx.fillStyle = "#6f5423";
      ctx.fillRect(3 * s, 8 * s, 15 * s, 9 * s);
      ctx.fillStyle = "#f0c45a";
      ctx.fillRect(6 * s, 5 * s, 9 * s, 9 * s);
      ctx.fillStyle = "#fff0a0";
      ctx.fillRect(9 * s, 6 * s, 3 * s, 3 * s);
    } else if (id === "crystal") {
      ctx.fillStyle = "#2e6c6b";
      ctx.fillRect(8 * s, 4 * s, 5 * s, 13 * s);
      ctx.fillStyle = "#83e3da";
      ctx.fillRect(5 * s, 8 * s, 10 * s, 6 * s);
      ctx.fillStyle = "#d7fffb";
      ctx.fillRect(10 * s, 5 * s, 2 * s, 4 * s);
    } else if (id === "scrap") {
      ctx.fillStyle = "#7a6b5d";
      ctx.fillRect(4 * s, 5 * s, 11 * s, 12 * s);
      ctx.fillStyle = "#c59d76";
      ctx.fillRect(8 * s, 3 * s, 8 * s, 6 * s);
      ctx.fillStyle = "#3b3e3a";
      ctx.fillRect(6 * s, 10 * s, 4 * s, 4 * s);
    } else if (id === "parts") {
      ctx.fillStyle = "#e6d7a3";
      ctx.fillRect(5 * s, 5 * s, 10 * s, 10 * s);
      ctx.fillStyle = "#524936";
      ctx.fillRect(8 * s, 8 * s, 4 * s, 4 * s);
      ctx.fillStyle = "#b7a46f";
      ctx.fillRect(3 * s, 9 * s, 14 * s, 2 * s);
    } else if (id === "key") {
      ctx.fillStyle = "#f3d36b";
      ctx.fillRect(4 * s, 7 * s, 7 * s, 7 * s);
      ctx.fillStyle = "#5a4421";
      ctx.fillRect(6 * s, 9 * s, 3 * s, 3 * s);
      ctx.fillStyle = "#f3d36b";
      ctx.fillRect(10 * s, 10 * s, 7 * s, 3 * s);
      ctx.fillRect(15 * s, 12 * s, 2 * s, 4 * s);
      ctx.fillRect(12 * s, 12 * s, 2 * s, 3 * s);
    }
  },
  drawPerkCoin(ctx, size = 20) {
    const s = size / 20;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#6f5423";
    ctx.fillRect(4 * s, 4 * s, 12 * s, 12 * s);
    ctx.fillStyle = "#f0c45a";
    ctx.fillRect(5 * s, 3 * s, 10 * s, 14 * s);
    ctx.fillStyle = "#fff0a0";
    ctx.fillRect(8 * s, 5 * s, 4 * s, 3 * s);
    ctx.fillStyle = "#8d6b29";
    ctx.fillRect(9 * s, 9 * s, 3 * s, 5 * s);
  },
  drawChest(ctx, x, y, size = 32, variant = 0) {
    const s = size / 32;
    const rect = (rx, ry, rw, rh) => ctx.fillRect(x + rx * s, y + ry * s, rw * s, rh * s);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.35)";
    rect(5, 24, 23, 4);
    ctx.fillStyle = variant % 2 ? "#6e4a2b" : "#7d5735";
    rect(5, 13, 22, 12);
    ctx.fillStyle = variant % 2 ? "#9a6a3d" : "#a87842";
    rect(6, 8, 20, 8);
    ctx.fillStyle = "#4b321f";
    rect(5, 15, 22, 3);
    ctx.fillStyle = "#f3d36b";
    rect(14, 13, 4, 7);
    rect(7, 10, 3, 14);
    rect(22, 10, 3, 14);
    ctx.fillStyle = "#fff0a0";
    rect(15, 14, 2, 2);
    ctx.restore();
  },
  drawBuilding(ctx, type, size = 32, alpha = 1) {
    const scale = size / 32;
    const def = PW.BUILDINGS[type];
    if (!def) return;
    if (PW.PixelArt && PW.PixelArt.draw(ctx, `building.${type}`, 0, 0, size, size, { alpha })) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const fillRect = (x, y, w, h) => ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
    if (type === "bridge") {
      ctx.fillStyle = "#243133";
      fillRect(3, 5, 26, 22);
      ctx.fillStyle = "#5f8b91";
      fillRect(4, 8, 24, 16);
      ctx.fillStyle = "#8a5a34";
      fillRect(4, 10, 24, 4);
      fillRect(4, 18, 24, 4);
      ctx.fillStyle = "#c99b5e";
      fillRect(7, 8, 3, 17);
      fillRect(14, 8, 3, 17);
      fillRect(21, 8, 3, 17);
      ctx.restore();
      return;
    }
    if (def.category === "wall") {
      ctx.fillStyle = type === "palisade" ? "#82613f" : type === "stoneWall" ? "#858980" : "#7f8c91";
      fillRect(4, 4, 24, 24);
      ctx.fillStyle = "rgba(0,0,0,.24)";
      fillRect(6, 8, 20, 4);
      fillRect(6, 19, 20, 4);
      if (type === "palisade") {
        ctx.fillStyle = "#b28a57";
        fillRect(8, 3, 3, 26);
        fillRect(20, 3, 3, 26);
      }
      ctx.restore();
      return;
    }
    if (type === "ballista") {
      ctx.fillStyle = "#272b2a";
      fillRect(7, 19, 18, 8);
      ctx.fillStyle = "#8a5a34";
      fillRect(14, 9, 4, 15);
      fillRect(5, 12, 22, 4);
      ctx.fillStyle = "#c99b5e";
      fillRect(3, 10, 5, 8);
      fillRect(24, 10, 5, 8);
      ctx.fillStyle = "#f2eddc";
      fillRect(15, 4, 2, 16);
      fillRect(10, 7, 12, 3);
      ctx.fillStyle = "#3b2a1b";
      fillRect(12, 24, 8, 4);
    } else if (type === "catapult") {
      ctx.fillStyle = "#272b2a";
      fillRect(5, 20, 22, 8);
      ctx.fillStyle = "#8a5a34";
      fillRect(8, 14, 4, 12);
      fillRect(20, 14, 4, 12);
      fillRect(7, 23, 18, 3);
      ctx.fillStyle = "#c99b5e";
      fillRect(11, 11, 15, 4);
      fillRect(20, 5, 4, 9);
      ctx.fillStyle = "#7a7467";
      fillRect(22, 3, 7, 7);
      ctx.fillStyle = "#c4b59b";
      fillRect(23, 3, 4, 3);
    } else if (type === "flak") {
      ctx.fillStyle = "#202629";
      fillRect(6, 21, 20, 7);
      ctx.fillStyle = "#4e6570";
      fillRect(10, 13, 12, 10);
      ctx.fillStyle = "#77b7d7";
      fillRect(7, 5, 5, 15);
      fillRect(20, 5, 5, 15);
      ctx.fillStyle = "#d7f1ff";
      fillRect(8, 3, 3, 5);
      fillRect(21, 3, 3, 5);
      ctx.fillStyle = "#2a3940";
      fillRect(13, 24, 6, 4);
    } else if (type === "tesla") {
      ctx.fillStyle = "#1d2726";
      fillRect(7, 22, 18, 6);
      ctx.fillStyle = "#426461";
      fillRect(12, 12, 8, 12);
      ctx.fillStyle = "#83e3da";
      fillRect(10, 10, 12, 3);
      fillRect(10, 15, 12, 3);
      fillRect(10, 20, 12, 3);
      ctx.strokeStyle = "#d7fffb";
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.beginPath();
      ctx.arc(16 * scale, 7 * scale, 5 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#d7fffb";
      fillRect(15, 6, 2, 2);
    } else if (type === "laser") {
      ctx.fillStyle = "#26231b";
      fillRect(8, 22, 16, 6);
      ctx.fillStyle = "#7d6a35";
      fillRect(13, 8, 6, 16);
      ctx.fillStyle = "#f0c45a";
      fillRect(11, 4, 10, 7);
      ctx.fillStyle = "#fff6c2";
      fillRect(14, 2, 4, 4);
      ctx.fillStyle = "#e35d57";
      fillRect(15, 6, 2, 3);
      ctx.strokeStyle = "#ffdf75";
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.strokeRect(10 * scale, 3 * scale, 12 * scale, 9 * scale);
    } else {
      ctx.fillStyle = "#272b2a";
      fillRect(5, 9, 22, 19);
      ctx.fillStyle = PW.RenderWorld.towerColor(type);
      fillRect(10, 4, 12, 14);
      fillRect(13, 17, 6, 8);
    }
    ctx.restore();
  },
  drawPalisade(ctx, size = 32, connections = {}, alpha = 1) {
    const north = Boolean(connections.north);
    const east = Boolean(connections.east);
    const south = Boolean(connections.south);
    const west = Boolean(connections.west);
    const connectionCount = [north, east, south, west].filter(Boolean).length;
    const isCorner = connectionCount === 2 && (north || south) && (east || west);
    if (!north && !east && !south && !west) {
      this.drawBuilding(ctx, "palisade", size, alpha);
      return;
    }
    if (PW.PixelArt && PW.PixelArt.draw(ctx, "building.palisade", 0, 0, size, size, { alpha })) return;

    const scale = size / 32;
    const fillRect = (x, y, w, h) => ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
    const arm = (x, y, w, h) => {
      ctx.fillStyle = "#765033";
      fillRect(x, y, w, h);
      ctx.fillStyle = "#ad7a49";
      if (w > h) fillRect(x, y + 2, w, 2);
      else fillRect(x + 2, y, 2, h);
    };

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    if (north) arm(11, 0, 10, 16);
    if (east) arm(16, 11, 16, 10);
    if (south) arm(11, 16, 10, 16);
    if (west) arm(0, 11, 16, 10);

    ctx.fillStyle = "#8a5a34";
    fillRect(10, 10, 12, 12);
    ctx.fillStyle = "#c99b5e";
    fillRect(12, 12, 8, 3);
    fillRect(12, 17, 8, 2);

    if (isCorner) {
      const jointX = east ? 16 : 11;
      const jointY = south ? 16 : 11;
      ctx.fillStyle = "#4b321f";
      fillRect(jointX - 1, jointY - 1, 7, 7);
      ctx.fillStyle = "#a86f3f";
      fillRect(jointX, jointY, 5, 5);
      ctx.fillStyle = "#e0ae70";
      fillRect(jointX + 1, jointY, 3, 2);
    } else {
      const stakes = [];
      if (east || west) stakes.push(4, 13, 22);
      if (north || south) stakes.push(4, 13, 22);
      ctx.fillStyle = "#b9824e";
      stakes.forEach((x) => {
        fillRect(x, 5, 3, 22);
        ctx.fillStyle = "#e0ae70";
        fillRect(x, 3, 3, 3);
        ctx.fillStyle = "#b9824e";
      });
      if (north || south) {
        ctx.fillStyle = "#4b321f";
        fillRect(5, 11, 22, 3);
        fillRect(5, 20, 22, 3);
      }
      if (east || west) {
        ctx.fillStyle = "#4b321f";
        fillRect(11, 5, 3, 22);
        fillRect(20, 5, 3, 22);
      }
    }
    ctx.restore();
  },
  drawTool(ctx, id, size = 28) {
    const scale = size / 28;
    const rect = (x, y, w, h) => ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
    ctx.clearRect(0, 0, size, size);
    if (PW.PixelArt && PW.PixelArt.draw(ctx, `tool.${id}`, 0, 0, size, size)) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (id === "axe") {
      ctx.fillStyle = "#8a5a34";
      rect(12, 10, 4, 15);
      rect(15, 13, 3, 5);
      ctx.fillStyle = "#b7c2bd";
      rect(7, 5, 10, 4);
      rect(5, 8, 10, 6);
      rect(8, 14, 5, 3);
      ctx.fillStyle = "#eef4ea";
      rect(8, 6, 5, 2);
      rect(6, 9, 4, 2);
      ctx.fillStyle = "#5c3924";
      rect(13, 21, 3, 4);
    } else if (id === "pickaxe") {
      ctx.fillStyle = "#8a5a34";
      rect(13, 7, 4, 18);
      rect(11, 11, 3, 6);
      ctx.fillStyle = "#b7c2bd";
      rect(5, 5, 18, 4);
      rect(3, 7, 5, 3);
      rect(21, 7, 4, 5);
      ctx.fillStyle = "#eef4ea";
      rect(6, 5, 8, 2);
      rect(19, 6, 3, 2);
    } else if (id === "repair") {
      ctx.fillStyle = "#8a5a34";
      rect(7, 15, 4, 9);
      ctx.fillStyle = "#b7c2bd";
      rect(5, 7, 8, 9);
      rect(4, 9, 10, 4);
      ctx.fillStyle = "#d7c951";
      rect(16, 5, 4, 16);
      rect(10, 11, 16, 4);
      ctx.fillStyle = "#efe6b1";
      rect(17, 6, 2, 14);
      rect(11, 12, 14, 2);
    } else if (id === "build") {
      ctx.fillStyle = "#7f8c91";
      rect(5, 13, 18, 10);
      ctx.fillStyle = "#4f5658";
      rect(7, 15, 4, 3);
      rect(13, 15, 4, 3);
      rect(19, 15, 3, 3);
      ctx.fillStyle = "#b28a57";
      rect(8, 5, 4, 10);
      rect(16, 5, 4, 10);
      rect(6, 8, 16, 4);
    } else if (id === "demolish") {
      ctx.fillStyle = "#8a5a34";
      rect(12, 9, 4, 16);
      ctx.fillStyle = "#c59d76";
      rect(8, 5, 12, 6);
      rect(7, 8, 14, 4);
    }

    ctx.restore();
  }
};
