"use strict";

PW.Autobalance = {
  difficultyProfile(id = PW.state.difficulty) {
    const difficulty = PW.CONFIG.difficulty;
    return difficulty.profiles.find((profile) => profile.id === id) || difficulty.profiles.find((profile) => profile.id === difficulty.default);
  },
  balanceConfig() {
    return { ...PW.CONFIG.balance, ...this.difficultyProfile().balance };
  },
  baseThreatForNight(night) {
    const cfg = PW.CONFIG.balance;
    return cfg.baseThreatBudget + (night - 1) * cfg.budgetGrowth + Math.pow(Math.max(0, night - 1), 1.22) * 0.9;
  },
  calculateThreatBudget(night) {
    const cfg = this.balanceConfig();
    const profile = this.difficultyProfile();
    const base = this.baseThreatForNight(night);
    const drift = PW.Utils.clamp(PW.state.balance.drift, cfg.maxNegativeDrift, cfg.maxPositiveDrift);
    return base * profile.threatMultiplier * (1 + drift);
  },
  threatBudgetForNight(night) {
    const budget = this.calculateThreatBudget(night);
    PW.state.balance.lastThreatBudget = budget;
    return budget;
  },
  effectiveThreatBudgetForNight(night) {
    const budget = this.threatBudgetForNight(night) * PW.GameModes.profile().waveMultiplier * PW.Development.factor("waveMultiplier");
    PW.state.balance.lastThreatBudget = budget;
    return budget;
  },
  forecastForNight(night) {
    const directorBudget = this.calculateThreatBudget(night);
    const profile = this.difficultyProfile();
    const gameMode = PW.GameModes.profile();
    const budget = directorBudget * gameMode.waveMultiplier * PW.Development.factor("waveMultiplier");
    const relativePressure = directorBudget / Math.max(1, this.baseThreatForNight(night) * profile.threatMultiplier);
    const forecast = relativePressure < 0.82 ? { label: "Niedrig", description: "Niedriger" } :
      relativePressure < 0.95 ? { label: "Gering", description: "Geringer" } :
      relativePressure < 1.05 ? { label: "Planmäßig", description: "Planmäßiger" } :
      relativePressure < 1.18 ? { label: "Erhöht", description: "Erhöhter" } :
      { label: "Hoch", description: "Hoher" };
    return { night, budget, directorBudget, relativePressure, ...forecast, profile, gameMode };
  },
  evaluateNight() {
    const state = PW.state;
    const stats = state.nightStats;
    if (!stats) return;
    const cfg = this.balanceConfig();
    const damageRatio = stats.shipDamageTaken / state.ship.maxHp;
    const hpRatio = state.ship.hp / state.ship.maxHp;
    const avgKillDistance = stats.kills ? stats.killDistanceSum / stats.kills : 0;
    const safeKillDistance = state.world.tileSize * 9;
    const easy = damageRatio <= cfg.easyDamageRatio && stats.wallsDestroyed === 0 && avgKillDistance > safeKillDistance;
    const hard = damageRatio >= cfg.hardDamageRatio || hpRatio <= cfg.lowHpRatio || stats.wallsDestroyed >= Math.max(3, state.world.buildings.length * 0.35);
    state.balance.nextHints = [];

    let adjustment = 0;
    if (hard) {
      state.balance.hardStreak += 1;
      state.balance.easyStreak = 0;
      adjustment = Math.max(cfg.maxNightRelief, -0.1 - damageRatio * 0.18);
      state.balance.dropBonus = Math.min(cfg.maxDropBonus, state.balance.dropBonus + 0.06);
      if (stats.airDamage / Math.max(1, stats.shipDamageTaken) > 0.45) {
        state.balance.nextHints.push("air");
        PW.ResourceSystem.revealHint("iron");
      }
    } else if (easy) {
      state.balance.easyStreak += 1;
      state.balance.hardStreak = 0;
      if (state.balance.easyStreak >= 2) adjustment = cfg.maxNightBoost;
      state.balance.dropBonus = Math.max(0, state.balance.dropBonus - 0.03);
    } else {
      state.balance.easyStreak = 0;
      state.balance.hardStreak = 0;
      if (damageRatio < cfg.idealDamageMin) adjustment = 0.04;
      if (damageRatio > cfg.idealDamageMax) adjustment = -0.06;
      state.balance.dropBonus = Math.max(0, state.balance.dropBonus - 0.015);
    }

    state.balance.drift = PW.Utils.clamp(state.balance.drift + adjustment, cfg.maxNegativeDrift, cfg.maxPositiveDrift);

    if (state.phase.night >= 3 && !state.knownResources.has("iron")) PW.ResourceSystem.revealHint("iron");
    if (state.phase.night >= 6 && !state.knownResources.has("crystal")) PW.ResourceSystem.revealHint("crystal");
    if (state.phase.night >= 7 && !state.knownResources.has("gold")) PW.ResourceSystem.revealHint("gold");

    const diagnosis = this.diagnose(stats, damageRatio, hpRatio, avgKillDistance);
    state.lastReport = {
      night: stats.night,
      damage: stats.shipDamageTaken,
      hp: state.ship.hp,
      maxHp: state.ship.maxHp,
      kills: stats.kills,
      wallsDestroyed: stats.wallsDestroyed,
      airDamage: stats.airDamage,
      drift: state.balance.drift,
      dropBonus: state.balance.dropBonus,
      diagnosis,
      difficulty: this.difficultyProfile().shortName,
      gameMode: PW.GameModes.profile().shortName,
      modeWaveMultiplier: PW.GameModes.profile().waveMultiplier,
      nextForecast: this.forecastForNight(state.phase.night + 1)
    };
  },
  diagnose(stats, damageRatio, hpRatio, avgKillDistance) {
    const cfg = this.balanceConfig();
    const lines = [];
    if (stats.shipDamageTaken === 0) lines.push("Perfekte Nacht: Das Wrack blieb unbeschädigt.");
    else lines.push(`Wrackschaden: ${stats.shipDamageTaken} HP.`);
    if (stats.airDamage > stats.shipDamageTaken * 0.45) lines.push(`Luftgegner verursachten ${Math.round(stats.airDamage / Math.max(1, stats.shipDamageTaken) * 100)} Prozent des Schadens.`);
    if (stats.wallsDestroyed > 0) lines.push(`${stats.wallsDestroyed} Mauern wurden zerstört.`);
    if (damageRatio > cfg.hardDamageRatio || hpRatio < cfg.lowHpRatio) lines.push("Nächste Nacht wird leicht entschärft und Schrottdrops steigen.");
    else if (damageRatio < cfg.easyDamageRatio && avgKillDistance > PW.state.world.tileSize * 9) lines.push("Verteidigung war sehr stark. Der nächste Angriff kann breiter werden.");
    else lines.push("Schwierigkeit bleibt nahe am aktuellen Druck.");
    if (!PW.hasAntiAir() && PW.state.phase.night >= 3) lines.push("Luftabwehr fehlt: Flak oder Laser vorbereiten.");
    if (PW.state.world.buildings.filter((b) => PW.BUILDINGS[b.type].category === "wall").length < 8 && PW.state.phase.night >= 2) lines.push("Mehr Mauern geben Ballisten Zeit zum Feuern.");
    return lines;
  }
};

PW.hasAntiAir = function hasAntiAir() {
  return PW.state.world.buildings.some((building) => {
    const def = PW.BUILDINGS[building.type];
    return def.category === "tower" && def.targets && def.targets.includes("air");
  });
};
