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
    const resource = state.world.resources[0];
    const chest = state.world.treasureChests.find((item) => !item.opened);
    const camp = state.world.monsterCamps.find((item) => !item.cleared);
    const bridge = state.world.tiles.find((tile) => PW.Tiles.isWaterTile(tile.x, tile.y));
    if (!resource || !chest || !camp || !bridge) throw new Error("Testziele fuer Kartennadeln fehlen.");
    const targets = [
      { kind: "resource", x: resource.x, y: resource.y },
      { kind: "chest", x: chest.x, y: chest.y },
      { kind: "camp", x: camp.tileX, y: camp.tileY },
      { kind: "bridge", x: bridge.x, y: bridge.y }
    ];
    targets.forEach((target) => { state.world.fog[PW.Tiles.idx(target.x, target.y)] = 2; });
    const pinResults = targets.map((target) => PW.MapPins.toggleAt(target.x, target.y));
    state.inspectedTile = { x: resource.x, y: resource.y };
    state.panel = "context";
    PW.UI.renderPanel();
    const contextHasPinAction = Array.from(state.dom.panelBody.querySelectorAll("button")).some((button) => button.textContent === "Nadel entfernen");
    PW.Save.save(false);
    state.world.mapPins = [];
    state.world.mapPinMap.clear();
    const loaded = PW.Save.load(false);
    const loadedState = PW.state;
    const restoredKinds = loadedState.world.mapPins.map((pin) => pin.kind).sort();
    const chestPin = loadedState.world.mapPins.find((pin) => pin.kind === "chest");
    PW.Tiles.getChest(chestPin.x, chestPin.y).opened = true;
    PW.MapPins.update();
    const staleChestRemoved = !PW.MapPins.get(chestPin.x, chestPin.y);
    loadedState.world.fog.fill(2);
    const nearby = PW.EnemySystem.spawn("drone", loadedState.player.x + 72, loadedState.player.y);
    PW.DropSystem.spawn("wood", 1, loadedState.player.x + 44, loadedState.player.y + 18);
    PW.Render.draw();
    const canvas = loadedState.canvas;
    const pixels = canvas.getContext("2d").getImageData(0, 0, Math.min(canvas.width, 320), Math.min(canvas.height, 220)).data;
    let painted = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] || pixels[i + 1] || pixels[i + 2]) painted++;
    }
    return {
      pinResults,
      contextHasPinAction,
      loaded,
      restoredKinds,
      staleChestRemoved,
      mapPinMethods: ["drawMapPins", "drawStateCorners"].every((method) => typeof PW.RenderWorld[method] === "function")
        && typeof PW.RenderEntities.drawStateCorners === "function",
      enemyPresent: loadedState.enemies.includes(nearby),
      painted
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.pinResults.some((value) => !value) || !result.contextHasPinAction || !result.loaded) {
    throw new Error(`Kartennadeln konnten nicht gesetzt, angezeigt oder geladen werden: ${JSON.stringify(result)}`);
  }
  if (JSON.stringify(result.restoredKinds) !== JSON.stringify(["bridge", "camp", "chest", "resource"])) {
    throw new Error(`Kartennadeln wurden nicht vollstaendig gespeichert: ${JSON.stringify(result)}`);
  }
  if (!result.staleChestRemoved || !result.mapPinMethods || !result.enemyPresent || result.painted < 500) {
    throw new Error(`Renderer oder Bereinigung der Kartennadeln fehlerhaft: ${JSON.stringify(result)}`);
  }
  console.log("OK map pins and visuals");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
