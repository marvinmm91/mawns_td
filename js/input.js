"use strict";

PW.Input = {
  init() {
    window.addEventListener("keydown", (event) => {
      const state = PW.state;
      const key = event.key.toLowerCase();
      if (state.dom.gameDialog && state.dom.gameDialog.classList.contains("cheat-dialog")) return;
      if (key === "m" && state.dom.gameDialog && !state.dom.gameDialog.classList.contains("hidden")) return;
      if (key === "m" || key === "escape") event.preventDefault();
      if (state.tacticalMapOpen && key !== "m" && key !== "escape") {
        event.preventDefault();
        return;
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
      }
      if (key === "enter" && state.dom.gameDialog && state.dom.gameDialog.classList.contains("hidden")) {
        event.preventDefault();
      }
      if (key === "alt" && state.player.selectedTool === "build" && state.player.buildMode === "blueprint") {
        event.preventDefault();
      }
      if (!state.input.keys.has(key)) state.input.pressed.add(key);
      state.input.keys.add(key);
      this.handleHotkey(key, event.repeat);
    });
    window.addEventListener("keyup", (event) => {
      PW.state.input.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener("blur", () => {
      PW.state.input.keys.clear();
      PW.state.input.pressed.clear();
      PW.state.input.mouseActionHeld = false;
      PW.state.paused = true;
      PW.UI.updatePause();
    });
    this.initMouse();
  },
  initMouse() {
    const canvas = PW.state.canvas;
    canvas.addEventListener("mousemove", (event) => {
      this.updateMouse(event);
    });
    canvas.addEventListener("mouseenter", (event) => {
      PW.state.mouse.inside = true;
      this.updateMouse(event);
    });
    canvas.addEventListener("mouseleave", () => {
      PW.state.mouse.inside = false;
    });
    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      PW.state.player.selectedTool = "axe";
      PW.state.panel = "status";
      PW.UI.renderHud();
      PW.UI.renderPanel();
    });
    canvas.addEventListener("pointerdown", (event) => {
      canvas.focus();
      this.updateMouse(event);
      if (event.button !== 0) return;
      if (PW.state.paused || PW.state.reportOpen || PW.state.gameOver || PW.state.victory) return;
      if (this.isInspectableTile(PW.state.mouse.tileX, PW.state.mouse.tileY)) {
        PW.state.input.mouseActionHeld = false;
        PW.UI.inspectTile(PW.state.mouse.tileX, PW.state.mouse.tileY);
      } else {
        PW.state.input.mouseActionHeld = true;
        if (Number.isInteger(event.pointerId)) canvas.setPointerCapture(event.pointerId);
        PW.Player.tryInteract();
      }
    });
    canvas.addEventListener("pointerup", (event) => {
      if (event.button === 0) PW.state.input.mouseActionHeld = false;
      if (Number.isInteger(event.pointerId) && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointercancel", (event) => {
      PW.state.input.mouseActionHeld = false;
      if (Number.isInteger(event.pointerId) && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      if (event.deltaY) this.cycleTool(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });
  },
  updateMouse(event) {
    const state = PW.state;
    const rect = state.canvas.getBoundingClientRect();
    if (Math.abs(state.camera.w - rect.width) > 0.5 || Math.abs(state.camera.h - rect.height) > 0.5) {
      PW.Camera.resize();
    }
    // The canvas can be resized by the surrounding panel without a window resize event.
    const scaleX = state.camera.w / Math.max(1, rect.width);
    const scaleY = state.camera.h / Math.max(1, rect.height);
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    state.mouse.x = localX * scaleX;
    state.mouse.y = localY * scaleY;
    state.mouse.worldX = state.mouse.x + state.camera.x;
    state.mouse.worldY = state.mouse.y + state.camera.y;
    state.mouse.tileX = PW.Utils.worldToTile(state.mouse.worldX);
    state.mouse.tileY = PW.Utils.worldToTile(state.mouse.worldY);
    state.mouse.inside = localX >= 0 && localY >= 0 && localX <= rect.width && localY <= rect.height;
  },
  buildAction() {
    return PW.state.player.buildMode === "blueprint" ? "blueprint" : "build";
  },
  applyBlueprintAction(action, x, y, quiet = false) {
    if (action === "eraseBlueprint") return PW.BuildingSystem.removeBlueprintAt(x, y, !quiet);
    return PW.BuildingSystem.placeBlueprintSelected(x, y, quiet);
  },
  removeBlueprintAhead() {
    const target = PW.Player.targetTile();
    return PW.BuildingSystem.removeBlueprintAt(target.x, target.y);
  },
  isInspectableTile(x, y) {
    if (!PW.Tiles.inBounds(x, y)) return false;
    return PW.Tiles.isShipTile(x, y) || Boolean(
      PW.Tiles.getBuilding(x, y) ||
      PW.Tiles.getBlueprint(x, y) ||
      PW.Tiles.getResource(x, y) ||
      PW.Tiles.getChest(x, y) ||
      PW.Tiles.getCamp(x, y) ||
      PW.Tiles.getOutpost(x, y) ||
      (PW.WildlifeSystem && PW.WildlifeSystem.atTile(x, y))
    );
  },
  selectTool(id) {
    const tool = PW.CONFIG.tools.find((item) => item.id === id);
    if (!tool) return false;
    const state = PW.state;
    const switchesToBuild = tool.id === "build" && state.player.selectedTool !== "build";
    state.player.selectedTool = tool.id;
    if (switchesToBuild) this.selectFirstBuild();
    if (tool.id === "build") PW.UI.togglePanel("build", true);
    PW.UI.showToolFeedback(tool.id, switchesToBuild ? state.selectedBuild : null);
    PW.UI.renderHud();
    return true;
  },
  cycleTool(direction) {
    const tools = PW.CONFIG.tools;
    const current = tools.findIndex((tool) => tool.id === PW.state.player.selectedTool);
    const index = (Math.max(0, current) + direction + tools.length) % tools.length;
    return this.selectTool(tools[index].id);
  },
  cycleBuild() {
    const state = PW.state;
    const options = this.availableBuildOptions();
    if (!options.length) return false;
    const current = options.findIndex((def) => def.id === state.selectedBuild);
    state.selectedBuild = options[(Math.max(0, current) + 1) % options.length].id;
    PW.UI.showToolFeedback("build", state.selectedBuild);
    PW.UI.renderHud();
    PW.UI.renderPanel();
    return true;
  },
  availableBuildOptions() {
    return Object.values(PW.BUILDINGS).filter((def) => PW.GameModes.allowsBuilding(def.id) && PW.state.unlockedBuildings.has(def.id));
  },
  selectFirstBuild() {
    const first = this.availableBuildOptions()[0];
    if (!first) return false;
    PW.state.selectedBuild = first.id;
    return true;
  },
  toggleBuildMode() {
    const state = PW.state;
    if (state.player.selectedTool !== "build") return false;
    state.player.buildMode = state.player.buildMode === "blueprint" ? "build" : "blueprint";
    PW.Messages.add(state.player.buildMode === "blueprint" ? "Blaupausenmodus aktiv." : "Baumodus aktiv.", "ok");
    PW.UI.renderHud();
    PW.UI.renderPanel();
    return true;
  },
  isDown(...keys) {
    return keys.some((key) => PW.state.input.keys.has(key));
  },
  consume(key) {
    const normalized = key.toLowerCase();
    if (!PW.state.input.pressed.has(normalized)) return false;
    PW.state.input.pressed.delete(normalized);
    return true;
  },
  endFrame() {
    PW.state.input.pressed.clear();
  },
  handleHotkey(key, repeating = false) {
    const state = PW.state;
    if (key === "control" && !repeating && this.toggleBuildMode()) return;
    if (key === "alt" && !repeating && state.player.selectedTool === "build" && state.player.buildMode === "blueprint") {
      this.removeBlueprintAhead();
      return;
    }
    if (key === "enter") {
      PW.UI.showCheatDialog();
      return;
    }
    if (key === "p") {
      state.paused = !state.paused;
      PW.UI.updatePause();
      return;
    }
    if (key === "m") {
      PW.TacticalMap.toggle();
      return;
    }
    if (key === "escape" && state.tacticalMapOpen) {
      PW.TacticalMap.close();
      return;
    }
    if (key === "r") PW.UI.togglePanel("ship");
    if (key === "h") PW.UI.showHelp();
    if (key === "f3") PW.Performance.toggle();
    if (key === "f6") PW.Save.save(true);
    if (key === "f9") PW.Save.load(true);
    const tool = PW.CONFIG.tools.find((item) => item.key === key);
    if (tool && !repeating) {
      if (tool.id === "build" && state.player.selectedTool === "build") this.cycleBuild();
      else this.selectTool(tool.id);
    }
  }
};
