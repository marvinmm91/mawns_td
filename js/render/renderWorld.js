"use strict";

PW.RenderWorld = {
  draw(ctx) {
    const state = PW.state;
    const ts = state.world.tileSize;
    const bounds = PW.Camera.visibleTileBounds(1);
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        if (!PW.Fog.isKnown(x, y)) continue;
        const tile = PW.Tiles.get(x, y);
        const sx = x * ts - state.camera.x;
        const sy = y * ts - state.camera.y;
        if (PW.PixelArt && PW.PixelArt.draw(ctx, `tile.${tile.kind}`, sx, sy, ts, ts)) continue;
        ctx.fillStyle = this.tileColor(tile);
        ctx.fillRect(sx, sy, ts, ts);
        this.drawTileDetails(ctx, tile, sx, sy, ts);
        if ((x + y + tile.variant) % 5 === 0) {
          ctx.fillStyle = "rgba(255,255,255,.035)";
          ctx.fillRect(sx + 3, sy + 4, 4, 4);
        }
      }
    }
    this.drawWarnings(ctx);
    this.drawShip(ctx);
    this.drawResources(ctx);
    this.drawTreasureChests(ctx);
    this.drawBuildings(ctx);
  },
  tileColor(tile) {
    if (!tile) return "#000";
    if (tile.kind === "ridge") return "#2f3533";
    if (tile.kind === "water") return ["#1d3f4c", "#1b3745", "#214856", "#183340"][tile.variant % 4];
    if (tile.kind === "shallowWater") return tile.ford ? "#527061" : ["#2f6570", "#315e67", "#39727a", "#2b5962"][tile.variant % 4];
    const meadow = ["#46583e", "#40533b", "#4b5f43", "#3f503b"][tile.variant % 4];
    const forest = ["#334b34", "#2f4430", "#395239", "#2d3f2e"][tile.variant % 4];
    const wetland = ["#3d5b46", "#365340", "#49634a", "#31483b"][tile.variant % 4];
    let color = this.mixColor(meadow, forest, Math.max(0, Math.min(1, tile.forest || 0)));
    color = this.mixColor(color, wetland, Math.max(0, Math.min(1, tile.wetness || 0)));
    if (tile.kind === "forestFloor") return this.mixColor(color, forest, 0.35);
    if (tile.kind === "wetland") return this.mixColor(color, wetland, 0.4);
    return color;
  },
  drawTileDetails(ctx, tile, sx, sy, ts) {
    if (tile.kind === "water") {
      ctx.fillStyle = "rgba(180,220,220,.12)";
      ctx.fillRect(sx + 4 + (tile.variant % 3) * 3, sy + 9, 10, 2);
      ctx.fillRect(sx + 15, sy + 21 - (tile.variant % 2) * 4, 12, 2);
    } else if (tile.kind === "shallowWater") {
      ctx.fillStyle = tile.ford ? "rgba(220,205,150,.34)" : "rgba(190,230,218,.16)";
      ctx.fillRect(sx + 4, sy + 14, 8, 2);
      ctx.fillRect(sx + 18, sy + 19, 9, 2);
      if (tile.ford) {
        ctx.fillStyle = "rgba(95,82,54,.45)";
        ctx.fillRect(sx + 8, sy + 9, 4, 4);
        ctx.fillRect(sx + 19, sy + 20, 5, 3);
      }
    } else if (tile.kind === "forestFloor") {
      ctx.fillStyle = "rgba(30,48,28,.28)";
      ctx.fillRect(sx + 6, sy + 7, 3, 3);
      ctx.fillRect(sx + 22, sy + 18, 4, 3);
    } else if (tile.kind === "wetland") {
      ctx.fillStyle = "rgba(131,227,218,.12)";
      ctx.fillRect(sx + 8, sy + 20, 12, 2);
      ctx.fillStyle = "rgba(91,123,72,.35)";
      ctx.fillRect(sx + 22, sy + 9, 2, 8);
      ctx.fillRect(sx + 25, sy + 12, 2, 6);
    }
  },
  mixColor(a, b, t) {
    const ca = this.hexToRgb(a);
    const cb = this.hexToRgb(b);
    const mix = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
    return `#${mix(ca.r, cb.r)}${mix(ca.g, cb.g)}${mix(ca.b, cb.b)}`;
  },
  hexToRgb(color) {
    const value = parseInt(color.slice(1), 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  },
  drawShip(ctx) {
    const state = PW.state;
    const ship = state.ship;
    const ts = state.world.tileSize;
    const x = ship.x * ts - state.camera.x;
    const y = ship.y * ts - state.camera.y;
    const w = ship.size * ts;
    const custom = PW.PixelArt && PW.PixelArt.draw(ctx, "ship.wreck", x, y, w, w);
    if (custom) {
      if (ship.launchActive) {
        const pulse = Math.sin(state.elapsed * 10) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(240,184,77,${0.25 + pulse * 0.35})`;
        ctx.fillRect(x + 12, y + w - 12, w - 24, 10);
      }
      return;
    }
    ctx.fillStyle = "#596066";
    ctx.fillRect(x, y, w, w);
    ctx.fillStyle = "#30363a";
    ctx.fillRect(x + 10, y + 12, w - 20, w - 24);
    ctx.fillStyle = ship.launchActive ? "#f0b84d" : "#76c7b4";
    ctx.fillRect(x + w / 2 - 12, y + 18, 24, 18);
    ctx.fillStyle = "#25282b";
    ctx.fillRect(x + 8, y + w - 28, w - 16, 12);
    ctx.strokeStyle = "#d8d1ad";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, w - 2);
    if (ship.launchActive) {
      const pulse = Math.sin(state.elapsed * 10) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(240,184,77,${0.25 + pulse * 0.35})`;
      ctx.fillRect(x + 12, y + w - 12, w - 24, 10);
    }
  },
  drawResources(ctx) {
    const state = PW.state;
    const ts = state.world.tileSize;
    state.world.resources.forEach((node) => {
      if (!PW.Fog.isKnown(node.x, node.y)) return;
      const def = PW.RESOURCE_NODES[node.type];
      const sx = node.x * ts - state.camera.x + (node.offsetX || 0);
      const sy = node.y * ts - state.camera.y + (node.offsetY || 0);
      if (PW.PixelArt && PW.PixelArt.draw(ctx, `resource.${node.type}`, sx, sy, ts, ts)) {
        // Custom pixel resource drawn.
      } else if (node.type === "tree") {
        this.drawTreeNode(ctx, sx, sy, node);
      } else {
        this.drawStoneNode(ctx, sx, sy, node, def);
      }
      if (node.hp < node.maxHp) {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(sx + 6, sy + 28, 20, 3);
        ctx.fillStyle = "#f0b84d";
        ctx.fillRect(sx + 6, sy + 28, 20 * node.hp / node.maxHp, 3);
      }
    });
  },
  drawTreeNode(ctx, sx, sy, node) {
    const scale = node.scale || 1;
    const variant = node.variant || 0;
    const trunkW = Math.max(5, Math.round(7 * scale));
    const trunkH = Math.max(10, Math.round(14 * scale));
    ctx.fillStyle = variant % 2 ? "#60432a" : "#4f3926";
    ctx.fillRect(sx + 16 - trunkW / 2, sy + 28 - trunkH, trunkW, trunkH);
    const greens = variant % 3 === 0 ? ["#4f7d43", "#6aa35a", "#87b965"] : ["#3f6f4a", "#5d9654", "#78aa61"];
    const canopyW = Math.round(20 * scale);
    const canopyH = Math.round(16 * scale);
    ctx.fillStyle = greens[0];
    ctx.fillRect(sx + 16 - canopyW / 2, sy + 8, canopyW, canopyH);
    ctx.fillStyle = greens[1];
    ctx.fillRect(sx + 9 - variant, sy + 4, Math.round(13 * scale), Math.round(10 * scale));
    ctx.fillStyle = greens[2];
    ctx.fillRect(sx + 15 + variant, sy + 3 + (variant % 2) * 3, Math.round(12 * scale), Math.round(9 * scale));
    if ((node.shape || 0) > 1) {
      ctx.fillStyle = "rgba(25,45,28,.55)";
      ctx.fillRect(sx + 5, sy + 18, Math.round(22 * scale), 4);
    }
  },
  drawStoneNode(ctx, sx, sy, node, def) {
    const scale = node.scale || 1;
    const shape = node.shape || 0;
    const baseW = Math.round((18 + shape * 2) * scale);
    const baseH = Math.round((13 + (node.variant || 0)) * scale);
    const color = def.color;
    ctx.fillStyle = "#303230";
    ctx.fillRect(sx + 16 - baseW / 2 - 2, sy + 18 - baseH / 2 + 4, baseW + 4, baseH + 3);
    ctx.fillStyle = color;
    ctx.fillRect(sx + 16 - baseW / 2, sy + 17 - baseH / 2, baseW, baseH);
    ctx.fillStyle = this.darker(color);
    ctx.fillRect(sx + 7 + shape, sy + 18, Math.round(9 * scale), Math.round(7 * scale));
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.fillRect(sx + 12 + shape, sy + 9, Math.max(3, Math.round(5 * scale)), Math.max(2, Math.round(3 * scale)));
    if (node.type === "crystal") {
      ctx.fillStyle = "#d7fffb";
      ctx.fillRect(sx + 15, sy + 4, 4, 15);
      ctx.fillRect(sx + 9, sy + 10, 4, 10);
    }
  },
  darker(color) {
    const named = {
      "#77786f": "#56584f",
      "#7d9da9": "#526d75",
      "#d6a845": "#8d6b29",
      "#65cec8": "#358b88"
    };
    return named[color] || "rgba(0,0,0,.28)";
  },
  drawBuildings(ctx) {
    const state = PW.state;
    const ts = state.world.tileSize;
    state.world.buildings.forEach((building) => {
      if (!PW.Fog.isKnown(building.x, building.y)) return;
      const def = PW.BUILDINGS[building.type];
      const sx = building.x * ts - state.camera.x;
      const sy = building.y * ts - state.camera.y;
      ctx.save();
      ctx.translate(sx, sy);
      PW.Icons.drawBuilding(ctx, building.type, ts, 1);
      ctx.restore();
      if (building.level > 1) {
        ctx.fillStyle = "#f0b84d";
        for (let i = 0; i < building.level; i++) ctx.fillRect(sx + 4 + i * 6, sy + 4, 4, 4);
      }
      if (building.hp < building.maxHp) {
        ctx.fillStyle = "rgba(0,0,0,.5)";
        ctx.fillRect(sx + 4, sy + 27, 24, 3);
        ctx.fillStyle = building.hp / building.maxHp < 0.35 ? "#e35d57" : "#d7c951";
        ctx.fillRect(sx + 4, sy + 27, 24 * building.hp / building.maxHp, 3);
      }
    });
  },
  drawTreasureChests(ctx) {
    const state = PW.state;
    const ts = state.world.tileSize;
    (state.world.treasureChests || []).forEach((chest) => {
      if (chest.opened || !PW.Fog.isKnown(chest.x, chest.y)) return;
      const sx = chest.x * ts - state.camera.x;
      const sy = chest.y * ts - state.camera.y;
      if (PW.PixelArt && PW.PixelArt.draw(ctx, "world.chest", sx, sy, ts, ts)) return;
      PW.Icons.drawChest(ctx, sx, sy, ts, chest.variant || 0);
    });
  },
  towerColor(type) {
    const colors = {
      ballista: "#c99b5e",
      catapult: "#aaa27c",
      flak: "#77b7d7",
      tesla: "#83e3da",
      laser: "#f0c45a"
    };
    return colors[type] || "#f0b84d";
  },
  drawWarnings(ctx) {
    const state = PW.state;
    if (state.phase.current !== "dusk" && state.phase.current !== "night") return;
    const alpha = state.phase.current === "dusk" ? 0.55 : 0.22;
    ctx.fillStyle = `rgba(227,93,87,${alpha})`;
    const w = state.camera.w;
    const h = state.camera.h;
    for (const dir of state.phase.warningDirections) {
      if (dir.includes("n")) ctx.fillRect(0, 0, w, 9);
      if (dir.includes("s")) ctx.fillRect(0, h - 9, w, 9);
      if (dir.includes("w")) ctx.fillRect(0, 0, 9, h);
      if (dir.includes("e")) ctx.fillRect(w - 9, 0, 9, h);
    }
  }
};
