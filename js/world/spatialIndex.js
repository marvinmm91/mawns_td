"use strict";

PW.SpatialIndex = {
  cellSize: 8,
  staticKinds: new Set(["resources", "buildings", "blueprints", "outposts"]),
  dynamicKinds: ["drops", "enemies", "birds", "wildlife", "projectiles"],
  reset() {
    const world = PW.state.world;
    world.spatialIndex = {
      cellSize: this.cellSize,
      buckets: {},
      ids: {},
      locations: {},
      sources: {},
      sourceCounts: {}
    };
    [...this.staticKinds, ...this.dynamicKinds].forEach((kind) => {
      world.spatialIndex.buckets[kind] = new Map();
      world.spatialIndex.ids[kind] = new Map();
      world.spatialIndex.locations[kind] = new Map();
      world.spatialIndex.sources[kind] = this.source(kind);
      world.spatialIndex.sourceCounts[kind] = 0;
    });
    return world.spatialIndex;
  },
  index() {
    const index = PW.state.world.spatialIndex;
    if (!index || index.cellSize !== this.cellSize || !index.ids || !index.locations || !index.sources) return this.reset();
    return index;
  },
  source(kind) {
    const state = PW.state;
    if (kind === "resources") return state.world.resources;
    if (kind === "buildings") return state.world.buildings;
    if (kind === "blueprints") return state.world.blueprints || [];
    if (kind === "outposts") return state.world.outposts || [];
    if (kind === "drops") return state.drops;
    if (kind === "enemies") return state.enemies;
    if (kind === "birds") return state.world.birds || [];
    if (kind === "wildlife") return state.world.wildlife || [];
    if (kind === "projectiles") return state.projectiles;
    return [];
  },
  tilePosition(kind, item) {
    if (kind === "resources" || kind === "buildings" || kind === "blueprints" || kind === "outposts") return { x: item.x, y: item.y };
    return { x: PW.Utils.worldToTile(item.x), y: PW.Utils.worldToTile(item.y) };
  },
  cellKey(tileX, tileY) {
    return `${Math.floor(tileX / this.cellSize)},${Math.floor(tileY / this.cellSize)}`;
  },
  rebuild(kind) {
    const index = this.index();
    const buckets = index.buckets[kind] || (index.buckets[kind] = new Map());
    const ids = index.ids[kind] || (index.ids[kind] = new Map());
    const locations = index.locations[kind] || (index.locations[kind] = new Map());
    buckets.clear();
    ids.clear();
    locations.clear();
    const source = this.source(kind);
    source.forEach((item) => this.addToBuckets(kind, item));
    index.sources[kind] = source;
    index.sourceCounts[kind] = source.length;
  },
  rebuildStatic() {
    this.rebuild("resources");
    this.rebuild("buildings");
    this.rebuild("blueprints");
    this.rebuild("outposts");
  },
  syncDynamic() {
    this.dynamicKinds.forEach((kind) => this.rebuild(kind));
  },
  addToBuckets(kind, item) {
    if (!item) return;
    const index = this.index();
    const buckets = index.buckets[kind] || (index.buckets[kind] = new Map());
    const ids = index.ids[kind] || (index.ids[kind] = new Map());
    const locations = index.locations[kind] || (index.locations[kind] = new Map());
    const pos = this.tilePosition(kind, item);
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    const key = this.cellKey(pos.x, pos.y);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
    if (item.id) ids.set(item.id, item);
    locations.set(item, key);
  },
  add(kind, item) {
    const index = this.index();
    const locations = index.locations[kind] || (index.locations[kind] = new Map());
    if (locations.has(item)) this.update(kind, item);
    else this.addToBuckets(kind, item);
    const source = this.source(kind);
    index.sources[kind] = source;
    index.sourceCounts[kind] = source.length;
  },
  update(kind, item) {
    const index = this.index();
    const buckets = index.buckets[kind] || (index.buckets[kind] = new Map());
    const locations = index.locations[kind] || (index.locations[kind] = new Map());
    if (!item) return;
    const pos = this.tilePosition(kind, item);
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    const nextKey = this.cellKey(pos.x, pos.y);
    const previousKey = locations.get(item);
    if (previousKey === nextKey) return;
    if (previousKey) this.removeFromBucket(buckets, previousKey, item);
    const bucket = buckets.get(nextKey);
    if (bucket) bucket.push(item);
    else buckets.set(nextKey, [item]);
    locations.set(item, nextKey);
  },
  removeFromBucket(buckets, key, item) {
    const bucket = buckets.get(key);
    if (!bucket) return;
    const next = bucket.filter((candidate) => candidate !== item);
    if (next.length) buckets.set(key, next);
    else buckets.delete(key);
  },
  remove(kind, item) {
    const index = this.index();
    const buckets = index.buckets[kind];
    const ids = index.ids[kind];
    const locations = index.locations[kind];
    if (!buckets || !item) return;
    const key = locations && locations.get(item);
    if (key) this.removeFromBucket(buckets, key, item);
    if (ids && item.id && ids.get(item.id) === item) ids.delete(item.id);
    if (locations) locations.delete(item);
    const source = this.source(kind);
    index.sources[kind] = source;
    index.sourceCounts[kind] = source.length;
  },
  ensure(kind) {
    const index = this.index();
    const source = this.source(kind);
    if (index.sources[kind] !== source || index.sourceCounts[kind] !== source.length) this.rebuild(kind);
  },
  visible(kind, bounds) {
    const index = this.index();
    this.ensure(kind);
    const buckets = index.buckets[kind];
    if (!buckets) return [];
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);
    const result = [];
    for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
      for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
        const bucket = buckets.get(`${cellX},${cellY}`);
        if (!bucket) continue;
        bucket.forEach((item) => {
          const pos = this.tilePosition(kind, item);
          if (pos.x >= bounds.minX && pos.x <= bounds.maxX && pos.y >= bounds.minY && pos.y <= bounds.maxY) result.push(item);
        });
      }
    }
    return result;
  },
  worldPosition(kind, item) {
    if (kind === "resources" || kind === "buildings" || kind === "blueprints" || kind === "outposts") return PW.Tiles.tileCenter(item.x, item.y);
    return { x: item.x, y: item.y };
  },
  nearby(kind, x, y, radius) {
    const safeRadius = Math.max(0, radius);
    const bounds = {
      minX: PW.Utils.worldToTile(x - safeRadius),
      maxX: PW.Utils.worldToTile(x + safeRadius),
      minY: PW.Utils.worldToTile(y - safeRadius),
      maxY: PW.Utils.worldToTile(y + safeRadius)
    };
    return this.visible(kind, bounds).filter((item) => {
      const pos = this.worldPosition(kind, item);
      return PW.Utils.distance(x, y, pos.x, pos.y) <= safeRadius;
    });
  },
  byId(kind, id) {
    this.ensure(kind);
    const ids = this.index().ids[kind];
    return ids ? ids.get(id) || null : null;
  },
  stats() {
    const index = this.index();
    const buckets = {};
    Object.entries(index.buckets).forEach(([kind, cells]) => { buckets[kind] = cells.size; });
    return { cellSize: index.cellSize, buckets };
  }
};
