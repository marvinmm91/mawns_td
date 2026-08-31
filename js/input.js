"use strict";

PW.Input = {
  init() {
    window.addEventListener("keydown", (event) => {
      const state = PW.state;
      const key = event.key.toLowerCase();
      if (state.dom.gameDialog && state.dom.gameDialog.classList.contains("cheat-dialog")) return;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
      }
      if (key === "enter" && state.dom.gameDialog && state.dom.gameDialog.classList.contains("hidden")) {
        event.preventDefault();
      }
      if (!state.input.keys.has(key)) state.input.pressed.add(key);
      state.input.keys.add(key);
      this.handleHotkey(key);
    });
    window.addEventListener("keyup", (event) => {
      PW.state.input.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener("blur", () => {
      PW.state.input.keys.clear();
      PW.state.input.pressed.clear();
      this.stopBlueprintPainting();
      PW.state.paused = true;
      PW.UI.updatePause();
    });
    this.initMouse();
  },
  initMouse() {
    const canvas = PW.state.canvas;
    canvas.addEventListener("mousemove", (event) => {
      this.updateMouse(event);
      this.placeBlueprintWhileDragging();
    });
    canvas.addEventListener("mouseenter", (event) => {
      PW.state.mouse.inside = true;
      this.updateMouse(event);
    });
    canvas.addEventListener("mouseleave", () => {
      PW.state.mouse.inside = false;
      this.stopBlueprintPainting();
    });
    canvas.addEventListener("pointerup", () => {
      if (PW.state.input.blueprintPainting) PW.UI.renderPanel();
      this.stopBlueprintPainting();
    });
    canvas.addEventListener("pointercancel", () => {
      this.stopBlueprintPainting();
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
      if (event.button === 2) return;
      if (PW.state.paused || PW.state.reportOpen || PW.state.gameOver || PW.state.victory) return;
      if (PW.state.player.selectedTool === "build") {
        const action = this.buildAction();
        if (action === "blueprint" || action === "eraseBlueprint") {
          PW.state.input.blueprintPainting = true;
          PW.state.input.blueprintPaintAction = action;
          PW.state.input.blueprintPaintTile = { x: PW.state.mouse.tileX, y: PW.state.mouse.tileY };
          this.applyBlueprintAction(action, PW.state.mouse.tileX, PW.state.mouse.tileY);
        } else {
          PW.BuildingSystem.placeSelected(PW.state.mouse.tileX, PW.state.mouse.tileY);
        }
        PW.UI.renderPanel();
      } else {
        PW.UI.inspectTile(PW.state.mouse.tileX, PW.state.mouse.tileY);
      }
    });
  },
  placeBlueprintWhileDragging() {
    const state = PW.state;
    if (!state.input.blueprintPainting || state.player.selectedTool !== "build") return;
    const action = state.input.blueprintPaintAction;
    if (!action) return;
    const from = state.input.blueprintPaintTile || { x: state.mouse.tileX, y: state.mouse.tileY };
    const dx = state.mouse.tileX - from.x;
    const dy = state.mouse.tileY - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let step = 1; step <= steps; step++) {
      const x = Math.round(from.x + dx * step / steps);
      const y = Math.round(from.y + dy * step / steps);
      this.applyBlueprintAction(action, x, y, true);
    }
    state.input.blueprintPaintTile = { x: state.mouse.tileX, y: state.mouse.tileY };
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
    if (this.isDown("alt")) return "eraseBlueprint";
    if (this.isDown("control")) return "blueprint";
    return "build";
  },
  applyBlueprintAction(action, x, y, quiet = false) {
    if (action === "eraseBlueprint") return PW.BuildingSystem.removeBlueprintAt(x, y, !quiet);
    return PW.BuildingSystem.placeBlueprintSelected(x, y, quiet);
  },
  stopBlueprintPainting() {
    const input = PW.state.input;
    input.blueprintPainting = false;
    input.blueprintPaintTile = null;
    input.blueprintPaintAction = null;
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
  handleHotkey(key) {
    const state = PW.state;
    if (key === "enter") {
      PW.UI.showCheatDialog();
      return;
    }
    if (key === "p") {
      state.paused = !state.paused;
      PW.UI.updatePause();
      return;
    }
    if (key === "e") PW.UI.togglePanel("inventory");
    if (key === "r") PW.UI.togglePanel("ship");
    if (key === "o") PW.UI.togglePanel("design");
    if (key === "h") PW.UI.showHelp();
    if (key === "f3") PW.Performance.toggle();
    if (key === "f6") PW.Save.save(true);
    if (key === "f9") PW.Save.load(true);
    const tool = PW.CONFIG.tools.find((item) => item.key === key);
    if (tool) {
      state.player.selectedTool = tool.id;
      if (tool.id === "build") PW.UI.togglePanel("build", true);
      PW.UI.renderHud();
    }
  }
};
