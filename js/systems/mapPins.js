"use strict";

PW.MapPins = {
  definitions: {
    resource: { label: "Ressource", color: "#66c6a6" },
    chest: { label: "Schatztruhe", color: "#f3d36b" },
    camp: { label: "Monsterhorde", color: "#e35d57" },
    bridge: { label: "Brueckenplatz", color: "#83e3da" }
  },
  key(x, y) {
    return PW.Utils.tileKey(x, y);
  },
  get(x, y) {
    return PW.state.world.mapPinMap.get(this.key(x, y)) || null;
  },
  targetAt(x, y) {
    const resource = PW.Tiles.getResource(x, y);
    if (resource) return { kind: "resource", label: PW.RESOURCE_NODES[resource.type].name };
    if (PW.Tiles.getChest(x, y)) return { kind: "chest", label: "Schatztruhe" };
    if (PW.Tiles.getCamp(x, y)) return { kind: "camp", label: "Monsterhorde" };
    if (PW.Tiles.isWaterTile(x, y) && !PW.Tiles.isBridge(PW.Tiles.getBuilding(x, y))) {
      return { kind: "bridge", label: "Brueckenplatz" };
    }
    return null;
  },
  toggleAt(x, y) {
    const existing = this.get(x, y);
    if (existing) {
      this.removeAt(x, y);
      PW.Messages.add("Kartennadel entfernt.");
      return false;
    }
    const target = this.targetAt(x, y);
    if (!target) return false;
    const pin = { x, y, kind: target.kind, label: target.label };
    PW.state.world.mapPins.push(pin);
    PW.state.world.mapPinMap.set(this.key(x, y), pin);
    PW.Messages.add(`${target.label} markiert.`, "ok");
    return true;
  },
  removeAt(x, y) {
    const world = PW.state.world;
    const pin = this.get(x, y);
    if (!pin) return false;
    world.mapPins = world.mapPins.filter((entry) => entry !== pin);
    world.mapPinMap.delete(this.key(x, y));
    return true;
  },
  restore(savedPins) {
    const world = PW.state.world;
    world.mapPins = [];
    world.mapPinMap = new Map();
    (savedPins || []).forEach((pin) => {
      if (!pin || !Number.isInteger(pin.x) || !Number.isInteger(pin.y) || this.get(pin.x, pin.y)) return;
      const target = this.targetAt(pin.x, pin.y);
      if (!target || target.kind !== pin.kind) return;
      const restored = { x: pin.x, y: pin.y, kind: target.kind, label: target.label };
      world.mapPins.push(restored);
      world.mapPinMap.set(this.key(restored.x, restored.y), restored);
    });
  },
  update() {
    const world = PW.state.world;
    if (!world.mapPins.length) return;
    const validPins = world.mapPins.filter((pin) => {
      const target = this.targetAt(pin.x, pin.y);
      return target && target.kind === pin.kind;
    });
    if (validPins.length === world.mapPins.length) return;
    world.mapPins = validPins;
    world.mapPinMap = new Map(validPins.map((pin) => [this.key(pin.x, pin.y), pin]));
  }
};
