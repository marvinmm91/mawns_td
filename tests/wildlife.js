"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const url = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
  await page.goto(url);
  await page.evaluate(() => {
    PW.Save.suppressBeforeUnload = true;
    localStorage.removeItem(PW.CONFIG.saveKey);
  });
  await page.reload();
  await page.locator("#dialogActions button").last().click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const birds = PW.state.world.birds || [];
    const wildlife = PW.state.world.wildlife || [];
    const types = Array.from(new Set(wildlife.map((critter) => critter.type)));
    const catalogIds = PW.PixelArt.catalog.map((asset) => asset.id);
    const critter = wildlife[0];
    const beforeDrops = PW.state.drops.length;
    let killed = false;
    let drops = [];
    if (critter) {
      const tileX = PW.Utils.worldToTile(critter.x);
      const tileY = PW.Utils.worldToTile(critter.y);
      PW.state.player.selectedTool = "axe";
      for (let i = 0; i < 5 && !critter.remove; i++) {
        PW.WildlifeSystem.attackAt(tileX, tileY);
      }
      killed = critter.remove === true;
      drops = PW.state.drops.slice(beforeDrops).map((drop) => drop.resource);
    }
    return {
      birdCount: birds.length,
      birdHasHitbox: birds.some((bird) => Number.isFinite(bird.radius)),
      wildlifeCount: wildlife.length,
      types,
      hasBirdAsset: catalogIds.includes("bird.small"),
      hasForestHopperAsset: catalogIds.includes("wildlife.forestHopper"),
      hasMossBeetleAsset: catalogIds.includes("wildlife.mossBeetle"),
      killed,
      drops
    };
  });

  if (result.birdCount < 18 || result.birdHasHitbox) {
    throw new Error(`Vogelpopulation/Hitbox falsch: ${JSON.stringify(result)}`);
  }
  if (result.wildlifeCount < 18 || !result.types.includes("forestHopper") || !result.types.includes("mossBeetle")) {
    throw new Error(`Waldbewohner fehlen: ${JSON.stringify(result)}`);
  }
  if (!result.hasBirdAsset || !result.hasForestHopperAsset || !result.hasMossBeetleAsset) {
    throw new Error(`Pixel-Art-Katalog unvollstaendig: ${JSON.stringify(result)}`);
  }
  if (!result.killed || result.drops.length < 1) {
    throw new Error(`Waldbewohner-Beute fehlt: ${JSON.stringify(result)}`);
  }

  await browser.close();
  console.log("OK wildlife");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
