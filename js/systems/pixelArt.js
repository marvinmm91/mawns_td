"use strict";

PW.PixelArt = {
  storageKey: "planet-wrack-pixel-art-v1",
  assets: {},
  cache: new Map(),
  resetIds: new Set(),
  suppressed: false,
  palette: [
    null,
    "#000000", "#ffffff", "#3f4239", "#706b55", "#f2eddc", "#f0b84d",
    "#5fc772", "#66c6a6", "#83e3da", "#7d83d6", "#a267c7",
    "#e35d57", "#d08b51", "#8a5a34", "#596066", "#a7aaa1"
  ],

  init() {
    this.cache = new Map();
    this.catalog = this.buildCatalog();
    this.loadLocal();
    this.applyStartupMods();
  },

  buildCatalog() {
    const list = [
      { id: "tile.soil", name: "Boden", category: "Welt", cols: 32, rows: 32 },
      { id: "tile.ridge", name: "Felskante", category: "Welt", cols: 32, rows: 32 },
      { id: "tile.forestFloor", name: "Waldboden", category: "Welt", cols: 32, rows: 32 },
      { id: "tile.wetland", name: "Feuchtwiese", category: "Welt", cols: 32, rows: 32 },
      { id: "tile.water", name: "Tiefes Wasser", category: "Welt", cols: 32, rows: 32 },
      { id: "tile.shallowWater", name: "Furt/Bach", category: "Welt", cols: 32, rows: 32 },
      { id: "world.chest", name: "Schatztruhe", category: "Welt", cols: 32, rows: 32 },
      { id: "ship.wreck", name: "Wrack", category: "Welt", cols: 32, rows: 32 },
      { id: "player.down", name: "Figur unten", category: "Figur", cols: 24, rows: 24 },
      { id: "player.up", name: "Figur oben", category: "Figur", cols: 24, rows: 24 },
      { id: "player.left", name: "Figur links", category: "Figur", cols: 24, rows: 24 },
      { id: "player.right", name: "Figur rechts", category: "Figur", cols: 24, rows: 24 }
    ];

    list.push({ id: "bird.small", name: "Kleiner Vogel", category: "Tiere", cols: 12, rows: 12 });
    Object.values(PW.WILDLIFE.critters).forEach((def) => {
      list.push({ id: `wildlife.${def.id}`, name: def.name, category: "Tiere", cols: 24, rows: 24 });
    });

    Object.values(PW.RESOURCE_NODES).forEach((def) => {
      list.push({ id: `resource.${def.id}`, name: def.name, category: "Rohstoffe", cols: 32, rows: 32 });
    });
    Object.values(PW.RESOURCES).forEach((def) => {
      list.push({ id: `resourceIcon.${def.id}`, name: `${def.name} Icon`, category: "Symbole", cols: 16, rows: 16 });
      list.push({ id: `drop.${def.id}`, name: `${def.name} Drop`, category: "Drops", cols: 16, rows: 16 });
    });
    Object.values(PW.BUILDINGS).forEach((def) => {
      list.push({ id: `building.${def.id}`, name: def.name, category: "Bauten", cols: 32, rows: 32 });
      if (def.category === "tower") {
        list.push({ id: `projectile.${def.id}`, name: `${def.name} Projektil`, category: "Projektile", cols: 12, rows: 12 });
      }
    });
    Object.values(PW.ENEMIES).forEach((def) => {
      list.push({ id: `enemy.${def.id}`, name: def.name, category: "Gegner", cols: 24, rows: 24 });
    });
    PW.CONFIG.tools.forEach((def) => {
      list.push({ id: `tool.${def.id}`, name: `${def.label} Werkzeug`, category: "Werkzeuge", cols: 16, rows: 16 });
    });
    [
      "hit", "damage", "splash", "treasureOpen", "campClear",
      "wildlifePoof",
      "catapultSplash", "flakBurst", "teslaPulse", "laserBeam", "laserHit", "boltHit",
      "enemySwarmBite", "enemyClaw", "enemySlam", "enemyBreakerHit",
      "enemyGuardianHit", "enemyDroneZap", "enemyBomb", "enemyDisrupt"
    ].forEach((id) => {
      list.push({ id: `effect.${id}`, name: `${id} Effekt`, category: "Effekte", cols: 16, rows: 16 });
    });
    return list;
  },

  assetDef(id) {
    return this.catalog.find((asset) => asset.id === id) || null;
  },

  categories() {
    return Array.from(new Set(this.catalog.map((asset) => asset.category)));
  },

  byCategory(category) {
    return this.catalog.filter((asset) => asset.category === category);
  },

  blank(asset) {
    return {
      id: asset.id,
      cols: asset.cols,
      rows: asset.rows,
      scale: 1,
      pixels: new Array(asset.cols * asset.rows).fill(null)
    };
  },

  get(id) {
    return this.assets[id] || null;
  },

  has(id) {
    return Boolean(this.assets[id]);
  },

  setAsset(id, art, save = true) {
    const asset = this.assetDef(id);
    if (!asset || !art || !Array.isArray(art.pixels)) return false;
    const cols = Math.max(1, Number(art.cols || asset.cols));
    const rows = Math.max(1, Number(art.rows || asset.rows));
    const scale = this.normalizeScale(art.scale);
    const pixels = art.pixels.slice(0, cols * rows).map((color) => this.normalizeColor(color));
    while (pixels.length < cols * rows) pixels.push(null);
    this.assets[id] = { id, cols, rows, scale, pixels };
    this.invalidate(id);
    this.resetIds.delete(id);
    if (save) this.saveLocal();
    return true;
  },

  resetAsset(id, save = true) {
    delete this.assets[id];
    this.invalidate(id);
    this.resetIds.add(id);
    if (save) this.saveLocal();
  },

  resetAll() {
    this.assets = {};
    this.invalidate();
    this.resetIds = new Set(this.catalog.map((asset) => asset.id));
    this.saveLocal();
  },

  invalidate(id) {
    if (!this.cache) this.cache = new Map();
    if (id) this.cache.delete(id);
    else this.cache.clear();
  },

  normalizeColor(color) {
    if (!color || color === "transparent") return null;
    const text = String(color).trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(text)) return text;
    return null;
  },

  normalizeScale(scale) {
    const value = Number(scale);
    if (!Number.isFinite(value)) return 1;
    return Math.max(0.5, Math.min(1.5, Math.round(value / 0.05) * 0.05));
  },

  loadLocal() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.assets = {};
      this.invalidate();
      this.resetIds = new Set(data.resetIds || []);
      Object.entries(data.assets || {}).forEach(([id, art]) => this.setAsset(id, art, false));
    } catch (error) {
      console.warn("Pixel-Design konnte nicht geladen werden", error);
      this.assets = {};
      this.resetIds = new Set();
    }
  },

  saveLocal() {
    const data = {
      version: 1,
      savedAt: new Date().toISOString(),
      resetIds: Array.from(this.resetIds),
      assets: this.assets
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  },

  applyStartupMods() {
    const mods = [];
    if (window.PW_PIXEL_MOD) mods.push(window.PW_PIXEL_MOD);
    if (Array.isArray(window.PW_PIXEL_MODS)) mods.push(...window.PW_PIXEL_MODS);
    mods.forEach((mod) => this.applyMod(mod, { save: false, force: false }));
  },

  applyMod(mod, options = {}) {
    const save = options.save !== false;
    const force = options.force === true;
    if (!mod || !mod.assets) return 0;
    let count = 0;
    Object.entries(mod.assets).forEach(([id, art]) => {
      if (!force && this.resetIds.has(id)) return;
      if (this.setAsset(id, art, false)) count++;
    });
    if (save) this.saveLocal();
    return count;
  },

  exportData() {
    return {
      type: "planet-wrack-pixel-mod",
      version: 1,
      exportedAt: new Date().toISOString(),
      assets: this.assets
    };
  },

  exportJson() {
    return JSON.stringify(this.exportData(), null, 2);
  },

  exportJs() {
    return [
      "\"use strict\";",
      "window.PW_PIXEL_MODS = window.PW_PIXEL_MODS || [];",
      `window.PW_PIXEL_MODS.push(${this.exportJson()});`,
      ""
    ].join("\n");
  },

  importText(text) {
    const trimmed = String(text || "").trim();
    let json = trimmed;
    const pushMatch = trimmed.match(/PW_PIXEL_MODS\.push\(([\s\S]*)\);?\s*$/);
    if (pushMatch) json = pushMatch[1];
    const assignMatch = trimmed.match(/PW_PIXEL_MOD\s*=\s*({[\s\S]*});?\s*$/);
    if (assignMatch) json = assignMatch[1];
    const data = JSON.parse(json);
    return this.applyMod(data, { save: true, force: true });
  },

  draw(ctx, id, x, y, w, h, options = {}) {
    if (this.suppressed) return false;
    const art = this.assets[id];
    if (!art || !art.pixels || !art.cols || !art.rows) return false;
    const image = this.cachedCanvas(id, art);
    ctx.save();
    ctx.globalAlpha = options.alpha !== undefined ? options.alpha : 1;
    ctx.imageSmoothingEnabled = false;
    const scale = id.startsWith("tile.") ? 1 : this.normalizeScale(art.scale);
    const drawW = Math.max(1, Math.round(w * scale));
    const drawH = Math.max(1, Math.round(h * scale));
    const drawX = Math.round(x + (w - drawW) / 2);
    const drawY = Math.round(y + (h - drawH) / 2);
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
    ctx.restore();
    return true;
  },

  cachedCanvas(id, art) {
    if (!this.cache) this.cache = new Map();
    const cached = this.cache.get(id);
    if (cached && cached.source === art) return cached.canvas;
    const canvas = document.createElement("canvas");
    canvas.width = art.cols;
    canvas.height = art.rows;
    const ctx = canvas.getContext("2d");
    const image = ctx.createImageData(art.cols, art.rows);
    for (let i = 0; i < art.pixels.length; i++) {
      const color = art.pixels[i];
      if (!color) continue;
      const rgb = this.hexToRgb(color);
      const offset = i * 4;
      image.data[offset] = rgb.r;
      image.data[offset + 1] = rgb.g;
      image.data[offset + 2] = rgb.b;
      image.data[offset + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    this.cache.set(id, { source: art, canvas });
    return canvas;
  },

  hexToRgb(color) {
    const value = parseInt(color.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  },

  drawCentered(ctx, id, x, y, w, h, options = {}) {
    return this.draw(ctx, id, x - w / 2, y - h / 2, w, h, options);
  },

  defaultPixels(id) {
    const asset = this.assetDef(id);
    if (!asset) return null;
    const canvas = document.createElement("canvas");
    canvas.width = asset.cols;
    canvas.height = asset.rows;
    const ctx = canvas.getContext("2d");
    try {
      this.suppressed = true;
      this.drawDefaultAsset(ctx, asset, 0, 0, asset.cols, asset.rows);
    } finally {
      this.suppressed = false;
    }
    const image = ctx.getImageData(0, 0, asset.cols, asset.rows).data;
    const pixels = [];
    for (let i = 0; i < image.length; i += 4) {
      const alpha = image[i + 3];
      pixels.push(alpha < 24 ? null : this.rgbToHex(image[i], image[i + 1], image[i + 2]));
    }
    return { id, cols: asset.cols, rows: asset.rows, scale: 1, pixels };
  },

  rgbToHex(r, g, b) {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  },

  drawDefaultAsset(ctx, asset, x, y, w, h) {
    const [kind, id] = asset.id.split(".");
    ctx.save();
    ctx.translate(x, y);
    if (kind === "tile") this.drawDefaultTile(ctx, id, w, h);
    else if (kind === "ship") this.drawDefaultShip(ctx, w, h);
    else if (kind === "world" && id === "chest") PW.Icons.drawChest(ctx, 0, 0, Math.min(w, h), 0);
    else if (kind === "player") this.drawDefaultPlayer(ctx, id, w, h);
    else if (kind === "resource") this.drawDefaultResourceNode(ctx, id, w, h);
    else if (kind === "resourceIcon") PW.Icons.drawResource(ctx, id, Math.min(w, h));
    else if (kind === "drop") this.drawDefaultDrop(ctx, id, w, h);
    else if (kind === "bird") this.drawDefaultBird(ctx, w, h);
    else if (kind === "wildlife") this.drawDefaultWildlife(ctx, id, w, h);
    else if (kind === "building") PW.Icons.drawBuilding(ctx, id, Math.min(w, h), 1);
    else if (kind === "enemy") this.drawDefaultEnemy(ctx, id, w, h);
    else if (kind === "tool") PW.Icons.drawTool(ctx, id, Math.min(w, h));
    else if (kind === "projectile") this.drawDefaultProjectile(ctx, id, w, h);
    else if (kind === "effect") this.drawDefaultEffect(ctx, id, w, h);
    ctx.restore();
  },

  drawDefaultTile(ctx, id, w, h) {
    const colors = {
      ridge: "#2f3533",
      forestFloor: "#334b34",
      wetland: "#3d5b46",
      water: "#1d3f4c",
      shallowWater: "#527061",
      soil: "#46583e"
    };
    ctx.fillStyle = colors[id] || colors.soil;
    ctx.fillRect(0, 0, w, h);
    if (id === "soil") {
      ctx.fillStyle = "rgba(255,255,255,.08)";
      ctx.fillRect(w * 0.2, h * 0.25, w * 0.18, h * 0.12);
      ctx.fillRect(w * 0.62, h * 0.65, w * 0.14, h * 0.1);
    } else if (id === "water" || id === "shallowWater") {
      ctx.fillStyle = id === "water" ? "rgba(180,220,220,.14)" : "rgba(220,205,150,.28)";
      ctx.fillRect(w * 0.15, h * 0.35, w * 0.32, h * 0.08);
      ctx.fillRect(w * 0.55, h * 0.62, w * 0.34, h * 0.08);
    } else if (id === "forestFloor") {
      ctx.fillStyle = "rgba(20,35,20,.35)";
      ctx.fillRect(w * 0.2, h * 0.22, w * 0.12, h * 0.12);
      ctx.fillRect(w * 0.68, h * 0.58, w * 0.16, h * 0.1);
    } else if (id === "wetland") {
      ctx.fillStyle = "rgba(131,227,218,.14)";
      ctx.fillRect(w * 0.2, h * 0.58, w * 0.44, h * 0.08);
    }
  },

  drawDefaultShip(ctx, w, h) {
    ctx.fillStyle = "#596066";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#30363a";
    ctx.fillRect(w * 0.1, h * 0.13, w * 0.8, h * 0.64);
    ctx.fillStyle = "#76c7b4";
    ctx.fillRect(w * 0.4, h * 0.18, w * 0.2, h * 0.16);
    ctx.fillStyle = "#25282b";
    ctx.fillRect(w * 0.08, h * 0.78, w * 0.84, h * 0.12);
    ctx.strokeStyle = "#d8d1ad";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  },

  drawDefaultPlayer(ctx, facing, w, h) {
    const cx = w / 2;
    const cy = h / 2 + 2;
    let dx = 0;
    let dy = 1;
    if (facing === "up") dy = -1;
    if (facing === "left") { dx = -1; dy = 0; }
    if (facing === "right") { dx = 1; dy = 0; }
    ctx.fillStyle = "#2d3638";
    ctx.fillRect(cx - 7, cy - 5, 14, 14);
    ctx.fillStyle = "#d9c39b";
    ctx.fillRect(cx - 5, cy - 13, 10, 8);
    ctx.fillStyle = "#66c6a6";
    ctx.fillRect(cx + dx * 8 - 2, cy + dy * 8 - 2, 4, 4);
  },

  drawDefaultResourceNode(ctx, id) {
    const node = { scale: 1, variant: 1, shape: 2, type: id };
    const def = PW.RESOURCE_NODES[id];
    if (id === "tree") PW.RenderWorld.drawTreeNode(ctx, 0, 0, node);
    else PW.RenderWorld.drawStoneNode(ctx, 0, 0, node, def);
  },

  drawDefaultDrop(ctx, id, w, h) {
    const res = PW.RESOURCES[id];
    ctx.fillStyle = res ? res.color : "#f0b84d";
    ctx.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
    ctx.fillStyle = "#151515";
    ctx.font = `${Math.max(8, h * 0.48)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(res ? res.icon : "?", w / 2, h / 2 + 1);
  },

  drawDefaultBird(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = "#3f4239";
    ctx.fillRect(cx - 5, cy - 2, 4, 2);
    ctx.fillRect(cx + 1, cy - 2, 4, 2);
    ctx.fillStyle = "#f2eddc";
    ctx.fillRect(cx - 2, cy - 3, 5, 4);
    ctx.fillStyle = "#83e3da";
    ctx.fillRect(cx - 1, cy - 5, 3, 2);
    ctx.fillStyle = "#f0b84d";
    ctx.fillRect(cx + 3, cy - 2, 2, 1);
    ctx.fillStyle = "#2d3638";
    ctx.fillRect(cx - 4, cy, 2, 2);
  },

  drawDefaultWildlife(ctx, id, w, h) {
    const def = PW.WILDLIFE.critters[id];
    if (PW.RenderEntities && PW.RenderEntities.drawWildlifeShape && def) {
      PW.RenderEntities.drawWildlifeShape(ctx, {
        type: id,
        vx: 1,
        age: 0,
        hp: def.hp,
        maxHp: def.hp
      }, def, w / 2, h / 2 + 2);
      return;
    }
    ctx.fillStyle = def ? def.color : "#6fb65d";
    ctx.fillRect(w * 0.18, h * 0.25, w * 0.64, h * 0.5);
  },

  drawDefaultEnemy(ctx, id, w, h) {
    const def = PW.ENEMIES[id];
    if (PW.RenderEntities && PW.RenderEntities.drawEnemyShape && def) {
      PW.RenderEntities.drawEnemyShape(ctx, { type: id, retreating: false }, def, w / 2, h / 2 + 2);
      return;
    }
    ctx.fillStyle = "#e35d57";
    ctx.fillRect(w * 0.16, h * 0.22, w * 0.68, h * 0.56);
  },

  drawDefaultProjectile(ctx, id, w, h) {
    ctx.fillStyle = PW.ProjectileSystem ? PW.ProjectileSystem.colorFor(id) : "#f0b84d";
    ctx.fillRect(w * 0.25, h * 0.25, w * 0.5, h * 0.5);
  },

  drawDefaultEffect(ctx, id, w, h) {
    if (id === "wildlifePoof") {
      ctx.fillStyle = "#6fb65d";
      ctx.fillRect(w * 0.18, h * 0.42, w * 0.22, h * 0.18);
      ctx.fillStyle = "#d9c39b";
      ctx.fillRect(w * 0.52, h * 0.2, w * 0.18, h * 0.18);
      ctx.fillStyle = "#f0b84d";
      ctx.fillRect(w * 0.62, h * 0.62, w * 0.18, h * 0.18);
      return;
    }
    if (id === "splash" || id === "treasureOpen" || id === "campClear" || id === "catapultSplash" || id === "enemyGuardianHit" || id === "enemyBomb") {
      ctx.strokeStyle = "#f0b84d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    if (id === "enemyDroneZap" || id === "enemyDisrupt") {
      ctx.strokeStyle = id === "enemyDisrupt" ? "#d9a8ef" : "#d7f1ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.18, h * 0.18, w * 0.64, h * 0.64);
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.42);
      ctx.lineTo(w * 0.48, h * 0.58);
      ctx.lineTo(w * 0.36, h * 0.58);
      ctx.lineTo(w * 0.72, h * 0.82);
      ctx.stroke();
      return;
    }
    if (id === "enemyClaw" || id === "enemySwarmBite") {
      ctx.strokeStyle = "#e35d57";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.18);
      ctx.lineTo(w * 0.48, h * 0.82);
      ctx.moveTo(w * 0.58, h * 0.18);
      ctx.lineTo(w * 0.76, h * 0.82);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = id === "damage" ? "#e35d57" : "#f0b84d";
    ctx.fillRect(w * 0.18, h * 0.18, w * 0.64, h * 0.64);
  }
};
