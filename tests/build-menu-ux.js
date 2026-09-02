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
    const emptyBuildTile = state.world.tiles.find((tile) => PW.Tiles.canBuildAt(tile.x, tile.y));
    PW.UI.inspectTile(emptyBuildTile.x, emptyBuildTile.y);
    const emptyTileOpensContext = state.panel === "context" && state.dom.panelTitle.textContent === "Kachel";
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
    state.world.buildingMap = new Map([[PW.Utils.tileKey(3, 3), state.world.buildings[0]]]);
    state.world.blueprintMap = new Map([[PW.Utils.tileKey(1, 1), state.world.blueprints[0]], [PW.Utils.tileKey(2, 1), state.world.blueprints[1]]]);
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
    const batchBuild = Array.from(blueprintCard?.querySelectorAll("button") || []).find((button) => button.textContent.includes("Alle errichten"));
    const batchBuildCorrect = blueprintText.includes("20 % höhere Baukosten") && batchBuild?.textContent === "Alle errichten (+20 %)" && batchBuild.disabled;
    const noUpgradeList = !body.textContent.includes("Upgrades");
    state.inspectedTile = { x: 3, y: 3 };
    state.panel = "context";
    PW.UI.renderPanel();
    const buildingButtons = Array.from(state.dom.panelBody.querySelectorAll("button")).map((button) => button.textContent);
    const statusOnlyBuilding = !buildingButtons.some((label) => /Reparieren|Upgrade|Abreissen/.test(label));

    return {
      blueprintText,
      totalCosts,
      lockedText,
      batchBuildCorrect,
      noUpgradeList,
      statusOnlyBuilding,
      emptyTileOpensContext
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (!result.blueprintText.includes("Einzelbau: Gesamtbedarf") || !result.totalCosts.includes("Holz (10/24)") || !result.totalCosts.includes("Stein (0/5)") || !result.totalCosts.includes("Holz (10/29)") || !result.totalCosts.includes("Stein (0/6)")) {
    throw new Error(`Blaupausen-Gesamtbedarf fehlt: ${JSON.stringify(result)}`);
  }
  if (!result.lockedText.includes("Freischaltung: ab Nacht 1.")) {
    throw new Error(`Freischaltbedingung fehlt: ${JSON.stringify(result)}`);
  }
  if (!result.batchBuildCorrect || !result.noUpgradeList || !result.statusOnlyBuilding) {
    throw new Error(`Baumenue oder Baukontext bietet unzulaessige Aktionen: ${JSON.stringify(result)}`);
  }
  if (!result.emptyTileOpensContext) {
    throw new Error(`Leere Kachel oeffnet nicht den reinen Kachelstatus: ${JSON.stringify(result)}`);
  }
  console.log("OK build menu UX");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
