"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

const RESOURCE_VALUE = Object.freeze({
  wood: 1,
  stone: 1.2,
  scrap: 1.2,
  iron: 1.8,
  crystal: 2.4,
  gold: 3,
  parts: 3.3
});

function format(value) {
  return Number(value).toFixed(2);
}

function table(rows) {
  const columns = ["Turm", "Kostenwert", "DPS", "DPS/Kosten", "Reichweite", "Ziele", "Spezial", "Upgrade +DPS/Kosten"];
  const values = rows.map((row) => [
    row.name,
    format(row.costValue),
    format(row.baseDps),
    format(row.baseEfficiency),
    format(row.range),
    row.targets,
    row.special,
    `${format(row.level2Efficiency)}/${format(row.level3Efficiency)}`
  ]);
  const widths = columns.map((column, index) => Math.max(column.length, ...values.map((row) => row[index].length)));
  const render = (row) => row.map((value, index) => value.padEnd(widths[index])).join(" | ");
  return [render(columns), widths.map((width) => "-".repeat(width)).join("-|-"), ...values.map(render)].join("\n");
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname, "..", "index.html")).href);

  const result = await page.evaluate((resourceValue) => {
    PW.state = PW.createInitialState();
    const costValue = (cost) => Object.entries(cost).reduce((sum, [resource, amount]) => sum + amount * resourceValue[resource], 0);
    const towerDefs = Object.values(PW.BUILDINGS).filter((def) => def.category === "tower");
    const dpsAtLevel = (def, level) => def.damage * (1 + (level - 1) * 0.35) * def.rate * (1 + (level - 1) * 0.18);
    const rows = towerDefs.map((def) => {
      const baseDps = dpsAtLevel(def, 1);
      const level2Cost = costValue(PW.BuildingSystem.upgradeCost({ type: def.id, level: 1 }));
      const level3Cost = costValue(PW.BuildingSystem.upgradeCost({ type: def.id, level: 2 }));
      const special = def.splash ? `AoE x${def.expectedTargets || 2}` : def.slow ? `Slow ${Math.round(def.slow * 100)}%` : "-";
      return {
        id: def.id,
        name: def.name,
        costValue: costValue(def.cost),
        baseDps,
        baseEfficiency: baseDps / costValue(def.cost),
        level2Efficiency: (dpsAtLevel(def, 2) - baseDps) / level2Cost,
        level3Efficiency: (dpsAtLevel(def, 3) - dpsAtLevel(def, 2)) / level3Cost,
        range: def.range,
        targets: def.targets.join("+"),
        special
      };
    });
    const rawDps = (tower) => PW.BUILDINGS[tower].damage * PW.BUILDINGS[tower].rate;
    const damagePerShot = (tower, enemyType) => {
      const enemy = { id: `${tower}-${enemyType}`, type: enemyType, x: 100, y: 100, hp: 100000, maxHp: 100000, slowFactor: 1, slowTimer: 0 };
      const before = enemy.hp;
      PW.EnemySystem.damage(enemy, PW.BUILDINGS[tower].damage, tower);
      return before - enemy.hp;
    };
    const catapult = PW.BUILDINGS.catapult;
    const swarmGroupMultiplier = 1 + (catapult.expectedTargets - 1) * catapult.splashFalloff;
    const swarmEnemy = { id: "slow-swarm", type: "swarm", x: 120, y: 120, hp: 999, maxHp: 999, slowFactor: 1, slowTimer: 0 };
    PW.ProjectileSystem.hit({ sourceType: "tesla", damage: 0, splash: 0, slow: PW.BUILDINGS.tesla.slow, slowTime: PW.BUILDINGS.tesla.slowTime, color: "#fff" }, swarmEnemy);
    const packCount = PW.Spawning.packSizeFor("swarm", PW.ENEMIES.swarm.budget * 4);
    PW.state.phase.current = "night";
    PW.state.wave = {
      active: true,
      budgetRemaining: 5,
      plannedDirections: ["n"],
      spawnedThisNight: 0,
      waveDef: { enemies: ["swarm"] }
    };
    PW.Spawning.spawnPulse();
    return {
      rows,
      counters: {
        catapultVsSwarm: rawDps("catapult") * PW.EnemySystem.damageMultiplier({ type: "swarm" }, "catapult") * swarmGroupMultiplier,
        ballistaVsSwarm: rawDps("ballista") * PW.EnemySystem.damageMultiplier({ type: "swarm" }, "ballista"),
        ballistaVsArmored: damagePerShot("ballista", "armored"),
        laserVsArmored: damagePerShot("laser", "armored"),
        flakDroneEfficiency: rawDps("flak") * PW.EnemySystem.damageMultiplier({ type: "drone" }, "flak") / costValue(PW.BUILDINGS.flak.cost),
        laserDroneEfficiency: rawDps("laser") * PW.EnemySystem.damageMultiplier({ type: "drone" }, "laser") / costValue(PW.BUILDINGS.laser.cost),
        flakVsBomber: rawDps("flak") * PW.EnemySystem.damageMultiplier({ type: "bomber" }, "flak"),
        laserVsBomber: rawDps("laser") * PW.EnemySystem.damageMultiplier({ type: "bomber" }, "laser"),
        swarmSlowedSpeed: PW.ENEMIES.swarm.speed * swarmEnemy.slowFactor,
        crawlerSpeed: PW.ENEMIES.crawler.speed,
        packCount,
        spawnedSwarmCount: PW.state.enemies.length,
        remainingSwarmBudget: PW.state.wave.budgetRemaining
      }
    };
  }, RESOURCE_VALUE);

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);

  for (const row of result.rows) {
    if (row.level2Efficiency < row.baseEfficiency * 0.9 || row.level3Efficiency < row.baseEfficiency * 0.9) {
      throw new Error(`Upgrade ist wirtschaftlich zu schwach: ${JSON.stringify(row)}`);
    }
  }
  const { counters } = result;
  if (counters.packCount < 2 || counters.packCount > 4 || counters.spawnedSwarmCount < 2 || counters.remainingSwarmBudget >= 5) {
    throw new Error(`Schwarmpaket fehlerhaft: ${JSON.stringify(counters)}`);
  }
  if (counters.catapultVsSwarm < counters.ballistaVsSwarm * 2) throw new Error(`Katapult ist kein klarer Schwarmkonter: ${JSON.stringify(counters)}`);
  if (counters.swarmSlowedSpeed >= counters.crawlerSpeed) throw new Error(`Tesla bremst schnelle Schwaerme nicht ausreichend: ${JSON.stringify(counters)}`);
  if (counters.ballistaVsArmored >= 20 || counters.laserVsArmored <= 70) throw new Error(`Panzerkonter fehlerhaft: ${JSON.stringify(counters)}`);
  if (counters.flakDroneEfficiency <= counters.laserDroneEfficiency) throw new Error(`Flak ist gegen Drohnen nicht wirtschaftlicher: ${JSON.stringify(counters)}`);
  if (counters.laserVsBomber <= counters.flakVsBomber) throw new Error(`Laser ist kein klarer Bomberkonter: ${JSON.stringify(counters)}`);

  console.log("TOWER ROLE ECONOMY");
  console.log(table(result.rows));
  console.log("COUNTERS", JSON.stringify(counters));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
