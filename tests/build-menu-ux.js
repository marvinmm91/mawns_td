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
    state.inventory.wood = 10;
    state.inventory.stone = 0;
    state.gameMode = "aggressive";
    state.unlockedBuildings.delete("stoneWall");
    state.world.blueprints = [
      { id: "test-palisade", type: "palisade", x: 1, y: 1 },
      { id: "test-ballista", type: "ballista", x: 2, y: 1 }
    ];
    state.world.buildings = [{
      id: "test-ballista-building",
      type: "ballista",
      x: 3,
      y: 3,
      hp: 90,
      maxHp: 90,
      level: 1,
      cooldown: 0
    }];
    state.panel = "build";
    PW.UI.renderPanel();

    const body = state.dom.panelBody;
    const blueprintCard = Array.from(body.querySelectorAll(".build-card"))
      .find((card) => card.querySelector("h3")?.textContent === "Blaupausen");
    const blueprintText = blueprintCard?.textContent || "";
    const totalCosts = Array.from(blueprintCard?.querySelectorAll(".cost-chip") || [])
      .map((chip) => chip.lastElementChild.textContent);
    const stoneWallCard = Array.from(body.querySelectorAll(".build-card"))
      .find((card) => card.querySelector("h3")?.textContent.includes("Steinmauer"));
    const lockedText = stoneWallCard?.textContent || "";
    const upgradeButton = Array.from(body.querySelectorAll(".upgrade-row button"))
      .find((button) => button.textContent.includes("Balliste"));
    upgradeButton.dispatchEvent(new MouseEvent("mouseenter"));
    const hoveredId = state.hoveredUpgradeBuildingId;
    upgradeButton.dispatchEvent(new MouseEvent("mouseleave"));

    return {
      blueprintText,
      totalCosts,
      lockedText,
      hoveredId,
      clearedHover: state.hoveredUpgradeBuildingId
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!result.blueprintText.includes("Gesamtbedarf für alle Blaupausen") || !result.totalCosts.includes("Holz (10/24)") || !result.totalCosts.includes("Stein (0/5)")) {
    throw new Error(`Blaupausen-Gesamtbedarf fehlt: ${JSON.stringify(result)}`);
  }
  if (!result.lockedText.includes("Freischaltung: ab Nacht 1.")) {
    throw new Error(`Freischaltbedingung fehlt: ${JSON.stringify(result)}`);
  }
  if (result.hoveredId !== "test-ballista-building" || result.clearedHover !== null) {
    throw new Error(`Upgrade-Hervorhebung reagiert nicht korrekt: ${JSON.stringify(result)}`);
  }
  console.log("OK build menu UX");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
