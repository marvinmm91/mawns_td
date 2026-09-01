"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname, "..", "index.html")).href);
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(150);

  const result = await page.evaluate(() => {
    const state = PW.state;
    state.phase.night = 4;
    state.balance.drift = 0;
    state.difficulty = "standard";
    const budgets = PW.CONFIG.gameModes.profiles.map((mode) => {
      state.gameMode = mode.id;
      const forecast = PW.Autobalance.forecastForNight(4);
      const budget = PW.Autobalance.effectiveThreatBudgetForNight(4);
      return { id: mode.id, budget, forecastBudget: forecast.budget, factor: mode.waveMultiplier };
    });
    const spawnCounts = PW.CONFIG.gameModes.profiles.map((mode) => {
      state.gameMode = mode.id;
      state.enemies = [];
      state.rng = PW.Random.create(4312);
      PW.Spawning.startNight(false);
      let guard = 0;
      while (state.wave.budgetRemaining > 0 && guard < 64) {
        PW.Spawning.spawnPulse();
        guard += 1;
      }
      return { id: mode.id, count: state.wave.spawnedThisNight, budgetRemaining: state.wave.budgetRemaining };
    });
    const modeDamage = PW.CONFIG.gameModes.profiles.map((mode) => {
      state.gameMode = mode.id;
      state.development = PW.Development.defaults();
      const enemyDef = PW.ENEMIES.guardian;
      const building = { id: `damage-${mode.id}`, x: 5, y: 5, hp: 1000, maxHp: 1000 };
      const enemy = { id: `enemy-${mode.id}`, x: PW.Utils.tileToWorld(5), y: PW.Utils.tileToWorld(5), attackCooldown: 0 };
      PW.EnemySystem.attackBuilding(enemy, enemyDef, building, 48);
      const buildingDamage = 1000 - building.hp;
      state.ship.hp = 1000;
      state.ship.maxHp = 1000;
      enemy.x = PW.EnemySystem.shipCenter().x;
      enemy.y = PW.EnemySystem.shipCenter().y;
      enemy.attackCooldown = 0;
      PW.EnemySystem.attackShipIfClose(enemy, enemyDef);
      return { id: mode.id, buildingDamage, shipDamage: 1000 - state.ship.hp, factor: mode.enemyDamageMultiplier };
    });
    state.gameMode = "classic";
    state.nightStats = { night: 4, shipDamageTaken: 0, wallsDestroyed: 0, kills: 0, killDistanceSum: 0, airDamage: 0 };
    PW.Autobalance.evaluateNight();
    PW.UI.renderPanel();
    return {
      budgets,
      spawnCounts,
      modeDamage,
      development: PW.Development.defaults(),
      guardian: { wallDamage: PW.ENEMIES.guardian.wallDamage, damage: PW.ENEMIES.guardian.damage },
      report: PW.state.lastReport,
      status: document.getElementById("panelBody").textContent
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  const classic = result.budgets.find((entry) => entry.id === "classic");
  const aggressive = result.budgets.find((entry) => entry.id === "aggressive");
  if (!classic || !aggressive || classic.factor !== 3.72 || aggressive.factor !== 0.92 || Math.abs(classic.budget / aggressive.budget - 3.72 / 0.92) > 0.000001) {
    throw new Error(`Moduswellenfaktoren fehlerhaft: ${JSON.stringify(result.budgets)}`);
  }
  if (result.budgets.some((entry) => Math.abs(entry.budget - entry.forecastBudget) > 0.000001)) {
    throw new Error(`Prognose zeigt nicht das effektive Budget: ${JSON.stringify(result.budgets)}`);
  }
  const classicSpawns = result.spawnCounts.find((entry) => entry.id === "classic");
  const aggressiveSpawns = result.spawnCounts.find((entry) => entry.id === "aggressive");
  if (!classicSpawns || !aggressiveSpawns || classicSpawns.budgetRemaining > 0 || aggressiveSpawns.budgetRemaining > 0 || classicSpawns.count <= aggressiveSpawns.count) {
    throw new Error(`Modus-Spawnmengen fehlerhaft: ${JSON.stringify(result.spawnCounts)}`);
  }
  const classicDamage = result.modeDamage.find((entry) => entry.id === "classic");
  const aggressiveDamage = result.modeDamage.find((entry) => entry.id === "aggressive");
  if (!classicDamage || !aggressiveDamage || classicDamage.factor !== 0.4 || aggressiveDamage.factor !== 1 || Math.abs(classicDamage.buildingDamage - result.guardian.wallDamage * 0.4) > 0.000001 || aggressiveDamage.buildingDamage !== result.guardian.wallDamage || classicDamage.shipDamage !== Math.ceil(result.guardian.damage * 0.4) || aggressiveDamage.shipDamage !== result.guardian.damage) {
    throw new Error(`Modus-Gegnerschaden fehlerhaft: ${JSON.stringify(result.modeDamage)}`);
  }
  if (Object.values(result.development).some((value) => value !== 1)) {
    throw new Error(`Entwicklungsfaktoren sind nicht neutral: ${JSON.stringify(result.development)}`);
  }
  if (result.report.gameMode !== "Classic" || result.report.modeWaveMultiplier !== 3.72 || !/Moduswellen/.test(result.status) || !/372%/.test(result.status)) {
    throw new Error(`Modusfeedback fehlerhaft: ${JSON.stringify(result)}`);
  }
  console.log("OK game mode balance", JSON.stringify(result.budgets));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
