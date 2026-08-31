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

    if (PW.Input.consume(" ") && player.actionCooldown <= 0) {
      player.actionCooldown = 0.16;
      this.interact();
    }
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
      if (PW.BuildingSystem.repairAt(target.x, target.y)) return;
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
    PW.Messages.add("Keine passende Aktion.");
  }
};
