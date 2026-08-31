"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const url = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
  await page.goto(url);

  const result = await page.evaluate(() => {
    PW.state = PW.createInitialState();
    PW.state.inventory.scrap = 0;
    PW.state.player.x = 100;
    PW.state.player.y = 100;
    PW.state.drops = [{
      id: "test-drop",
      resource: "scrap",
      amount: 3,
      x: 154,
      y: 100,
      life: 999
    }];
    for (let i = 0; i < 20; i++) PW.DropSystem.update(0.05);
    return {
      scrap: PW.state.inventory.scrap,
      drops: PW.state.drops.length
    };
  });

  if (result.scrap !== 3 || result.drops !== 0) {
    throw new Error(`Drop-Magnet sammelt nicht ein: ${JSON.stringify(result)}`);
  }

  await browser.close();
  console.log("OK drop magnet");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
