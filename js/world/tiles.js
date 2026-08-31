"use strict";

PW.Tiles = {
  idx(x, y) {
    return y * PW.state.world.width + x;
  },
  inBounds(x, y) {
    const world = PW.state.world;
    return x >= 0 && y >= 0 && x < world.width && y < world.height;
  },
  get(x, y) {
    if (!this.inBounds(x, y)) return null;
    return PW.state.world.tiles[this.idx(x, y)];
  },
  isShipTile(x, y) {
    const ship = PW.state.ship;
    return x >= ship.x && y >= ship.y && x < ship.x + ship.size && y < ship.y + ship.size;
  },
  getResource(x, y) {
    return PW.state.world.resourceMap.get(PW.Utils.tileKey(x, y)) || null;
  },
  getBuilding(x, y) {
    return PW.state.world.buildingMap.get(PW.Utils.tileKey(x, y)) || null;
  },
  getBlueprint(x, y) {
    return PW.state.world.blueprintMap.get(PW.Utils.tileKey(x, y)) || null;
  },
  getChest(x, y) {
    return (PW.state.world.treasureChests || []).find((chest) => !chest.opened && chest.x === x && chest.y === y) || null;
  },
  getCamp(x, y) {
    return (PW.state.world.monsterCamps || []).find((camp) => !camp.cleared && camp.tileX === x && camp.tileY === y) || null;
  },
  tileCenter(x, y) {
    const ts = PW.state.world.tileSize;
    return { x: x * ts + ts / 2, y: y * ts + ts / 2 };
  },
  isWaterKind(kind) {
    return kind === "water" || kind === "shallowWater";
  },
  isBridge(building) {
    return Boolean(building && building.type === "bridge");
  },
  isWaterTile(x, y) {
    const tile = this.get(x, y);
    return Boolean(tile && this.isWaterKind(tile.kind));
  },
  isBlockedForPlayer(x, y) {
    if (!this.inBounds(x, y)) return true;
    const tile = this.get(x, y);
    const building = this.getBuilding(x, y);
    if (this.isBridge(building)) return false;
    if (!tile || tile.blocked) return true;
    if (this.isShipTile(x, y)) return true;
    const resource = this.getResource(x, y);
    if (resource && PW.RESOURCE_NODES[resource.type].blocks) return true;
    if (this.getChest(x, y)) return true;
    if (this.getCamp(x, y)) return true;
    return Boolean(building);
  },
  isBlockedForGround(x, y) {
    if (!this.inBounds(x, y)) return true;
    const tile = this.get(x, y);
    const building = this.getBuilding(x, y);
    if (this.isBridge(building)) return false;
    if (!tile || tile.blocked) return true;
    if (this.isShipTile(x, y)) return false;
    const resource = this.getResource(x, y);
    if (resource && PW.RESOURCE_NODES[resource.type].blocks) return true;
    if (this.getChest(x, y)) return true;
    if (this.getCamp(x, y)) return true;
    return Boolean(building && PW.BUILDINGS[building.type].blocksGround);
  },
  canBuildAt(x, y) {
    if (!this.inBounds(x, y)) return false;
    if (this.isShipTile(x, y)) return false;
    if (this.getResource(x, y) || this.getBuilding(x, y) || this.getChest(x, y) || this.getCamp(x, y)) return false;
    const tile = this.get(x, y);
    return tile && !tile.blocked && !this.isWaterKind(tile.kind);
  },
  canBuildBridgeAt(x, y) {
    if (!this.inBounds(x, y)) return false;
    if (this.isShipTile(x, y)) return false;
    if (this.getResource(x, y) || this.getBuilding(x, y) || this.getChest(x, y) || this.getCamp(x, y)) return false;
    const tile = this.get(x, y);
    return Boolean(tile && this.isWaterKind(tile.kind));
  },
  circleTiles(cx, cy, radius) {
    const result = [];
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        if (this.inBounds(x, y) && Math.hypot(x - cx, y - cy) <= radius) result.push({ x, y });
      }
    }
    return result;
  }
};
