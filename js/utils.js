"use strict";

PW.Utils = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  distance(a, b, c, d) {
    const dx = a - c;
    const dy = b - d;
    return Math.hypot(dx, dy);
  },
  tileKey(x, y) {
    return `${x},${y}`;
  },
  formatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  },
  costText(cost) {
    return Object.entries(cost).map(([id, amount]) => `${PW.RESOURCES[id].name} ${amount}`).join(", ");
  },
  canAfford(cost) {
    const inv = PW.state.inventory;
    return Object.entries(cost).every(([id, amount]) => (inv[id] || 0) >= amount);
  },
  pay(cost) {
    if (!this.canAfford(cost)) return false;
    Object.entries(cost).forEach(([id, amount]) => { PW.state.inventory[id] -= amount; });
    return true;
  },
  addInventory(id, amount) {
    const state = PW.state;
    state.inventory[id] = (state.inventory[id] || 0) + amount;
    state.knownResources.add(id);
    PW.Progression.refreshUnlocks();
    PW.UI.refreshInventoryDependentPanel();
  },
  addEffect(type, x, y, color, life = 0.45, size = 1, extra = null) {
    PW.state.effects.push({ type, x, y, color, life, maxLife: life, size, ...(extra || {}) });
  },
  worldToTile(px) {
    return Math.floor(px / PW.CONFIG.tileSize);
  },
  tileToWorld(tile) {
    return tile * PW.CONFIG.tileSize + PW.CONFIG.tileSize / 2;
  },
  directionName(dir) {
    const names = { n: "Norden", s: "Sueden", e: "Osten", w: "Westen", ne: "Nordost", nw: "Nordwest", se: "Suedost", sw: "Suedwest" };
    return names[dir] || dir;
  },
  weightedPick(entries, rng) {
    const total = entries.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng.float(0, total);
    for (const item of entries) {
      roll -= item.weight;
      if (roll <= 0) return item.value;
    }
    return entries[entries.length - 1].value;
  }
};
