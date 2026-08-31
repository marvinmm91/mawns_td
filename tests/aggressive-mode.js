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
    const setup = (buildings) => {
      PW.state = PW.createInitialState();
      const state = PW.state;
      state.gameMode = "aggressive";
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
      state.ship = { x: 10, y: 7, size: 2, hp: 500, maxHp: 500, damageFlash: 0 };
      for (let y = 0; y < state.world.height; y++) {
        for (let x = 0; x < state.world.width; x++) state.world.tiles.push({ x, y, kind: "grass", blocked: false });
      }
      buildings.forEach(({ x, y, type = "palisade" }) => {
        const def = PW.BUILDINGS[type];
        const building = { id: `${type}-${x}-${y}`, type, x, y, hp: def.maxHp, maxHp: def.maxHp, level: 1 };
        state.world.buildings.push(building);
        state.world.buildingMap.set(PW.Utils.tileKey(x, y), building);
      });
      PW.Pathfinding.markDirty();
      return {
        type: "crawler",
        x: PW.Tiles.tileCenter(6, 8).x,
        y: PW.Tiles.tileCenter(6, 8).y,
        speed: PW.ENEMIES.crawler.speed,
        attackCooldown: 0,
        slowFactor: 1,
        slowTimer: 0,
        retreating: false
      };
    };
    const attackFor = (enemy, steps = 6) => {
      for (let step = 0; step < steps; step++) PW.EnemySystem.updateAttack(enemy, 0.2);
    };

    const directEnemy = setup([{ x: 7, y: 8 }]);
    const direct = PW.Tiles.getBuilding(7, 8);
    attackFor(directEnemy);

    const sideEnemy = setup([{ x: 6, y: 7 }]);
    const side = PW.Tiles.getBuilding(6, 7);
    attackFor(sideEnemy, 2);

    const towerEnemy = setup([{ x: 7, y: 8, type: "ballista" }]);
    const tower = PW.Tiles.getBuilding(7, 8);
    attackFor(towerEnemy);

    const blockedEnemy = setup(Array.from({ length: 16 }, (_, y) => ({ x: 7, y })));
    const blocked = PW.Tiles.getBuilding(7, 8);
    attackFor(blockedEnemy);

    return {
      directHp: direct.hp,
      sideHp: side.hp,
      towerHp: tower.hp,
      blockedHp: blocked.hp,
      shipHp: PW.state.ship.hp
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.directHp !== 58 || result.towerHp !== 78 || result.blockedHp !== 58) {
    throw new Error(`Direkte Strukturziele werden nicht korrekt angegriffen: ${JSON.stringify(result)}`);
  }
  if (result.sideHp !== 70 || result.shipHp !== 500) throw new Error(`Seitliches Ziel oder Wrackfokus fehlerhaft: ${JSON.stringify(result)}`);
  console.log("OK aggressive mode", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
