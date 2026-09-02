"use strict";

PW.Progression = {
  refreshUnlocks() {
    const state = PW.state;
    Object.values(PW.BUILDINGS).forEach((def) => {
      if (!PW.GameModes.allowsBuilding(def.id)) {
        state.unlockedBuildings.delete(def.id);
        return;
      }
      if (def.category === "tower") {
        state.unlockedBuildings.add(def.id);
        return;
      }
      const nightOk = state.phase.night >= (def.unlockNight || 0);
      const knownOk = !def.requiresKnown || def.requiresKnown.some((id) => state.knownResources.has(id));
      if (nightOk && knownOk) state.unlockedBuildings.add(def.id);
    });
    if (state.phase.night >= 3) state.unlockedBuildings.add("flak");
    if (state.phase.night >= 4) state.unlockedBuildings.add("catapult");
    if (state.phase.night >= 8 && state.knownResources.has("gold")) state.unlockedBuildings.add("laser");
    if (!PW.GameModes.allowsBuilding(state.selectedBuild)) state.selectedBuild = "palisade";
  },
  shipRepairCostOptions() {
    const repairCount = PW.state.ship.repairCount || 0;
    const multiplier = Math.pow(PW.CONFIG.shipRepair.costMultiplier, repairCount);
    const scaleCost = (baseCost) => Object.fromEntries(Object.entries(baseCost).map(([resourceId, amount]) => [resourceId, Math.ceil(amount * multiplier)]));
    return {
      scrap: scaleCost(PW.CONFIG.shipRepair.scrapCost),
      basic: scaleCost(PW.CONFIG.shipRepair.basicCost)
    };
  },
  shipRepairCost() {
    const options = this.shipRepairCostOptions();
    return PW.Utils.canAfford(options.scrap) ? options.scrap : options.basic;
  },
  repairShip() {
    const state = PW.state;
    if (state.ship.hp >= state.ship.maxHp) {
      PW.Messages.add("Wrack ist bereits stabil.");
      return false;
    }
    const options = this.shipRepairCostOptions();
    const cost = this.shipRepairCost();
    if (!PW.Utils.canAfford(cost)) {
      PW.Messages.add(`Wrackreparatur braucht ${PW.Utils.costText(options.basic)} oder ${PW.Utils.costText(options.scrap)}.`);
      return false;
    }
    PW.Utils.pay(cost);
    state.ship.repairCount += 1;
    state.ship.hp = Math.min(state.ship.maxHp, state.ship.hp + PW.CONFIG.shipRepair.hpRestored);
    if (state.ship.hp >= state.ship.maxHp) state.ship.damageFlash = 0;
    PW.Utils.addEffect("splash", PW.EnemySystem.shipCenter().x, PW.EnemySystem.shipCenter().y, "#6ec36e", 0.5, 1.7);
    PW.Messages.add(`Wrack +${PW.CONFIG.shipRepair.hpRestored} HP.`, "ok");
    PW.UI.renderHud();
    return true;
  },
  canRepairModule(id) {
    const state = PW.state;
    const mod = PW.SHIP_MODULES[id];
    if (!mod || state.ship.modules[id]) return false;
    if (state.phase.night < mod.unlockNight) return false;
    if (mod.requiresKnown && !mod.requiresKnown.some((res) => state.knownResources.has(res))) return false;
    return PW.Utils.canAfford(mod.cost);
  },
  repairModule(id) {
    const state = PW.state;
    const mod = PW.SHIP_MODULES[id];
    if (!mod || state.ship.modules[id]) return;
    if (state.phase.night < mod.unlockNight) {
      PW.Messages.add(`${mod.name} ist noch nicht analysiert.`);
      return;
    }
    if (mod.requiresKnown && !mod.requiresKnown.some((res) => state.knownResources.has(res))) {
      PW.Messages.add(`${mod.name}: benötigte Ressource noch unbekannt.`);
      return;
    }
    if (!PW.Utils.canAfford(mod.cost)) {
      PW.Messages.add(`Zu wenig Material für ${mod.name}.`);
      return;
    }
    PW.Utils.pay(mod.cost);
    state.ship.modules[id] = true;
    if (id === "hull") {
      state.ship.maxHp += 100;
      state.ship.hp = Math.min(state.ship.maxHp, state.ship.hp + 100);
    }
    if (id === "comms") PW.Messages.add("Spawnwarnungen werden ab jetzt genauer.", "ok");
    PW.Utils.addEffect("splash", PW.EnemySystem.shipCenter().x, PW.EnemySystem.shipCenter().y, "#83e3da", 0.8, 2.2);
    PW.Messages.add(`${mod.name} repariert.`, "ok");
    PW.UI.renderPanel();
    PW.UI.renderHud();
    PW.Save.save(false);
  },
  repairedModuleCount() {
    return Object.values(PW.state.ship.modules).filter(Boolean).length;
  },
  canStartLaunch() {
    const state = PW.state;
    return this.repairedModuleCount() === Object.keys(PW.SHIP_MODULES).length &&
      state.phase.night >= 10 &&
      state.ship.hp >= state.ship.maxHp * 0.7 &&
      !state.ship.launchActive;
  },
  startLaunch() {
    if (!this.canStartLaunch()) {
      PW.Messages.add("Startsequenz braucht alle Module, Nacht 10 und mindestens 70 Prozent Wrack-HP.");
      return;
    }
    PW.UI.hidePanel();
    PW.DayNight.forceFinalNight();
  },
  updateLaunch(dt) {
    const state = PW.state;
    state.ship.launchTimer = Math.max(0, state.ship.launchTimer - dt);
    if (state.ship.launchTimer <= 0 && state.ship.hp > 0) this.win();
  },
  lose() {
    const state = PW.state;
    if (state.gameOver) return;
    state.gameOver = true;
    state.running = false;
    PW.UI.showEndDialog(false);
  },
  win() {
    const state = PW.state;
    if (state.victory) return;
    state.victory = true;
    state.running = false;
    PW.Save.clear();
    PW.UI.showEndDialog(true);
  }
};
