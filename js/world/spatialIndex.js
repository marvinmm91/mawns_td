"use strict";

PW.SpatialIndex = {
  cellSize: 8,
  staticKinds: new Set(["resources", "buildings"]),
  dynamicKinds: ["drops", "enemies", "birds", "wildlife", "projectiles"],
  reset() {
    const world = PW.state.world;
    world.spatialIndex = {
      cellSize: this.cellSize,
      buckets: {},
      sourceCounts: {}
    };
    [...this.staticKinds, ...this.dynamicKinds].forEach((kind) => {
      world.spatialIndex.buckets[kind] = new Map();
      world.spatialIndex.sourceCounts[kind] = 0;
    });
    return world.spatialIndex;
  },
  index() {
    const index = PW.state.world.spatialIndex;
    if (!index || index.cellSize !== this.cellSize) return this.reset();
    return index;
  },
  source(kind) {
    const state = PW.state;
    if (kind === "resources") return state.world.resources;
    if (kind === "buildings") return state.world.buildings;
    if (kind === "drops") return state.drops;
    if (kind === "enemies") return state.enemies;
    if (kind === "birds") return state.world.birds || [];
    if (kind === "wildlife") return state.world.wildlife || [];
    if (kind === "projectiles") return state.projectiles;
    return [];
  },
  tilePosition(kind, item) {
    if (kind === "resources" || kind === "buildings") return { x: item.x, y: item.y };
    return { x: PW.Utils.worldToTile(item.x), y: PW.Utils.worldToTile(item.y) };
  },
  cellKey(tileX, tileY) {
    return `${Math.floor(tileX / this.cellSize)},${Math.floor(tileY / this.cellSize)}`;
  },
  rebuild(kind) {
    const index = this.index();
    const buckets = index.buckets[kind] || (index.buckets[kind] = new Map());
    buckets.clear();
    const source = this.source(kind);
    source.forEach((item) => this.addToBuckets(buckets, kind, item));
    index.sourceCounts[kind] = source.length;
  },
  rebuildStatic() {
    this.rebuild("resources");
    this.rebuild("buildings");
  },
  syncDynamic() {
    this.dynamicKinds.forEach((kind) => this.rebuild(kind));
  },
  addToBuckets(buckets, kind, item) {
    if (!item) return;
    const pos = this.tilePosition(kind, item);
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    const key = this.cellKey(pos.x, pos.y);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  },
  add(kind, item) {
    const index = this.index();
    const buckets = index.buckets[kind] || (index.buckets[kind] = new Map());
    this.addToBuckets(buckets, kind, item);
    index.sourceCounts[kind] = this.source(kind).length;
  },
  remove(kind, item) {
    const index = this.index();
    const buckets = index.buckets[kind];
    if (!buckets || !item) return;
    const pos = this.tilePosition(kind, item);
    const key = this.cellKey(pos.x, pos.y);
    const bucket = buckets.get(key);
    if (bucket) {
      const next = bucket.filter((candidate) => candidate !== item);
      if (next.length) buckets.set(key, next);
      else buckets.delete(key);
    }
    index.sourceCounts[kind] = this.source(kind).length;
  },
  visible(kind, bounds) {
    const index = this.index();
    const source = this.source(kind);
    if (this.staticKinds.has(kind) && index.sourceCounts[kind] !== source.length) this.rebuild(kind);
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
  stats() {
    const index = this.index();
    const buckets = {};
    Object.entries(index.buckets).forEach(([kind, cells]) => { buckets[kind] = cells.size; });
    return { cellSize: index.cellSize, buckets };
  }
};
