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
    Object.assign(state.inventory, { wood: 999, stone: 999, iron: 999, gold: 999, crystal: 999, scrap: 999, parts: 999 });
    state.gameMode = "aggressive";
    state.player.selectedTool = "build";
    state.player.buildMode = "build";
    const available = Object.values(PW.BUILDINGS).filter((def) => PW.GameModes.allowsBuilding(def.id) && state.unlockedBuildings.has(def.id));
    state.selectedBuild = available[0].id;
    PW.Input.handleHotkey("4");
    const repeatedFourCycles = state.selectedBuild === available[1].id;
    PW.Input.handleHotkey("control");
    const controlTogglesBlueprints = state.player.buildMode === "blueprint";

    const tile = PW.Tiles.circleTiles(state.ship.x, state.ship.y + state.ship.size + 5, 8).find(({ x, y }) => PW.Tiles.canBuildAt(x, y) && PW.Tiles.canBuildAt(x - 1, y));
    const source = PW.Tiles.tileCenter(tile.x - 1, tile.y);
    state.player.x = source.x;
    state.player.y = source.y;
    state.player.dirX = 1;
    state.player.dirY = 0;
    const blueprintPlanned = PW.BuildingSystem.placeBlueprint("palisade", tile.x, tile.y);
    PW.Input.handleHotkey("alt");
    const altOnlyErasesBlueprints = blueprintPlanned && !PW.Tiles.getBlueprint(tile.x, tile.y) && state.player.buildMode === "blueprint";
    state.player.buildMode = "build";
    const placed = PW.BuildingSystem.place("ballista", tile.x, tile.y);
    const building = PW.Tiles.getBuilding(tile.x, tile.y);
    state.player.selectedTool = "repair";
    state.player.actionCooldown = 0;
    PW.Player.tryInteract();
    const upgradedWhenIntact = building.level === 2;
    building.hp = 10;
    state.player.actionCooldown = 0;
    PW.Player.tryInteract();
    const repairsBeforeFurtherUpgrade = building.level === 2 && building.hp > 10 && building.hp < building.maxHp;
    const damagedUpgradeRejected = !PW.BuildingSystem.upgrade(building.id);

    const rect = state.canvas.getBoundingClientRect();
    const clientX = rect.left + (tile.x * state.world.tileSize + state.world.tileSize / 2 - state.camera.x) / state.camera.w * rect.width;
    const clientY = rect.top + (tile.y * state.world.tileSize + state.world.tileSize / 2 - state.camera.y) / state.camera.h * rect.height;
    state.canvas.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX, clientY }));
    const towerOpensStatus = state.panel === "context" && state.inspectedTile?.x === tile.x && state.inspectedTile?.y === tile.y;
    state.canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 1 }));
    const wheelCyclesTool = state.player.selectedTool === "build" && state.toolFeedback.id === "build";
    return { repeatedFourCycles, controlTogglesBlueprints, altOnlyErasesBlueprints, placed, upgradedWhenIntact, repairsBeforeFurtherUpgrade, damagedUpgradeRejected, towerOpensStatus, wheelCyclesTool };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!Object.values(result).every(Boolean)) throw new Error(`Interaktionssteuerung fehlerhaft: ${JSON.stringify(result)}`);
  console.log("OK interaction controls");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
