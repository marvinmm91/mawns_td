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

  await page.evaluate(() => {
    const state = PW.state;
    const ts = state.world.tileSize;
    state.paused = true;
    state.enemies = [{ id: "map-test-enemy", x: 10 * ts, y: 10 * ts, hp: 1, maxHp: 1 }];
  });
  await page.keyboard.press("m");
  const mapResult = await page.evaluate(() => {
    const state = PW.state;
    PW.TacticalMap.render(true);
    const canvas = state.dom.tacticalMapCanvas;
    const pixel = canvas.getContext("2d").getImageData(10, 10, 1, 1).data;
    return {
      open: state.tacticalMapOpen,
      visible: !state.dom.tacticalMap.classList.contains("hidden"),
      dimensions: [canvas.width, canvas.height],
      redEnemy: pixel[0] === 227 && pixel[1] === 93 && pixel[2] === 87
    };
  });
  await page.getByRole("button", { name: "Karte schließen" }).click();

  const result = await page.evaluate(() => {
    const state = PW.state;
    const node = state.world.resources.find((resource) => resource.type === "tree");
    node.amount = 5;
    node.maxHp = 2;
    node.hp = 2;
    node.yielded = 0;
    state.inventory.wood = 0;
    state.player.selectedTool = "axe";
    PW.ResourceSystem.interactWithTarget(node.x, node.y);
    const firstHit = { wood: state.inventory.wood, hp: node.hp, yielded: node.yielded };
    PW.ResourceSystem.interactWithTarget(node.x, node.y);
    const secondHit = { wood: state.inventory.wood, removed: !PW.Tiles.getResource(node.x, node.y) };

    state.effects = [];
    for (let index = 0; index < PW.CONFIG.effects.maxActive + 20; index++) {
      PW.Utils.addEffect("hit", state.player.x, state.player.y, "#fff", 1, 1);
    }
    const capped = state.effects.length;
    state.effects = [{
      type: "hit",
      x: state.camera.x + state.camera.w + PW.CONFIG.effects.cullPadding + 1,
      y: state.camera.y,
      color: "#fff",
      life: 1,
      maxLife: 1,
      size: 1
    }];
    PW.RenderEffects.update(0.01);
    return {
      firstHit,
      secondHit,
      capped,
      effectLimit: PW.CONFIG.effects.maxActive,
      offscreenRemoved: state.effects.length === 0,
      mapClosed: !state.tacticalMapOpen && state.dom.tacticalMap.classList.contains("hidden")
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!mapResult.open || !mapResult.visible || mapResult.dimensions[0] !== 144 || mapResult.dimensions[1] !== 144 || !mapResult.redEnemy) {
    throw new Error(`Live-Karte nicht korrekt gerendert: ${JSON.stringify(mapResult)}`);
  }
  if (result.firstHit.wood !== 2 || result.firstHit.hp !== 1 || result.firstHit.yielded !== 2 || result.secondHit.wood !== 5 || !result.secondHit.removed) {
    throw new Error(`Teil-Ertrag der Ressource fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (result.capped !== result.effectLimit || !result.offscreenRemoved || !result.mapClosed) {
    throw new Error(`Effektbegrenzung oder Kartensteuerung fehlerhaft: ${JSON.stringify(result)}`);
  }
  console.log("OK map, resources and effects");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
