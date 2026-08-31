"use strict";

PW.Bootstrap = {
  init() {
    const state = PW.state;
    state.canvas = document.getElementById("gameCanvas");
    state.canvas.tabIndex = 0;
    state.ctx = state.canvas.getContext("2d");
    state.dom = {
      shipHpText: document.getElementById("shipHpText"),
      shipHpFill: document.getElementById("shipHpFill"),
      phaseName: document.getElementById("phaseName"),
      phaseTimer: document.getElementById("phaseTimer"),
      nightText: document.getElementById("nightText"),
      moduleText: document.getElementById("moduleText"),
      pauseOverlay: document.getElementById("pauseOverlay"),
      toastStack: document.getElementById("toastStack"),
      toolBar: document.getElementById("toolBar"),
      resourceBar: document.getElementById("resourceBar"),
      inventoryButton: document.getElementById("inventoryButton"),
      shipButton: document.getElementById("shipButton"),
      designButton: document.getElementById("designButton"),
      helpButton: document.getElementById("helpButton"),
      sidePanel: document.getElementById("sidePanel"),
      panelTitle: document.getElementById("panelTitle"),
      panelBody: document.getElementById("panelBody"),
      panelCloseButton: document.getElementById("panelCloseButton"),
      morningReport: document.getElementById("morningReport"),
      reportBody: document.getElementById("reportBody"),
      reportCloseButton: document.getElementById("reportCloseButton"),
      gameDialog: document.getElementById("gameDialog"),
      dialogTitle: document.getElementById("dialogTitle"),
      dialogBody: document.getElementById("dialogBody"),
      dialogActions: document.getElementById("dialogActions")
    };
    PW.PixelArt.init();
    PW.MapGenerator.generate();
    PW.Input.init();
    state.canvas.addEventListener("pointerdown", () => state.canvas.focus());
    PW.UI.initPanels();
    window.addEventListener("resize", () => PW.Camera.resize());
    if (window.ResizeObserver) {
      new ResizeObserver(() => PW.Camera.resize()).observe(state.canvas);
    }
    window.addEventListener("beforeunload", () => PW.Save.markReloadAndSave());
    PW.Camera.resize();
    PW.Progression.refreshUnlocks();
    PW.UI.renderHud();
    PW.UI.renderPanel();
    PW.GameLoop.start();
    this.showStartDialog(PW.Save.consumeReloadFlag());
  },
  focusGame() {
    window.focus();
    PW.state.canvas.focus({ preventScroll: true });
  },
  showStartDialog(fromReload = false) {
    PW.state.paused = true;
    const hasSave = PW.Save.hasSave();
    const actions = [];
    if (hasSave) {
      actions.push({ label: "Fortsetzen", action: () => {
        PW.UI.hideDialog();
        PW.Save.load(true);
        PW.state.paused = false;
        PW.UI.updatePause();
        PW.Bootstrap.focusGame();
      } });
    }
    actions.push({ label: hasSave ? "Neustart" : "Neue Partie", action: () => {
      if (hasSave) PW.Save.clear();
      PW.UI.hideDialog();
      PW.state.paused = false;
      PW.UI.updatePause();
      PW.Bootstrap.focusGame();
      PW.Messages.add("Tag 1: Sammle Holz und Stein, baue Palisaden und Ballisten.", "ok");
    } });
    PW.UI.showDialog("Planet-Wrack", `
      <p>Beschuetze das Wrack in der Kartenmitte, sammle Ressourcen, baue Verteidigung und repariere alle Schiffsmodule.</p>
      <p>Die Gegner greifen nachts das Wrack an. Du selbst wirst ignoriert, aber jede Sekunde ausserhalb der Basis fehlt beim Reparieren.</p>
      ${fromReload && hasSave ? "<p>Das Spiel wurde nach dem Aktualisieren gesichert. Du kannst fortsetzen oder neu starten.</p>" : ""}
      <p>Steuerung: WASD/Pfeiltasten, Space fuer Aktion, E Inventar, R Wrack, P Pause.</p>
    `, actions);
  }
};

document.addEventListener("DOMContentLoaded", () => PW.Bootstrap.init());
