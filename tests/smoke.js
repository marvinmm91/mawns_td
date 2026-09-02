"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  const url = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
  await page.goto(url);
  const changelog = await page.locator(".start-changelog").innerText();
  const beta3Index = changelog.indexOf("Beta 3 – Änderungen seit Beta 2");
  const beta2Index = changelog.indexOf("Beta 2 – Änderungen seit Beta 1");
  if (beta3Index < 0 || beta2Index < 0 || beta3Index > beta2Index) {
    throw new Error(`Start-Changelog ist unvollständig oder falsch sortiert: ${changelog}`);
  }
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(700);

  const basic = await page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, Math.min(240, canvas.width), Math.min(160, canvas.height)).data;
    let painted = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] || data[i + 1] || data[i + 2]) painted++;
    }
    return {
      painted,
      phase: PW.state.phase.current,
      hp: PW.state.ship.hp,
      resources: PW.state.world.resources.length,
      buildings: PW.state.world.buildings.length
    };
  });

  if (basic.painted < 500) throw new Error(`Canvas wirkt leer: ${basic.painted}`);
  if (basic.phase !== "day") throw new Error(`Falsche Startphase: ${basic.phase}`);
  if (basic.hp !== 500) throw new Error(`Falsche Wrack-HP: ${basic.hp}`);
  if (basic.resources < 100) throw new Error(`Zu wenige Ressourcen: ${basic.resources}`);
  const shellLayout = await page.evaluate(() => {
    const panel = document.getElementById("sidePanel");
    const style = getComputedStyle(panel);
    const variedResources = PW.state.world.resources.filter((node) => node.scale && node.variant !== undefined).length;
    return {
      panelPosition: style.position,
      panelHidden: panel.classList.contains("hidden"),
      variedResources
    };
  });
  if (shellLayout.panelPosition === "fixed" || shellLayout.panelHidden) {
    throw new Error(`Rechte Leiste ist nicht fest im Layout: ${JSON.stringify(shellLayout)}`);
  }
  if (shellLayout.variedResources < 80) throw new Error(`Ressourcenvarianten fehlen: ${shellLayout.variedResources}`);

  await page.keyboard.press("4");
  await page.locator(".build-card", { hasText: "Balliste" }).getByRole("button").click();
  const buildMenu = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".build-card"));
    const wanted = ["Palisade", "Balliste", "Katapult", "Flak", "Tesla-Feld", "Laser-Turm"];
    const rows = wanted.map((name) => {
      const card = cards.find((item) => item.textContent.includes(name));
      return {
        name,
        hasIcon: Boolean(card && card.querySelector("canvas.build-preview")),
        hasHp: Boolean(card && /\d+\s*HP/.test(card.textContent)),
        hasCostIcon: Boolean(card && card.querySelector(".cost-chip canvas.resource-icon")),
        hasCostFill: Boolean(card && Array.from(card.querySelectorAll(".cost-chip")).every((chip) => chip.style.getPropertyValue("--fill")))
      };
    });
    return {
      rows,
      hiddenClassicWalls: !cards.some((card) => /Steinmauer|Stahlmauer/.test(card.textContent))
    };
  });
  const badBuildRows = buildMenu.rows.filter((row) => !row.hasIcon || !row.hasHp || !row.hasCostIcon || !row.hasCostFill);
  if (badBuildRows.length || !buildMenu.hiddenClassicWalls) throw new Error(`Baumenue ohne Symbol/HP/Kostenbalken oder mit Classic-Mauern: ${JSON.stringify(buildMenu)}`);
  const mouseBuild = await page.evaluate(() => {
    Object.assign(PW.state.inventory, { wood: 999, stone: 999 });
    PW.state.selectedBuild = "palisade";
    PW.state.player.selectedTool = "build";
    PW.state.player.buildMode = "build";
    PW.state.panel = "status";
    PW.UI.renderPanel();
    for (let y = PW.state.ship.y - 8; y <= PW.state.ship.y + PW.state.ship.size + 8; y++) {
      for (let x = PW.state.ship.x - 8; x <= PW.state.ship.x + PW.state.ship.size + 8; x++) {
        if (PW.Tiles.canBuildAt(x, y) && PW.Tiles.canBuildAt(x - 1, y) && PW.Tiles.canBuildAt(x - 2, y) && !(PW.WildlifeSystem && PW.WildlifeSystem.atTile(x - 1, y))) {
          const source = PW.Tiles.tileCenter(x - 1, y);
          PW.state.player.x = source.x;
          PW.state.player.y = source.y;
          PW.state.player.dirX = 1;
          PW.state.player.dirY = 0;
          PW.state.player.actionCooldown = 0;
          PW.Camera.update();
          const rect = PW.state.canvas.getBoundingClientRect();
          return {
            x,
            y,
            sx: rect.left + ((x - 1) * PW.state.world.tileSize + 16 - PW.state.camera.x) / PW.state.camera.w * rect.width,
            sy: rect.top + (y * PW.state.world.tileSize + 16 - PW.state.camera.y) / PW.state.camera.h * rect.height,
            before: PW.state.world.buildings.length
          };
        }
      }
    }
    return null;
  });
  if (!mouseBuild) throw new Error("Kein freies Feld fuer Mausbau gefunden.");
  await page.mouse.move(mouseBuild.sx, mouseBuild.sy);
  await page.mouse.click(mouseBuild.sx, mouseBuild.sy);
  const mouseBuilt = await page.evaluate(({ x, y, before }) => ({
    built: Boolean(PW.Tiles.getBuilding(x, y)),
    count: PW.state.world.buildings.length,
    before,
    openedBuildMenu: PW.state.panel === "build"
  }), mouseBuild);
  if (!mouseBuilt.built || mouseBuilt.count <= mouseBuilt.before || mouseBuilt.openedBuildMenu) throw new Error(`Nahbereichs-Mausbau fehlgeschlagen: ${JSON.stringify(mouseBuilt)}`);
  await page.keyboard.press("E");
  await page.keyboard.press("R");

  const systems = await page.evaluate(() => {
    Object.assign(PW.state.inventory, { wood: 999, stone: 999, iron: 999, gold: 999, crystal: 999, scrap: 999, parts: 999 });
    PW.state.selectedBuild = "ballista";
    PW.state.player.selectedTool = "build";
    const placed = PW.BuildingSystem.placeSelected(PW.state.ship.x - 1, PW.state.ship.y);
    PW.state.selectedBuild = "palisade";
    const wall = PW.BuildingSystem.placeSelected(PW.state.ship.x - 2, PW.state.ship.y);
    PW.Save.save(false);
    PW.state.inventory.wood = 1;
    const loaded = PW.Save.load(false);
    PW.DayNight.beginNight(false);
    for (let i = 0; i < 30; i++) {
      PW.Spawning.update(0.1);
      PW.Pathfinding.update();
      PW.EnemySystem.update(0.1);
      PW.Combat.update(0.1);
      PW.ProjectileSystem.update(0.1);
    }
    return {
      placed,
      wall,
      loaded,
      buildings: PW.state.world.buildings.length,
      wood: PW.state.inventory.wood,
      enemies: PW.state.enemies.length,
      spawned: PW.state.wave.spawnedThisNight,
      gameOver: PW.state.gameOver,
      statsReady: Boolean(PW.state.nightStats)
    };
  });

  if (!systems.placed || !systems.wall) throw new Error("Bauen per System fehlgeschlagen.");
  if (!systems.loaded || systems.wood < 900) throw new Error("Save/Load hat Inventar nicht wiederhergestellt.");
  if (systems.buildings < 2) throw new Error("Bauwerke fehlen nach Load.");
  if (!systems.statsReady || systems.spawned < 1) throw new Error("Nacht-/Spawn-System startet nicht.");
  if (systems.gameOver) throw new Error("Smoke-Test sollte nicht in Niederlage enden.");

  await page.waitForTimeout(250);
  const postLoadRender = await page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, Math.min(320, canvas.width), Math.min(220, canvas.height)).data;
    let painted = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) painted++;
    }
    return { painted, tileSize: PW.state.world.tileSize };
  });
  if (postLoadRender.tileSize !== 32) throw new Error(`TileSize nach Load fehlerhaft: ${postLoadRender.tileSize}`);
  if (postLoadRender.painted < 1000) throw new Error(`Canvas nach Load wirkt leer: ${postLoadRender.painted}`);

  await page.evaluate(() => PW.Save.markReloadAndSave());
  await page.reload();
  await page.waitForTimeout(800);
  const reloadState = await page.evaluate(() => ({
    paused: PW.state.paused,
    running: PW.state.running,
    dialogHidden: document.getElementById("gameDialog").classList.contains("hidden"),
    hasContinue: Array.from(document.querySelectorAll("button")).some((button) => button.textContent === "Fortsetzen"),
    hasRestart: Array.from(document.querySelectorAll("button")).some((button) => button.textContent === "Neustart"),
    x: PW.state.player.x,
    phase: PW.state.phase.current,
    waveActive: PW.state.wave.active
  }));
  if (!reloadState.running || !reloadState.paused || reloadState.dialogHidden || !reloadState.hasContinue || !reloadState.hasRestart) {
    throw new Error(`Reload-Menue fehlt oder ist fehlerhaft: ${JSON.stringify(reloadState)}`);
  }
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await page.waitForTimeout(250);
  const beforeMove = await page.evaluate(() => ({ x: PW.state.player.x, y: PW.state.player.y }));
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    await wait(300);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "a", bubbles: true }));
  });
  await page.waitForTimeout(120);
  const movedAfterReload = await page.evaluate((before) => {
    return Math.hypot(PW.state.player.x - before.x, PW.state.player.y - before.y) > 5;
  }, beforeMove);
  if (!movedAfterReload) throw new Error("Spieler bewegt sich nach Reload nicht korrekt.");

  const nudge = await page.evaluate(() => {
    PW.state = PW.createInitialState();
    PW.state.canvas = document.getElementById("gameCanvas");
    PW.state.ctx = PW.state.canvas.getContext("2d");
    PW.state.dom = {
      shipHpText: document.getElementById("shipHpText"),
      shipHpFill: document.getElementById("shipHpFill"),
      phaseName: document.getElementById("phaseName"),
      phaseTimer: document.getElementById("phaseTimer"),
      nightText: document.getElementById("nightText"),
      moduleText: document.getElementById("moduleText"),
      pauseOverlay: document.getElementById("pauseOverlay"),
      toastStack: document.getElementById("toastStack"),
      toolBar: document.getElementById("toolBar"),
      resourceBar: document.getElementById("resourceBar")
    };
    PW.MapGenerator.generate();
    Object.assign(PW.state.inventory, { wood: 999, stone: 999 });
    const tx = PW.state.ship.x - 3;
    const ty = PW.state.ship.y + 1;
    PW.state.player.x = tx * PW.state.world.tileSize - 2;
    PW.state.player.y = ty * PW.state.world.tileSize + PW.state.world.tileSize / 2;
    PW.state.selectedBuild = "palisade";
    const beforeOverlap = PW.BuildingSystem.playerOverlapsTile(PW.state.player.x, PW.state.player.y, PW.state.player.radius, tx, ty);
    const placed = PW.BuildingSystem.placeSelected(tx, ty);
    const afterOverlap = PW.BuildingSystem.playerOverlapsTile(PW.state.player.x, PW.state.player.y, PW.state.player.radius, tx, ty);
    const canStand = PW.BuildingSystem.canPlayerStandAfterBuild(PW.state.player.x, PW.state.player.y, PW.state.player.radius, tx, ty);
    return { beforeOverlap, placed, afterOverlap, canStand };
  });
  if (!nudge.beforeOverlap || !nudge.placed || nudge.afterOverlap || !nudge.canStand) {
    throw new Error(`Bau-Pushback fehlerhaft: ${JSON.stringify(nudge)}`);
  }

  await page.screenshot({ path: path.join(__dirname, "smoke.png"), fullPage: true });
  await browser.close();

  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  console.log("OK smoke");
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
