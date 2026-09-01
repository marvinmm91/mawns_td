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
    const setup = (walls = []) => {
      PW.state = PW.createInitialState();
      const state = PW.state;
      state.world.width = 16;
      state.world.height = 16;
      state.world.tiles = [];
      state.world.resources = [];
      state.world.resourceMap = new Map();
      state.world.treasureChests = [];
      state.world.monsterCamps = [];
      state.world.outposts = [];
      state.world.outpostMap = new Map();
      state.world.buildings = [];
      state.world.buildingMap = new Map();
      state.ship = { x: 10, y: 7, size: 2, hp: 500, maxHp: 500 };
      for (let y = 0; y < state.world.height; y++) {
        for (let x = 0; x < state.world.width; x++) state.world.tiles.push({ x, y, kind: "grass", blocked: false });
      }
      walls.forEach(({ x, y, type = "palisade" }) => {
        const def = PW.BUILDINGS[type];
        const building = { id: `${type}-${x}-${y}`, type, x, y, hp: def.maxHp, maxHp: def.maxHp, level: 1 };
        state.world.buildings.push(building);
        state.world.buildingMap.set(PW.Utils.tileKey(x, y), building);
      });
      PW.Pathfinding.markDirty();
      return { x: PW.Tiles.tileCenter(6, 8).x, y: PW.Tiles.tileCenter(6, 8).y };
    };
    const summarize = (enemy) => {
      const info = PW.Pathfinding.routeInfoFor(enemy);
      return {
        hasPath: info.hasPath,
        pathStep: info.pathStep && { x: PW.Utils.worldToTile(info.pathStep.x), y: PW.Utils.worldToTile(info.pathStep.y) },
        breakthroughStep: info.breakthroughStep && { x: PW.Utils.worldToTile(info.breakthroughStep.x), y: PW.Utils.worldToTile(info.breakthroughStep.y) },
        blockadeTarget: info.blockadeTarget && info.blockadeTarget.id,
        directTarget: info.directTarget && info.directTarget.id
      };
    };

    const open = summarize(setup());
    const alternate = summarize(setup([{ x: 7, y: 8 }]));
    const blocked = summarize(setup(Array.from({ length: 16 }, (_, y) => ({ x: 7, y }))));
    return { open, alternate, blocked };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!result.open.hasPath || result.open.blockadeTarget || result.open.directTarget || !result.open.pathStep) {
    throw new Error(`Freier Weg fehlerhaft: ${JSON.stringify(result.open)}`);
  }
  if (!result.alternate.hasPath || result.alternate.blockadeTarget || result.alternate.directTarget !== "palisade-7-8") {
    throw new Error(`Direktes Strukturziel fehlerhaft: ${JSON.stringify(result.alternate)}`);
  }
  if (result.blocked.hasPath || result.blocked.blockadeTarget !== "palisade-7-8" || result.blocked.directTarget !== "palisade-7-8") {
    throw new Error(`Blockadeziel fehlerhaft: ${JSON.stringify(result.blocked)}`);
  }
  console.log("OK mode route targets", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
