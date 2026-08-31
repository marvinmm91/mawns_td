"use strict";

PW.Input = {
  init() {
    window.addEventListener("keydown", (event) => {
      const state = PW.state;
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)) {
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
      PW.state.paused = true;
      PW.UI.updatePause();
    });
    this.initMouse();
  },
  initMouse() {
    const canvas = PW.state.canvas;
    canvas.addEventListener("mousemove", (event) => this.updateMouse(event));
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
      if (event.button === 2) return;
      if (PW.state.paused || PW.state.reportOpen || PW.state.gameOver || PW.state.victory) return;
      if (PW.state.player.selectedTool === "build") {
        PW.BuildingSystem.placeSelected(PW.state.mouse.tileX, PW.state.mouse.tileY);
        PW.UI.renderPanel();
      } else {
        PW.UI.inspectTile(PW.state.mouse.tileX, PW.state.mouse.tileY);
      }
    });
  },
  updateMouse(event) {
    const state = PW.state;
    const rect = state.canvas.getBoundingClientRect();
    state.mouse.x = event.clientX - rect.left;
    state.mouse.y = event.clientY - rect.top;
    state.mouse.worldX = state.mouse.x + state.camera.x;
    state.mouse.worldY = state.mouse.y + state.camera.y;
    state.mouse.tileX = PW.Utils.worldToTile(state.mouse.worldX);
    state.mouse.tileY = PW.Utils.worldToTile(state.mouse.worldY);
    state.mouse.inside = state.mouse.x >= 0 && state.mouse.y >= 0 && state.mouse.x <= rect.width && state.mouse.y <= rect.height;
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
    if (key === "p") {
      state.paused = !state.paused;
      PW.UI.updatePause();
      return;
    }
    if (key === "e") PW.UI.togglePanel("inventory");
    if (key === "b") PW.UI.togglePanel("build");
    if (key === "r") PW.UI.togglePanel("ship");
    if (key === "h") PW.UI.showHelp();
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
