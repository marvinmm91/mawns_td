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
      PW.Spawning.startNight(false);
      const forecast = PW.Autobalance.forecastForNight(4);
      return { id: mode.id, budget: state.wave.budgetRemaining, forecastBudget: forecast.budget, factor: mode.waveMultiplier };
    });
    state.gameMode = "classic";
    state.nightStats = { night: 4, shipDamageTaken: 0, wallsDestroyed: 0, kills: 0, killDistanceSum: 0, airDamage: 0 };
    PW.Autobalance.evaluateNight();
    PW.UI.renderPanel();
    return {
      budgets,
      report: PW.state.lastReport,
      status: document.getElementById("panelBody").textContent
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  const classic = result.budgets.find((entry) => entry.id === "classic");
  const aggressive = result.budgets.find((entry) => entry.id === "aggressive");
  if (!classic || !aggressive || Math.abs(classic.budget / aggressive.budget - 1.24 / 0.92) > 0.000001) {
    throw new Error(`Moduswellenfaktoren fehlerhaft: ${JSON.stringify(result.budgets)}`);
  }
  if (result.budgets.some((entry) => Math.abs(entry.budget - entry.forecastBudget) > 0.000001)) {
    throw new Error(`Prognose zeigt nicht das effektive Budget: ${JSON.stringify(result.budgets)}`);
  }
  if (result.report.gameMode !== "Classic" || result.report.modeWaveMultiplier !== 1.24 || !/Moduswellen/.test(result.status) || !/124%/.test(result.status)) {
    throw new Error(`Modusfeedback fehlerhaft: ${JSON.stringify(result)}`);
  }
  console.log("OK game mode balance", JSON.stringify(result.budgets));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
