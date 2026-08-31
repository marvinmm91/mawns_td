"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const tests = [
  "game-mode-foundation.js",
  "mode-route-targets.js",
  "classic-mode.js",
  "classic-route-guard.js",
  "aggressive-mode.js",
  "game-mode-balance.js",
  "enemy-persistence.js"
];

for (const test of tests) {
  const result = spawnSync(process.execPath, [path.join(__dirname, test)], { encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`OK defense modes regression (${tests.length} Szenarien)`);
