"use strict";

window.PW = window.PW || {};

PW.CONFIG = Object.freeze({
  version: "1.0.0",
  saveKey: "planet-wrack-save-v1",
  autosaveEvery: 15,
  tileSize: 32,
  mapWidth: 144,
  mapHeight: 144,
  canvasWidth: 1280,
  canvasHeight: 720,
  shipSize: 4,
  shipMaxHp: 500,
  baseSafeRadius: 14,
  playerSpeed: 132,
  playerInteractRange: 1,
  dropPickupRadius: 30,
  dropMagnetRadius: 72,
  dropMagnetSpeed: 260,
  treasure: {
    minActiveChests: 1,
    maxActiveChests: 2,
    chestRespawnEvery: 24,
    campCount: [5, 7],
    campRespawnEvery: 35,
    campLeashTiles: 8.5,
    campAggroTiles: 7.8,
    campAttackRange: 34
  },
  outposts: {
    count: 3,
    minShipDistance: 24,
    minSpacing: 18,
    guardRadiusTiles: 6.5
  },
  gatherTicks: {
    tree: [1, 2],
    rock: [2, 3],
    iron: [3, 4],
    gold: [4, 5],
    crystal: [4, 5]
  },
  sight: {
    day: 7,
    dusk: 6,
    night: 5,
    dawn: 6
  },
  phases: {
    day: 120,
    dusk: 12,
    night: 70,
    dawn: 8
  },
  phaseGrowth: {
    dayShrinkPerNight: 2,
    dayMin: 90,
    nightGrowPerNight: 2,
    nightMax: 92
  },
  colors: {
    day: "#9dc27c",
    dusk: "#b87955",
    night: "#46518b",
    dawn: "#7da0a1"
  },
  startingInventory: {
    wood: 32,
    stone: 18,
    iron: 0,
    gold: 0,
    crystal: 0,
    scrap: 0,
    parts: 0,
    key: 0
  },
  tools: [
    { id: "axe", key: "1", label: "Axt", hint: "Baeume" },
    { id: "pickaxe", key: "2", label: "Hacke", hint: "Stein/Erz" },
    { id: "repair", key: "3", label: "Reparatur", hint: "Wrack/Bauten" },
    { id: "build", key: "4", label: "Bauen", hint: "Bauplan" },
    { id: "demolish", key: "5", label: "Abriss", hint: "Rueckbau" }
  ],
  balance: {
    baseThreatBudget: 13,
    budgetGrowth: 5.4,
    easyDamageRatio: 0.05,
    idealDamageMin: 0.08,
    idealDamageMax: 0.22,
    hardDamageRatio: 0.35,
    lowHpRatio: 0.35,
    maxPositiveDrift: 0.3,
    maxNegativeDrift: -0.3,
    maxNightBoost: 0.12,
    maxNightRelief: -0.18
  },
  debug: {
    enabled: false,
    fastForward: false
  }
});
