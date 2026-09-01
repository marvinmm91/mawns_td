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
    const dom = PW.state.dom;
    const canvas = PW.state.canvas;
    const ctx = PW.state.ctx;
    const setup = (gaps, wallType = "palisade") => {
      PW.state = PW.createInitialState();
      const state = PW.state;
      state.dom = dom;
      state.canvas = canvas;
      state.ctx = ctx;
      state.gameMode = "classic";
      state.world.width = 20;
      state.world.height = 20;
      state.world.tiles = [];
      state.world.resources = [];
      state.world.resourceMap = new Map();
      state.world.treasureChests = [];
      state.world.monsterCamps = [];
      state.world.outposts = [];
      state.world.outpostMap = new Map();
      state.world.buildings = [];
      state.world.buildingMap = new Map();
      state.world.blueprints = [];
      state.world.blueprintMap = new Map();
      state.ship = { x: 14, y: 9, size: 2, hp: 500, maxHp: 500, damageFlash: 0 };
      state.unlockedBuildings = new Set(["palisade", "stoneWall", "steelWall", "ballista"]);
      for (let y = 0; y < state.world.height; y++) {
        for (let x = 0; x < state.world.width; x++) state.world.tiles.push({ x, y, kind: "grass", blocked: false });
      }
      for (let y = 0; y < state.world.height; y++) {
        if (gaps.includes(y)) continue;
        const def = PW.BUILDINGS[wallType];
        const wall = { id: `${wallType}-10-${y}`, type: wallType, x: 10, y, hp: def.maxHp, maxHp: def.maxHp, level: 1 };
        state.world.buildings.push(wall);
        state.world.buildingMap.set(PW.Utils.tileKey(wall.x, wall.y), wall);
      }
      PW.Pathfinding.markDirty();
      return state;
    };

    setup([10]);
    const blockedStatus = PW.BuildingSystem.placementStatus("palisade", 10, 10);

    setup([10], "ballista");
    const blockedTowerStatus = PW.BuildingSystem.placementStatus("ballista", 10, 10);

    setup([10, 11]);
    const firstBlueprint = PW.BuildingSystem.placeBlueprint("palisade", 10, 10);
    const secondBlueprint = PW.BuildingSystem.placeBlueprint("palisade", 10, 11);

    setup([10, 11], "ballista");
    const firstTowerBlueprint = PW.BuildingSystem.placeBlueprint("ballista", 10, 10);
    const secondTowerBlueprint = PW.BuildingSystem.placeBlueprint("ballista", 10, 11);

    const state = PW.state;
    PW.Progression.refreshUnlocks();
    PW.UI.renderBuild(state.dom.panelBody);
    const classicBuildText = state.dom.panelBody.textContent;
    PW.UI.showHelp();
    const classicHelpText = state.dom.dialogBody.textContent;
    state.gameMode = "aggressive";
    PW.UI.renderBuild(state.dom.panelBody);
    const aggressiveBuildText = state.dom.panelBody.textContent;
    PW.UI.showHelp();
    const aggressiveHelpText = state.dom.dialogBody.textContent;

    return {
      blockedStatus,
      blockedTowerStatus,
      firstBlueprint,
      secondBlueprint,
      firstTowerBlueprint,
      secondTowerBlueprint,
      classicBuildText,
      classicHelpText,
      aggressiveBuildText,
      aggressiveHelpText,
      selectedBuild: state.selectedBuild
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.blockedStatus.ok || result.blockedStatus.reason !== "route") {
    throw new Error(`Classic laesst eine vollstaendige Wegsperre zu: ${JSON.stringify(result.blockedStatus)}`);
  }
  if (result.blockedTowerStatus.ok || result.blockedTowerStatus.reason !== "route") {
    throw new Error(`Classic laesst eine Turm-Wegsperre zu: ${JSON.stringify(result.blockedTowerStatus)}`);
  }
  if (!result.firstBlueprint || result.secondBlueprint) {
    throw new Error(`Blaupausen sichern den kuenftigen Weg nicht: ${JSON.stringify(result)}`);
  }
  if (!result.firstTowerBlueprint || result.secondTowerBlueprint) {
    throw new Error(`Turm-Blaupausen sichern den kuenftigen Weg nicht: ${JSON.stringify(result)}`);
  }
  if (/Steinmauer|Stahlmauer/.test(result.classicBuildText) || /Steinmauer|Stahlmauer/.test(result.classicHelpText) || result.selectedBuild !== "palisade") {
    throw new Error(`Classic zeigt oder waehlt gesperrte Mauern: ${JSON.stringify(result)}`);
  }
  if (!/Steinmauer/.test(result.aggressiveBuildText) || !/Stahlmauer/.test(result.aggressiveHelpText)) {
    throw new Error(`Aggressive verliert verfuegbare Mauern: ${JSON.stringify(result)}`);
  }
  console.log("OK classic route guard", JSON.stringify({ blockedStatus: result.blockedStatus, blockedTowerStatus: result.blockedTowerStatus, firstBlueprint: result.firstBlueprint, secondBlueprint: result.secondBlueprint, firstTowerBlueprint: result.firstTowerBlueprint, secondTowerBlueprint: result.secondTowerBlueprint }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
