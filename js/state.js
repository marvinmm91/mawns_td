"use strict";

PW.createInitialState = function createInitialState() {
  const cfg = PW.CONFIG;
  const seed = Date.now() & 0xffffffff;
  const inventory = { ...cfg.startingInventory };
  const modules = {};
  Object.keys(PW.SHIP_MODULES).forEach((id) => { modules[id] = false; });

  return {
    version: cfg.version,
    seed,
    rng: PW.Random.create(seed),
    canvas: null,
    ctx: null,
    dom: {},
    running: false,
    paused: false,
    gameOver: false,
    victory: false,
    lastTime: 0,
    elapsed: 0,
    autosaveTimer: 0,
    debug: {
      enabled: cfg.debug.enabled === true,
      profile: {
        fps: 0,
        frameMs: 0,
        updateMs: 0,
        renderMs: 0,
        workMs: 0,
        frames: 0
      }
    },
    input: {
      keys: new Set(),
      pressed: new Set(),
      blueprintPainting: false,
      blueprintPaintTile: null,
      blueprintPaintAction: null
    },
    mouse: {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      tileX: 0,
      tileY: 0,
      inside: false
    },
    world: {
      width: cfg.mapWidth,
      height: cfg.mapHeight,
      tileSize: cfg.tileSize,
      tiles: [],
      fog: [],
      resources: [],
      resourceMap: new Map(),
      birds: [],
      wildlife: [],
      treasureChests: [],
      monsterCamps: [],
      outposts: [],
      outpostMap: new Map(),
      waterways: { river: [], brooks: [] },
      buildings: [],
      buildingMap: new Map(),
      blueprints: [],
      blueprintMap: new Map(),
      mapPins: [],
      mapPinMap: new Map()
    },
    camera: {
      x: 0,
      y: 0,
      w: cfg.canvasWidth,
      h: cfg.canvasHeight,
      pixelRatio: 1
    },
    player: {
      x: Math.floor(cfg.mapWidth / 2) * cfg.tileSize,
      y: (Math.floor(cfg.mapHeight / 2) + 5) * cfg.tileSize,
      radius: 11,
      dirX: 0,
      dirY: -1,
      speed: cfg.playerSpeed,
      actionCooldown: 0,
      selectedTool: "axe"
    },
    ship: {
      x: Math.floor(cfg.mapWidth / 2) - Math.floor(cfg.shipSize / 2),
      y: Math.floor(cfg.mapHeight / 2) - Math.floor(cfg.shipSize / 2),
      size: cfg.shipSize,
      hp: cfg.shipMaxHp,
      maxHp: cfg.shipMaxHp,
      damageFlash: 0,
      modules,
      launchActive: false,
      launchTimer: 0,
      launchDuration: 120
    },
    phase: {
      current: "day",
      timer: cfg.phases.day,
      duration: cfg.phases.day,
      night: 0,
      warningDirections: []
    },
    inventory,
    knownResources: new Set(["wood", "stone"]),
    unlockedBuildings: new Set(["palisade", "ballista"]),
    selectedBuild: "palisade",
    enemies: [],
    projectiles: [],
    drops: [],
    fauna: {
      birdTarget: 0,
      critterTarget: 0,
      critterRespawnTimer: 0
    },
    treasure: {
      chestRespawnTimer: 0,
      campRespawnTimer: 0,
      campTarget: 0
    },
    effects: [],
    messages: [],
    panel: "status",
    inspectedTile: null,
    reportOpen: false,
    balance: {
      drift: 0,
      easyStreak: 0,
      hardStreak: 0,
      lastThreatBudget: cfg.balance.baseThreatBudget,
      dropBonus: 0,
      nextHints: []
    },
    nightStats: null,
    lastReport: null,
    wave: {
      active: false,
      budgetRemaining: 0,
      pulseTimer: 0,
      pulseIndex: 0,
      plannedDirections: [],
      spawnedThisNight: 0
    }
  };
};

PW.state = PW.createInitialState();
