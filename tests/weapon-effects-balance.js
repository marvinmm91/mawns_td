"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

function totalCost(cost) {
  return Object.values(cost).reduce((sum, amount) => sum + amount, 0);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const url = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
  await page.goto(url);

  const result = await page.evaluate(() => {
    PW.state = PW.createInitialState();
    const towerIds = Object.values(PW.BUILDINGS).filter((def) => def.category === "tower").map((def) => def.id);
    const upgradeRows = towerIds.map((id) => {
      const def = PW.BUILDINGS[id];
      const level1 = { type: id, level: 1 };
      const level2 = { type: id, level: 2 };
      const cost2 = PW.BuildingSystem.upgradeCost(level1);
      const cost3 = PW.BuildingSystem.upgradeCost(level2);
      const dps1 = def.damage * def.rate;
      const dps2 = def.damage * 1.35 * def.rate * 1.18;
      const dps3 = def.damage * 1.7 * def.rate * 1.36;
      return {
        id,
        baseCost: Object.values(def.cost).reduce((sum, amount) => sum + amount, 0),
        cost2: Object.values(cost2).reduce((sum, amount) => sum + amount, 0),
        cost3: Object.values(cost3).reduce((sum, amount) => sum + amount, 0),
        gain2: (dps2 - dps1) / dps1,
        gain3: (dps3 - dps2) / dps1
      };
    });

    const target = { id: "enemy", type: "crawler", x: 140, y: 100, hp: 999, maxHp: 999, slowFactor: 1, slowTimer: 0 };
    const effects = {};
    [
      ["catapult", { splash: 1.25, slow: 0 }],
      ["flak", { splash: 0, slow: 0 }],
      ["tesla", { splash: 0, slow: 0.45, slowTime: 1.4 }],
      ["laser", { splash: 0, slow: 0 }],
      ["ballista", { splash: 0, slow: 0 }]
    ].forEach(([sourceType, extra]) => {
      PW.state.effects = [];
      PW.state.enemies = [target];
      PW.ProjectileSystem.hit({
        sourceType,
        damage: 1,
        color: PW.ProjectileSystem.colorFor(sourceType),
        slowTime: 0,
        ...extra
      }, target);
      effects[sourceType] = PW.state.effects.map((effect) => effect.type);
    });
    return { upgradeRows, effects };
  });

  for (const row of result.upgradeRows) {
    if (row.cost2 / row.baseCost >= row.gain2) {
      throw new Error(`Upgrade Stufe 2 lohnt sich nicht fuer ${row.id}: ${JSON.stringify(row)}`);
    }
    if (row.cost3 / row.baseCost >= row.gain3) {
      throw new Error(`Upgrade Stufe 3 lohnt sich nicht fuer ${row.id}: ${JSON.stringify(row)}`);
    }
  }

  const expectedEffects = {
    catapult: "catapultSplash",
    flak: "flakBurst",
    tesla: "teslaPulse",
    laser: "laserHit",
    ballista: "boltHit"
  };
  for (const [tower, effect] of Object.entries(expectedEffects)) {
    if (!result.effects[tower].includes(effect)) {
      throw new Error(`Effekt fuer ${tower} fehlt: ${JSON.stringify(result.effects)}`);
    }
  }

  await browser.close();
  console.log("OK weapon effects balance");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
