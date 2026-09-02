"use strict";

Object.assign(PW.UI, {
  initPanels() {
    const dom = PW.state.dom;
    dom.inventoryButton.addEventListener("click", () => this.togglePanel("inventory"));
    dom.shipButton.addEventListener("click", () => this.togglePanel("ship"));
    dom.designButton.addEventListener("click", () => this.togglePanel("design"));
    dom.developmentButton.addEventListener("click", () => this.togglePanel("development"));
    dom.helpButton.addEventListener("click", () => this.showHelp());
    dom.panelCloseButton.addEventListener("click", () => this.showStatusPanel());
    dom.reportCloseButton.addEventListener("click", () => this.hideMorningReport());
  },
  togglePanel(name, forceOpen = false) {
    const state = PW.state;
    if (state.panel === name && !forceOpen) {
      this.showStatusPanel();
      return;
    }
    state.panel = name;
    this.renderPanel();
  },
  hidePanel() {
    this.showStatusPanel();
  },
  refreshInventoryDependentPanel() {
    const panel = PW.state.panel;
    if (panel === "build" || panel === "ship" || panel === "inventory" || panel === "context" || panel === "status") {
      this.renderPanel();
    }
  },
  showStatusPanel() {
    PW.state.panel = "status";
    PW.state.inspectedTile = null;
    this.renderPanel();
  },
  renderPanel() {
    const state = PW.state;
    const title = state.dom.panelTitle;
    const body = state.dom.panelBody;
    if (!state.panel || !body) return;
    state.dom.panelCloseButton.classList.toggle("hidden", state.panel === "status");
    if (state.panel === "status") {
      title.textContent = "Status";
      this.renderStatus(body);
    } else if (state.panel === "inventory") {
      title.textContent = "Inventar";
      this.renderInventory(body);
    } else if (state.panel === "build") {
      title.textContent = "Bauen";
      this.renderBuild(body);
    } else if (state.panel === "ship") {
      title.textContent = "Wrack";
      this.renderShip(body);
    } else if (state.panel === "design") {
      title.textContent = "Optik";
      this.renderDesign(body);
    } else if (state.panel === "development") {
      title.textContent = "Entwicklung";
      this.renderDevelopment(body);
    } else if (state.panel === "context") {
      this.renderContext(body);
    }
  },
  renderDevelopment(body) {
    const state = PW.state;
    const controls = [
      { id: "waveMultiplier", label: "Wellenmenge", hint: "Erhöht oder senkt das gesamte Gegnerbudget jeder kommenden Nacht. Mehr Budget bedeutet mehr Gegner und größere Gruppen." },
      { id: "enemyHpMultiplier", label: "Gegnerleben", hint: "Multipliziert die Lebenspunkte aller neu gespawnten Gegner. Bereits vorhandene Gegner bleiben unverändert." },
      { id: "enemyDamageMultiplier", label: "Gegnerschaden", hint: "Multipliziert den Schaden, den Gegner am Wrack und an Bauwerken verursachen." },
      { id: "enemySpeedMultiplier", label: "Gegnertempo", hint: "Multipliziert die Bewegungsgeschwindigkeit aller neu gespawnten Gegner." }
    ];
    body.innerHTML = "";
    const factors = document.createElement("section");
    factors.className = "development-section";
    factors.innerHTML = "<h3>Schwierigkeit</h3>";
    controls.forEach((control) => {
      const value = PW.Development.factor(control.id);
      const row = document.createElement("div");
      row.className = "development-control";
      row.title = control.hint;
      const label = document.createElement("span");
      label.textContent = control.label;
      const output = document.createElement("output");
      output.textContent = `${value.toFixed(2)}x`;
      const buttons = document.createElement("div");
      buttons.className = "development-factor-buttons";
      [-0.05, 0.05].forEach((amount) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = amount < 0 ? "-" : "+";
        button.title = `${amount < 0 ? "Verringert" : "Erhöht"} ${control.label} um 0,05.`;
        button.setAttribute("aria-label", button.title);
        button.addEventListener("click", () => {
          PW.Development.adjustFactor(control.id, amount);
          output.textContent = `${PW.Development.factor(control.id).toFixed(2)}x`;
        });
        buttons.appendChild(button);
      });
      row.append(label, output, buttons);
      factors.appendChild(row);
    });
    body.appendChild(factors);

    const autobalance = document.createElement("section");
    autobalance.className = "development-section";
    const forecastNight = state.wave.active ? state.phase.night : state.phase.night + 1;
    const forecast = PW.Autobalance.forecastForNight(forecastNight);
    autobalance.innerHTML = `<h3>Automatische Steigerung</h3><div class="meta" title="Dieser interne Faktor kann nach besonders souveränen Nächten nur steigen. Er senkt die Schwierigkeit niemals automatisch.">Aktueller Zusatzdruck: ${Math.round(state.balance.drift * 100)}%. Nächste Nacht: ${forecast.label} (${Math.ceil(forecast.budget)} Budget).</div>`;
    body.appendChild(autobalance);

    const simulation = document.createElement("section");
    simulation.className = "development-section";
    simulation.innerHTML = "<h3>Simulation</h3>";
    const speeds = document.createElement("div");
    speeds.className = "development-speeds";
    [1, 2, 3].forEach((speed) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${speed}x`;
      button.title = speed === 1 ? "Normale Spielgeschwindigkeit." : `Beschleunigt den gesamten Spielablauf auf ${speed}fache Geschwindigkeit.`;
      button.classList.toggle("active", PW.Development.factor("timeScale") === speed);
      button.addEventListener("click", () => {
        PW.Development.setFactor("timeScale", speed);
        this.renderDevelopment(body);
      });
      speeds.appendChild(button);
    });
    const night = document.createElement("button");
    night.type = "button";
    night.textContent = "Nächste Nacht starten";
    night.title = "Beendet die aktuelle friedliche Phase und startet sofort die nächste normale Nachtwelle. Während einer aktiven Nacht ist der Knopf nicht verfügbar.";
    night.disabled = state.paused || state.gameOver || state.victory || state.ship.launchActive || state.phase.current === "night" || state.wave.active;
    night.addEventListener("click", () => {
      if (PW.Development.startNextNight()) this.renderDevelopment(body);
    });
    simulation.append(speeds, night);
    body.appendChild(simulation);

    const resources = document.createElement("section");
    resources.className = "development-section";
    resources.innerHTML = "<h3>Rohstoffe</h3><div class=\"meta\">Füllt jeden Rohstoff im Inventar auf.</div>";
    const grantResources = document.createElement("button");
    grantResources.type = "button";
    grantResources.textContent = "200 von jedem Rohstoff geben";
    grantResources.title = "Gibt dem Inventar 200 von jedem bekannten Rohstoff und Gegenstand.";
    grantResources.addEventListener("click", () => PW.Development.grantAllResources(200));
    resources.appendChild(grantResources);
    body.appendChild(resources);
  },
  renderStatus(body) {
    const state = PW.state;
    const gameMode = PW.GameModes.profile();
    body.innerHTML = "";
    const phaseNames = { day: "Tag", dusk: "Dämmerung", night: state.ship.launchActive ? "Startsequenz" : "Nacht", dawn: "Morgen" };
    const stats = document.createElement("div");
    stats.className = "stat-grid";
    stats.innerHTML = `
      <div class="stat-box"><span>Phase</span><strong>${phaseNames[state.phase.current]}</strong></div>
      <div class="stat-box"><span>${state.phase.current === "night" && !state.ship.launchActive ? "Nacht" : "Timer"}</span><strong>${state.phase.current === "night" && !state.ship.launchActive ? "Welle aktiv" : PW.Utils.formatTime(state.ship.launchActive ? state.ship.launchTimer : state.phase.timer)}</strong></div>
      <div class="stat-box"><span>Gegner</span><strong>${state.enemies.length}</strong></div>
      <div class="stat-box"><span>Bauwerke</span><strong>${state.world.buildings.length}</strong></div>
      <div class="stat-box"><span>Truhen</span><strong>${(state.world.treasureChests || []).filter((chest) => !chest.opened).length}</strong></div>
      <div class="stat-box"><span>Horden</span><strong>${(state.world.monsterCamps || []).filter((camp) => !camp.cleared).length}</strong></div>
      <div class="stat-box"><span>${state.wave.active ? "Restbudget" : "Nächste Welle"}</span><strong>${state.wave.active ? Math.ceil(state.wave.budgetRemaining) : "Bereit"}</strong></div>
      <div class="stat-box"><span>Schwierigkeit</span><strong>${PW.Autobalance.difficultyProfile().shortName}</strong></div>
      <div class="stat-box"><span>Spielmodus</span><strong>${gameMode.shortName}</strong></div>
      <div class="stat-box"><span>Moduswellen</span><strong>${Math.round(gameMode.waveMultiplier * 100)}%</strong></div>
    `;
    body.appendChild(stats);
    const build = document.createElement("div");
    build.className = "build-card";
    const selected = PW.BUILDINGS[state.selectedBuild];
    const mode = state.player.buildMode === "blueprint" ? "Blaupause" : "Bauen";
    build.innerHTML = `<h3>Aktiver Bauplan</h3><div class="meta">${selected ? selected.name : "Keiner"}. Modus: ${mode}. Werkzeug 4 und Leertaste oder Klick auf freies Gelände baut vor der Figur; Strg wechselt den Modus.</div>`;
    if (selected) {
      const costs = document.createElement("div");
      costs.className = "costs";
      this.renderCostChips(costs, selected.cost);
      build.appendChild(costs);
    }
    body.appendChild(build);
    if (state.lastReport) {
      const report = document.createElement("div");
      report.className = "build-card";
      report.innerHTML = `<h3>Letzte Nacht</h3><div class="meta">Schaden ${state.lastReport.damage}, Kills ${state.lastReport.kills}, Mauern verloren ${state.lastReport.wallsDestroyed}.</div>`;
      body.appendChild(report);
    }
  },
  renderInventory(body) {
    body.innerHTML = "";
    Object.values(PW.RESOURCES).forEach((res) => {
      const row = document.createElement("div");
      row.className = "report-row";
      const title = document.createElement("div");
      title.className = "build-title";
      const heading = document.createElement("h3");
      heading.style.color = res.color;
      heading.append(PW.Icons.resourceCanvas(res.id, 20), document.createTextNode(res.name));
      const amount = document.createElement("strong");
      amount.textContent = String(PW.state.inventory[res.id] || 0);
      title.append(heading, amount);
      row.appendChild(title);
      body.appendChild(row);
    });
    const actions = document.createElement("div");
    actions.className = "build-card";
    actions.innerHTML = `<h3>Speicherstand</h3><div class="meta">F6 speichert, F9 lädt. Autosave läuft alle ${PW.CONFIG.autosaveEvery} Sekunden.</div>`;
    const save = document.createElement("button");
    save.textContent = "Speichern";
    save.addEventListener("click", () => PW.Save.save(true));
    const load = document.createElement("button");
    load.textContent = "Laden";
    load.addEventListener("click", () => PW.Save.load(true));
    const reset = document.createElement("button");
    reset.textContent = "Neustart";
    reset.addEventListener("click", () => PW.UI.confirmReset());
    actions.append(save, load, reset);
    body.appendChild(actions);
  },
  renderBuild(body) {
    body.innerHTML = "";
    this.renderBlueprintControls(body);
    Object.values(PW.BUILDINGS).filter((def) => PW.GameModes.allowsBuilding(def.id)).forEach((def) => {
      const unlocked = PW.state.unlockedBuildings.has(def.id);
      const affordable = PW.Utils.canAfford(def.cost);
      const card = document.createElement("div");
      card.className = "build-card";
      const selected = PW.state.selectedBuild === def.id ? "ok-text" : "";
      const hpText = def.maxHp ? `${def.maxHp} HP` : "";
      const titleRow = document.createElement("div");
      titleRow.className = "build-title";
      const heading = document.createElement("h3");
      heading.className = selected;
      const preview = PW.Icons.buildingCanvas(def.id, 32);
      heading.appendChild(preview);
      heading.appendChild(document.createTextNode(def.name));
      const hp = document.createElement("strong");
      hp.textContent = hpText;
      titleRow.append(heading, hp);
      const description = document.createElement("div");
      description.className = "meta";
      description.textContent = def.description;
      const costs = document.createElement("div");
      costs.className = "costs";
      this.renderCostChips(costs, def.cost);
      const stateText = document.createElement("div");
      stateText.className = "meta";
      stateText.textContent = unlocked ? (affordable ? "Bereit." : "Material fehlt.") : this.buildingUnlockText(def);
      card.append(titleRow, description, costs, stateText);
      if (def.category === "tower") card.appendChild(this.towerStatsLine(def, 1));
      const button = document.createElement("button");
      button.textContent = PW.state.selectedBuild === def.id ? "Ausgewählt" : "Auswählen";
      button.disabled = !unlocked;
      button.addEventListener("click", () => {
        PW.state.selectedBuild = def.id;
        PW.state.player.selectedTool = "build";
        this.renderHud();
        this.renderPanel();
      });
      card.appendChild(button);
      body.appendChild(card);
    });
  },
  renderBlueprintControls(body) {
    const state = PW.state;
    const card = document.createElement("div");
    card.className = "build-card";
    const mode = state.player.buildMode === "blueprint" ? "aktiv" : "inaktiv";
    card.innerHTML = `<h3>Blaupausen</h3><div class="meta">Blaupausenmodus: ${mode}. Strg schaltet dauerhaft um. Ein Tipp auf Alt entfernt die Blaupause vor der Figur.</div>`;
    const blueprints = state.world.blueprints || [];
    const summary = document.createElement("div");
    summary.className = "meta";
    summary.textContent = blueprints.length ? `${blueprints.length} Blaupausen vorgemerkt.` : "Keine Blaupausen vorgemerkt.";
    card.appendChild(summary);
    if (blueprints.length) {
      const totalCost = PW.BuildingSystem.blueprintCost(blueprints);
      const totalTitle = document.createElement("div");
      totalTitle.className = "meta";
      totalTitle.textContent = "Einzelbau: Gesamtbedarf";
      const totalCosts = document.createElement("div");
      totalCosts.className = "costs";
      this.renderCostChips(totalCosts, totalCost);
      const batchTitle = document.createElement("div");
      batchTitle.className = "meta";
      batchTitle.textContent = "Sammelbau: 20 % höhere Baukosten (aufgerundet)";
      const batchCosts = document.createElement("div");
      batchCosts.className = "costs";
      this.renderCostChips(batchCosts, PW.BuildingSystem.blueprintBatchCost(blueprints));
      const buildAll = document.createElement("button");
      buildAll.type = "button";
      buildAll.textContent = "Alle errichten (+20 %)";
      buildAll.title = "Errichtet alle Blaupausen gemeinsam für 20 % mehr Material.";
      buildAll.disabled = !PW.Utils.canAfford(PW.BuildingSystem.blueprintBatchCost(blueprints)) || !PW.BuildingSystem.canBuildAllBlueprints(blueprints);
      buildAll.addEventListener("click", () => PW.BuildingSystem.buildAllBlueprints());
      const removeAll = document.createElement("button");
      removeAll.type = "button";
      removeAll.textContent = "Alle Blaupausen entfernen";
      removeAll.title = "Entfernt alle vorgemerkten Blaupausen ohne Materialkosten.";
      removeAll.addEventListener("click", () => PW.BuildingSystem.removeAllBlueprints());
      card.append(totalTitle, totalCosts, batchTitle, batchCosts, buildAll, removeAll);
    }
    body.appendChild(card);
  },
  renderCostChips(container, cost) {
    Object.entries(cost).forEach(([id, required]) => {
      const have = PW.state.inventory[id] || 0;
      const missing = Math.max(0, required - have);
      const progress = Math.max(0, Math.min(1, have / Math.max(1, required)));
      const chip = document.createElement("span");
      chip.className = `cost-chip ${missing ? "short" : "ready"}`;
      chip.title = `${PW.RESOURCES[id].name}: ${have}/${required}`;
      chip.style.setProperty("--fill", `${Math.round(progress * 100)}%`);
      chip.appendChild(PW.Icons.resourceCanvas(id, 20));
      const text = document.createElement("span");
      text.textContent = missing ? `${PW.RESOURCES[id].name} (${have}/${required})` : `${have}/${required}`;
      chip.appendChild(text);
      container.appendChild(chip);
    });
  },
  towerStatsLine(def, level, nextLevel = null) {
    const format = (value) => Number(value).toLocaleString("de-DE", { maximumFractionDigits: 1 });
    const stats = PW.Combat.towerStats(def, level);
    const statText = (values) => `Schaden ${Math.round(values.damage)} | ${Math.round(values.rate * 60)} Schuss/min | ${format(values.damage * values.rate)} DPS`;
    const line = document.createElement("div");
    line.className = "tower-stats";
    line.textContent = nextLevel ? `${statText(stats)} -> ${statText(PW.Combat.towerStats(def, nextLevel))}` : statText(stats);
    return line;
  },
  buildingUnlockText(def) {
    const requirements = [];
    if (PW.state.phase.night < (def.unlockNight || 0)) requirements.push(`ab Nacht ${def.unlockNight}`);
    const unknownResources = (def.requiresKnown || []).filter((id) => !PW.state.knownResources.has(id));
    if (unknownResources.length) {
      const resourceNames = unknownResources.map((id) => PW.RESOURCES[id].name);
      requirements.push(`${resourceNames.join(" oder ")} entdecken`);
    }
    return requirements.length ? `Freischaltung: ${requirements.join("; ")}.` : "Noch nicht freigeschaltet.";
  },
  renderShip(body) {
    const state = PW.state;
    body.innerHTML = "";
    const status = document.createElement("div");
    status.className = "build-card";
    status.innerHTML = `<h3>Wrackstruktur</h3><div class="meta">${Math.ceil(state.ship.hp)} von ${state.ship.maxHp} HP. Reparatur nur mit Werkzeug 3 am Wrack.</div>`;
    body.appendChild(status);

    Object.values(PW.SHIP_MODULES).forEach((mod) => {
      const repaired = state.ship.modules[mod.id];
      const unlocked = state.phase.night >= mod.unlockNight && (!mod.requiresKnown || mod.requiresKnown.some((id) => state.knownResources.has(id)));
      const row = document.createElement("div");
      row.className = "module-row";
      row.innerHTML = `
        <h3>${mod.name} ${repaired ? "<span class=\"ok-text\">repariert</span>" : ""}</h3>
        <div class="meta">${mod.description}</div>
        <div class="meta">${mod.effect}</div>
      `;
      const costs = document.createElement("div");
      costs.className = "costs";
      this.renderCostChips(costs, mod.cost);
      row.appendChild(costs);
      const button = document.createElement("button");
      button.textContent = repaired ? "Fertig" : unlocked ? "Modul reparieren" : "Noch nicht analysiert";
      button.disabled = repaired || !unlocked || !PW.Utils.canAfford(mod.cost);
      button.addEventListener("click", () => PW.Progression.repairModule(mod.id));
      row.appendChild(button);
      body.appendChild(row);
    });

    const launch = document.createElement("div");
    launch.className = "build-card";
    launch.innerHTML = `<h3>Startsequenz</h3><div class="meta">Alle Module, Nacht 10 und mindestens 70 Prozent Wrack-HP benötigt.</div>`;
    const launchButton = document.createElement("button");
    launchButton.textContent = "Startsequenz beginnen";
    launchButton.disabled = !PW.Progression.canStartLaunch();
    launchButton.addEventListener("click", () => PW.Progression.startLaunch());
    launch.appendChild(launchButton);
    body.appendChild(launch);
  },
  inspectTile(x, y) {
    if (!PW.Tiles.inBounds(x, y)) return;
    if (PW.Tiles.isShipTile(x, y)) {
      this.togglePanel("ship", true);
      return;
    }
    PW.state.inspectedTile = { x, y };
    PW.state.panel = "context";
    this.renderPanel();
  },
  renderContext(body) {
    const state = PW.state;
    const tile = state.inspectedTile;
    if (!tile) {
      this.showStatusPanel();
      return;
    }
    const title = state.dom.panelTitle;
    body.innerHTML = "";
    const resource = PW.Tiles.getResource(tile.x, tile.y);
    const chest = PW.Tiles.getChest(tile.x, tile.y);
    const camp = PW.Tiles.getCamp(tile.x, tile.y);
    const outpost = PW.Tiles.getOutpost(tile.x, tile.y);
    const wildlife = PW.WildlifeSystem ? PW.WildlifeSystem.atTile(tile.x, tile.y) : null;
    const building = PW.Tiles.getBuilding(tile.x, tile.y);
    const blueprint = PW.Tiles.getBlueprint(tile.x, tile.y);
    if (building) {
      this.renderBuildingContext(body, building);
      title.textContent = PW.BUILDINGS[building.type].name;
      return;
    }
    if (blueprint) {
      this.renderBlueprintContext(body, blueprint);
      title.textContent = `${PW.BUILDINGS[blueprint.type].name} (Blaupause)`;
      return;
    }
    if (resource) {
      this.renderResourceContext(body, resource);
      this.renderMapPinControl(body, tile.x, tile.y);
      title.textContent = PW.RESOURCE_NODES[resource.type].name;
      return;
    }
    if (wildlife) {
      this.renderWildlifeContext(body, wildlife);
      title.textContent = PW.WILDLIFE.critters[wildlife.type].name;
      return;
    }
    if (chest) {
      this.renderChestContext(body, chest);
      this.renderMapPinControl(body, tile.x, tile.y);
      title.textContent = "Schatztruhe";
      return;
    }
    if (camp) {
      this.renderCampContext(body, camp);
      this.renderMapPinControl(body, tile.x, tile.y);
      title.textContent = "Monsterhorde";
      return;
    }
    if (outpost) {
      this.renderOutpostContext(body, outpost);
      title.textContent = PW.OutpostSystem.variants[outpost.type].name;
      return;
    }
    const ground = PW.Tiles.get(tile.x, tile.y);
    title.textContent = "Kachel";
    const card = document.createElement("div");
    card.className = "build-card";
    card.innerHTML = `<h3>${tile.x}/${tile.y}</h3>`;
    card.appendChild(this.infoLine("Terrain", this.tileLabel(ground)));
    card.appendChild(this.infoLine("Status", PW.Tiles.canBuildAt(tile.x, tile.y) || PW.Tiles.canBuildBridgeAt(tile.x, tile.y) ? "Bebaubar" : "Blockiert"));
    body.appendChild(card);
    this.renderMapPinControl(body, tile.x, tile.y);
  },
  renderMapPinControl(body, x, y) {
    const target = PW.MapPins.targetAt(x, y);
    if (!target) return;
    const pin = PW.MapPins.get(x, y);
    const card = document.createElement("div");
    card.className = "build-card";
    card.appendChild(this.infoLine("Kartennadel", pin ? "gesetzt" : target.label));
    const button = document.createElement("button");
    button.textContent = pin ? "Nadel entfernen" : "Nadel setzen";
    button.addEventListener("click", () => {
      PW.MapPins.toggleAt(x, y);
      this.inspectTile(x, y);
    });
    card.appendChild(button);
    body.appendChild(card);
  },
  tileLabel(tile) {
    if (!tile) return "Unbekannt";
    if (tile.kind === "water") return "Tiefes Wasser";
    if (tile.kind === "shallowWater") return tile.ford ? "Furt" : "Bach";
    if (tile.kind === "wetland") return "Feuchtwiese";
    if (tile.kind === "forestFloor") return "Waldboden";
    if (tile.kind === "ridge") return "Felskante";
    return "Wiese";
  },
  renderBuildingContext(body, building) {
    const def = PW.BUILDINGS[building.type];
    const card = document.createElement("div");
    card.className = "build-card";
    const titleRow = document.createElement("div");
    titleRow.className = "build-title";
    const heading = document.createElement("h3");
    heading.append(PW.Icons.buildingCanvas(building.type, 32), document.createTextNode(def.name));
    const hp = document.createElement("strong");
    hp.textContent = `${Math.ceil(building.hp)}/${building.maxHp} HP`;
    titleRow.append(heading, hp);
    card.appendChild(titleRow);
    card.appendChild(this.infoLine("Position", `${building.x}/${building.y}`));
    card.appendChild(this.infoLine("Stufe", String(building.level)));
    if (def.category === "tower") {
      const stats = PW.Combat.towerStats(def, building.level);
      card.appendChild(this.infoLine("Einsatz", def.description));
      card.appendChild(this.infoLine("Schaden", `${Math.round(stats.damage)}`));
      card.appendChild(this.infoLine("Schussrate", `${Math.round(stats.rate * 60)} / min`));
      card.appendChild(this.infoLine("DPS", Number(stats.damage * stats.rate).toLocaleString("de-DE", { maximumFractionDigits: 1 })));
      card.appendChild(this.infoLine("Reichweite", `${stats.range.toFixed(1)} Felder`));
      card.appendChild(this.infoLine("Ziele", def.targets.includes("air") && def.targets.includes("ground") ? "Boden + Luft" : def.targets.includes("air") ? "Luft" : "Boden"));
      const priority = document.createElement("label");
      priority.className = "target-priority";
      priority.append(document.createTextNode("Zielpriorität"));
      const select = document.createElement("select");
      select.setAttribute("aria-label", "Zielpriorität");
      PW.Combat.targetPriorityOptions(building, def).forEach((option) => {
        const entry = document.createElement("option");
        entry.value = option.id;
        entry.textContent = option.label;
        entry.selected = option.id === PW.Combat.targetPriority(building, def);
        select.appendChild(entry);
      });
      select.addEventListener("change", () => PW.BuildingSystem.setTargetPriority(building.id, select.value));
      priority.appendChild(select);
      card.appendChild(priority);
    }
    const palisadeUpgradeLocked = state.gameMode === "classic" && building.type === "palisade";
    const canUpgrade = PW.BuildingSystem.canUpgrade(building);
    if (palisadeUpgradeLocked) {
      card.appendChild(this.infoLine("Upgrade", "Im Classic-Modus dienen Palisaden nur als Labyrinth und können nicht verbessert werden."));
    } else if (canUpgrade) {
      const status = building.hp < building.maxHp ? "Vollständig mit Werkzeug 3 reparieren, dann erneut einsetzen." : "Vollständig repariert: Werkzeug 3 erneut einsetzen, um zu verbessern.";
      card.appendChild(this.infoLine("Nächstes Upgrade", status));
      const costs = document.createElement("div");
      costs.className = "costs";
      this.renderCostChips(costs, PW.BuildingSystem.upgradeCost(building));
      card.appendChild(costs);
    }
    body.appendChild(card);
  },
  renderBlueprintContext(body, blueprint) {
    const def = PW.BUILDINGS[blueprint.type];
    const card = document.createElement("div");
    card.className = "build-card";
    const titleRow = document.createElement("div");
    titleRow.className = "build-title";
    const heading = document.createElement("h3");
    heading.append(PW.Icons.buildingCanvas(blueprint.type, 32), document.createTextNode(def.name));
    const state = document.createElement("strong");
    state.textContent = "Vorgemerkt";
    titleRow.append(heading, state);
    card.append(titleRow, this.infoLine("Position", `${blueprint.x}/${blueprint.y}`));
    const costs = document.createElement("div");
    costs.className = "costs";
    this.renderCostChips(costs, def.cost);
    card.appendChild(costs);
    card.appendChild(this.infoLine("Bedienung", "Im Baumodus vor der Figur errichten; im Blaupausenmodus mit Alt-Tipp entfernen."));
    body.appendChild(card);
  },
  renderResourceContext(body, node) {
    const def = PW.RESOURCE_NODES[node.type];
    const res = PW.RESOURCES[def.resource];
    const card = document.createElement("div");
    card.className = "build-card";
    const titleRow = document.createElement("div");
    titleRow.className = "build-title";
    const heading = document.createElement("h3");
    heading.style.color = res.color;
    heading.append(PW.Icons.resourceCanvas(res.id, 22), document.createTextNode(def.name));
    const amount = document.createElement("strong");
    amount.textContent = `+${node.amount}`;
    titleRow.append(heading, amount);
    card.appendChild(titleRow);
    card.appendChild(this.infoLine("Material", res.name));
    card.appendChild(this.infoLine("Abbau", `${node.hp}/${node.maxHp} Treffer`));
    card.appendChild(this.infoLine("Werkzeug", res.tool === "axe" ? "Axt" : "Spitzhacke"));
    body.appendChild(card);
  },
  renderWildlifeContext(body, critter) {
    const def = PW.WILDLIFE.critters[critter.type];
    const card = document.createElement("div");
    card.className = "build-card";
    const titleRow = document.createElement("div");
    titleRow.className = "build-title";
    const heading = document.createElement("h3");
    const preview = document.createElement("canvas");
    preview.className = "build-preview";
    preview.width = 32;
    preview.height = 32;
    const pctx = preview.getContext("2d");
    if (!(PW.PixelArt && PW.PixelArt.drawCentered(pctx, `wildlife.${critter.type}`, 16, 16, 28, 28))) {
      PW.RenderEntities.drawWildlifeShape(pctx, { ...critter, vx: 1, age: 0 }, def, 16, 17);
    }
    heading.append(preview, document.createTextNode(def.name));
    const hp = document.createElement("strong");
    hp.textContent = `${Math.ceil(critter.hp)}/${critter.maxHp} HP`;
    titleRow.append(heading, hp);
    card.appendChild(titleRow);
    card.appendChild(this.infoLine("Verhalten", "friedlich, flieht bei Nähe"));
    card.appendChild(this.infoLine("Hitbox", `${def.radius}px`));
    card.appendChild(this.infoLine("Belohnung", PW.WildlifeSystem.rewardText(def)));
    body.appendChild(card);
  },
  renderChestContext(body, chest) {
    const card = document.createElement("div");
    card.className = "build-card";
    const titleRow = document.createElement("div");
    titleRow.className = "build-title";
    const heading = document.createElement("h3");
    const preview = document.createElement("canvas");
    preview.className = "build-preview";
    preview.width = 32;
    preview.height = 32;
    PW.Icons.drawChest(preview.getContext("2d"), 0, 0, 32, chest.variant || 0);
    heading.append(preview, document.createTextNode("Schatztruhe"));
    const keys = document.createElement("strong");
    keys.textContent = `${PW.state.inventory.key || 0} Schlüssel`;
    titleRow.append(heading, keys);
    card.appendChild(titleRow);
    card.appendChild(this.infoLine("Inhalt", PW.Utils.costText(chest.rewards)));
    const button = document.createElement("button");
    button.textContent = "Mit Schlüssel öffnen";
    button.disabled = (PW.state.inventory.key || 0) < 1;
    button.addEventListener("click", () => {
      PW.TreasureSystem.openChestAt(chest.x, chest.y);
      this.inspectTile(chest.x, chest.y);
    });
    card.appendChild(button);
    body.appendChild(card);
  },
  renderCampContext(body, camp) {
    const alive = PW.state.enemies.filter((enemy) => enemy.campId === camp.id && enemy.hp > 0 && !enemy.remove);
    const carriers = alive.filter((enemy) => enemy.campKeyCarrier).length;
    const types = {};
    alive.forEach((enemy) => {
      const name = PW.ENEMIES[enemy.type] ? PW.ENEMIES[enemy.type].name : enemy.type;
      types[name] = (types[name] || 0) + 1;
    });
    const card = document.createElement("div");
    card.className = "build-card";
    const titleRow = document.createElement("div");
    titleRow.className = "build-title";
    const heading = document.createElement("h3");
    heading.textContent = "Monsterhorde";
    const count = document.createElement("strong");
    count.textContent = `${alive.length} Gegner`;
    titleRow.append(heading, count);
    card.appendChild(titleRow);
    card.appendChild(this.infoLine("Position", `${camp.tileX}/${camp.tileY}`));
    card.appendChild(this.infoLine("Radius", `${Math.round((camp.aggroPx || 0) / PW.state.world.tileSize)} Felder`));
    card.appendChild(this.infoLine("Schlüssel", camp.keyDropped ? "fallen gelassen" : carriers ? "bei einem Gegner" : "keiner sichtbar"));
    card.appendChild(this.infoLine("Gegner", Object.entries(types).map(([name, amount]) => `${amount}x ${name}`).join(", ") || "besiegt"));
    const hint = document.createElement("div");
    hint.className = "meta";
    hint.textContent = "Baue Türme im roten Radius, um die Horde zu bekämpfen. Die Horde greift Bauwerke in ihrem Gebiet an.";
    card.appendChild(hint);
    body.appendChild(card);
  },
  renderOutpostContext(body, outpost) {
    const def = PW.OutpostSystem.variants[outpost.type];
    const card = document.createElement("div");
    card.className = "build-card";
    const titleRow = document.createElement("div");
    titleRow.className = "build-title";
    const heading = document.createElement("h3");
    heading.style.color = def.color;
    heading.textContent = def.name;
    const status = document.createElement("strong");
    status.textContent = outpost.status === "claimed" ? "gesichert" : outpost.status === "active" ? "aktiv" : "untersuchen";
    titleRow.append(heading, status);
    card.appendChild(titleRow);
    card.appendChild(this.infoLine("Fund", def.description));
    if (outpost.type === "beacon") {
      const alive = PW.state.enemies.filter((enemy) => enemy.outpostId === outpost.id && enemy.hp > 0 && !enemy.remove).length;
      card.appendChild(this.infoLine("Wachgruppe", outpost.status === "active" ? `${alive} Gegner` : outpost.status === "claimed" ? "besiegt" : "wartet"));
      card.appendChild(this.infoLine("Gebiet", `${Math.round(outpost.guardRadius / PW.state.world.tileSize)} Felder`));
    } else if (outpost.type === "research" && outpost.unlockedBuilding) {
      card.appendChild(this.infoLine("Bauplan", PW.BUILDINGS[outpost.unlockedBuilding].name));
    } else {
      card.appendChild(this.infoLine("Belohnung", PW.Utils.costText(def.rewards)));
    }
    const button = document.createElement("button");
    button.textContent = outpost.status === "claimed" ? "Geborgen" : outpost.status === "active" ? "Wachgruppe aktiv" : "Untersuchen";
    button.disabled = outpost.status === "claimed";
    button.addEventListener("click", () => {
      PW.OutpostSystem.interactAt(outpost.x, outpost.y);
      this.inspectTile(outpost.x, outpost.y);
    });
    card.appendChild(button);
    body.appendChild(card);
  },
  infoLine(label, value) {
    const row = document.createElement("div");
    row.className = "context-line";
    row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    return row;
  },
  showMorningReport() {
    const report = PW.state.lastReport;
    if (!report) return;
    PW.state.reportOpen = true;
    const body = PW.state.dom.reportBody;
    body.innerHTML = "";
    [
      `Nacht ${report.night} überstanden.`,
      `Wrack: ${Math.ceil(report.hp)}/${report.maxHp} HP.`,
      `Kills: ${report.kills}. Zerstörte Mauern: ${report.wallsDestroyed}.`,
      `Schwierigkeit: ${report.difficulty || PW.Autobalance.difficultyProfile().shortName}. Spielmodus: ${report.gameMode || PW.GameModes.profile().shortName}.`
    ].concat(report.diagnosis).forEach((line) => {
      const row = document.createElement("div");
      row.className = "report-row";
      row.textContent = line;
      body.appendChild(row);
    });
    const tooltip = this.nextTooltip();
    if (tooltip) {
      const tip = document.createElement("blockquote");
      tip.className = "morning-tooltip";
      const label = document.createElement("strong");
      label.textContent = "Tipp";
      const text = document.createElement("span");
      text.textContent = tooltip.text;
      tip.append(label, text);
      body.appendChild(tip);
    }
    PW.state.dom.morningReport.classList.remove("hidden");
  },
  nextTooltip() {
    const all = PW.TOOLTIPS || [];
    if (!all.length) return null;
    const choices = all.length > 1 ? all.filter((tip) => tip.id !== PW.state.lastTooltipId) : all;
    const tooltip = choices[Math.floor(Math.random() * choices.length)];
    PW.state.lastTooltipId = tooltip.id;
    return tooltip;
  },
  hideMorningReport() {
    PW.state.reportOpen = false;
    PW.state.dom.morningReport.classList.add("hidden");
  },
  helpNumber(value) {
    return Number.isInteger(value) ? String(value) : Number(value).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  },
  helpResourceCost(cost) {
    return Object.entries(cost).map(([id, amount]) => `${PW.RESOURCES[id] ? PW.RESOURCES[id].name : id} ${amount}`).join(", ");
  },
  helpDrops(def) {
    const profile = PW.DropSystem.lootProfileFor(def);
    const [min, max] = profile.amounts;
    const amount = min === max ? String(min) : `${min}–${max}`;
    const chance = profile.chance < 1 ? ` (${Math.round(profile.chance * 100)} % Chance)` : "";
    return `${amount} zufällige Rohstoffe${chance}; Schrott, Holz und Stein häufig, Gold sehr selten`;
  },
  helpTargetNames(targets) {
    return targets.map((target) => target === "air" ? "Luft" : "Boden").join(" + ");
  },
  helpCounterText(def) {
    return Object.entries(def.damageTaken || {}).map(([tower, multiplier]) => {
      const name = PW.BUILDINGS[tower] ? PW.BUILDINGS[tower].name : tower;
      const difference = Math.round(Math.abs(multiplier - 1) * 100);
      if (!difference) return `${name}: normal`;
      return `${name}: ${difference} % ${multiplier < 1 ? "weniger" : "mehr"} Schaden`;
    }).join(", ") || "Keine besondere Schadensanfälligkeit";
  },
  helpEnemyCard(def) {
    const movement = def.moveType === "air" ? "Luft" : "Boden";
    const buildingDamage = def.wallDamage === undefined ? "–" : this.helpNumber(def.wallDamage);
    const specials = [];
    if (def.packSize) specials.push(`Schwarmgröße ${def.packSize[0]}–${def.packSize[1]}`);
    if (def.slowResistance) specials.push(`${Math.round(def.slowResistance * 100)} % Verlangsamungsresistenz`);
    if (def.aura) specials.push(`Störfeld ${this.helpNumber(def.aura)} Felder; Türme feuern darin 45 % langsamer`);
    return `
      <article class="help-unit-card">
        <div class="help-unit-heading">
          <canvas class="help-unit-image" data-help-enemy="${def.id}" width="48" height="48" aria-hidden="true"></canvas>
          <div><h4>${def.name}</h4><div class="help-unit-role">${def.role}</div></div>
        </div>
        <dl class="help-unit-stats">
          <div><dt>Bewegung</dt><dd>${movement}</dd></div>
          <div><dt>Lebenspunkte</dt><dd>${this.helpNumber(def.hp)}</dd></div>
          <div><dt>Geschwindigkeit</dt><dd>${this.helpNumber(def.speed)}</dd></div>
          <div><dt>Angriff</dt><dd>${this.helpNumber(def.damage)} alle ${this.helpNumber(def.attackCooldown)} s</dd></div>
          <div><dt>Gebäudeschaden</dt><dd>${buildingDamage}</dd></div>
          <div><dt>Wellenwert</dt><dd>${this.helpNumber(def.budget)}</dd></div>
        </dl>
        <p><strong>Besonderheiten:</strong> ${specials.join("; ") || "Keine"}</p>
        <p><strong>Konter:</strong> ${def.counter}</p>
        <p><strong>Schadensprofil:</strong> ${this.helpCounterText(def)}</p>
        <p><strong>Drops:</strong> ${this.helpDrops(def)}</p>
      </article>
    `;
  },
  helpTowerCard(def) {
    const specials = [];
    if (def.splash) specials.push(`Flächenschaden ${this.helpNumber(def.splash)} Felder, bis zu ${def.expectedTargets || "mehrere"} Ziele`);
    if (def.slow) specials.push(`${Math.round(def.slow * 100)} % Verlangsamung für ${this.helpNumber(def.slowTime)} s`);
    return `
      <article class="help-unit-card">
        <div class="help-unit-heading">
          <canvas class="help-unit-image" data-help-building="${def.id}" width="48" height="48" aria-hidden="true"></canvas>
          <div><h4>${def.name}</h4><div class="help-unit-role">${def.description}</div></div>
        </div>
        <dl class="help-unit-stats">
          <div><dt>Baukosten</dt><dd>${this.helpResourceCost(def.cost)}</dd></div>
          <div><dt>Lebenspunkte</dt><dd>${this.helpNumber(def.maxHp)}</dd></div>
          <div><dt>Reichweite</dt><dd>${this.helpNumber(def.range)} Felder</dd></div>
          <div><dt>Schaden</dt><dd>${this.helpNumber(def.damage)} pro Treffer</dd></div>
          <div><dt>Feuerrate</dt><dd>${this.helpNumber(def.rate)} / s</dd></div>
          <div><dt>Grund-DPS</dt><dd>${this.helpNumber(def.damage * def.rate)}</dd></div>
          <div><dt>Ziele</dt><dd>${this.helpTargetNames(def.targets)}</dd></div>
        </dl>
        <p><strong>Spezialeffekt:</strong> ${specials.join("; ") || "Keiner"}</p>
        <p><strong>Verbesserungen:</strong> Pro Stufe steigen Schaden und HP um 35 %, die Feuerrate um 18 %.</p>
      </article>
    `;
  },
  helpWallCard(def) {
    return `
      <article class="help-unit-card">
        <div class="help-unit-heading">
          <canvas class="help-unit-image" data-help-building="${def.id}" width="48" height="48" aria-hidden="true"></canvas>
          <div><h4>${def.name}</h4><div class="help-unit-role">${def.description}</div></div>
        </div>
        <dl class="help-unit-stats">
          <div><dt>Baukosten</dt><dd>${this.helpResourceCost(def.cost)}</dd></div>
          <div><dt>Lebenspunkte</dt><dd>${this.helpNumber(def.maxHp)}</dd></div>
          <div><dt>Wirkung</dt><dd>Blockiert Bodeneinheiten</dd></div>
        </dl>
      </article>
    `;
  },
  helpUnitCatalog() {
    const enemies = Object.values(PW.ENEMIES).map((def) => this.helpEnemyCard(def)).join("");
    const towers = Object.values(PW.BUILDINGS).filter((def) => def.category === "tower").map((def) => this.helpTowerCard(def)).join("");
    const walls = Object.values(PW.BUILDINGS).filter((def) => def.category === "wall" && PW.GameModes.allowsBuilding(def.id)).map((def) => this.helpWallCard(def)).join("");
    return `
      <div class="help-catalog" aria-label="Gegner- und Turmübersicht">
        <h3>Gegner</h3>
        <div class="help-unit-grid">${enemies}</div>
        <h3>Türme</h3>
        <div class="help-unit-grid">${towers}</div>
        <h3>Mauern</h3>
        <div class="help-unit-grid">${walls}</div>
      </div>
    `;
  },
  renderHelpImages() {
    const body = PW.state.dom.dialogBody;
    body.querySelectorAll("[data-help-enemy]").forEach((canvas) => {
      const image = PW.Icons.enemyCanvas(canvas.dataset.helpEnemy, canvas.width);
      image.classList.add("help-unit-image");
      canvas.replaceWith(image);
    });
    body.querySelectorAll("[data-help-building]").forEach((canvas) => {
      const image = PW.Icons.buildingCanvas(canvas.dataset.helpBuilding, canvas.width);
      image.classList.add("help-unit-image");
      canvas.replaceWith(image);
    });
  },
  showHelp() {
    this.showDialog("Hilfe", `
      <p><span class="kbd">WASD</span> oder Pfeiltasten bewegen. <span class="kbd">Space</span> interagiert mit der Kachel vor dir.</p>
      <p><span class="kbd">1</span> Axt, <span class="kbd">2</span> Spitzhacke, <span class="kbd">3</span> Reparatur und Upgrade, <span class="kbd">4</span> Bauen, <span class="kbd">5</span> Abriss. Taste 4 erneut wechselt den Bauplan; <span class="kbd">Strg</span> schaltet Blaupausen um.</p>
      <p>Ein Klick auf freies Gelände wirkt wie Space. Bauwerke und andere Weltobjekte öffnen weiterhin ihre Statusansicht. Das Mausrad wechselt Werkzeuge.</p>
      <p><span class="kbd">E</span> Inventar, <span class="kbd">M</span> Karte, <span class="kbd">O</span> Optik, <span class="kbd">R</span> Wrack, <span class="kbd">P</span> Pause. <span class="kbd">F3</span> Leistungsanzeige.</p>
      <p>Tagsüber erkundest und baust du. Nachts greifen Gegner das Wrack an. Du kannst nachts weiter rausgehen, riskierst dann aber Reparaturzeit.</p>
      <p class="meta">Die folgenden Werte zeigen, wofür Gegner und Türme gedacht sind. Grund-DPS berücksichtigt keine Flächenziele oder Spezialeffekte.</p>
      ${this.helpUnitCatalog()}
    `, [{ label: "Schließen", action: () => this.hideDialog() }]);
    this.renderHelpImages();
  },
  showCheatDialog() {
    const dom = PW.state.dom;
    if (!dom.gameDialog || !dom.gameDialog.classList.contains("hidden")) return;
    PW.state.input.keys.clear();
    PW.state.input.pressed.clear();
    this.showDialog("Cheat-Code", `
      <form id="cheatForm" class="cheat-form">
        <label for="cheatCode">Code</label>
        <input id="cheatCode" name="cheatCode" type="text" autocomplete="off" spellcheck="false" placeholder="Cheat-Code eingeben">
      </form>
    `, [
      { label: "Abbrechen", action: () => this.hideDialog() },
      { label: "Aktivieren", action: () => this.submitCheatCode() }
    ]);
    dom.gameDialog.classList.add("cheat-dialog");
    const form = dom.dialogBody.querySelector("#cheatForm");
    const input = dom.dialogBody.querySelector("#cheatCode");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submitCheatCode();
    });
    input.focus();
  },
  submitCheatCode() {
    const input = PW.state.dom.dialogBody.querySelector("#cheatCode");
    const code = input ? input.value.trim().toLowerCase() : "";
    if (code !== "lumberjack" && code !== "theflash" && code !== "hardassteel") {
      PW.Messages.add("Ungültiger Cheat-Code.", "danger");
      this.hideDialog();
      return;
    }
    if (code === "lumberjack") {
      Object.values(PW.RESOURCES).forEach((resource) => {
        PW.state.inventory[resource.id] = (PW.state.inventory[resource.id] || 0) + 500;
        PW.state.knownResources.add(resource.id);
      });
      PW.Progression.refreshUnlocks();
      PW.UI.renderHud();
      PW.UI.refreshInventoryDependentPanel();
      PW.Messages.add("Cheat aktiviert: 500 von jeder Ressource erhalten.", "ok");
    } else if (code === "theflash") {
      PW.state.player.speed = PW.CONFIG.playerSpeed * 3;
      PW.Messages.add("Cheat aktiviert: Deine Bewegungsgeschwindigkeit ist verdreifacht.", "ok");
    } else if (PW.state.phase.current === "night" || PW.state.ship.launchActive) {
      PW.Messages.add("Hardassteel kann nicht während einer laufenden Nacht aktiviert werden.", "danger");
    } else {
      PW.DayNight.beginNight(false, 5);
      PW.Messages.add("Hardassteel aktiviert: Sofortige Nacht mit fünffachem Wellenbudget.", "danger");
    }
    this.hideDialog();
  },
  confirmReset() {
    this.showDialog("Neustart", "<p>Der aktuelle Speicherstand wird gelöscht und die Partie startet neu.</p>", [
      { label: "Abbrechen", action: () => this.hideDialog() },
      { label: "Neustarten", action: () => PW.Save.reset() }
    ]);
  },
  showEndDialog(won) {
    this.showDialog(won ? "Abgehoben" : "Wrack verloren", won ?
      "<p>Das Schiff hebt ab. Du hast den Planeten verlassen.</p>" :
      "<p>Das Wrack wurde zerstört. Die Verteidigung ist zusammengebrochen.</p>", [
      { label: "Neue Partie", action: () => PW.Save.reset() }
    ]);
  },
  showDialog(title, html, actions) {
    const dom = PW.state.dom;
    dom.gameDialog.classList.remove("cheat-dialog");
    dom.dialogTitle.textContent = title;
    dom.dialogBody.innerHTML = html;
    dom.dialogActions.innerHTML = "";
    actions.forEach((item) => {
      const button = document.createElement("button");
      button.textContent = item.label;
      button.addEventListener("click", item.action);
      dom.dialogActions.appendChild(button);
    });
    dom.gameDialog.classList.remove("hidden");
  },
  hideDialog() {
    PW.state.dom.gameDialog.classList.add("hidden");
    PW.state.dom.gameDialog.classList.remove("cheat-dialog");
  }
});
