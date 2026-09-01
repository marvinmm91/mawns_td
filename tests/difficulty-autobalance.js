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

  const choices = page.locator('[role="radio"][data-difficulty]');
  if (await choices.count() !== 5) throw new Error("Startdialog bietet nicht genau fuenf Schwierigkeitsstufen.");
  await page.getByRole("radio", { name: /Stufe 5 - Ansturm/ }).click();
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(150);

  const result = await page.evaluate(() => {
    const state = PW.state;
    const legacyBudget = (night) => PW.CONFIG.balance.baseThreatBudget + (night - 1) * PW.CONFIG.balance.budgetGrowth + Math.pow(Math.max(0, night - 1), 1.22) * 0.9;
    const selectedDifficulty = state.difficulty;
    state.balance.drift = 0;
    const budgets = PW.CONFIG.difficulty.profiles.map((profile) => {
      state.difficulty = profile.id;
      return { id: profile.id, budget: PW.Autobalance.threatBudgetForNight(4) };
    });
    state.difficulty = "standard";
    const standardBudget = PW.Autobalance.threatBudgetForNight(4);
    const forecast = PW.Autobalance.forecastForNight(4);

    state.difficulty = "hard";
    PW.Save.save(false);
    state.difficulty = "relaxed";
    const loaded = PW.Save.load(false);

    PW.UI.showHelp();
    const catalog = document.querySelector(".help-catalog");
    return {
      selectedDifficulty,
      budgets,
      standardBudget,
      legacyBudget: legacyBudget(4),
      forecast,
      loaded,
      loadedDifficulty: PW.state.difficulty,
      statusText: document.getElementById("panelBody").textContent,
      helpCards: document.querySelectorAll(".help-unit-card").length,
      helpImages: document.querySelectorAll(".help-unit-card canvas.help-unit-image").length,
      catalogScrollable: catalog && getComputedStyle(catalog).overflowY
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.selectedDifficulty !== "onslaught") throw new Error(`Startauswahl nicht uebernommen: ${result.selectedDifficulty}`);
  if (result.budgets.some((entry, index) => index > 0 && entry.budget <= result.budgets[index - 1].budget)) {
    throw new Error(`Schwierigkeitsbudgets sind nicht strikt abgestuft: ${JSON.stringify(result.budgets)}`);
  }
  if (Math.abs(result.standardBudget - result.legacyBudget) > 0.000001) {
    throw new Error(`Standardbudget hat sich veraendert: ${JSON.stringify(result)}`);
  }
  if (result.forecast.label !== "Planmäßig" || result.forecast.description !== "Planmäßiger") {
    throw new Error(`Bedrohungsprognose ist fehlerhaft: ${JSON.stringify(result.forecast)}`);
  }
  if (!result.loaded || result.loadedDifficulty !== "hard") throw new Error(`Schwierigkeit bleibt nicht gespeichert: ${JSON.stringify(result)}`);
  if (!/Schwierigkeit/.test(result.statusText) || !/Bedrohung Nacht/.test(result.statusText)) {
    throw new Error(`Status zeigt keine Prognose: ${result.statusText}`);
  }
  if (result.helpCards < 13 || result.helpImages !== result.helpCards || result.catalogScrollable !== "auto") {
    throw new Error(`Hilfeuebersicht unvollstaendig: ${JSON.stringify(result)}`);
  }
  console.log("OK difficulty autobalance", JSON.stringify({ budgets: result.budgets, forecast: result.forecast }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
