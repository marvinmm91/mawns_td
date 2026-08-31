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

  const result = await page.evaluate(() => {
    PW.state = PW.createInitialState();
    const state = PW.state;
    const ts = state.world.tileSize;
    const tower = { id: "tower", type: "ballista", x: 24, y: 24, hp: 90, maxHp: 90, level: 1, cooldown: 0 };
    const towerCenter = PW.Tiles.tileCenter(tower.x, tower.y);
    const makeEnemy = (id, type, x, y) => ({ id, type, x, y, hp: 500, maxHp: 500, slowFactor: 1, slowTimer: 0, retreating: false });
    state.world.buildings = [tower];
    state.world.buildingMap = new Map([[PW.Utils.tileKey(tower.x, tower.y), tower]]);
    state.enemies = [
      makeEnemy("in-range", "crawler", towerCenter.x + ts * 3, towerCenter.y),
      makeEnemy("out-of-range", "crawler", towerCenter.x + ts * 11, towerCenter.y)
    ];
    PW.SpatialIndex.reset();
    PW.SpatialIndex.rebuildStatic();
    PW.SpatialIndex.rebuild("enemies");

    const selected = PW.Combat.findTarget(tower, PW.BUILDINGS.ballista);
    const directLookup = PW.SpatialIndex.byId("enemies", "in-range");
    const nearbyEnemies = PW.SpatialIndex.nearby("enemies", towerCenter.x, towerCenter.y, ts * 4).map((enemy) => enemy.id);

    const disruptor = makeEnemy("disruptor", "disruptor", towerCenter.x + (PW.ENEMIES.disruptor.aura * ts) - 1, towerCenter.y);
    state.enemies = [disruptor];
    const disruptionNear = PW.Combat.disruptionAt(tower.x, tower.y);
    state.enemies = [makeEnemy("far-disruptor", "disruptor", towerCenter.x + (PW.ENEMIES.disruptor.aura * ts) + ts * 2, towerCenter.y)];
    const disruptionFar = PW.Combat.disruptionAt(tower.x, tower.y);

    const splashTarget = makeEnemy("splash-target", "crawler", towerCenter.x, towerCenter.y);
    const splashNearby = makeEnemy("splash-nearby", "crawler", towerCenter.x + ts, towerCenter.y);
    const splashAir = makeEnemy("splash-air", "drone", towerCenter.x + ts, towerCenter.y);
    const splashFar = makeEnemy("splash-far", "crawler", towerCenter.x + ts * 3, towerCenter.y);
    state.enemies = [splashTarget, splashNearby, splashAir, splashFar];
    PW.ProjectileSystem.hit({ sourceType: "catapult", damage: 100, splash: 1.25, color: "#fff" }, splashTarget);
    const splash = {
      target: splashTarget.hp,
      nearby: splashNearby.hp,
      air: splashAir.hp,
      far: splashFar.hp
    };

    const trackedTarget = makeEnemy("tracked", "crawler", towerCenter.x + ts * 3, towerCenter.y);
    state.enemies = [trackedTarget];
    PW.ProjectileSystem.spawn(tower, trackedTarget, PW.BUILDINGS.ballista);
    const projectile = state.projectiles[0];
    PW.ProjectileSystem.update(0.05);
    const projectileTracked = state.projectiles.length === 1 && projectile.x > towerCenter.x;

    const camp = { x: towerCenter.x, y: towerCenter.y, aggroPx: ts * 4 };
    const farBuilding = { id: "far-wall", type: "palisade", x: tower.x + 12, y: tower.y, hp: 70, maxHp: 70 };
    state.world.buildings = [tower, farBuilding];
    state.world.buildingMap = new Map([
      [PW.Utils.tileKey(tower.x, tower.y), tower],
      [PW.Utils.tileKey(farBuilding.x, farBuilding.y), farBuilding]
    ]);
    PW.SpatialIndex.rebuildStatic();
    const campTarget = PW.EnemySystem.findCampBuildingTarget(trackedTarget, camp);

    return {
      selected: selected && selected.id,
      directLookup: directLookup && directLookup.id,
      nearbyEnemies,
      disruptionNear,
      disruptionFar,
      splash,
      projectileTracked,
      campTarget: campTarget && campTarget.id
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.selected !== "in-range" || result.directLookup !== "in-range" || result.nearbyEnemies.join(",") !== "in-range") {
    throw new Error(`Turmziel oder Gegnerindex fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.disruptionNear || result.disruptionFar) throw new Error(`Stoerfeld fehlerhaft: ${JSON.stringify(result)}`);
  if (result.splash.target !== 400 || result.splash.nearby !== 438 || result.splash.air !== 500 || result.splash.far !== 500) {
    throw new Error(`Flaechenschaden fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.projectileTracked || result.campTarget !== "tower") throw new Error(`Projektil oder Hordenangriff fehlerhaft: ${JSON.stringify(result)}`);
  console.log("OK combat queries");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
