"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(pathToFileURL(path.join(__dirname, "..", "index.html")).href);
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(250);

  const result = await page.evaluate(() => {
    const state = PW.state;
    Object.assign(state.inventory, { wood: 999, stone: 999, iron: 999, gold: 999, crystal: 999, scrap: 999, parts: 999 });
    const ship = state.ship;
    let tile = null;
    for (let y = ship.y - 7; y <= ship.y + ship.size + 7 && !tile; y += 1) {
      for (let x = ship.x - 7; x <= ship.x + ship.size + 7; x += 1) {
        if (PW.Tiles.canBuildAt(x, y)) {
          tile = { x, y };
          break;
        }
      }
    }
    if (!tile) throw new Error("Kein Bauplatz gefunden.");
    state.player.x = PW.Tiles.tileCenter(tile.x - 1, tile.y).x;
    state.player.y = PW.Tiles.tileCenter(tile.x - 1, tile.y).y;
    state.selectedBuild = "palisade";
    const placed = PW.BuildingSystem.placeSelected(tile.x, tile.y);
    const site = PW.Tiles.getBuilding(tile.x, tile.y);
    const initiallyBlocked = PW.Tiles.isBlockedForGround(tile.x, tile.y);
    PW.BuildingSystem.update(1.5);
    const halfway = PW.BuildingSystem.constructionProgress(site);
    PW.BuildingSystem.update(1.6);
    const complete = !PW.BuildingSystem.isConstructing(site) && PW.Tiles.isBlockedForGround(tile.x, tile.y);

    state.perks.coins = 12;
    const boughtField = PW.Perks.purchase("fieldMechanic");
    const boughtPlans = PW.Perks.purchase("blueprintLogistics");
    const boughtTools = PW.Perks.purchase("reinforcedTools");
    const boughtRich = PW.Perks.purchase("richDeposits");
    const boughtScanner = PW.Perks.purchase("groundScanner");
    const ballista = PW.BUILDINGS.ballista;
    const constructionTime = PW.Perks.constructionTime(ballista);
    const richYield = PW.Perks.resourceYield(5);
    const scannerDeposits = state.world.buriedDeposits.length;
    const batchMultiplier = PW.Perks.batchCostMultiplier();
    state.phase.night = 4;
    state.ship.launchActive = false;
    state.perks.lastAwardedNight = 3;
    const coinsBeforeAward = state.perks.coins;
    const awardedNightCoin = PW.Perks.awardNightCoin();
    const awardedOnce = state.perks.coins === coinsBeforeAward + 1 && !PW.Perks.awardNightCoin();

    PW.UI.togglePanel("perks", true);
    const perkPanelVisible = document.getElementById("panelBody").textContent.includes("Verteidigung & Baulogistik");
    PW.Save.save(false);
    const savedCoins = state.perks.coins;
    const loaded = PW.Save.load(false);
    const persisted = PW.Perks.has("fieldMechanic") && PW.state.perks.coins === savedCoins;
    return {
      placed,
      duration: site.constructionDuration,
      initiallyBlocked,
      halfway,
      complete,
      boughtField,
      boughtPlans,
      boughtTools,
      boughtRich,
      boughtScanner,
      constructionTime,
      richYield,
      scannerDeposits,
      batchMultiplier,
      awardedNightCoin,
      awardedOnce,
      perkPanelVisible,
      loaded,
      persisted
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!result.placed || result.duration !== 3 || result.initiallyBlocked || !(result.halfway > 0.45 && result.halfway < 0.55) || !result.complete) {
    throw new Error(`Baustellenzustand fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.boughtField || !result.boughtPlans || !result.boughtTools || !result.boughtRich || !result.boughtScanner || result.constructionTime !== 7.5 || result.richYield !== 8 || result.batchMultiplier !== 1.1 || !result.scannerDeposits) {
    throw new Error(`Perk-Effekte fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.awardedNightCoin || !result.awardedOnce || !result.perkPanelVisible || !result.loaded || !result.persisted) throw new Error(`Perk-UI, Coin oder Save/Load fehlerhaft: ${JSON.stringify(result)}`);
  console.log("OK perks-construction", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
