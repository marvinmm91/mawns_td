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
    const centerX = state.ship.x + Math.floor(state.ship.size / 2);
    const centerY = state.ship.y + state.ship.size + 2;
    const slots = PW.Tiles.circleTiles(centerX, centerY, 8).filter((tile) => PW.BuildingSystem.canPlaceBuilding("palisade", tile.x, tile.y)).slice(0, 6);
    const [first, second, third, fourth, fifth, sixth] = slots;
    state.inventory.wood = 0;
    const plannedWithoutResources = PW.BuildingSystem.placeBlueprint("palisade", first.x, first.y);
    const duplicateRejected = !PW.BuildingSystem.placeBlueprint("palisade", first.x, first.y);
    const nonBlocking = PW.BuildingSystem.canPlaceBuilding("palisade", first.x, first.y);
    const firstIndexed = PW.SpatialIndex.visible("blueprints", { minX: first.x, maxX: first.x, minY: first.y, maxY: first.y }).length === 1;
    state.inventory.wood = 999;
    const builtSingle = PW.BuildingSystem.buildBlueprint(PW.Tiles.getBlueprint(first.x, first.y).id);
    const singleCleared = !PW.Tiles.getBlueprint(first.x, first.y) && Boolean(PW.Tiles.getBuilding(first.x, first.y));
    state.player.selectedTool = "build";
    state.player.buildMode = "build";
    PW.Input.handleHotkey("control");
    const controlToggles = state.player.buildMode === "blueprint" && PW.Input.buildAction() === "blueprint";
    const controlPlans = controlToggles && PW.Input.applyBlueprintAction(PW.Input.buildAction(), second.x, second.y);
    const source = PW.Tiles.tileCenter(second.x - 1, second.y);
    state.player.x = source.x;
    state.player.y = source.y;
    state.player.dirX = 1;
    state.player.dirY = 0;
    PW.Input.handleHotkey("alt");
    const altErases = !PW.Tiles.getBlueprint(second.x, second.y);
    const modeStaysBlueprint = PW.Input.buildAction() === "blueprint";
    const replanned = PW.BuildingSystem.placeBlueprint("palisade", third.x, third.y);
    state.inspectedTile = { x: third.x, y: third.y };
    state.panel = "context";
    PW.UI.renderPanel();
    const contextStatusOnly = state.dom.panelTitle.textContent.includes("Blaupause") && !Array.from(state.dom.panelBody.querySelectorAll("button")).some((button) => /Errichten|Entfernen/.test(button.textContent));
    PW.Save.save(false);
    const loaded = PW.Save.load(false);
    const restored = PW.Tiles.getBlueprint(third.x, third.y);
    const restoredState = PW.state;
    const batchOne = PW.BuildingSystem.placeBlueprint("palisade", fourth.x, fourth.y);
    const batchTwo = PW.BuildingSystem.placeBlueprint("palisade", fifth.x, fifth.y);
    const batchBlueprints = [PW.Tiles.getBlueprint(third.x, third.y), PW.Tiles.getBlueprint(fourth.x, fourth.y), PW.Tiles.getBlueprint(fifth.x, fifth.y)];
    const batchCost = PW.BuildingSystem.blueprintBatchCost(batchBlueprints);
    Object.entries(batchCost).forEach(([resourceId, amount]) => { restoredState.inventory[resourceId] = amount; });
    restoredState.player.x = PW.Tiles.tileCenter(restoredState.ship.x, restoredState.ship.y).x;
    restoredState.player.y = PW.Tiles.tileCenter(restoredState.ship.x, restoredState.ship.y).y;
    const builtBatch = PW.BuildingSystem.buildAllBlueprints();
    const batchBuildings = batchBlueprints.map((blueprint) => Boolean(PW.Tiles.getBuilding(blueprint.x, blueprint.y)));
    const batchInventorySpent = Object.entries(batchCost).every(([resourceId]) => restoredState.inventory[resourceId] === 0);
    const batchBuilt = builtBatch === batchBlueprints.length && batchBuildings.every(Boolean) && batchInventorySpent;
    const blockedBlueprint = PW.BuildingSystem.placeBlueprint("palisade", sixth.x, sixth.y);
    const blockedCost = PW.BuildingSystem.blueprintBatchCost();
    Object.entries(blockedCost).forEach(([resourceId, amount]) => { restoredState.inventory[resourceId] = Math.max(0, amount - 1); });
    const blockedBuild = PW.BuildingSystem.buildAllBlueprints();
    const noPartialBatch = blockedBuild === 0 && Boolean(PW.Tiles.getBlueprint(sixth.x, sixth.y)) && !PW.Tiles.getBuilding(sixth.x, sixth.y);
    return { plannedWithoutResources, duplicateRejected, nonBlocking, firstIndexed, builtSingle, singleCleared, controlToggles, controlPlans, altErases, modeStaysBlueprint, replanned, contextStatusOnly, loaded, restored: Boolean(restored), restoredType: restored && restored.type, restoredMode: PW.state.player.buildMode, batchOne, batchTwo, batchCost, builtBatch, batchBuildings, batchInventorySpent, batchBuilt, blockedBlueprint, blockedBuild, noPartialBatch };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!result.plannedWithoutResources || !result.duplicateRejected || !result.nonBlocking || !result.firstIndexed || !result.builtSingle || !result.singleCleared) {
    throw new Error(`Blaupausen-Grundlogik fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.controlToggles || !result.controlPlans || !result.altErases || !result.modeStaysBlueprint || !result.replanned || !result.contextStatusOnly) {
    throw new Error(`Blaupausenbedienung fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.loaded || !result.restored || result.restoredType !== "palisade" || result.restoredMode !== "blueprint") {
    throw new Error(`Blaupause oder Modus wurde nicht gespeichert: ${JSON.stringify(result)}`);
  }
  if (!result.batchOne || !result.batchTwo || result.batchCost.wood !== 22 || !result.batchBuilt || !result.blockedBlueprint || !result.noPartialBatch) {
    throw new Error(`Blaupausen-Sammelbau fehlerhaft: ${JSON.stringify(result)}`);
  }
  console.log("OK blueprints");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
