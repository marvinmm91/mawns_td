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

const BETA_3_CHANGELOG = Object.freeze([
  "Fünf Schwierigkeitsstufen mit gespeicherter Auswahl und Vorschau für die nächste Nacht ergänzt.",
  "Classic und Aggressive als eigenständige Spielmodi eingeführt, einschließlich gespeicherter Auswahl und eigener Balance.",
  "Classic deutlich erweitert: mehr Gegner, weniger normaler Gegnerschaden und Palisaden als einzige neu baubare Mauer.",
  "Vollständige Blockaden sind im Classic-Modus erlaubt; eingeschlossene Gegner brechen sie gezielt mit massivem Strukturschaden auf.",
  "Reguläre Nächte enden erst nach dem letzten Wellengegner. Bereits gespawnte Gegner bleiben auch nach der Nacht aktiv.",
  "Feste Begegnungen für die ersten zehn Nächte sowie abwechslungsreiche, skalierende Kapitel bis weit über Nacht 60 ergänzt.",
  "Schwärme treten in sinnvollen Mindestgruppen auf; Gegner erhalten leicht unterschiedliche Bewegungsgeschwindigkeiten.",
  "Taktische Karte mit Erkundungsstand, Wrack, Spieler, Gegnern und Kartennadeln ergänzt.",
  "Entwicklungsmenü ersetzt die Benchmark-Sandbox: Testfaktoren, Zeitbeschleunigung, Nachtstart und Materialhilfe direkt im Spiel.",
  "Automatisches Balancing erhöht nach sehr leichten Nächten nur noch den Druck und zeigt seine Diagnose ausschließlich im Entwicklungsmenü.",
  "Turmziele auf Wracknähe, Letzter, Stärkster und Schwächster fokussiert; Klassik-Routen und Turmpositionen robuster gemacht.",
  "Bau- und Werkzeugsteuerung überarbeitet: Aktionen vor der Figur, Bauplanwechsel mit Taste 4, Mausradwechsel und wiederholte Aktionen beim Halten.",
  "Blaupausen sind dauerhaft umschaltbar, lassen sich mit einem Alt-Tipp entfernen und können gesammelt für 20 Prozent Mehrkosten errichtet werden.",
  "Reparaturwerkzeug verbessert nun vollständig reparierte Bauwerke; Bau- und Kontextfenster dienen als reine Statusansichten.",
  "DPS-Anzeigen, skalierte Gegnerbeute, Morgen-Tipps und weitere Hinweise zur Bedienung ergänzt."
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
      muteButton: document.getElementById("muteButton"),
      toolBar: document.getElementById("toolBar"),
      resourceBar: document.getElementById("resourceBar"),
      shipButton: document.getElementById("shipButton"),
      developmentButton: document.getElementById("developmentButton"),
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
      dialogActions: document.getElementById("dialogActions"),
      tacticalMap: document.getElementById("tacticalMap"),
      tacticalMapCanvas: document.getElementById("tacticalMapCanvas"),
      tacticalMapCloseButton: document.getElementById("tacticalMapCloseButton")
    };
    PW.Sound.init();
    PW.PixelArt.init();
    PW.MapGenerator.generate();
    PW.Input.init();
    PW.TacticalMap.init();
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
    const dialogDifficulty = hasSave ? PW.Save.savedDifficulty() : PW.state.difficulty;
    const dialogGameMode = hasSave ? PW.Save.savedGameMode() : PW.state.gameMode;
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
      if (hasSave) {
        PW.Save.reset();
        return;
      }
      PW.UI.hideDialog();
      PW.DayNight.setPhase("day");
      PW.state.paused = false;
      PW.UI.updatePause();
      PW.Bootstrap.focusGame();
      PW.Messages.add("Tag 1: Sammle Holz und Stein, baue Palisaden und Ballisten.", "ok");
    } });
    PW.UI.showDialog("Planet-Wrack", `
      <p>Beschütze das Wrack in der Kartenmitte, sammle Ressourcen, baue Verteidigung und repariere alle Schiffsmodule.</p>
      <p>Die Gegner greifen nachts das Wrack an. Du selbst wirst ignoriert, aber jede Sekunde ausserhalb der Basis fehlt beim Reparieren.</p>
      ${fromReload && hasSave ? "<p>Das Spiel wurde nach dem Aktualisieren gesichert. Du kannst fortsetzen oder neu starten.</p>" : ""}
      <section class="mode-picker${hasSave ? " mode-picker-readonly" : ""}" aria-labelledby="modeTitle">
        <h3 id="modeTitle">Spielmodus${hasSave ? " (gespeichert)" : ""}</h3>
        ${hasSave ? "<p class=\"meta\">Beim Fortsetzen ist diese Auswahl reine Information und nicht änderbar.</p>" : ""}
        <div class="mode-options" role="radiogroup">
          ${PW.CONFIG.gameModes.profiles.map((profile) => `<button type="button" class="mode-option" data-game-mode="${profile.id}" role="radio" aria-checked="${profile.id === dialogGameMode}"${hasSave ? " disabled" : ""}><strong>${profile.name}</strong><span>${profile.description}</span></button>`).join("")}
        </div>
      </section>
      <section class="difficulty-picker${hasSave ? " difficulty-picker-readonly" : ""}" aria-labelledby="difficultyTitle">
        <h3 id="difficultyTitle">Schwierigkeitsgrad${hasSave ? " (gespeichert)" : ""}</h3>
        ${hasSave ? "<p class=\"meta\">Beim Fortsetzen ist diese Auswahl reine Information und nicht änderbar.</p>" : ""}
        <div class="difficulty-options" role="radiogroup">
          ${PW.CONFIG.difficulty.profiles.map((profile) => `<button type="button" class="difficulty-option" data-difficulty="${profile.id}" role="radio" aria-checked="${profile.id === dialogDifficulty}"${hasSave ? " disabled" : ""}><strong>${profile.name}</strong><span>${profile.description}</span></button>`).join("")}
        </div>
      </section>
      <p>Steuerung: WASD/Pfeiltasten, Space für Aktion, R Wrack, M Karte, Z Zoom, P Pause.</p>
      <section class="start-changelog" aria-labelledby="beta3ChangelogTitle">
        <div class="start-changelog-scroll">
          <h3 id="beta3ChangelogTitle">Beta 3 – Änderungen seit Beta 2</h3>
          <ul>${BETA_3_CHANGELOG.map((entry) => `<li>${entry}</li>`).join("")}</ul>
          <hr class="start-changelog-separator">
          <h3 id="beta2ChangelogTitle">Beta 2 – Änderungen seit Beta 1</h3>
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
      if (button.dataset.difficulty === dialogDifficulty) button.classList.add("active");
    });
    document.querySelectorAll(".mode-option").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = PW.GameModes.profile(button.dataset.gameMode);
        PW.state.gameMode = mode.id;
        document.querySelectorAll(".mode-option").forEach((option) => {
          const selected = option.dataset.gameMode === mode.id;
          option.classList.toggle("active", selected);
          option.setAttribute("aria-checked", String(selected));
        });
      });
      if (button.dataset.gameMode === dialogGameMode) button.classList.add("active");
    });
  }
};

document.addEventListener("DOMContentLoaded", () => PW.Bootstrap.init());
