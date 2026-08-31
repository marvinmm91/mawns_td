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

  const result = await page.evaluate(async () => {
    const state = PW.state;
    PW.Performance.setEnabled(true);
    const towerTiles = [];
    const centerX = state.ship.x + Math.floor(state.ship.size / 2);
    const centerY = state.ship.y + Math.floor(state.ship.size / 2);
    for (let radius = 5; radius <= 12 && towerTiles.length < 72; radius++) {
      for (let y = centerY - radius; y <= centerY + radius && towerTiles.length < 72; y++) {
        for (let x = centerX - radius; x <= centerX + radius && towerTiles.length < 72; x++) {
          if (Math.max(Math.abs(x - centerX), Math.abs(y - centerY)) !== radius) continue;
          if (PW.Tiles.canBuildAt(x, y)) towerTiles.push({ x, y });
        }
      }
    }
    towerTiles.forEach((tile, index) => {
      const type = ["ballista", "catapult", "flak", "tesla", "laser"][index % 5];
      const def = PW.BUILDINGS[type];
      const building = { id: `stress-tower-${index}`, type, x: tile.x, y: tile.y, hp: def.maxHp, maxHp: def.maxHp, cooldown: 0, level: 2 };
      state.world.buildings.push(building);
      state.world.buildingMap.set(PW.Utils.tileKey(tile.x, tile.y), building);
    });
    for (let index = 0; index < 360; index++) {
      const angle = index * 2.399963229728653;
      const radius = 120 + (index % 18) * 13;
      const type = ["crawler", "swarm", "armored", "drone", "bomber"][index % 5];
      PW.EnemySystem.spawn(type, (centerX * state.world.tileSize) + Math.cos(angle) * radius, (centerY * state.world.tileSize) + Math.sin(angle) * radius);
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    const overlay = document.getElementById("gameCanvas").getContext("2d").getImageData(11, 11, 218, 92).data;
    let overlayPixels = 0;
    for (let index = 0; index < overlay.length; index += 4) {
      if (overlay[index] || overlay[index + 1] || overlay[index + 2]) overlayPixels++;
    }
    return {
      profile: PW.Performance.snapshot(),
      towers: towerTiles.length,
      enemies: state.enemies.length,
      overlayPixels
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.towers < 45 || result.enemies < 300) throw new Error(`Stressszene unvollstaendig: ${JSON.stringify(result)}`);
  if (!result.profile.enabled || result.profile.frames < 20 || !Number.isFinite(result.profile.fps) || result.profile.fps <= 0) {
    throw new Error(`Leistungsmessung fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!Number.isFinite(result.profile.updateMs) || !Number.isFinite(result.profile.renderMs) || result.overlayPixels < 300) {
    throw new Error(`Leistungsanzeige fehlt: ${JSON.stringify(result)}`);
  }
  console.log("OK performance stress", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
