"use strict";

PW.Save = {
  save(showMessage) {
    const state = PW.state;
    if (state.gameOver || state.victory) return;
    const data = {
      version: state.version,
      seed: state.seed,
      world: {
        width: state.world.width,
        height: state.world.height,
        tileSize: state.world.tileSize,
        tiles: state.world.tiles,
        fog: state.world.fog,
        resources: state.world.resources,
        birds: state.world.birds || [],
        wildlife: state.world.wildlife || [],
        treasureChests: state.world.treasureChests || [],
        monsterCamps: state.world.monsterCamps || [],
        outposts: state.world.outposts || [],
        waterways: state.world.waterways || { river: [], brooks: [] },
        buildings: state.world.buildings,
        blueprints: state.world.blueprints || [],
        mapPins: state.world.mapPins || []
      },
      player: state.player,
      ship: state.ship,
      phase: state.phase,
      inventory: state.inventory,
      knownResources: Array.from(state.knownResources),
      unlockedBuildings: Array.from(state.unlockedBuildings),
      selectedBuild: state.selectedBuild,
      enemies: state.enemies,
      projectiles: state.projectiles,
      drops: state.drops,
      fauna: state.fauna,
      resourceGrowth: state.resourceGrowth,
      treasure: state.treasure,
      wave: state.wave,
      nightStats: state.nightStats,
      balance: state.balance,
      lastReport: state.lastReport
    };
    localStorage.setItem(PW.CONFIG.saveKey, JSON.stringify(data));
    if (showMessage) PW.Messages.add("Spiel gespeichert.", "ok");
  },
  load(showMessage) {
    const raw = localStorage.getItem(PW.CONFIG.saveKey);
    if (!raw) {
      if (showMessage) PW.Messages.add("Kein Speicherstand gefunden.");
      return false;
    }
    try {
      const data = JSON.parse(raw);
      const fresh = PW.createInitialState();
      const wasRunning = PW.state.running;
      const wasPaused = PW.state.paused;
      const dom = PW.state.dom;
      const canvas = PW.state.canvas;
      const ctx = PW.state.ctx;
      PW.state = Object.assign(fresh, data);
      PW.state.dom = dom;
      PW.state.canvas = canvas;
      PW.state.ctx = ctx;
      PW.state.running = wasRunning;
      PW.state.paused = wasPaused;
      PW.state.reportOpen = false;
      PW.state.rng = PW.Random.create((data.seed || Date.now()) ^ Date.now());
      PW.state.input = { keys: new Set(), pressed: new Set() };
      PW.state.world.tileSize = PW.state.world.tileSize || PW.CONFIG.tileSize;
      PW.state.world.birds = PW.state.world.birds || [];
      PW.state.world.wildlife = PW.state.world.wildlife || [];
      PW.state.world.treasureChests = PW.state.world.treasureChests || [];
      PW.state.world.monsterCamps = PW.state.world.monsterCamps || [];
      PW.state.world.outposts = PW.state.world.outposts || [];
      PW.state.world.waterways = PW.state.world.waterways || { river: [], brooks: [] };
      PW.state.world.blueprints = PW.state.world.blueprints || [];
      PW.state.world.mapPins = PW.state.world.mapPins || [];
      PW.state.fauna = data.fauna || PW.state.fauna || { birdTarget: 0, critterMax: 0, critterRespawnTimer: 0 };
      PW.state.resourceGrowth = data.resourceGrowth || PW.state.resourceGrowth || { treeRespawnTimer: 0 };
      if (PW.ResourceSystem) PW.ResourceSystem.ensureGrowthState();
      PW.state.treasure = data.treasure || PW.state.treasure || { chestRespawnTimer: 0, campRespawnTimer: 0, campTarget: PW.CONFIG.treasure.campCount[0] };
      if (!PW.state.treasure.campTarget) PW.state.treasure.campTarget = Math.max(PW.CONFIG.treasure.campCount[0], PW.state.world.monsterCamps.filter((camp) => !camp.cleared).length);
      PW.state.inventory.key = PW.state.inventory.key || 0;
      PW.state.wave = data.wave || PW.state.wave;
      PW.state.nightStats = data.nightStats || PW.state.nightStats || {
        night: PW.state.phase.night,
        shipStartHp: PW.state.ship.hp,
        shipDamageTaken: 0,
        airDamage: 0,
        wallDamage: 0,
        wallsDestroyed: 0,
        kills: 0,
        killDistanceSum: 0,
        startedAt: PW.state.elapsed
      };
      PW.state.knownResources = new Set(data.knownResources || ["wood", "stone"]);
      PW.state.unlockedBuildings = new Set(data.unlockedBuildings || ["palisade", "ballista", "catapult", "flak", "tesla", "laser"]);
      PW.Progression.refreshUnlocks();
      PW.state.world.resourceMap = new Map();
      PW.state.world.resources.forEach((node) => {
        PW.MapGenerator.normalizeResourceHp(node);
        PW.state.world.resourceMap.set(PW.Utils.tileKey(node.x, node.y), node);
      });
      PW.state.world.buildingMap = new Map();
      PW.state.world.buildings.forEach((building) => {
        const def = PW.BUILDINGS[building.type];
        if (def && def.category === "tower") building.targetPriority = PW.Combat.targetPriority(building, def);
        PW.state.world.buildingMap.set(PW.Utils.tileKey(building.x, building.y), building);
      });
      PW.state.world.blueprintMap = new Map();
      PW.state.world.blueprints = PW.state.world.blueprints.filter((blueprint) => {
        const def = PW.BUILDINGS[blueprint.type];
        if (!def || PW.Tiles.getBuilding(blueprint.x, blueprint.y)) return false;
        PW.state.world.blueprintMap.set(PW.Utils.tileKey(blueprint.x, blueprint.y), blueprint);
        return true;
      });
      PW.OutpostSystem.restore(PW.state.world.outposts);
      PW.MapPins.restore(PW.state.world.mapPins);
      if (PW.WildlifeSystem) PW.WildlifeSystem.ensurePopulation();
      PW.SpatialIndex.reset();
      PW.SpatialIndex.rebuildStatic();
      PW.SpatialIndex.syncDynamic();
      PW.Pathfinding.markDirty();
      PW.Camera.resize();
      PW.UI.renderHud();
      PW.UI.hidePanel();
      if (showMessage) PW.Messages.add("Spiel geladen.", "ok");
      return true;
    } catch (error) {
      console.error(error);
      PW.Messages.add("Speicherstand konnte nicht geladen werden.", "danger");
      return false;
    }
  },
  hasSave() {
    return Boolean(localStorage.getItem(PW.CONFIG.saveKey));
  },
  clear() {
    localStorage.removeItem(PW.CONFIG.saveKey);
  },
  reset() {
    this.suppressBeforeUnload = true;
    this.clear();
    window.location.reload();
  },
  markReloadAndSave() {
    if (this.suppressBeforeUnload) return;
    try {
      sessionStorage.setItem(`${PW.CONFIG.saveKey}-reload`, "1");
      this.save(false);
    } catch (error) {
      console.warn("Reload-Save fehlgeschlagen", error);
    }
  },
  consumeReloadFlag() {
    const key = `${PW.CONFIG.saveKey}-reload`;
    const value = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return value === "1";
  },
  update(dt) {
    const state = PW.state;
    state.autosaveTimer += dt;
    if (state.autosaveTimer >= PW.CONFIG.autosaveEvery) {
      state.autosaveTimer = 0;
      this.save(false);
    }
  }
};
