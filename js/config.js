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
  resourceGrowth: {
    treeRespawnEvery: [58, 96],
    treeRetryEvery: 16,
    treeMax: 1600,
    treeSafeRadius: 18,
    treeMinSpacing: 2.4,
    treeStructureClearance: 3
  },
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
    scrap: 16,
    parts: 0,
    key: 0
  },
  tools: [
    { id: "axe", key: "1", label: "Axt", hint: "Bäume" },
    { id: "pickaxe", key: "2", label: "Hacke", hint: "Stein/Erz" },
    { id: "repair", key: "3", label: "Reparatur", hint: "Wrack/Bauten" },
    { id: "build", key: "4", label: "Bauen", hint: "Bauplan" },
    { id: "demolish", key: "5", label: "Abriss", hint: "Rückbau" }
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
  difficulty: {
    default: "standard",
    profiles: [
      {
        id: "relaxed",
        name: "Stufe 1 - Entspannt",
        shortName: "Entspannt",
        description: "Mehr Raum zum Aufbauen und deutliche Hilfe nach einer harten Nacht.",
        threatMultiplier: 0.76,
        balance: { easyDamageRatio: 0.02, idealDamageMin: 0.04, idealDamageMax: 0.17, hardDamageRatio: 0.30, lowHpRatio: 0.42, maxPositiveDrift: 0.20, maxNegativeDrift: -0.38, maxNightBoost: 0.08, maxNightRelief: -0.24, maxDropBonus: 0.30 }
      },
      {
        id: "calm",
        name: "Stufe 2 - Ruhig",
        shortName: "Ruhig",
        description: "Etwas weniger Grunddruck mit verzeihendem Ausgleich.",
        threatMultiplier: 0.88,
        balance: { easyDamageRatio: 0.035, idealDamageMin: 0.06, idealDamageMax: 0.195, hardDamageRatio: 0.325, lowHpRatio: 0.38, maxPositiveDrift: 0.25, maxNegativeDrift: -0.34, maxNightBoost: 0.10, maxNightRelief: -0.21, maxDropBonus: 0.26 }
      },
      {
        id: "standard",
        name: "Stufe 3 - Standard",
        shortName: "Standard",
        description: "Die vorgesehene, ausgewogene Planet-Wrack-Erfahrung.",
        threatMultiplier: 1,
        balance: { maxDropBonus: 0.22 }
      },
      {
        id: "hard",
        name: "Stufe 4 - Anspruchsvoll",
        shortName: "Anspruchsvoll",
        description: "Mehr Druck und weniger automatische Entlastung nach Fehlern.",
        threatMultiplier: 1.13,
        balance: { easyDamageRatio: 0.065, idealDamageMin: 0.10, idealDamageMax: 0.245, hardDamageRatio: 0.375, lowHpRatio: 0.32, maxPositiveDrift: 0.34, maxNegativeDrift: -0.26, maxNightBoost: 0.14, maxNightRelief: -0.15, maxDropBonus: 0.18 }
      },
      {
        id: "onslaught",
        name: "Stufe 5 - Ansturm",
        shortName: "Ansturm",
        description: "Hoher Grunddruck für erfahrene Verteidigungsplaner.",
        threatMultiplier: 1.27,
        balance: { easyDamageRatio: 0.08, idealDamageMin: 0.12, idealDamageMax: 0.27, hardDamageRatio: 0.40, lowHpRatio: 0.29, maxPositiveDrift: 0.38, maxNegativeDrift: -0.22, maxNightBoost: 0.16, maxNightRelief: -0.12, maxDropBonus: 0.14 }
      }
    ]
  },
  gameModes: {
    default: "classic",
    profiles: [
      {
        id: "classic",
        name: "Classic",
        shortName: "Classic",
        description: "Freie Wege werden beim Bauen gesichert; nur echte Notfallblockaden werden schnell aufgebrochen.",
        structureTargeting: "blockade",
        waveMultiplier: 1.24,
        structureDamageMultiplier: 1,
        breakthroughDamageMultiplier: 10,
        disabledBuildings: ["stoneWall", "steelWall"]
      },
      {
        id: "aggressive",
        name: "Aggressive",
        shortName: "Aggressiv",
        description: "Direkte Wegverteidigungen werden aktiv angegriffen; Wellen sind dafür etwas kleiner.",
        structureTargeting: "direct-path",
        waveMultiplier: 0.92,
        structureDamageMultiplier: 1
      }
    ]
  },
  pathfinding: {
    directStructureCost: 1.65
  },
  debug: {
    enabled: false,
    fastForward: false
  }
});
