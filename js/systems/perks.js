"use strict";

PW.Perks = {
  state() {
    const state = PW.state;
    const defaults = { coins: 0, purchased: [], lastAwardedNight: 0 };
    state.perks = { ...defaults, ...(state.perks || {}) };
    state.perks.coins = Math.max(0, Math.floor(Number(state.perks.coins) || 0));
    state.perks.purchased = Array.isArray(state.perks.purchased) ? state.perks.purchased.filter((id) => PW.PERKS[id]) : [];
    state.perks.lastAwardedNight = Math.max(0, Math.floor(Number(state.perks.lastAwardedNight) || 0));
    return state.perks;
  },
  has(id) {
    return this.state().purchased.includes(id);
  },
  definition(id) {
    return PW.PERKS[id] || null;
  },
  canPurchase(id) {
    const perk = this.definition(id);
    if (!perk || this.has(id)) return false;
    const state = this.state();
    return state.coins >= perk.cost && (perk.requires || []).every((required) => this.has(required));
  },
  purchase(id) {
    const perk = this.definition(id);
    if (!perk) return false;
    if (this.has(id)) {
      PW.Messages.add(`${perk.name} ist bereits aktiv.`);
      return false;
    }
    if (!(perk.requires || []).every((required) => this.has(required))) {
      PW.Messages.add("Vorherige Perks fehlen noch.");
      return false;
    }
    const state = this.state();
    if (state.coins < perk.cost) {
      PW.Messages.add(`${perk.name} braucht ${perk.cost} Coin${perk.cost === 1 ? "" : "s"}.`);
      return false;
    }
    state.coins -= perk.cost;
    state.purchased.push(id);
    this.applyPurchase(perk);
    PW.Messages.add(`${perk.name} aktiviert.`, "ok");
    PW.UI.renderHud();
    PW.UI.renderPanel();
    PW.Save.save(false);
    return true;
  },
  applyPurchase(perk) {
    if (perk.id === "groundScanner") PW.MapGenerator.generateBuriedDeposits();
    if (perk.id === "orbitalCartography") PW.Fog.revealAll();
  },
  awardNightCoin() {
    const state = PW.state;
    const perks = this.state();
    const night = state.phase.night;
    if (state.ship.launchActive || night <= 0 || perks.lastAwardedNight >= night) return false;
    perks.coins += 1;
    perks.lastAwardedNight = night;
    return true;
  },
  gatheringCooldown() {
    return PW.CONFIG.actionRepeatInterval * (this.has("rapidHarvest") ? 0.75 : 1);
  },
  resourceYield(amount) {
    return this.has("richDeposits") ? Math.ceil(amount * 1.5) : amount;
  },
  magnetRadius() {
    return this.has("salvageMagnet") ? PW.CONFIG.dropMagnetRadius * 1.9 : PW.CONFIG.dropMagnetRadius;
  },
  extraEnemyDropChance() {
    return this.has("recoveryProtocol") ? 0.35 : 0;
  },
  batchCostMultiplier() {
    return this.has("blueprintLogistics") ? 1.1 : PW.CONFIG.blueprintBatchCostMultiplier;
  },
  constructionTime(def) {
    const perkMultiplier = this.has("fieldMechanic") ? 0.75 : 1;
    const developmentMultiplier = def.category === "tower" ? PW.Development.factor("towerConstructionTimeMultiplier") : 1;
    return Math.max(0.1, (def.buildTime || 3) * perkMultiplier * developmentMultiplier);
  },
  constructionSpeedMultiplier() {
    return this.has("builderDrones") && PW.state.phase.current === "day" ? 2 : 1;
  },
  repairMultiplier() {
    return this.has("maintenanceTraining") ? 1.35 : 1;
  },
  towerDamageMultiplier() {
    return this.has("precisionCalibration") ? 1.12 : 1;
  },
  towerRateMultiplier() {
    return this.has("tacticalCapacitors") ? 1.12 : 1;
  },
  scannerRadius() {
    return 5;
  },
  update() {
    if (!this.has("groundScanner")) return;
    const state = PW.state;
    const px = PW.Utils.worldToTile(state.player.x);
    const py = PW.Utils.worldToTile(state.player.y);
    (state.world.buriedDeposits || []).forEach((deposit) => {
      if (deposit.discovered || Math.hypot(deposit.x - px, deposit.y - py) > this.scannerRadius()) return;
      if (PW.MapGenerator.addResource(deposit.type, deposit.x, deposit.y, { buried: true })) {
        deposit.discovered = true;
        PW.Messages.add("Bodendetektor: Lagerstätte entdeckt.", "ok");
      }
    });
  }
};
