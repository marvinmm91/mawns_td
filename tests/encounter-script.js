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
    const nights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 21, 31, 41, 51, 60, 61].map((night) => {
      const wave = PW.WaveScript.forNight(night);
      return { night, id: wave.id, chapter: wave.chapter, doctrine: wave.doctrine, enemies: wave.enemies, featured: wave.featured, directions: wave.directions, budgetMultiplier: wave.budgetMultiplier };
    });

    state.gameMode = "aggressive";
    state.phase.night = 5;
    state.rng = PW.Random.create(1234);
    state.enemies = [];
    PW.Spawning.startNight(false);
    const featuredSpawn = state.enemies.some((enemy) => enemy.type === "drone");

    state.balance.drift = 0.18;
    state.balance.dropBonus = 0.2;
    state.nightStats = { night: 5, shipDamageTaken: state.ship.maxHp, wallsDestroyed: 4, kills: 1, killDistanceSum: 0, airDamage: 0 };
    PW.Autobalance.evaluateNight();
    const hardNight = { drift: state.balance.drift, dropBonus: state.balance.dropBonus };

    state.balance.drift = 0;
    state.balance.easyStreak = 0;
    state.nightStats = { night: 5, shipDamageTaken: 0, wallsDestroyed: 0, kills: 1, killDistanceSum: state.world.tileSize * 12, airDamage: 0 };
    PW.Autobalance.evaluateNight();
    PW.Autobalance.evaluateNight();
    const easyNights = { drift: state.balance.drift, dropBonus: state.balance.dropBonus };

    PW.UI.showStatusPanel();
    const statusText = document.getElementById("panelBody").textContent;
    PW.UI.togglePanel("development", true);
    const developmentText = document.getElementById("panelBody").textContent;
    return { nights, featuredSpawn, hardNight, easyNights, statusText, developmentText };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  const opening = result.nights.slice(0, 10);
  const expectedFeatures = ["crawler", "swarm", "armored", "swarm", "drone", "armored", "breaker", "disruptor", "bomber", "guardian"];
  if (opening.some((wave, index) => wave.chapter !== 0 || !wave.featured.includes(expectedFeatures[index]))) {
    throw new Error(`Einstiegsskripte fehlerhaft: ${JSON.stringify(opening)}`);
  }
  const chapters = result.nights.slice(10);
  const expectedDoctrines = ["assault", "air", "siege", "encirclement", "vanguard", "vanguard", "invasion"];
  if (chapters.some((wave, index) => wave.doctrine !== expectedDoctrines[index])) {
    throw new Error(`Kapitelrotation fehlerhaft: ${JSON.stringify(chapters)}`);
  }
  const night10 = result.nights.find((wave) => wave.night === 10);
  const night60 = result.nights.find((wave) => wave.night === 60);
  if (!night10 || !night60 || night60.budgetMultiplier <= night10.budgetMultiplier || night60.directions < night10.directions) {
    throw new Error(`Späte Skriptskalierung fehlerhaft: ${JSON.stringify({ night10, night60 })}`);
  }
  if (!result.featuredSpawn) throw new Error("Der garantierte Schwerpunktgegner der Luftnacht wurde nicht gespawnt.");
  if (result.hardNight.drift !== 0.18 || result.hardNight.dropBonus !== 0 || result.easyNights.drift <= 0 || result.easyNights.dropBonus !== 0) {
    throw new Error(`Automatischer Director ist nicht einseitig: ${JSON.stringify({ hard: result.hardNight, easy: result.easyNights })}`);
  }
  if (/Balance|Bedrohung/.test(result.statusText) || !/Automatische Steigerung/.test(result.developmentText)) {
    throw new Error(`Director-Informationen liegen im falschen Panel: ${JSON.stringify({ status: result.statusText, development: result.developmentText })}`);
  }
  console.log("OK encounter script", JSON.stringify({ night10, night60, hardNight: result.hardNight, easyNights: result.easyNights }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
