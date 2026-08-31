"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(pathToFileURL(path.join(__dirname, "..", "index.html")).href);
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(400);

  const result = await page.evaluate(() => {
    function tick(seconds) {
      const step = 0.1;
      for (let t = 0; t < seconds; t += step) {
        PW.DayNight.update(step);
        PW.Pathfinding.update();
        PW.Spawning.update(step);
        PW.EnemySystem.update(step);
        PW.Combat.update(step);
        PW.ProjectileSystem.update(step);
        PW.DropSystem.update(step);
        PW.RenderEffects.update(step);
        if (PW.state.gameOver || PW.state.victory) break;
      }
    }

    Object.assign(PW.state.inventory, { wood: 5000, stone: 5000, iron: 5000, gold: 5000, crystal: 5000, scrap: 5000, parts: 5000 });
    ["palisade", "stoneWall", "steelWall", "ballista", "catapult", "flak", "tesla", "laser"].forEach((id) => PW.state.unlockedBuildings.add(id));

    const ship = PW.state.ship;
    for (let y = ship.y - 1; y <= ship.y + ship.size; y++) {
      for (let x = ship.x - 1; x <= ship.x + ship.size; x++) {
        const border = x === ship.x - 1 || x === ship.x + ship.size || y === ship.y - 1 || y === ship.y + ship.size;
        if (!border) continue;
        PW.state.selectedBuild = "steelWall";
        PW.BuildingSystem.placeSelected(x, y);
      }
    }
    const placements = [
      ["ballista", ship.x - 2, ship.y], ["ballista", ship.x + ship.size + 1, ship.y],
      ["flak", ship.x, ship.y - 2], ["flak", ship.x, ship.y + ship.size + 1],
      ["catapult", ship.x - 2, ship.y + ship.size], ["tesla", ship.x + ship.size + 1, ship.y + ship.size],
      ["laser", ship.x + 2, ship.y - 3], ["laser", ship.x + 2, ship.y + ship.size + 2],
      ["laser", ship.x - 3, ship.y + 2], ["flak", ship.x + ship.size + 2, ship.y + 2]
    ];
    placements.forEach(([type, x, y]) => {
      PW.state.selectedBuild = type;
      PW.BuildingSystem.placeSelected(x, y);
    });

    for (let n = 0; n < 4; n++) {
      PW.DayNight.beginNight(false);
      tick(50);
      PW.DayNight.beginDawn();
      PW.UI.hideMorningReport();
      PW.DayNight.beginDay();
      PW.state.ship.hp = PW.state.ship.maxHp;
    }

    PW.state.phase.night = 10;
    PW.state.knownResources = new Set(["wood", "stone", "iron", "gold", "crystal", "scrap", "parts"]);
    Object.keys(PW.SHIP_MODULES).forEach((id) => PW.Progression.repairModule(id));
    PW.state.ship.hp = PW.state.ship.maxHp;
    const canLaunch = PW.Progression.canStartLaunch();
    PW.Progression.startLaunch();
    tick(130);

    return {
      gameOver: PW.state.gameOver,
      victory: PW.state.victory,
      canLaunch,
      modules: PW.Progression.repairedModuleCount(),
      buildings: PW.state.world.buildings.length,
      drift: PW.state.balance.drift,
      hp: PW.state.ship.hp,
      enemies: PW.state.enemies.length
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.gameOver) throw new Error(`Langlauf verlor unerwartet: ${JSON.stringify(result)}`);
  if (!result.canLaunch || result.modules !== 5) throw new Error(`Startbedingungen fehlerhaft: ${JSON.stringify(result)}`);
  if (!result.victory) throw new Error(`Startsequenz endete nicht mit Sieg: ${JSON.stringify(result)}`);
  if (result.buildings < 6) throw new Error(`Bauwerke fehlen im Langlauf: ${JSON.stringify(result)}`);
  console.log("OK endurance", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
