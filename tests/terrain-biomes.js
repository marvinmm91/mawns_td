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
    const counts = PW.state.world.tiles.reduce((acc, tile) => {
      acc[tile.kind] = (acc[tile.kind] || 0) + 1;
      if (tile.ford) acc.ford = (acc.ford || 0) + 1;
      return acc;
    }, {});
    const riverLength = (PW.state.world.waterways.river || []).length;
    const brookCount = (PW.state.world.waterways.brooks || []).length;
    const bridgeWater = PW.state.world.tiles.find((tile) => tile.kind === "water" && !PW.Tiles.getBuilding(tile.x, tile.y));
    const normalGround = PW.state.world.tiles.find((tile) => tile.kind === "soil" && PW.Tiles.canBuildAt(tile.x, tile.y));
    Object.assign(PW.state.inventory, { wood: 999, stone: 999 });
    const bridgeRejectedOnGround = normalGround ? !PW.BuildingSystem.canPlaceBuilding("bridge", normalGround.x, normalGround.y) : false;
    const towerRejectedOnWater = bridgeWater ? !PW.BuildingSystem.canPlaceBuilding("ballista", bridgeWater.x, bridgeWater.y) : false;
    PW.state.selectedBuild = "bridge";
    const bridgePlaced = bridgeWater ? PW.BuildingSystem.placeSelected(bridgeWater.x, bridgeWater.y) : false;
    const bridge = bridgeWater ? PW.Tiles.getBuilding(bridgeWater.x, bridgeWater.y) : null;
    const bridgePassable = bridgeWater ? !PW.Tiles.isBlockedForGround(bridgeWater.x, bridgeWater.y) && !PW.Tiles.isBlockedForPlayer(bridgeWater.x, bridgeWater.y) : false;
    const fordPassable = PW.state.world.tiles.filter((tile) => tile.ford).every((tile) => !PW.Tiles.isBlockedForGround(tile.x, tile.y));
    return {
      width: PW.state.world.width,
      height: PW.state.world.height,
      counts,
      riverLength,
      brookCount,
      bridgePlaced,
      bridgeType: bridge && bridge.type,
      bridgePassable,
      bridgeRejectedOnGround,
      towerRejectedOnWater,
      fordPassable
    };
  });

  if (result.width !== 144 || result.height !== 144) {
    throw new Error(`Kartengroesse falsch: ${JSON.stringify(result)}`);
  }
  if (result.riverLength < 100 || result.brookCount < 1 || result.brookCount > 2) {
    throw new Error(`Wasserwege fehlen: ${JSON.stringify(result)}`);
  }
  if ((result.counts.water || 0) < 80 || (result.counts.shallowWater || 0) < 50 || (result.counts.ford || 0) < 8) {
    throw new Error(`Zu wenig Wasser/Furten: ${JSON.stringify(result)}`);
  }
  if ((result.counts.forestFloor || 0) < 100 || (result.counts.wetland || 0) < 100) {
    throw new Error(`Biome fehlen: ${JSON.stringify(result)}`);
  }
  if (!result.bridgePlaced || result.bridgeType !== "bridge" || !result.bridgePassable) {
    throw new Error(`Bruecke funktioniert nicht: ${JSON.stringify(result)}`);
  }
  if (!result.bridgeRejectedOnGround || !result.towerRejectedOnWater || !result.fordPassable) {
    throw new Error(`Bau-/Furtregeln fehlerhaft: ${JSON.stringify(result)}`);
  }

  await browser.close();
  console.log("OK terrain biomes");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
