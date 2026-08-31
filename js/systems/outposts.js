"use strict";

PW.OutpostSystem = {
  variants: {
    cache: {
      name: "Versorgungslager",
      color: "#f0b84d",
      description: "Ein versiegeltes Lager mit sofort nutzbaren Baumaterialien.",
      rewards: { wood: 28, stone: 20, scrap: 12 }
    },
    research: {
      name: "Forschungsterminal",
      color: "#83e3da",
      description: "Ein Terminal mit einem geborgenen Bauplan.",
      rewards: { iron: 8, crystal: 4, parts: 2 }
    },
    beacon: {
      name: "Sicherheitsbake",
      color: "#e35d57",
      description: "Eine aktive Sicherung ruft eine kleine, ortsgebundene Wachgruppe.",
      rewards: { scrap: 26, iron: 10, parts: 3 }
    }
  },
  generateInitial() {
    const world = PW.state.world;
    world.outposts = [];
    world.outpostMap = new Map();
    const types = ["cache", "research", "beacon"];
    for (let i = 0; i < PW.CONFIG.outposts.count; i++) {
      const type = types[i % types.length];
      const site = this.findSite(PW.CONFIG.outposts.minShipDistance + i * 9);
      if (site) this.create(type, site.x, site.y);
    }
  },
  create(type, x, y) {
    const def = this.variants[type];
    if (!def || PW.Tiles.getOutpost(x, y)) return null;
    const ts = PW.state.world.tileSize;
    const outpost = {
      id: `outpost-${type}-${Date.now()}-${PW.state.world.outposts.length}`,
      type,
      x,
      y,
      status: "ready",
      guardRadius: PW.CONFIG.outposts.guardRadiusTiles * ts,
      defenderIds: [],
      unlockedBuilding: null
    };
    PW.state.world.outposts.push(outpost);
    PW.state.world.outpostMap.set(PW.Utils.tileKey(x, y), outpost);
    PW.SpatialIndex.add("outposts", outpost);
    return outpost;
  },
  restore(savedOutposts) {
    const world = PW.state.world;
    world.outposts = [];
    world.outpostMap = new Map();
    (savedOutposts || []).forEach((outpost) => {
      if (!outpost || !this.variants[outpost.type] || !Number.isInteger(outpost.x) || !Number.isInteger(outpost.y)) return;
      if (!PW.Tiles.inBounds(outpost.x, outpost.y) || world.outpostMap.has(PW.Utils.tileKey(outpost.x, outpost.y))) return;
      const restored = {
        id: outpost.id || `outpost-${outpost.type}-${outpost.x}-${outpost.y}`,
        type: outpost.type,
        x: outpost.x,
        y: outpost.y,
        status: ["ready", "active", "claimed"].includes(outpost.status) ? outpost.status : "ready",
        guardRadius: Number.isFinite(outpost.guardRadius) ? outpost.guardRadius : PW.CONFIG.outposts.guardRadiusTiles * PW.state.world.tileSize,
        defenderIds: Array.isArray(outpost.defenderIds) ? outpost.defenderIds : [],
        unlockedBuilding: outpost.unlockedBuilding || null
      };
      world.outposts.push(restored);
      world.outpostMap.set(PW.Utils.tileKey(restored.x, restored.y), restored);
    });
  },
  at(x, y) {
    return PW.Tiles.getOutpost(x, y);
  },
  byId(id) {
    return (PW.state.world.outposts || []).find((outpost) => outpost.id === id) || null;
  },
  findSite(minShipDistance) {
    const state = PW.state;
    const shipX = state.ship.x + state.ship.size / 2;
    const shipY = state.ship.y + state.ship.size / 2;
    for (let i = 0; i < 900; i++) {
      const x = state.rng.int(4, state.world.width - 5);
      const y = state.rng.int(4, state.world.height - 5);
      if (!PW.Tiles.canBuildAt(x, y) || Math.hypot(x - shipX, y - shipY) < minShipDistance) continue;
      if (!this.hasDefenceSpace(x, y) || this.tooCloseToObjective(x, y)) continue;
      return { x, y };
    }
    return null;
  },
  hasDefenceSpace(x, y) {
    return PW.Tiles.circleTiles(x, y, 3).filter((tile) =>
      (tile.x !== x || tile.y !== y) && PW.Tiles.canBuildAt(tile.x, tile.y)
    ).length >= 7;
  },
  tooCloseToObjective(x, y) {
    const spacing = PW.CONFIG.outposts.minSpacing;
    const chestNear = (PW.state.world.treasureChests || []).some((chest) => !chest.opened && Math.hypot(chest.x - x, chest.y - y) < 10);
    const campNear = (PW.state.world.monsterCamps || []).some((camp) => !camp.cleared && Math.hypot(camp.tileX - x, camp.tileY - y) < 11);
    const outpostNear = (PW.state.world.outposts || []).some((outpost) => Math.hypot(outpost.x - x, outpost.y - y) < spacing);
    return chestNear || campNear || outpostNear;
  },
  interactAt(x, y) {
    const outpost = this.at(x, y);
    if (!outpost) return false;
    if (outpost.status === "claimed") {
      PW.Messages.add("Dieser Aussenposten ist bereits gesichert.");
      return true;
    }
    if (outpost.type === "beacon") {
      if (outpost.status === "ready") {
        outpost.status = "active";
        this.spawnDefenders(outpost);
        PW.Utils.addEffect("outpostAlert", PW.Utils.tileToWorld(outpost.x), PW.Utils.tileToWorld(outpost.y), "#e35d57", 0.7, 1.5);
        PW.Messages.add("Sicherheitsbake aktiviert. Die Wachgruppe verteidigt das Gebiet.", "danger");
      } else {
        PW.Messages.add("Sicherheitsbake aktiv: Besiege die Wachgruppe mit lokalen Tuerme.");
      }
      PW.UI.renderPanel();
      return true;
    }
    this.claim(outpost);
    return true;
  },
  spawnDefenders(outpost) {
    if (outpost.defenderIds.length) return;
    const distance = PW.Utils.distance(
      PW.Utils.tileToWorld(outpost.x),
      PW.Utils.tileToWorld(outpost.y),
      PW.EnemySystem.shipCenter().x,
      PW.EnemySystem.shipCenter().y
    ) / PW.state.world.tileSize;
    const types = distance > 48 ? ["crawler", "swarm", "armored", "crawler"] : ["crawler", "swarm", "crawler"];
    types.forEach((type, index) => {
      const angle = index / types.length * Math.PI * 2;
      const radius = 28 + (index % 2) * 12;
      const enemy = PW.EnemySystem.spawn(type,
        PW.Utils.tileToWorld(outpost.x) + Math.cos(angle) * radius,
        PW.Utils.tileToWorld(outpost.y) + Math.sin(angle) * radius,
        { outpostId: outpost.id, outpostX: PW.Utils.tileToWorld(outpost.x), outpostY: PW.Utils.tileToWorld(outpost.y), outpostLeash: outpost.guardRadius }
      );
      outpost.defenderIds.push(enemy.id);
    });
  },
  noteEnemyKilled(enemy) {
    if (!enemy.outpostId) return;
    const outpost = this.byId(enemy.outpostId);
    if (!outpost || outpost.status !== "active") return;
    const anyAlive = PW.state.enemies.some((item) => item !== enemy && item.outpostId === outpost.id && item.hp > 0 && !item.remove);
    if (!anyAlive) this.claim(outpost);
  },
  claim(outpost) {
    if (!outpost || outpost.status === "claimed") return false;
    const def = this.variants[outpost.type];
    outpost.status = "claimed";
    if (outpost.type === "research") {
      outpost.unlockedBuilding = this.unlockResearch();
    }
    Object.entries(def.rewards).forEach(([id, amount]) => PW.Utils.addInventory(id, amount));
    PW.Utils.addEffect("outpostClaim", PW.Utils.tileToWorld(outpost.x), PW.Utils.tileToWorld(outpost.y), def.color, 0.8, 1.5);
    const extra = outpost.unlockedBuilding ? ` Bauplan ${PW.BUILDINGS[outpost.unlockedBuilding].name} freigeschaltet.` : "";
    PW.Messages.add(`${def.name} geborgen.${extra}`, "ok");
    PW.UI.renderHud();
    PW.UI.renderPanel();
    return true;
  },
  unlockResearch() {
    const candidates = ["flak", "catapult", "tesla", "laser"].filter((id) => !PW.state.unlockedBuildings.has(id));
    const building = candidates[0];
    if (!building) return null;
    PW.state.unlockedBuildings.add(building);
    return building;
  }
};
