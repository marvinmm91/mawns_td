"use strict";

PW.ResourceSystem = {
  resetGrowth() {
    const state = PW.state;
    state.resourceGrowth = state.resourceGrowth || {};
    state.resourceGrowth.treeRespawnTimer = this.nextTreeRespawnDelay();
  },
  ensureGrowthState() {
    const state = PW.state;
    state.resourceGrowth = state.resourceGrowth || {};
    if (!Number.isFinite(state.resourceGrowth.treeRespawnTimer) || state.resourceGrowth.treeRespawnTimer <= 0) {
      state.resourceGrowth.treeRespawnTimer = this.nextTreeRespawnDelay();
    }
    return state.resourceGrowth;
  },
  nextTreeRespawnDelay() {
    return PW.state.rng.float(PW.CONFIG.resourceGrowth.treeRespawnEvery[0], PW.CONFIG.resourceGrowth.treeRespawnEvery[1]);
  },
  scheduleTreeRespawn() {
    this.ensureGrowthState().treeRespawnTimer = this.nextTreeRespawnDelay();
  },
  update(dt) {
    const growth = this.ensureGrowthState();
    growth.treeRespawnTimer -= dt;
    if (growth.treeRespawnTimer > 0) return;
    const treeCount = PW.state.world.resources.filter((node) => node.type === "tree").length;
    if (treeCount >= PW.CONFIG.resourceGrowth.treeMax) {
      growth.treeRespawnTimer = PW.CONFIG.resourceGrowth.treeRetryEvery;
      return;
    }
    const spot = PW.MapGenerator.findTreeRespawnTile();
    if (spot && PW.MapGenerator.addResource("tree", spot.x, spot.y)) {
      this.scheduleTreeRespawn();
      return;
    }
    growth.treeRespawnTimer = PW.CONFIG.resourceGrowth.treeRetryEvery;
  },
  interactWithTarget(x, y) {
    const state = PW.state;
    const node = PW.Tiles.getResource(x, y);
    if (!node) return false;
    const def = PW.RESOURCE_NODES[node.type];
    const resourceDef = PW.RESOURCES[def.resource];
    if (state.player.selectedTool !== resourceDef.tool) {
      PW.Messages.add(`${def.name}: brauche ${resourceDef.tool === "axe" ? "Axt" : "Spitzhacke"}.`);
      return true;
    }
    node.hp -= 1;
    PW.Utils.addEffect("hit", PW.Utils.tileToWorld(x), PW.Utils.tileToWorld(y), def.color, 0.28, 1.1);
    if (node.hp <= 0) {
      PW.Utils.addInventory(def.resource, node.amount, { x: PW.Utils.tileToWorld(x), y: PW.Utils.tileToWorld(y) });
      this.remove(node);
    }
    return true;
  },
  remove(node) {
    const world = PW.state.world;
    world.resourceMap.delete(PW.Utils.tileKey(node.x, node.y));
    world.resources = world.resources.filter((item) => item !== node);
    PW.SpatialIndex.remove("resources", node);
    if (node.type === "tree") this.scheduleTreeRespawn();
  },
  nearestKnownResource(type) {
    const state = PW.state;
    const candidates = state.world.resources.filter((node) => {
      const def = PW.RESOURCE_NODES[node.type];
      return def.resource === type && PW.Fog.isKnown(node.x, node.y);
    });
    candidates.sort((a, b) => {
      const da = PW.Utils.distance(state.player.x, state.player.y, PW.Utils.tileToWorld(a.x), PW.Utils.tileToWorld(a.y));
      const db = PW.Utils.distance(state.player.x, state.player.y, PW.Utils.tileToWorld(b.x), PW.Utils.tileToWorld(b.y));
      return da - db;
    });
    return candidates[0] || null;
  },
  revealHint(type) {
    const state = PW.state;
    const candidates = state.world.resources.filter((node) => PW.RESOURCE_NODES[node.type].resource === type);
    if (!candidates.length) return;
    candidates.sort((a, b) => {
      const ship = state.ship;
      const cx = ship.x + ship.size / 2;
      const cy = ship.y + ship.size / 2;
      return Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy);
    });
    const node = candidates[0];
    PW.Tiles.circleTiles(node.x, node.y, 3).forEach(({ x, y }) => {
      state.world.fog[PW.Tiles.idx(x, y)] = Math.max(state.world.fog[PW.Tiles.idx(x, y)], 1);
    });
    PW.Messages.add(`Scanner-Hinweis: ${PW.RESOURCES[type].name} in Richtung ${this.directionFromShip(node.x, node.y)}.`);
  },
  directionFromShip(x, y) {
    const ship = PW.state.ship;
    const cx = ship.x + ship.size / 2;
    const cy = ship.y + ship.size / 2;
    const dx = x - cx;
    const dy = y - cy;
    if (Math.abs(dx) > Math.abs(dy) * 1.6) return dx > 0 ? "Osten" : "Westen";
    if (Math.abs(dy) > Math.abs(dx) * 1.6) return dy > 0 ? "Sueden" : "Norden";
    if (dx > 0 && dy > 0) return "Suedost";
    if (dx > 0 && dy < 0) return "Nordost";
    if (dx < 0 && dy > 0) return "Suedwest";
    return "Nordwest";
  }
};
