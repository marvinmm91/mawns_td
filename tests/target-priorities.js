"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname, "..", "index.html")).href);
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(200);

  const result = await page.evaluate(() => {
    const state = PW.state;
    const tower = { id: "priority-tower", type: "laser", x: state.ship.x - 7, y: state.ship.y + 2, hp: 120, maxHp: 120, level: 1, cooldown: 0, targetPriority: "ship" };
    const center = PW.Tiles.tileCenter(tower.x, tower.y);
    const makeEnemy = (id, type, tileX, tileY) => {
      const point = PW.Tiles.tileCenter(tileX, tileY);
      const def = PW.ENEMIES[type];
      return { id, type, x: point.x, y: point.y, hp: def.hp, maxHp: def.hp, slowFactor: 1, slowTimer: 0, retreating: false };
    };
    const nearest = makeEnemy("nearest", "crawler", tower.x + 1, tower.y);
    const last = makeEnemy("last", "crawler", tower.x - 2, tower.y);
    const strongest = makeEnemy("strongest", "guardian", tower.x + 2, tower.y);
    const breaker = makeEnemy("breaker", "breaker", tower.x + 3, tower.y);
    const air = makeEnemy("air", "drone", tower.x + 4, tower.y);
    const shipNear = makeEnemy("ship-near", "crawler", state.ship.x, state.ship.y + 2);
    state.world.buildings = [tower];
    state.world.buildingMap = new Map([[PW.Utils.tileKey(tower.x, tower.y), tower]]);
    state.enemies = [nearest, last, strongest, breaker, air, shipNear];
    PW.SpatialIndex.reset();
    PW.SpatialIndex.rebuildStatic();
    PW.SpatialIndex.rebuild("enemies");
    state.inspectedTile = { x: tower.x, y: tower.y };
    state.panel = "context";
    PW.UI.renderPanel();
    const contextOptions = Array.from(document.querySelectorAll('select[aria-label="Zielpriorität"] option')).map((option) => option.value);
    const select = (priority) => {
      PW.BuildingSystem.setTargetPriority(tower.id, priority);
      return PW.Combat.findTarget(tower, PW.BUILDINGS.laser).id;
    };
    const targets = {
      ship: select("ship"),
      nearest: select("nearest"),
      last: select("last"),
      strongest: select("strongest"),
      breaker: select("breaker"),
      air: select("air")
    };
    const invalidRejected = !PW.BuildingSystem.setTargetPriority(tower.id, "invalid");
    PW.BuildingSystem.setTargetPriority(tower.id, "air");
    PW.Save.save(false);
    const loaded = PW.Save.load(false);
    const restored = PW.state.world.buildings.find((building) => building.id === tower.id);
    return {
      targets,
      invalidRejected,
      loaded,
      restoredPriority: restored && restored.targetPriority,
      options: PW.Combat.targetPriorityOptions(restored, PW.BUILDINGS.laser).map((option) => option.id),
      contextOptions
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  const expected = { ship: "ship-near", nearest: "nearest", last: "last", strongest: "strongest", breaker: "breaker", air: "air" };
  if (JSON.stringify(result.targets) !== JSON.stringify(expected)) throw new Error(`Zielprioritaeten fehlerhaft: ${JSON.stringify(result)}`);
  if (!result.invalidRejected || !result.loaded || result.restoredPriority !== "air" || result.options.join(",") !== "ship,nearest,last,strongest,breaker,air" || result.contextOptions.join(",") !== "ship,nearest,last,strongest,breaker,air") {
    throw new Error(`Prioritaeten nicht korrekt gespeichert oder angeboten: ${JSON.stringify(result)}`);
  }
  console.log("OK target priorities");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
