"use strict";

const BETA_2_CHANGELOG = Object.freeze([
  "Roadmap und priorisierte Entwicklungsziele dokumentiert.",
  "Performance-Messung mit FPS- und Zeitwerten sowie ein reproduzierbarer Stresstest ergänzt.",
  "Räumlicher Index für sichtbare Ressourcen, Gebäude, Drops und Einheiten eingeführt.",
  "Aktualisierung des räumlichen Indexes bei Bewegungen und beim Laden verbessert.",
  "Kampfberechnungen auf räumliche Zielabfragen umgestellt.",
  "Turm-Zielprioritäten und kostenfreie Blaupausen ergänzt.",
  "Kartennadeln sowie bessere Lesbarkeit durch Zustandsfarben und Umrisse ergänzt.",
  "Verlassene Außenposten und sichtbare Schadenszustände für Bauwerke ergänzt.",
  "Blaupausen-Planung mit Strg-/Alt-Ziehen und verbesserter Eingabe umgesetzt.",
  "Schadens- und Ressourcenfeedback direkt an der Spielwelt ergänzt.",
  "Nacht-Overlay nach Feedback-Anzeigen korrigiert.",
  "Doppelten Baumenü-Zugang entfernt; Bauen läuft über Quickslot 4.",
  "Alle Türme von Anfang an verfügbar gemacht.",
  "Unnötige Aktions- und Ressourcenschadensmeldungen entfernt.",
  "Waldbewohner respawnen; Bäume und Endgame-Ressourcen wachsen nach.",
  "Energiezellen-Beschreibung an den 10-Prozent-Feuerratebonus angepasst.",
  "Gegnerrollen geschärft, Schwärme ergänzt und Turmökonomie automatisiert ausgewertet.",
  "Fehlenden Umlaut im Upgrade-Menü korrigiert."
]);

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
      <section class="difficulty-picker" aria-labelledby="difficultyTitle">
        <h3 id="difficultyTitle">Schwierigkeitsgrad</h3>
        <div class="difficulty-options" role="radiogroup">
          ${PW.CONFIG.difficulty.profiles.map((profile) => `<button type="button" class="difficulty-option" data-difficulty="${profile.id}" role="radio" aria-checked="${profile.id === PW.state.difficulty}"><strong>${profile.name}</strong><span>${profile.description}</span></button>`).join("")}
        </div>
      </section>
      <p>Steuerung: WASD/Pfeiltasten, Space fuer Aktion, E Inventar, R Wrack, P Pause.</p>
      <section class="start-changelog" aria-labelledby="beta2ChangelogTitle">
        <h3 id="beta2ChangelogTitle">Beta 2 – Änderungen seit Beta 1</h3>
        <div class="start-changelog-scroll">
          <ul>${BETA_2_CHANGELOG.map((entry) => `<li>${entry}</li>`).join("")}</ul>
        </div>
      </section>
    `, actions);
    document.querySelectorAll(".difficulty-option").forEach((button) => {
      button.addEventListener("click", () => {
        const profile = PW.Autobalance.difficultyProfile(button.dataset.difficulty);
        PW.state.difficulty = profile.id;
        document.querySelectorAll(".difficulty-option").forEach((option) => {
          const selected = option.dataset.difficulty === profile.id;
          option.classList.toggle("active", selected);
          option.setAttribute("aria-checked", String(selected));
        });
      });
      if (button.dataset.difficulty === PW.state.difficulty) button.classList.add("active");
    });
  }
};

document.addEventListener("DOMContentLoaded", () => PW.Bootstrap.init());
