"use strict";

Object.assign(PW.UI, {
  initPanels() {
    const dom = PW.state.dom;
    dom.inventoryButton.addEventListener("click", () => this.togglePanel("inventory"));
    dom.buildButton.addEventListener("click", () => this.togglePanel("build"));
    dom.shipButton.addEventListener("click", () => this.togglePanel("ship"));
    dom.designButton.addEventListener("click", () => this.togglePanel("design"));
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
      title.textContent = "Design";
      this.renderDesign(body);
    } else if (state.panel === "context") {
      this.renderContext(body);
    }
  },
  renderStatus(body) {
    const state = PW.state;
    body.innerHTML = "";
    const phaseNames = { day: "Tag", dusk: "Daemmerung", night: state.ship.launchActive ? "Startsequenz" : "Nacht", dawn: "Morgen" };
    const stats = document.createElement("div");
    stats.className = "stat-grid";
    stats.innerHTML = `
      <div class="stat-box"><span>Phase</span><strong>${phaseNames[state.phase.current]}</strong></div>
      <div class="stat-box"><span>Timer</span><strong>${PW.Utils.formatTime(state.phase.timer)}</strong></div>
      <div class="stat-box"><span>Gegner</span><strong>${state.enemies.length}</strong></div>
      <div class="stat-box"><span>Bauwerke</span><strong>${state.world.buildings.length}</strong></div>
      <div class="stat-box"><span>Truhen</span><strong>${(state.world.treasureChests || []).filter((chest) => !chest.opened).length}</strong></div>
      <div class="stat-box"><span>Horden</span><strong>${(state.world.monsterCamps || []).filter((camp) => !camp.cleared).length}</strong></div>
      <div class="stat-box"><span>Wellenbudget</span><strong>${Math.ceil(state.wave.budgetRemaining || 0)}</strong></div>
      <div class="stat-box"><span>Balance</span><strong>${Math.round(state.balance.drift * 100)}%</strong></div>
    `;
    body.appendChild(stats);
    const build = document.createElement("div");
    build.className = "build-card";
    const selected = PW.BUILDINGS[state.selectedBuild];
    const modeText = state.buildMode === "blueprint" ? "Blaupausen" : "Bauen";
    build.innerHTML = `<h3>Aktiver Bauplan</h3><div class="meta">${selected ? selected.name : "Keiner"}, Modus ${modeText}. Werkzeug 4 und Linksklick auf die Maus-Kachel.</div>`;
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
    actions.innerHTML = `<h3>Speicherstand</h3><div class="meta">F6 speichert, F9 laedt. Autosave laeuft alle ${PW.CONFIG.autosaveEvery} Sekunden.</div>`;
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
    Object.values(PW.BUILDINGS).forEach((def) => {
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
      stateText.textContent = unlocked ? (affordable ? "Bereit." : "Material fehlt.") : "Noch nicht freigeschaltet.";
      card.append(titleRow, description, costs, stateText);
      const button = document.createElement("button");
      button.textContent = PW.state.selectedBuild === def.id ? "Ausgewaehlt" : "Auswaehlen";
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
    this.renderUpgradeList(body);
  },
  renderBlueprintControls(body) {
    const state = PW.state;
    const card = document.createElement("div");
    card.className = "build-card";
    card.innerHTML = "<h3>Bauweise</h3><div class=\"meta\">Blaupausen kosten kein Material und blockieren nicht. Ziehen plant zusammenhaengende Linien.</div>";
    const modes = document.createElement("div");
    modes.className = "build-mode";
    [
      ["build", "Bauen"],
      ["blueprint", "Blaupausen"]
    ].forEach(([mode, label]) => {
      const button = document.createElement("button");
      button.textContent = label;
      button.className = state.buildMode === mode ? "active" : "";
      button.addEventListener("click", () => {
        state.buildMode = mode;
        state.player.selectedTool = "build";
        this.renderHud();
        this.renderPanel();
      });
      modes.appendChild(button);
    });
    card.appendChild(modes);
    const blueprints = state.world.blueprints || [];
    const summary = document.createElement("div");
    summary.className = "meta";
    summary.textContent = blueprints.length ? `${blueprints.length} Blaupausen vorgemerkt.` : "Keine Blaupausen vorgemerkt.";
    card.appendChild(summary);
    if (blueprints.length) {
      const buildAll = document.createElement("button");
      buildAll.textContent = "Alle errichten";
      buildAll.addEventListener("click", () => PW.BuildingSystem.buildAllBlueprints());
      card.appendChild(buildAll);
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
      text.textContent = missing ? `${missing} fehlt (${have}/${required})` : `${have}/${required}`;
      chip.appendChild(text);
      container.appendChild(chip);
    });
  },
  renderUpgradeList(body) {
    const towers = PW.state.world.buildings.filter((b) => PW.BUILDINGS[b.type].category === "tower" || PW.BUILDINGS[b.type].category === "wall");
    if (!towers.length) return;
    const wrap = document.createElement("div");
    wrap.className = "build-card";
    wrap.innerHTML = "<h3>Upgrades</h3><div class=\"meta\">Bauwerke koennen bis Stufe 3 verbessert werden.</div>";
    towers.slice(0, 16).forEach((building) => {
      const def = PW.BUILDINGS[building.type];
      const button = document.createElement("button");
      button.textContent = `${def.name} (${building.x}/${building.y}) Stufe ${building.level}`;
      button.disabled = building.level >= 3 || !PW.Utils.canAfford(PW.BuildingSystem.upgradeCost(building));
      button.addEventListener("click", () => PW.BuildingSystem.upgrade(building.id));
      wrap.appendChild(button);
    });
    body.appendChild(wrap);
  },
  renderShip(body) {
    const state = PW.state;
    body.innerHTML = "";
    const status = document.createElement("div");
    status.className = "build-card";
    status.innerHTML = `<h3>Wrackstruktur</h3><div class="meta">${Math.ceil(state.ship.hp)} von ${state.ship.maxHp} HP. Reparatur mit Werkzeug 3 am Wrack oder hier per Button.</div>`;
    const repair = document.createElement("button");
    repair.textContent = "Wrack +50 HP reparieren";
    repair.disabled = state.ship.hp >= state.ship.maxHp;
    repair.addEventListener("click", () => { PW.Progression.repairShip(); this.renderShip(body); });
    status.appendChild(repair);
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
    launch.innerHTML = `<h3>Startsequenz</h3><div class="meta">Alle Module, Nacht 10 und mindestens 70 Prozent Wrack-HP benoetigt.</div>`;
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
      title.textContent = "Schatztruhe";
      return;
    }
    if (camp) {
      this.renderCampContext(body, camp);
      title.textContent = "Monsterhorde";
      return;
    }
    const ground = PW.Tiles.get(tile.x, tile.y);
    title.textContent = "Kachel";
    const card = document.createElement("div");
    card.className = "build-card";
    card.innerHTML = `<h3>${tile.x}/${tile.y}</h3>`;
    card.appendChild(this.infoLine("Terrain", this.tileLabel(ground)));
    card.appendChild(this.infoLine("Status", PW.Tiles.canBuildAt(tile.x, tile.y) || PW.Tiles.canBuildBridgeAt(tile.x, tile.y) ? "Bebaubar" : "Blockiert"));
    const selected = PW.BUILDINGS[state.selectedBuild];
    if (selected) {
      const canPlace = PW.BuildingSystem.canPlaceBuilding(selected.id, tile.x, tile.y);
      const costs = document.createElement("div");
      costs.className = "costs";
      this.renderCostChips(costs, selected.cost);
      card.appendChild(costs);
      const action = document.createElement("button");
      action.textContent = `${selected.name} hier bauen`;
      action.disabled = !canPlace || !state.unlockedBuildings.has(selected.id) || !PW.Utils.canAfford(selected.cost);
      action.addEventListener("click", () => {
        state.player.selectedTool = "build";
        PW.BuildingSystem.placeSelected(tile.x, tile.y);
        this.inspectTile(tile.x, tile.y);
      });
      card.appendChild(action);
    }
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
      card.appendChild(this.infoLine("Schaden", `${Math.round(def.damage * (1 + (building.level - 1) * 0.35))}`));
      card.appendChild(this.infoLine("Reichweite", `${def.range} Felder`));
      card.appendChild(this.infoLine("Ziele", def.targets.includes("air") && def.targets.includes("ground") ? "Boden + Luft" : def.targets.includes("air") ? "Luft" : "Boden"));
      const priority = document.createElement("label");
      priority.className = "target-priority";
      priority.append(document.createTextNode("Zielprioritaet"));
      const select = document.createElement("select");
      select.setAttribute("aria-label", "Zielprioritaet");
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
    const actions = document.createElement("div");
    actions.className = "build-actions";
    const repair = document.createElement("button");
    repair.textContent = "Reparieren";
    repair.disabled = building.hp >= building.maxHp;
    repair.addEventListener("click", () => {
      PW.BuildingSystem.repairAt(building.x, building.y);
      this.inspectTile(building.x, building.y);
    });
    const upgrade = document.createElement("button");
    const canUpgrade = def.upgradeable !== false && building.level < 3;
    upgrade.textContent = "Upgrade";
    upgrade.disabled = !canUpgrade || !PW.Utils.canAfford(PW.BuildingSystem.upgradeCost(building));
    upgrade.addEventListener("click", () => PW.BuildingSystem.upgrade(building.id));
    const demolish = document.createElement("button");
    demolish.textContent = "Abreissen";
    demolish.addEventListener("click", () => {
      PW.BuildingSystem.demolishAt(building.x, building.y);
      this.inspectTile(building.x, building.y);
    });
    actions.append(repair, upgrade, demolish);
    card.appendChild(actions);
    if (canUpgrade) {
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
    const actions = document.createElement("div");
    actions.className = "build-actions";
    const build = document.createElement("button");
    build.textContent = "Errichten";
    build.disabled = !PW.Utils.canAfford(def.cost) || !PW.BuildingSystem.canPlaceBuilding(blueprint.type, blueprint.x, blueprint.y);
    build.addEventListener("click", () => PW.BuildingSystem.buildBlueprint(blueprint.id));
    const remove = document.createElement("button");
    remove.textContent = "Entfernen";
    remove.addEventListener("click", () => PW.BuildingSystem.removeBlueprintAt(blueprint.x, blueprint.y));
    actions.append(build, remove);
    card.appendChild(actions);
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
    card.appendChild(this.infoLine("Verhalten", "friedlich, flieht bei Naehe"));
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
    keys.textContent = `${PW.state.inventory.key || 0} Schluessel`;
    titleRow.append(heading, keys);
    card.appendChild(titleRow);
    card.appendChild(this.infoLine("Inhalt", PW.Utils.costText(chest.rewards)));
    const button = document.createElement("button");
    button.textContent = "Mit Schluessel oeffnen";
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
    card.appendChild(this.infoLine("Schluessel", camp.keyDropped ? "fallen gelassen" : carriers ? "bei einem Gegner" : "keiner sichtbar"));
    card.appendChild(this.infoLine("Gegner", Object.entries(types).map(([name, amount]) => `${amount}x ${name}`).join(", ") || "besiegt"));
    const hint = document.createElement("div");
    hint.className = "meta";
    hint.textContent = "Baue Tuerme im roten Radius, um die Horde zu bekaempfen. Die Horde greift Bauwerke in ihrem Gebiet an.";
    card.appendChild(hint);
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
      `Nacht ${report.night} ueberstanden.`,
      `Wrack: ${Math.ceil(report.hp)}/${report.maxHp} HP.`,
      `Kills: ${report.kills}. Zerstoerte Mauern: ${report.wallsDestroyed}.`,
      `Balance-Drift: ${Math.round(report.drift * 100)} Prozent. Drop-Hilfe: ${Math.round(report.dropBonus * 100)} Prozent.`
    ].concat(report.diagnosis).forEach((line) => {
      const row = document.createElement("div");
      row.className = "report-row";
      row.textContent = line;
      body.appendChild(row);
    });
    PW.state.dom.morningReport.classList.remove("hidden");
  },
  hideMorningReport() {
    PW.state.reportOpen = false;
    PW.state.dom.morningReport.classList.add("hidden");
  },
  showHelp() {
    this.showDialog("Hilfe", `
      <p><span class="kbd">WASD</span> oder Pfeiltasten bewegen. <span class="kbd">Space</span> interagiert mit der Kachel vor dir.</p>
      <p><span class="kbd">1</span> Axt, <span class="kbd">2</span> Spitzhacke, <span class="kbd">3</span> Reparatur, <span class="kbd">4</span> Bauen, <span class="kbd">5</span> Abriss.</p>
      <p><span class="kbd">E</span> Inventar, <span class="kbd">B</span> Baumenue, <span class="kbd">R</span> Wrack, <span class="kbd">P</span> Pause. <span class="kbd">F3</span> Leistungsanzeige.</p>
      <p>Tagsueber erkundest und baust du. Nachts greifen Gegner das Wrack an. Du kannst nachts weiter rausgehen, riskierst dann aber Reparaturzeit.</p>
    `, [{ label: "Schliessen", action: () => this.hideDialog() }]);
  },
  confirmReset() {
    this.showDialog("Neustart", "<p>Der aktuelle Speicherstand wird geloescht und die Partie startet neu.</p>", [
      { label: "Abbrechen", action: () => this.hideDialog() },
      { label: "Neustarten", action: () => PW.Save.reset() }
    ]);
  },
  showEndDialog(won) {
    this.showDialog(won ? "Abgehoben" : "Wrack verloren", won ?
      "<p>Das Schiff hebt ab. Du hast den Planeten verlassen.</p>" :
      "<p>Das Wrack wurde zerstoert. Die Verteidigung ist zusammengebrochen.</p>", [
      { label: "Neue Partie", action: () => PW.Save.reset() }
    ]);
  },
  showDialog(title, html, actions) {
    const dom = PW.state.dom;
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
  }
});
