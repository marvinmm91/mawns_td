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

  const result = await page.evaluate(() => {
    const state = PW.state;
    state.phase.current = "night";
    state.phase.night = 1;
    state.wave.active = true;
    state.nightStats = { night: 1, shipStartHp: state.ship.hp, shipDamageTaken: 0, airDamage: 0, wallDamage: 0, wallsDestroyed: 0, kills: 0, killDistanceSum: 0, startedAt: state.elapsed };
    const enemy = PW.EnemySystem.spawn("crawler", state.player.x - 96, state.player.y);
    const expectedCount = state.enemies.length;
    PW.DayNight.beginDawn();
    const dawn = { count: state.enemies.length, retreating: enemy.retreating, waveActive: state.wave.active };
    PW.DayNight.beginDay();
    PW.EnemySystem.update(0.2);
    return { dawn, expectedCount, dayCount: state.enemies.length, retreating: enemy.retreating, remove: Boolean(enemy.remove) };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.dawn.count !== result.expectedCount || result.dawn.retreating || result.dawn.waveActive || result.dayCount !== result.expectedCount || result.retreating || result.remove) {
    throw new Error(`Gegner verschwinden nach der Nacht: ${JSON.stringify(result)}`);
  }
  console.log("OK enemy persistence", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
