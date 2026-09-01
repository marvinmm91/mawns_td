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
  addInventory(id, amount, source = null) {
    const state = PW.state;
    state.inventory[id] = (state.inventory[id] || 0) + amount;
    state.knownResources.add(id);
    PW.Progression.refreshUnlocks();
    PW.UI.refreshInventoryDependentPanel();
    if (source && amount > 0) this.addResourceFeedback(id, amount, source.x, source.y);
  },
  addEffect(type, x, y, color, life = 0.45, size = 1, extra = null) {
    const effect = { type, x, y, color, life, maxLife: life, size, ...(extra || {}) };
    PW.state.effects.push(effect);
    this.limitEffects();
    return effect;
  },
  effectPriority(effect) {
    return ["treasureOpen", "campClear", "outpostClaim", "outpostAlert"].includes(effect.type) ? 2 : effect.type === "floatingText" ? 1 : 0;
  },
  limitEffects() {
    const effects = PW.state.effects;
    const limit = PW.CONFIG.effects.maxActive;
    while (effects.length > limit) {
      let discardIndex = 0;
      for (let index = 1; index < effects.length; index++) {
        const candidate = effects[index];
        const discarded = effects[discardIndex];
        const candidatePriority = this.effectPriority(candidate);
        const discardedPriority = this.effectPriority(discarded);
        const candidateLife = candidate.life / Math.max(0.001, candidate.maxLife);
        const discardedLife = discarded.life / Math.max(0.001, discarded.maxLife);
        if (candidatePriority < discardedPriority || (candidatePriority === discardedPriority && candidateLife < discardedLife)) discardIndex = index;
      }
      effects.splice(discardIndex, 1);
    }
  },
  addFloatingText(text, x, y, color, options = {}) {
    const state = PW.state;
    const life = options.life || 0.82;
    const key = options.key || null;
    const value = options.value || 0;
    const active = key && state.effects.find((effect) => effect.type === "floatingText" && effect.key === key && effect.life > effect.maxLife * 0.44);
    if (active) {
      active.value += value;
      active.text = options.format ? options.format(active.value) : text;
      active.life = Math.min(active.maxLife, active.life + 0.16);
      return active;
    }
    const hash = key ? this.textHash(key) >>> 0 : 0;
    const lane = hash % 3;
    const row = Math.floor(hash / 3) % 3;
    const effect = {
      type: "floatingText",
      x,
      y,
      color,
      text,
      value,
      key,
      life,
      maxLife: life,
      rise: options.rise || 23,
      offsetX: (lane - 1) * 9,
      offsetY: (options.offsetY || 0) - row * 11
    };
    state.effects.push(effect);
    this.limitEffects();
    return effect;
  },
  addDamageFeedback(enemy, amount) {
    const damage = Math.max(0.1, amount);
    this.addFloatingText(`-${Math.round(damage)}`, enemy.x, enemy.y, "#ffd17a", {
      key: `damage:${enemy.id}`,
      value: damage,
      format: (value) => `-${Math.round(value)}`,
      life: 0.72,
      rise: 25,
      offsetY: -20
    });
  },
  addResourceFeedback(id, amount, x, y) {
    const resource = PW.RESOURCES[id];
    if (!resource) return;
    this.addFloatingText(`+${amount} ${resource.name}`, x, y, resource.color, {
      key: `resource:${id}:${Math.round(x / 32)},${Math.round(y / 32)}`,
      value: amount,
      format: (value) => `+${Math.round(value)} ${resource.name}`,
      life: 1.02,
      rise: 30,
      offsetY: -19
    });
  },
  textHash(text) {
    let hash = 0;
    for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) | 0;
    return hash;
  },
  worldToTile(px) {
    return Math.floor(px / PW.CONFIG.tileSize);
  },
  tileToWorld(tile) {
    return tile * PW.CONFIG.tileSize + PW.CONFIG.tileSize / 2;
  },
  directionName(dir) {
    const names = { n: "Norden", s: "Süden", e: "Osten", w: "Westen", ne: "Nordost", nw: "Nordwest", se: "Südost", sw: "Südwest" };
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
