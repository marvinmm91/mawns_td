"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const url = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
  await page.goto(url);
  await page.evaluate(() => localStorage.removeItem(PW.CONFIG.saveKey));
  await page.reload();
  await page.locator("#dialogActions button").last().click();
  await page.keyboard.press("B");

  const refreshed = await page.evaluate(() => {
    PW.state.inventory.wood = 0;
    PW.UI.renderPanel();
    const before = Array.from(document.querySelectorAll(".build-card")).find((card) => card.textContent.includes("Palisade")).querySelector(".cost-chip").style.getPropertyValue("--fill");
    PW.Utils.addInventory("wood", 3);
    const after = Array.from(document.querySelectorAll(".build-card")).find((card) => card.textContent.includes("Palisade")).querySelector(".cost-chip").style.getPropertyValue("--fill");
    return { before, after, panel: PW.state.panel };
  });

  if (refreshed.panel !== "build" || refreshed.before !== "0%" || refreshed.after !== "50%") {
    throw new Error(`Baumenue aktualisiert Inventar nicht live: ${JSON.stringify(refreshed)}`);
  }

  await browser.close();
  console.log("OK panel inventory refresh");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
