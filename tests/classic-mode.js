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
    const setup = (walls) => {
      PW.state = PW.createInitialState();
      const state = PW.state;
      state.gameMode = "classic";
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
      walls.forEach(({ x, y }) => {
        const def = PW.BUILDINGS.palisade;
        const building = { id: `wall-${x}-${y}`, type: "palisade", x, y, hp: def.maxHp, maxHp: def.maxHp, level: 1 };
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
    const def = PW.ENEMIES.crawler;

    const alternateEnemy = setup([{ x: 7, y: 8 }]);
    const alternateWall = PW.Tiles.getBuilding(7, 8);
    const alternateStart = { x: alternateEnemy.x, y: alternateEnemy.y };
    PW.EnemySystem.updateAttack(alternateEnemy, 0.4);
    const alternate = {
      hp: alternateWall.hp,
      moved: Math.hypot(alternateEnemy.x - alternateStart.x, alternateEnemy.y - alternateStart.y),
      movedAround: alternateEnemy.y !== alternateStart.y
    };

    const blockedEnemy = setup(Array.from({ length: 16 }, (_, y) => ({ x: 7, y })));
    const blockedWall = PW.Tiles.getBuilding(7, 8);
    PW.EnemySystem.updateAttack(blockedEnemy, 0.2);
    for (let step = 0; step < 6; step++) {
      PW.EnemySystem.updateAttack(blockedEnemy, 0.2);
    }
    const routeAfterBreak = PW.Pathfinding.routeInfoFor(blockedEnemy).hasPath;
    const blocked = {
      hp: blockedWall.hp,
      expectedDamage: def.wallDamage * PW.GameModes.profile("classic").breakthroughDamageMultiplier * PW.GameModes.profile("classic").enemyDamageMultiplier,
      shipHp: PW.state.ship.hp,
      routeAfterBreak,
      crossedBreak: PW.Utils.worldToTile(blockedEnemy.x) >= 7,
      gapBlocked: PW.Tiles.isBlockedForGround(7, 8),
      wallDestroyed: !PW.Tiles.getBuilding(7, 8)
    };

    const openGapEnemy = setup(Array.from({ length: 16 }, (_, y) => y === 8 ? null : ({ x: 7, y })).filter(Boolean));
    const openGapHasPath = PW.Pathfinding.routeInfoFor(openGapEnemy).hasPath;

    const airEnemy = setup([{ x: 7, y: 8 }]);
    airEnemy.type = "drone";
    airEnemy.attackCooldown = 0;
    const airWall = PW.Tiles.getBuilding(7, 8);
    PW.EnemySystem.updateAttack(airEnemy, 0.2);
    return { alternate, blocked, openGapHasPath, airWallHp: airWall.hp };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.alternate.hp !== 70 || !result.alternate.moved || !result.alternate.movedAround) {
    throw new Error(`Classic ignoriert Alternativweg nicht: ${JSON.stringify(result.alternate)}`);
  }
  if (!result.openGapHasPath || Math.abs(result.blocked.hp - Math.max(0, 70 - result.blocked.expectedDamage)) > 0.001 || result.blocked.shipHp !== 500 || !result.blocked.wallDestroyed || !result.blocked.crossedBreak || !result.blocked.routeAfterBreak) {
    throw new Error(`Classic-Blockadeschaden fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (result.airWallHp !== 70) throw new Error(`Luftgegner greifen im Classic Mode eine Mauer an: ${result.airWallHp}`);
  console.log("OK classic mode", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
