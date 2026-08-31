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
  await page.waitForTimeout(250);

  const result = await page.evaluate(() => {
    const state = PW.state;
    const bounds = PW.Camera.visibleTileBounds(1);
    const manualResources = state.world.resources.filter((node) => node.x >= bounds.minX && node.x <= bounds.maxX && node.y >= bounds.minY && node.y <= bounds.maxY).map((node) => node.id).sort();
    const indexedResources = PW.SpatialIndex.visible("resources", bounds).map((node) => node.id).sort();
    const free = PW.Tiles.circleTiles(PW.Utils.worldToTile(state.player.x), PW.Utils.worldToTile(state.player.y), 5).find((tile) => PW.Tiles.canBuildAt(tile.x, tile.y));
    Object.assign(state.inventory, { wood: 999 });
    state.selectedBuild = "palisade";
    const built = free ? PW.BuildingSystem.placeSelected(free.x, free.y) : false;
    const building = free ? PW.Tiles.getBuilding(free.x, free.y) : null;
    PW.DropSystem.spawn("wood", 1, state.player.x + 12, state.player.y);
    PW.DropSystem.spawn("stone", 1, state.player.x + state.world.width * state.world.tileSize, state.player.y);
    const woodDrop = state.drops.find((drop) => drop.resource === "wood");
    const startTile = PW.Utils.worldToTile(woodDrop.x);
    const startBounds = { minX: startTile - 1, maxX: startTile + 1, minY: PW.Utils.worldToTile(woodDrop.y) - 1, maxY: PW.Utils.worldToTile(woodDrop.y) + 1 };
    const movedTile = startTile + PW.SpatialIndex.cellSize + 2;
    woodDrop.x = PW.Utils.tileToWorld(movedTile);
    PW.SpatialIndex.update("drops", woodDrop);
    const movedBounds = { minX: movedTile - 1, maxX: movedTile + 1, minY: startBounds.minY, maxY: startBounds.maxY };
    const dropMovedOut = !PW.SpatialIndex.visible("drops", startBounds).includes(woodDrop);
    const dropMovedIn = PW.SpatialIndex.visible("drops", movedBounds).includes(woodDrop);
    const replacementDrop = { ...woodDrop, id: "replacement-drop" };
    state.drops = state.drops.map((drop) => drop === woodDrop ? replacementDrop : drop);
    const replacementVisible = PW.SpatialIndex.visible("drops", movedBounds).includes(replacementDrop);
    const drops = PW.SpatialIndex.visible("drops", bounds).map((drop) => drop.resource);
    const buildingVisible = building ? PW.SpatialIndex.visible("buildings", bounds).includes(building) : false;
    PW.Save.save(false);
    const loaded = PW.Save.load(false);
    const rebuiltResources = PW.SpatialIndex.visible("resources", PW.Camera.visibleTileBounds(1)).length;
    return {
      manualResources,
      indexedResources,
      built,
      buildingVisible,
      drops,
      dropMovedOut,
      dropMovedIn,
      replacementVisible,
      loaded,
      rebuiltResources,
      resourceCount: state.world.resources.length,
      stats: PW.SpatialIndex.stats()
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (JSON.stringify(result.manualResources) !== JSON.stringify(result.indexedResources)) throw new Error(`Ressourcenindex weicht ab: ${JSON.stringify(result)}`);
  if (!result.built || !result.buildingVisible || !result.drops.includes("wood") || result.drops.includes("stone") || !result.dropMovedOut || !result.dropMovedIn || !result.replacementVisible) {
    throw new Error(`Sichtbarer Objektindex fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.loaded || result.rebuiltResources < 1 || result.stats.cellSize !== 8) throw new Error(`Index nach Laden fehlerhaft: ${JSON.stringify(result)}`);
  console.log("OK spatial index", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
