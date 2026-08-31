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
    const towerIds = Object.values(PW.BUILDINGS)
      .filter((def) => def.category === "tower")
      .map((def) => def.id);
    const allUnlocked = towerIds.every((id) => PW.state.unlockedBuildings.has(id));
    const noResourceKnowledgeRequired = towerIds.every((id) => {
      const def = PW.BUILDINGS[id];
      return !def.requiresKnown && !(def.unlockNight > 0);
    });
    return {
      towerIds,
      allUnlocked,
      noResourceKnowledgeRequired,
      night: PW.state.phase.night,
      knownResources: Array.from(PW.state.knownResources)
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!result.allUnlocked || !result.noResourceKnowledgeRequired || result.night !== 0) {
    throw new Error(`Tuerme sind nicht vollstaendig von Beginn an verfuegbar: ${JSON.stringify(result)}`);
  }
  console.log("OK tower availability", JSON.stringify(result));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
