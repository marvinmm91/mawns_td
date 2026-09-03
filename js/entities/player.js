"use strict";

PW.Player = {
  update(dt) {
    const state = PW.state;
    const player = state.player;
    player.actionCooldown = Math.max(0, player.actionCooldown - dt);

    let dx = 0;
    let dy = 0;
    if (PW.Input.isDown("a", "arrowleft")) dx -= 1;
    if (PW.Input.isDown("d", "arrowright")) dx += 1;
    if (PW.Input.isDown("w", "arrowup")) dy -= 1;
    if (PW.Input.isDown("s", "arrowdown")) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      player.dirX = Math.round(dx);
      player.dirY = Math.round(dy);
      this.move(dx * player.speed * dt, dy * player.speed * dt);
    }

    const actionPressed = PW.Input.consume(" ");
    const actionHeld = PW.Input.isDown(" ") || state.input.mouseActionHeld;
    if (actionPressed || actionHeld) this.tryInteract();
  },
  move(dx, dy) {
    const state = PW.state;
    const player = state.player;
    this.tryMove(dx, 0);
    this.tryMove(0, dy);
    player.x = PW.Utils.clamp(player.x, player.radius, state.world.width * state.world.tileSize - player.radius);
    player.y = PW.Utils.clamp(player.y, player.radius, state.world.height * state.world.tileSize - player.radius);
  },
  tryMove(dx, dy) {
    const player = PW.state.player;
    const nx = player.x + dx;
    const ny = player.y + dy;
    const r = player.radius;
    const points = [
      [nx - r, ny - r],
      [nx + r, ny - r],
      [nx - r, ny + r],
      [nx + r, ny + r]
    ];
    const blocked = points.some(([px, py]) => PW.Tiles.isBlockedForPlayer(PW.Utils.worldToTile(px), PW.Utils.worldToTile(py)));
    if (!blocked) {
      player.x = nx;
      player.y = ny;
    }
  },
  targetTile() {
    const state = PW.state;
    const px = PW.Utils.worldToTile(state.player.x);
    const py = PW.Utils.worldToTile(state.player.y);
    return {
      x: px + state.player.dirX * PW.CONFIG.playerInteractRange,
      y: py + state.player.dirY * PW.CONFIG.playerInteractRange
    };
  },
  tryInteract() {
    const player = PW.state.player;
    if (player.actionCooldown > 0) return false;
    const target = this.targetTile();
    const isGathering = (player.selectedTool === "axe" || player.selectedTool === "pickaxe") && Boolean(PW.Tiles.getResource(target.x, target.y));
    player.actionCooldown = isGathering ? PW.Perks.gatheringCooldown() : PW.CONFIG.actionRepeatInterval;
    this.interact();
    return true;
  },
  interact() {
    const state = PW.state;
    if (state.gameOver || state.victory || state.reportOpen) return;
    const target = this.targetTile();
    if (!PW.Tiles.inBounds(target.x, target.y)) return;

    if (state.player.selectedTool === "build") {
      const action = PW.Input.buildAction();
      if (action === "build") PW.BuildingSystem.placeSelected(target.x, target.y);
      else PW.Input.applyBlueprintAction(action, target.x, target.y);
      return;
    }
    if (PW.OutpostSystem && PW.OutpostSystem.interactAt(target.x, target.y)) return;
    if (PW.TreasureSystem && PW.TreasureSystem.openChestAt(target.x, target.y)) return;
    if (state.player.selectedTool === "repair") {
      const building = PW.Tiles.getBuilding(target.x, target.y);
      if (building) {
        if (building.hp < building.maxHp) PW.BuildingSystem.repairAt(target.x, target.y);
        else PW.BuildingSystem.upgrade(building.id);
        return;
      }
      if (PW.Tiles.isShipTile(target.x, target.y)) {
        PW.Progression.repairShip();
        return;
      }
    }
    if (state.player.selectedTool === "demolish") {
      PW.BuildingSystem.demolishAt(target.x, target.y);
      return;
    }
    if (PW.WildlifeSystem && PW.WildlifeSystem.attackAt(target.x, target.y)) return;
    if (PW.ResourceSystem.interactWithTarget(target.x, target.y)) return;
    if (PW.Tiles.isShipTile(target.x, target.y)) {
      PW.UI.togglePanel("ship", true);
      return;
    }
  }
};
