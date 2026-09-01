"use strict";

PW.UI = PW.UI || {};

Object.assign(PW.UI, {
  renderHud() {
    const state = PW.state;
    const dom = state.dom;
    if (!dom.shipHpText) return;
    dom.shipHpText.textContent = `${Math.ceil(state.ship.hp)}/${state.ship.maxHp}`;
    const hpRatio = PW.Utils.clamp(state.ship.hp / state.ship.maxHp, 0, 1);
    dom.shipHpFill.style.width = `${hpRatio * 100}%`;
    dom.shipHpFill.style.background = hpRatio < 0.3 ? "#e35d57" : hpRatio < 0.6 ? "#d7c951" : "linear-gradient(90deg, #5fc772, #d7c951)";
    const phaseNames = { day: "Tag", dusk: "Dämmerung", night: state.ship.launchActive ? "Start" : "Nacht", dawn: "Morgen" };
    dom.phaseName.textContent = phaseNames[state.phase.current];
    dom.phaseTimer.textContent = state.ship.launchActive ? PW.Utils.formatTime(state.ship.launchTimer) : state.phase.current === "night" ? "Welle aktiv" : PW.Utils.formatTime(state.phase.timer);
    dom.nightText.textContent = String(state.phase.night);
    dom.moduleText.textContent = `${PW.Progression.repairedModuleCount()}/${Object.keys(PW.SHIP_MODULES).length}`;
    const toolKey = state.player.selectedTool;
    const resourceKey = Object.values(PW.RESOURCES).map((res) => `${res.id}:${state.inventory[res.id] || 0}`).join("|");
    this._hudCache = this._hudCache || {};
    if (this._hudCache.toolKey !== toolKey) {
      this._hudCache.toolKey = toolKey;
      this.renderTools();
    }
    if (this._hudCache.resourceKey !== resourceKey) {
      this._hudCache.resourceKey = resourceKey;
      this.renderResources();
    }
  },
  renderTools() {
    const bar = PW.state.dom.toolBar;
    if (!bar) return;
    bar.innerHTML = "";
    PW.CONFIG.tools.forEach((tool) => {
      const button = document.createElement("button");
      button.className = `tool-button ${PW.state.player.selectedTool === tool.id ? "active" : ""}`;
      button.type = "button";
      const key = document.createElement("span");
      key.className = "tool-key";
      key.textContent = tool.key;
      const label = document.createElement("strong");
      label.textContent = tool.label;
      const hint = document.createElement("span");
      hint.className = "tool-hint";
      hint.textContent = tool.hint;
      button.append(key, PW.Icons.toolCanvas(tool.id), label, hint);
      button.addEventListener("click", () => {
        PW.state.player.selectedTool = tool.id;
        if (tool.id === "build") this.togglePanel("build", true);
        this.renderHud();
      });
      bar.appendChild(button);
    });
  },
  renderResources() {
    const bar = PW.state.dom.resourceBar;
    if (!bar) return;
    bar.innerHTML = "";
    Object.values(PW.RESOURCES).forEach((res) => {
      const div = document.createElement("div");
      div.className = "resource-pill";
      div.style.borderColor = res.color;
      div.title = res.name;
      div.append(PW.Icons.resourceCanvas(res.id, 20), document.createTextNode(String(PW.state.inventory[res.id] || 0)));
      bar.appendChild(div);
    });
  },
  updatePause() {
    PW.state.dom.pauseOverlay.classList.toggle("hidden", !PW.state.paused);
  }
});
