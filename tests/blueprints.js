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
    const slots = PW.Tiles.circleTiles(centerX, centerY, 8).filter((tile) => PW.BuildingSystem.canPlaceBuilding("palisade", tile.x, tile.y)).slice(0, 4);
    const [first, second, third, fourth] = slots;
    const reserved = new Set(slots.map((tile) => PW.Utils.tileKey(tile.x, tile.y)));
    const lineStart = PW.Tiles.circleTiles(centerX, centerY, 9).find((tile) => [0, 1, 2].every((offset) => {
      const key = PW.Utils.tileKey(tile.x + offset, tile.y);
      return !reserved.has(key) && PW.BuildingSystem.canPlaceBuilding("palisade", tile.x + offset, tile.y);
    }));
    state.inventory.wood = 0;
    const plannedWithoutResources = PW.BuildingSystem.placeBlueprint("palisade", first.x, first.y);
    const duplicateRejected = !PW.BuildingSystem.placeBlueprint("palisade", first.x, first.y);
    const nonBlocking = PW.BuildingSystem.canPlaceBuilding("palisade", first.x, first.y);
    const firstIndexed = PW.SpatialIndex.visible("blueprints", { minX: first.x, maxX: first.x, minY: first.y, maxY: first.y }).length === 1;
    state.inventory.wood = 999;
    const builtSingle = PW.BuildingSystem.buildBlueprint(PW.Tiles.getBlueprint(first.x, first.y).id);
    const singleCleared = !PW.Tiles.getBlueprint(first.x, first.y) && Boolean(PW.Tiles.getBuilding(first.x, first.y));
    PW.BuildingSystem.placeBlueprint("palisade", second.x, second.y);
    PW.BuildingSystem.placeBlueprint("palisade", third.x, third.y);
    state.player.selectedTool = "build";
    state.input.blueprintPainting = true;
    state.input.blueprintPaintAction = "blueprint";
    state.input.blueprintPaintTile = { x: lineStart.x, y: lineStart.y };
    PW.BuildingSystem.placeBlueprintSelected(lineStart.x, lineStart.y, true);
    state.mouse.tileX = lineStart.x + 2;
    state.mouse.tileY = lineStart.y;
    PW.Input.placeBlueprintWhileDragging();
    const linePlanned = [0, 1, 2].every((offset) => Boolean(PW.Tiles.getBlueprint(lineStart.x + offset, lineStart.y)));
    state.input.blueprintPainting = false;
    state.input.blueprintPaintAction = null;
    const builtAll = PW.BuildingSystem.buildAllBlueprints();
    const allCleared = !PW.Tiles.getBlueprint(second.x, second.y) && !PW.Tiles.getBlueprint(third.x, third.y) && [0, 1, 2].every((offset) => !PW.Tiles.getBlueprint(lineStart.x + offset, lineStart.y));
    state.input.keys.add("control");
    const controlPlans = PW.Input.buildAction() === "blueprint" && PW.Input.applyBlueprintAction(PW.Input.buildAction(), fourth.x, fourth.y);
    state.input.keys.add("alt");
    const altErases = PW.Input.buildAction() === "eraseBlueprint" && PW.Input.applyBlueprintAction(PW.Input.buildAction(), fourth.x, fourth.y);
    state.input.keys.clear();
    const replanned = PW.BuildingSystem.placeBlueprint("palisade", fourth.x, fourth.y);
    const rect = state.canvas.getBoundingClientRect();
    PW.Input.updateMouse({ clientX: rect.left + rect.width * 0.25, clientY: rect.top + rect.height * 0.75 });
    const mouseTracksCanvas = Math.abs(state.mouse.x - state.camera.w * 0.25) < 0.01 && Math.abs(state.mouse.y - state.camera.h * 0.75) < 0.01;
    state.inspectedTile = { x: fourth.x, y: fourth.y };
    state.panel = "context";
    PW.UI.renderPanel();
    const contextVisible = PW.state.dom.panelTitle.textContent.includes("Blaupause") && PW.state.dom.panelBody.textContent.includes("Errichten");
    PW.Save.save(false);
    const loaded = PW.Save.load(false);
    const restored = PW.Tiles.getBlueprint(fourth.x, fourth.y);
    return {
      plannedWithoutResources,
      duplicateRejected,
      nonBlocking,
      firstIndexed,
      builtSingle,
      singleCleared,
      builtAll,
      allCleared,
      linePlanned,
      controlPlans,
      altErases,
      replanned,
      mouseTracksCanvas,
      contextVisible,
      loaded,
      restored: Boolean(restored),
      restoredType: restored && restored.type
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!result.plannedWithoutResources || !result.duplicateRejected || !result.nonBlocking || !result.firstIndexed) {
    throw new Error(`Blaupause konnte nicht korrekt geplant werden: ${JSON.stringify(result)}`);
  }
  if (!result.builtSingle || !result.singleCleared || result.builtAll !== 5 || !result.allCleared || !result.linePlanned || !result.controlPlans || !result.altErases || !result.replanned || !result.mouseTracksCanvas) {
    throw new Error(`Blaupausen wurden nicht korrekt errichtet: ${JSON.stringify(result)}`);
  }
  if (!result.contextVisible || !result.loaded || !result.restored || result.restoredType !== "palisade") {
    throw new Error(`Blaupause fehlt im Kontext oder Speicherstand: ${JSON.stringify(result)}`);
  }
  console.log("OK blueprints");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
