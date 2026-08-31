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
    const activeChests = PW.state.world.treasureChests.filter((chest) => !chest.opened);
    const activeCamps = PW.state.world.monsterCamps.filter((camp) => !camp.cleared);
    const carriersByCamp = activeCamps.map((camp) => PW.state.enemies.filter((enemy) => enemy.campId === camp.id && enemy.campKeyCarrier).length);
    const chest = activeChests[0];
    const chestBlocksBuild = chest ? !PW.Tiles.canBuildAt(chest.x, chest.y) : false;
    const beforeRewards = { ...PW.state.inventory };
    PW.state.inventory.key = 1;
    const opened = PW.TreasureSystem.openChestAt(chest.x, chest.y);
    const rewardGain = Object.entries(chest.rewards).reduce((sum, [id, amount]) => sum + Math.max(0, (PW.state.inventory[id] || 0) - (beforeRewards[id] || 0) >= amount ? amount : 0), 0);

    const camp = activeCamps[0];
    const carrier = PW.state.enemies.find((enemy) => enemy.campId === camp.id && enemy.campKeyCarrier);
    PW.state.drops = [];
    PW.DropSystem.spawnForEnemy(carrier);
    const keyDrops = PW.state.drops.filter((drop) => drop.resource === "key").length;

    Object.assign(PW.state.inventory, { wood: 999, stone: 999, iron: 999, scrap: 999, gold: 999, crystal: 999, parts: 999 });
    let buildTile = null;
    for (let y = camp.tileY - 5; y <= camp.tileY + 5 && !buildTile; y++) {
      for (let x = camp.tileX - 5; x <= camp.tileX + 5; x++) {
        if (!PW.Tiles.canBuildAt(x, y)) continue;
        const dist = PW.Utils.distance(camp.x, camp.y, PW.Utils.tileToWorld(x), PW.Utils.tileToWorld(y));
        if (dist > camp.aggroPx) continue;
        buildTile = { x, y };
        break;
      }
    }
    PW.state.selectedBuild = "ballista";
    const placed = buildTile ? PW.BuildingSystem.placeSelected(buildTile.x, buildTile.y) : false;
    const building = buildTile ? PW.Tiles.getBuilding(buildTile.x, buildTile.y) : null;
    const attacker = PW.state.enemies.find((enemy) => enemy.campId === camp.id);
    if (attacker && building) {
      attacker.x = PW.Utils.tileToWorld(building.x) - 20;
      attacker.y = PW.Utils.tileToWorld(building.y);
      attacker.attackCooldown = 0;
      PW.EnemySystem.updateCamp(attacker, PW.ENEMIES[attacker.type], 0.1);
    }

    return {
      activeChestCount: activeChests.length,
      activeCampCount: activeCamps.length,
      carriersByCamp,
      chestBlocksBuild,
      opened,
      keyAfterOpen: PW.state.inventory.key,
      rewardGain,
      keyDrops,
      placed,
      buildingHpAfterAttack: building ? building.hp : null,
      buildingMaxHp: building ? building.maxHp : null
    };
  });

  if (result.activeChestCount < 1 || result.activeChestCount > 2) {
    throw new Error(`Truhenanzahl falsch: ${JSON.stringify(result)}`);
  }
  if (result.activeCampCount < 5) {
    throw new Error(`Zu wenige Horden: ${JSON.stringify(result)}`);
  }
  if (result.carriersByCamp.some((count) => count !== 1)) {
    throw new Error(`Nicht genau ein Schluesseltraeger pro Horde: ${JSON.stringify(result)}`);
  }
  if (!result.chestBlocksBuild || !result.opened || result.keyAfterOpen !== 0 || result.rewardGain <= 0) {
    throw new Error(`Truheninteraktion fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (result.keyDrops !== 1) {
    throw new Error(`Schluesseldrop fehlerhaft: ${JSON.stringify(result)}`);
  }
  if (!result.placed || !(result.buildingHpAfterAttack < result.buildingMaxHp)) {
    throw new Error(`Camp-Gegner greifen Bauwerk nicht an: ${JSON.stringify(result)}`);
  }

  await browser.close();
  console.log("OK treasure camps");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
