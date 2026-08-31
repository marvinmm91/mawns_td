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
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const state = PW.state;
    const outposts = state.world.outposts;
    const byType = Object.fromEntries(outposts.map((outpost) => [outpost.type, outpost]));
    if (!byType.cache || !byType.research || !byType.beacon) throw new Error("Nicht alle Aussenpostenvarianten wurden erzeugt.");
    const placementValid = outposts.every((outpost) => {
      const tile = PW.Tiles.get(outpost.x, outpost.y);
      return tile && !PW.Tiles.isWaterKind(tile.kind) && !PW.Tiles.getResource(outpost.x, outpost.y)
        && !PW.Tiles.getChest(outpost.x, outpost.y) && !PW.Tiles.getCamp(outpost.x, outpost.y);
    });
    const indexed = PW.SpatialIndex.visible("outposts", {
      minX: 0, maxX: state.world.width - 1, minY: 0, maxY: state.world.height - 1
    }).length === outposts.length;
    state.inspectedTile = { x: byType.cache.x, y: byType.cache.y };
    state.panel = "context";
    PW.UI.renderPanel();
    const panelVisible = state.dom.panelTitle.textContent === "Versorgungslager"
      && state.dom.panelBody.textContent.includes("Untersuchen");
    const woodBefore = state.inventory.wood;
    const cacheClaimed = PW.OutpostSystem.interactAt(byType.cache.x, byType.cache.y) && byType.cache.status === "claimed";
    const researchClaimed = PW.OutpostSystem.interactAt(byType.research.x, byType.research.y)
      && byType.research.status === "claimed" && Boolean(byType.research.unlockedBuilding);
    const beaconActivated = PW.OutpostSystem.interactAt(byType.beacon.x, byType.beacon.y)
      && byType.beacon.status === "active";
    const guards = state.enemies.filter((enemy) => enemy.outpostId === byType.beacon.id);
    const guardsStayLocal = guards.length >= 3 && guards.every((enemy) => !enemy.retreating && Math.hypot(
      enemy.x - PW.Utils.tileToWorld(byType.beacon.x), enemy.y - PW.Utils.tileToWorld(byType.beacon.y)
    ) <= 48);
    guards.forEach((enemy) => PW.EnemySystem.damage(enemy, enemy.hp + 1, "test"));
    const beaconClaimed = byType.beacon.status === "claimed";

    Object.assign(state.inventory, { wood: 999, stone: 999, scrap: 999 });
    const buildTile = PW.Tiles.circleTiles(state.ship.x - 4, state.ship.y, 5)
      .find((tile) => PW.BuildingSystem.canPlaceBuilding("palisade", tile.x, tile.y));
    if (!buildTile) throw new Error("Kein Feld fuer Schadenspruefung gefunden.");
    const built = PW.BuildingSystem.place("palisade", buildTile.x, buildTile.y);
    const building = PW.Tiles.getBuilding(buildTile.x, buildTile.y);
    const attacker = { x: PW.Utils.tileToWorld(buildTile.x), y: PW.Utils.tileToWorld(buildTile.y), attackCooldown: 0 };
    const buildingHpBefore = building.hp;
    PW.EnemySystem.attackBuilding(attacker, PW.ENEMIES.crawler, building, 100);
    const buildingDamaged = building.hp < buildingHpBefore && building.damageFlash > 0;
    const shipAttacker = { x: PW.EnemySystem.shipCenter().x, y: PW.EnemySystem.shipCenter().y, attackCooldown: 0 };
    const shipHpBefore = state.ship.hp;
    PW.EnemySystem.attackShipIfClose(shipAttacker, PW.ENEMIES.crawler);
    const shipDamaged = state.ship.hp < shipHpBefore && state.ship.damageFlash > 0;
    PW.DamageVisuals.update(1);
    building.hp = building.maxHp;
    state.ship.hp = state.ship.maxHp;
    const damageCleared = building.damageFlash === 0 && state.ship.damageFlash === 0;

    state.world.fog.fill(2);
    PW.Render.draw();
    const canvas = state.canvas;
    const pixels = canvas.getContext("2d").getImageData(0, 0, Math.min(320, canvas.width), Math.min(220, canvas.height)).data;
    let painted = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] || pixels[i + 1] || pixels[i + 2]) painted++;
    }
    PW.Save.save(false);
    const loaded = PW.Save.load(false);
    const loadedState = PW.state;
    const restored = loadedState.world.outposts.map((outpost) => `${outpost.type}:${outpost.status}`).sort();
    return {
      outpostCount: outposts.length,
      placementValid,
      indexed,
      panelVisible,
      cacheClaimed,
      cacheRewarded: state.inventory.wood > woodBefore,
      researchClaimed,
      beaconActivated,
      guardsStayLocal,
      beaconClaimed,
      built,
      buildingDamaged,
      shipDamaged,
      damageCleared,
      loaded,
      restored,
      pixelAssets: ["cache", "research", "beacon"].every((type) => Boolean(PW.PixelArt.assetDef(`world.outpost.${type}`))),
      renderer: typeof PW.RenderWorld.drawOutposts === "function" && typeof PW.RenderWorld.drawStructureDamage === "function",
      painted
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.outpostCount !== 3 || !result.placementValid || !result.indexed || !result.panelVisible) {
    throw new Error(`Aussenpostenplatzierung oder Kontext fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.cacheClaimed || !result.cacheRewarded || !result.researchClaimed || !result.beaconActivated || !result.guardsStayLocal || !result.beaconClaimed) {
    throw new Error(`Aussenposteninteraktion fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.built || !result.buildingDamaged || !result.shipDamaged || !result.damageCleared) {
    throw new Error(`Schadenszustand oder Reparaturzustand fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.loaded || JSON.stringify(result.restored) !== JSON.stringify(["beacon:claimed", "cache:claimed", "research:claimed"]) || !result.pixelAssets || !result.renderer || result.painted < 500) {
    throw new Error(`Save/Load oder Rendering fehlerhaft: ${JSON.stringify(result)}`);
  }
  console.log("OK outposts and damage");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
