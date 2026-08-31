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
    PW.state.rng = PW.Random.create(12345);
    PW.state.world.tiles = [];
    PW.state.world.resources = [];
    PW.state.world.resourceMap = new Map();
    PW.state.world.buildings = [];
    PW.state.world.buildingMap = new Map();
    for (let y = 0; y < PW.state.world.height; y++) {
      for (let x = 0; x < PW.state.world.width; x++) {
        PW.state.world.tiles.push({ x, y, kind: "soil", blocked: false, variant: 0 });
      }
    }

    const expected = {
      tree: [1, 2],
      rock: [2, 3],
      iron: [3, 4],
      gold: [4, 5],
      crystal: [4, 5]
    };
    const values = {};
    Object.keys(expected).forEach((type, typeIndex) => {
      values[type] = [];
      for (let i = 0; i < 24; i++) {
        PW.MapGenerator.addResource(type, 2 + i, 4 + typeIndex * 3);
      }
    });
    PW.state.world.resources.forEach((node) => values[node.type].push(node.maxHp));

    const legacy = { type: "rock", hp: 2, maxHp: 2 };
    PW.MapGenerator.normalizeResourceHp(legacy);

    return { expected, values, legacy };
  });

  for (const [type, range] of Object.entries(result.expected)) {
    const values = result.values[type];
    if (!values.length) throw new Error(`Keine Testressourcen fuer ${type}`);
    if (values.some((hp) => hp < range[0] || hp > range[1])) {
      throw new Error(`${type} ausserhalb Range ${range}: ${values.join(",")}`);
    }
    if (!values.includes(range[0]) || !values.includes(range[1])) {
      throw new Error(`${type} nutzt nicht beide HP-Werte ${range}: ${values.join(",")}`);
    }
  }
  if (!Array.isArray(result.legacy.hpRange) || result.legacy.hpRange[0] !== 2 || result.legacy.hpRange[1] !== 3) {
    throw new Error(`Legacy-Migration setzt hpRange nicht korrekt: ${JSON.stringify(result.legacy)}`);
  }

  await browser.close();
  console.log("OK resource hp ranges");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
