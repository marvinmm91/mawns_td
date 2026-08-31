"use strict";

PW.BuildingSystem = {
  placeSelected(x, y) {
    return this.place(PW.state.selectedBuild, x, y);
  },
  place(type, x, y) {
    const state = PW.state;
    const def = PW.BUILDINGS[type];
    if (!def) return false;
    if (!state.unlockedBuildings.has(type)) {
      PW.Messages.add(`${def.name} ist noch nicht verfuegbar.`);
      return false;
    }
    if (!this.canPlaceBuilding(type, x, y)) {
      PW.Messages.add("Hier kann nicht gebaut werden.");
      return false;
    }
    if (!PW.Utils.canAfford(def.cost)) {
      PW.Messages.add(`Zu wenig Material: ${PW.Utils.costText(def.cost)}.`);
      return false;
    }
    if (!this.nudgePlayerAwayFromBuildTile(x, y)) {
      PW.Messages.add("Du stehst zu nah am Bauplatz.");
      return false;
    }
    PW.Utils.pay(def.cost);
    const building = {
      id: `building-${Date.now()}-${state.world.buildings.length}`,
      type,
      x,
      y,
      hp: def.maxHp,
      maxHp: def.maxHp,
      cooldown: state.rng.float(0, 0.5),
      level: 1,
      targetPriority: def.category === "tower" ? "ship" : undefined
    };
    state.world.buildings.push(building);
    state.world.buildingMap.set(PW.Utils.tileKey(x, y), building);
    PW.SpatialIndex.add("buildings", building);
    this.removeBlueprintAt(x, y, false);
    PW.Pathfinding.markDirty();
    PW.Messages.add(`${def.name} gebaut.`, "ok");
    PW.UI.renderHud();
    PW.UI.renderPanel();
    return true;
  },
  canPlaceBlueprint(type, x, y) {
    return !PW.Tiles.getBlueprint(x, y) && this.canPlaceBuilding(type, x, y);
  },
  placeBlueprintSelected(x, y, quiet = false) {
    return this.placeBlueprint(PW.state.selectedBuild, x, y, quiet);
  },
  placeBlueprint(type, x, y, quiet = false) {
    const state = PW.state;
    const def = PW.BUILDINGS[type];
    if (!def || !state.unlockedBuildings.has(type) || !this.canPlaceBlueprint(type, x, y)) return false;
    const blueprint = {
      id: `blueprint-${Date.now()}-${state.world.blueprints.length}`,
      type,
      x,
      y
    };
    state.world.blueprints.push(blueprint);
    state.world.blueprintMap.set(PW.Utils.tileKey(x, y), blueprint);
    PW.SpatialIndex.add("blueprints", blueprint);
    if (!quiet) {
      PW.Messages.add(`${def.name} vorgemerkt.`, "ok");
      PW.UI.renderPanel();
    }
    return true;
  },
  removeBlueprintAt(x, y, showMessage = true) {
    const state = PW.state;
    const blueprint = PW.Tiles.getBlueprint(x, y);
    if (!blueprint) return false;
    state.world.blueprintMap.delete(PW.Utils.tileKey(x, y));
    state.world.blueprints = state.world.blueprints.filter((item) => item !== blueprint);
    PW.SpatialIndex.remove("blueprints", blueprint);
    if (showMessage) {
      PW.Messages.add("Blaupause entfernt.");
      PW.UI.renderPanel();
    }
    return true;
  },
  buildBlueprint(blueprintId) {
    const blueprint = PW.state.world.blueprints.find((item) => item.id === blueprintId);
    if (!blueprint) return false;
    return this.place(blueprint.type, blueprint.x, blueprint.y);
  },
  buildAllBlueprints() {
    let built = 0;
    [...PW.state.world.blueprints].forEach((blueprint) => {
      if (this.buildBlueprint(blueprint.id)) built += 1;
    });
    if (!built) PW.Messages.add("Keine Blaupause konnte errichtet werden.");
    PW.UI.renderPanel();
    return built;
  },
  canPlaceBuilding(type, x, y) {
    const def = PW.BUILDINGS[type];
    if (!def) return false;
    return def.placeOnWater ? PW.Tiles.canBuildBridgeAt(x, y) : PW.Tiles.canBuildAt(x, y);
  },
  nudgePlayerAwayFromBuildTile(tileX, tileY) {
    const state = PW.state;
    const player = state.player;
    if (!this.playerOverlapsTile(player.x, player.y, player.radius, tileX, tileY)) return true;

    const center = PW.Tiles.tileCenter(tileX, tileY);
    let dx = player.x - center.x;
    let dy = player.y - center.y;
    if (Math.hypot(dx, dy) < 0.01) {
      dx = -player.dirX || 0;
      dy = -player.dirY || 1;
    }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const original = { x: player.x, y: player.y };
    const ts = state.world.tileSize;
    for (let step = 4; step <= ts * 2.25; step += 4) {
      const nx = original.x + dx * step;
      const ny = original.y + dy * step;
      if (this.canPlayerStandAfterBuild(nx, ny, player.radius, tileX, tileY)) {
        player.x = nx;
        player.y = ny;
        PW.Camera.update();
        return true;
      }
    }
    return false;
  },
  playerOverlapsTile(px, py, radius, tileX, tileY) {
    const ts = PW.state.world.tileSize;
    const minX = tileX * ts;
    const minY = tileY * ts;
    const maxX = minX + ts;
    const maxY = minY + ts;
    const closestX = PW.Utils.clamp(px, minX, maxX);
    const closestY = PW.Utils.clamp(py, minY, maxY);
    return PW.Utils.distance(px, py, closestX, closestY) < radius + 1;
  },
  canPlayerStandAfterBuild(px, py, radius, blockedTileX, blockedTileY) {
    const samples = [
      [px - radius, py - radius],
      [px + radius, py - radius],
      [px - radius, py + radius],
      [px + radius, py + radius],
      [px, py - radius],
      [px, py + radius],
      [px - radius, py],
      [px + radius, py],
      [px, py]
    ];
    return samples.every(([sx, sy]) => {
      const tx = PW.Utils.worldToTile(sx);
      const ty = PW.Utils.worldToTile(sy);
      if (tx === blockedTileX && ty === blockedTileY) return false;
      return !PW.Tiles.isBlockedForPlayer(tx, ty);
    });
  },
  repairAt(x, y) {
    const building = PW.Tiles.getBuilding(x, y);
    if (!building) return false;
    const def = PW.BUILDINGS[building.type];
    if (building.hp >= building.maxHp) {
      PW.Messages.add(`${def.name} ist intakt.`);
      return true;
    }
    const cost = def.category === "wall" ? { stone: 1 } : { scrap: 1 };
    if (!PW.Utils.canAfford(cost)) {
      PW.Messages.add(`Reparatur braucht ${PW.Utils.costText(cost)}.`);
      return true;
    }
    PW.Utils.pay(cost);
    building.hp = Math.min(building.maxHp, building.hp + Math.ceil(building.maxHp * 0.28));
    PW.Messages.add(`${def.name} repariert.`, "ok");
    PW.UI.renderHud();
    PW.UI.renderPanel();
    return true;
  },
  demolishAt(x, y) {
    const building = PW.Tiles.getBuilding(x, y);
    if (!building) {
      PW.Messages.add("Kein Bauwerk zum Abreissen.");
      return false;
    }
    const def = PW.BUILDINGS[building.type];
    Object.entries(def.refund || {}).forEach(([id, amount]) => PW.Utils.addInventory(id, amount));
    this.destroy(building);
    PW.Messages.add(`${def.name} abgerissen.`);
    PW.UI.renderHud();
    PW.UI.renderPanel();
    return true;
  },
  destroy(building) {
    const state = PW.state;
    state.world.buildingMap.delete(PW.Utils.tileKey(building.x, building.y));
    state.world.buildings = state.world.buildings.filter((item) => item !== building);
    PW.SpatialIndex.remove("buildings", building);
    PW.Pathfinding.markDirty();
    PW.Utils.addEffect("splash", PW.Utils.tileToWorld(building.x), PW.Utils.tileToWorld(building.y), "#e35d57", 0.5, 1.2);
  },
  upgrade(buildingId) {
    const building = PW.state.world.buildings.find((item) => item.id === buildingId);
    if (!building) return;
    const def = PW.BUILDINGS[building.type];
    if (def.upgradeable === false) {
      PW.Messages.add(`${def.name} kann nicht verbessert werden.`);
      return;
    }
    if (building.level >= 3) {
      PW.Messages.add("Maximale Stufe erreicht.");
      return;
    }
    const cost = this.upgradeCost(building);
    if (!PW.Utils.canAfford(cost)) {
      PW.Messages.add(`Upgrade braucht ${PW.Utils.costText(cost)}.`);
      return;
    }
    PW.Utils.pay(cost);
    building.level += 1;
    building.maxHp = Math.round(def.maxHp * (1 + (building.level - 1) * 0.35));
    building.hp = building.maxHp;
    PW.Messages.add(`${def.name} auf Stufe ${building.level}.`, "ok");
    PW.UI.renderPanel();
  },
  upgradeCost(building) {
    const base = PW.BUILDINGS[building.type].cost;
    const isTower = PW.BUILDINGS[building.type].category === "tower";
    const factor = isTower ? (building.level === 1 ? 0.45 : 0.5) : (building.level === 1 ? 0.3 : 0.32);
    const cost = {};
    Object.entries(base).forEach(([id, amount]) => { cost[id] = Math.max(1, Math.ceil(amount * factor)); });
    return cost;
  },
  setTargetPriority(buildingId, priority) {
    const building = PW.state.world.buildings.find((item) => item.id === buildingId);
    const def = building && PW.BUILDINGS[building.type];
    if (!building || !def || def.category !== "tower") return false;
    const valid = PW.Combat.targetPriorityOptions(building, def).some((option) => option.id === priority);
    if (!valid) return false;
    building.targetPriority = priority;
    PW.Messages.add(`${def.name}: ${PW.Combat.targetPriorityLabel(building, def)}.`, "ok");
    PW.UI.renderPanel();
    return true;
  }
};
