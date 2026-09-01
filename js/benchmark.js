"use strict";

(() => {
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");
  const dom = {
    status: document.getElementById("simStatus"), metrics: document.getElementById("simMetrics"), plan: document.getElementById("buildPlan"), roles: document.getElementById("roleTable"), pause: document.getElementById("pauseButton"), reset: document.getElementById("resetButton"), seed: document.getElementById("seedInput"), mode: document.getElementById("modeSelect"), difficulty: document.getElementById("difficultySelect"), sliders: {}
  };
  ["classicCount", "classicHp", "aggressiveCount", "aggressiveHp", "reserve"].forEach((id) => { dom.sliders[id] = document.getElementById(id); });

  const cardinal = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const terrainColors = { soil: "#4f7b49", forestFloor: "#365f3b", wetland: "#52734d", ridge: "#263333", water: "#2d6680", shallowWater: "#4b91a1" };
  const resourceColors = { tree: "#1f622f", rock: "#77786f", iron: "#7898a3", gold: "#d7aa42", crystal: "#5bcac2" };
  let sim;
  let last = performance.now();

  const key = (x, y) => `${x},${y}`;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const profile = () => PW.CONFIG.difficulty.profiles.find((item) => item.id === dom.difficulty.value);
  const slider = (name) => Number(dom.sliders[`${dom.mode.value}${name}`].value);
  const tileCenter = (x, y) => ({ x: PW.Utils.tileToWorld(x), y: PW.Utils.tileToWorld(y) });
  const tileOf = (point) => ({ x: PW.Utils.worldToTile(point.x), y: PW.Utils.worldToTile(point.y) });
  const world = () => PW.state.world;
  const ship = () => PW.state.ship;
  const resourceDef = (node) => PW.RESOURCE_NODES[node.type];
  const resourceId = (node) => resourceDef(node)?.resource;
  const isShipTile = (x, y) => PW.Tiles.isShipTile(x, y);
  const isTerrainWalkable = (x, y) => {
    const tile = PW.Tiles.get(x, y);
    return Boolean(tile && !tile.blocked && !isShipTile(x, y));
  };
  const isWalkable = (x, y) => isTerrainWalkable(x, y) && !world().resourceMap.has(key(x, y)) && !sim.structures.has(key(x, y));
  const canBuildAt = (x, y) => {
    const tile = PW.Tiles.get(x, y);
    return Boolean(tile && !tile.blocked && !PW.Tiles.isWaterKind(tile.kind) && !isShipTile(x, y) && !world().resourceMap.has(key(x, y)) && !sim.structures.has(key(x, y)));
  };
  const size = () => world().width * world().height;
  const indexOf = (x, y) => y * world().width + x;
  const tileFromIndex = (index) => ({ x: index % world().width, y: Math.floor(index / world().width) });

  function drawTerrainLayer() {
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    const layerCtx = layer.getContext("2d");
    const scale = canvas.width / world().width;
    world().tiles.forEach((tile) => {
      layerCtx.fillStyle = terrainColors[tile.kind] || terrainColors.soil;
      layerCtx.fillRect(tile.x * scale, tile.y * scale, Math.ceil(scale), Math.ceil(scale));
    });
    return layer;
  }

  function ring(radius, gate) {
    const center = { x: ship().x + Math.floor(ship().size / 2), y: ship().y + Math.floor(ship().size / 2) };
    const result = [];
    for (let x = center.x - radius; x <= center.x + radius; x += 1) result.push({ x, y: center.y - radius }, { x, y: center.y + radius });
    for (let y = center.y - radius + 1; y < center.y + radius; y += 1) result.push({ x: center.x - radius, y }, { x: center.x + radius, y });
    return result.filter((tile) => tile.x !== gate.x || tile.y !== gate.y);
  }

  function buildQueue() {
    const center = { x: ship().x + Math.floor(ship().size / 2), y: ship().y + Math.floor(ship().size / 2) };
    const tower = (type, x, y) => ({ type, x, y });
    if (dom.mode.value !== "classic") return [tower("ballista", center.x + 2, center.y + 2), tower("catapult", center.x - 4, center.y - 4), tower("ballista", center.x + 4, center.y + 4), tower("flak", center.x + 4, center.y - 4), tower("tesla", center.x - 4, center.y + 4), tower("laser", center.x + 6, center.y)];
    const replaceWall = (tiles, replacements) => tiles.map((tile) => replacements.get(key(tile.x, tile.y)) || { type: "palisade", ...tile });
    const inner = replaceWall(ring(3, { x: center.x - 3, y: center.y + 2 }), new Map([
      [key(center.x + 3, center.y + 2), tower("ballista", center.x + 3, center.y + 2)]
    ]));
    const outer = replaceWall(ring(5, { x: center.x, y: center.y - 5 }), new Map([
      [key(center.x - 4, center.y - 5), tower("ballista", center.x - 4, center.y - 5)],
      [key(center.x - 3, center.y - 5), tower("flak", center.x - 3, center.y - 5)],
      [key(center.x - 2, center.y - 5), tower("catapult", center.x - 2, center.y - 5)],
      [key(center.x + 4, center.y + 5), tower("ballista", center.x + 4, center.y + 5)],
      [key(center.x - 5, center.y + 3), tower("tesla", center.x - 5, center.y + 3)],
      [key(center.x + 2, center.y - 5), tower("laser", center.x + 2, center.y - 5)]
    ]));
    return [...inner, ...outer];
  }

  function reset() {
    const seed = Number(dom.seed.value) || 1;
    PW.state = PW.createInitialState();
    PW.state.seed = seed;
    PW.state.rng = PW.Random.create(seed);
    PW.state.gameMode = dom.mode.value;
    PW.state.difficulty = dom.difficulty.value;
    PW.MapGenerator.generate();
    sim = { time: 0, night: 1, nextNight: PW.CONFIG.phases.day, queue: buildQueue(), buildIndex: 0, bot: { x: PW.state.player.x, y: PW.state.player.y, target: null }, structures: new Map(), towers: [], enemies: [], drops: [], spawned: 0, kills: 0, fightTimes: [], terrainLayer: drawTerrainLayer(), distanceField: null, mapVersion: 0, fieldVersion: -1, paused: false, speed: 1, notice: "Tag: Bot erkundet die echte Karte und sammelt endliche Ressourcen." };
    refreshDistanceField();
    renderPlan();
  }

  const currentBuild = () => sim.queue[sim.buildIndex];
  const missing = (entry) => Object.entries(PW.BUILDINGS[entry.type].cost).map(([id, amount]) => {
    const reserve = (id === "scrap" || id === "parts" || id === "key") ? 1 : Number(dom.sliders.reserve.value);
    return { id, amount: amount * reserve - PW.state.inventory[id] };
  }).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);

  function findPath(start, goalTiles) {
    const goals = new Set(goalTiles.map((tile) => key(tile.x, tile.y)));
    const startTile = tileOf(start);
    if (!isWalkable(startTile.x, startTile.y) || !goals.size) return null;
    const total = size();
    const previous = new Int32Array(total).fill(-2);
    const queue = new Int32Array(total);
    const startIndex = indexOf(startTile.x, startTile.y);
    previous[startIndex] = -1;
    queue[0] = startIndex;
    let head = 0;
    let tail = 1;
    let found = -1;
    while (head < tail) {
      const index = queue[head++];
      const tile = tileFromIndex(index);
      if (goals.has(key(tile.x, tile.y))) { found = index; break; }
      for (const [dx, dy] of cardinal) {
        const x = tile.x + dx;
        const y = tile.y + dy;
        if (!isWalkable(x, y)) continue;
        const next = indexOf(x, y);
        if (previous[next] !== -2) continue;
        previous[next] = index;
        queue[tail++] = next;
      }
    }
    if (found < 0) return null;
    const path = [];
    for (let index = found; index >= 0; index = previous[index]) path.push(tileFromIndex(index));
    return path.reverse();
  }

  function pathToAdjacent(tile) {
    const candidates = cardinal.map(([dx, dy]) => ({ x: tile.x + dx, y: tile.y + dy })).filter((candidate) => isWalkable(candidate.x, candidate.y));
    return findPath(sim.bot, candidates);
  }

  function targetNode(resource) {
    const startTile = tileOf(sim.bot);
    if (!isWalkable(startTile.x, startTile.y)) return null;
    const previous = new Int32Array(size()).fill(-2);
    const queue = new Int32Array(size());
    const startIndex = indexOf(startTile.x, startTile.y);
    previous[startIndex] = -1;
    queue[0] = startIndex;
    let head = 0;
    let tail = 1;
    while (head < tail) {
      const index = queue[head++];
      const tile = tileFromIndex(index);
      for (const [dx, dy] of cardinal) {
        const node = world().resourceMap.get(key(tile.x + dx, tile.y + dy));
        if (node && resourceId(node) === resource) {
          const path = [];
          for (let cursor = index; cursor >= 0; cursor = previous[cursor]) path.push(tileFromIndex(cursor));
          return { type: "gather", node, path: path.reverse(), pathIndex: 1, timer: 0 };
        }
      }
      for (const [dx, dy] of cardinal) {
        const x = tile.x + dx;
        const y = tile.y + dy;
        if (!isWalkable(x, y)) continue;
        const next = indexOf(x, y);
        if (previous[next] !== -2) continue;
        previous[next] = index;
        queue[tail++] = next;
      }
    }
    return null;
  }

  function targetDrop(resource) {
    const botTile = tileOf(sim.bot);
    const drops = sim.drops.filter((drop) => drop.resource === resource).sort((a, b) => Math.hypot(a.tileX - botTile.x, a.tileY - botTile.y) - Math.hypot(b.tileX - botTile.x, b.tileY - botTile.y));
    for (const drop of drops) {
      const path = findPath(sim.bot, [{ x: drop.tileX, y: drop.tileY }]);
      if (path) return { type: "drop", drop, path, pathIndex: 1 };
    }
    return null;
  }

  function chooseTarget() {
    const entry = currentBuild();
    if (!entry) return null;
    const blockingNode = world().resourceMap.get(key(entry.x, entry.y));
    if (blockingNode) {
      const path = pathToAdjacent(blockingNode);
      return path ? { type: "gather", node: blockingNode, path, pathIndex: 1, timer: 0, clearingBuild: true } : null;
    }
    const needs = missing(entry);
    if (!needs.length) {
      const path = pathToAdjacent(entry);
      return path ? { type: "build", entry, path, pathIndex: 1 } : null;
    }
    const need = needs[0].id;
    return targetDrop(need) || targetNode(need);
  }

  function targetIsValid(target) {
    if (!target) return false;
    if (target.type === "gather") return world().resourceMap.get(key(target.node.x, target.node.y)) === target.node;
    if (target.type === "drop") return sim.drops.includes(target.drop);
    if (target.type === "build") return currentBuild() === target.entry;
    return false;
  }

  function moveAlongPath(target, dt) {
    const waypoint = target.path[target.pathIndex];
    if (!waypoint) return true;
    const point = tileCenter(waypoint.x, waypoint.y);
    const gap = distance(sim.bot, point);
    if (gap <= 2) { target.pathIndex += 1; return target.pathIndex >= target.path.length; }
    const step = Math.min(gap, PW.CONFIG.playerSpeed * dt);
    sim.bot.x += (point.x - sim.bot.x) / gap * step;
    sim.bot.y += (point.y - sim.bot.y) / gap * step;
    return false;
  }

  function removeNode(node) {
    world().resourceMap.delete(key(node.x, node.y));
    world().resources = world().resources.filter((item) => item !== node);
    sim.mapVersion += 1;
  }

  function build(entry) {
    const def = PW.BUILDINGS[entry.type];
    if (!canBuildAt(entry.x, entry.y)) {
      sim.notice = `${def.name}: Bauplatz ist nicht frei.`;
      sim.bot.target = null;
      return;
    }
    Object.entries(def.cost).forEach(([id, amount]) => { PW.state.inventory[id] -= amount; });
    const structure = { ...entry, cooldown: 0, hp: def.maxHp, maxHp: def.maxHp };
    sim.structures.set(key(entry.x, entry.y), structure);
    if (def.category === "tower") sim.towers.push(structure);
    sim.buildIndex += 1;
    sim.mapVersion += 1;
    sim.notice = `${def.name} errichtet.`;
    renderPlan();
  }

  function updateBot(dt) {
    const entry = currentBuild();
    if (!entry) { sim.bot.target = null; return; }
    if (!targetIsValid(sim.bot.target)) sim.bot.target = chooseTarget();
    const target = sim.bot.target;
    if (!target) {
      sim.notice = `Bot wartet auf ${Object.keys(PW.BUILDINGS[entry.type].cost).map((id) => PW.RESOURCES[id].name).join(" und ")}.`;
      return;
    }
    if (!moveAlongPath(target, dt)) return;
    if (target.type === "drop") {
      PW.state.inventory[target.drop.resource] += target.drop.amount;
      sim.drops = sim.drops.filter((drop) => drop !== target.drop);
      sim.notice = `${PW.RESOURCES[target.drop.resource].name} eingesammelt.`;
      sim.bot.target = null;
      return;
    }
    if (target.type === "build") {
      build(target.entry);
      sim.bot.target = null;
      return;
    }
    target.timer -= dt;
    if (target.timer > 0) return;
    target.node.hp -= 1;
    target.timer = 0.16;
    sim.notice = `${resourceDef(target.node).name} wird abgebaut.`;
    if (target.node.hp > 0) return;
    PW.state.inventory[resourceId(target.node)] += target.node.amount;
    sim.notice = `${resourceDef(target.node).name} vollstaendig abgebaut.`;
    removeNode(target.node);
    sim.bot.target = null;
  }

  function refreshDistanceField() {
    if (sim.fieldVersion === sim.mapVersion) return;
    const field = new Float64Array(size());
    field.fill(Infinity);
    const queue = new Int32Array(size());
    let head = 0;
    let tail = 0;
    const shipData = ship();
    for (let y = shipData.y - 1; y <= shipData.y + shipData.size; y += 1) {
      for (let x = shipData.x - 1; x <= shipData.x + shipData.size; x += 1) {
        if (!isWalkable(x, y)) continue;
        const index = indexOf(x, y);
        field[index] = 0;
        queue[tail++] = index;
      }
    }
    while (head < tail) {
      const index = queue[head++];
      const tile = tileFromIndex(index);
      for (const [dx, dy] of cardinal) {
        const x = tile.x + dx;
        const y = tile.y + dy;
        if (!isWalkable(x, y)) continue;
        const next = indexOf(x, y);
        if (field[next] !== Infinity) continue;
        field[next] = field[index] + 1;
        queue[tail++] = next;
      }
    }
    sim.distanceField = field;
    sim.fieldVersion = sim.mapVersion;
  }

  function spawnTile() {
    refreshDistanceField();
    const candidates = [];
    const margin = 3;
    const padding = 8;
    for (let x = padding; x < world().width - padding; x += 1) candidates.push({ x, y: margin }, { x, y: world().height - margin - 1 });
    for (let y = padding; y < world().height - padding; y += 1) candidates.push({ x: margin, y }, { x: world().width - margin - 1, y });
    const valid = candidates.filter((tile) => isWalkable(tile.x, tile.y) && Number.isFinite(sim.distanceField[indexOf(tile.x, tile.y)]));
    return valid.length ? PW.state.rng.pick(valid) : { x: margin, y: margin };
  }

  function startNight() {
    const wave = PW.WAVES[Math.min(sim.night - 1, PW.WAVES.length - 1)];
    const count = Math.max(2, Math.round((7 + sim.night * 3.5) * profile().threatMultiplier * slider("Count")));
    for (let index = 0; index < count; index += 1) {
      const type = PW.state.rng.pick(wave.enemies);
      const def = PW.ENEMIES[type];
      const tile = spawnTile();
      const point = tileCenter(tile.x, tile.y);
      sim.enemies.push({ type, x: point.x, y: point.y, hp: def.hp * slider("Hp"), born: sim.time, firstHit: null, slowTimer: 0, slowFactor: 1, attackCooldown: def.attackCooldown });
    }
    sim.spawned += count;
    sim.notice = `Nacht ${sim.night}: ${count} Gegner auf der Kartenkante. ${wave.note}`;
    sim.night += 1;
  }

  function nextGroundTile(enemy) {
    const tile = tileOf(enemy);
    const current = sim.distanceField[indexOf(tile.x, tile.y)];
    let best = null;
    let bestScore = current;
    for (const [dx, dy] of cardinal) {
      const x = tile.x + dx;
      const y = tile.y + dy;
      if (!isWalkable(x, y)) continue;
      const score = sim.distanceField[indexOf(x, y)];
      if (score < bestScore) { best = { x, y }; bestScore = score; }
    }
    return best;
  }

  function moveEnemy(enemy, target, dt) {
    const gap = distance(enemy, target);
    if (gap < 2) return;
    const def = PW.ENEMIES[enemy.type];
    const step = Math.min(gap, def.speed * enemy.slowFactor * dt);
    enemy.x += (target.x - enemy.x) / gap * step;
    enemy.y += (target.y - enemy.y) / gap * step;
  }

  function rollDrops(enemy) {
    Object.entries(PW.ENEMIES[enemy.type].drops || {}).forEach(([resource, [chance, min, max]]) => {
      if (!PW.state.rng.chance(chance)) return;
      const tile = tileOf(enemy);
      sim.drops.push({ resource, amount: PW.state.rng.int(min, max), tileX: tile.x, tileY: tile.y, x: enemy.x, y: enemy.y });
    });
  }

  function damageEnemy(enemy, amount, source) {
    const def = PW.ENEMIES[enemy.type];
    enemy.firstHit = enemy.firstHit ?? sim.time;
    enemy.hp -= amount * (def.damageTaken?.[source] || 1);
  }

  function updateTowers(dt) {
    sim.towers.forEach((tower) => {
      const def = PW.BUILDINGS[tower.type];
      tower.cooldown -= dt;
      if (tower.cooldown > 0) return;
      const origin = tileCenter(tower.x, tower.y);
      const target = sim.enemies.filter((enemy) => def.targets.includes(PW.ENEMIES[enemy.type].moveType) && distance(origin, enemy) <= def.range * PW.CONFIG.tileSize).sort((a, b) => distance(origin, a) - distance(origin, b))[0];
      if (!target) return;
      damageEnemy(target, def.damage, tower.type);
      if (def.splash) sim.enemies.filter((enemy) => enemy !== target && distance(enemy, target) <= def.splash * PW.CONFIG.tileSize).forEach((enemy) => damageEnemy(enemy, def.damage * def.splashFalloff, tower.type));
      if (def.slow) {
        target.slowFactor = Math.min(target.slowFactor, 1 - def.slow * (1 - (PW.ENEMIES[target.type].slowResistance || 0)));
        target.slowTimer = Math.max(target.slowTimer, def.slowTime);
      }
      tower.cooldown = 1 / def.rate;
    });
  }

  function updateEnemies(dt) {
    refreshDistanceField();
    const shipCenter = tileCenter(ship().x + ship().size / 2 - 0.5, ship().y + ship().size / 2 - 0.5);
    sim.enemies.forEach((enemy) => {
      const def = PW.ENEMIES[enemy.type];
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      if (!enemy.slowTimer) enemy.slowFactor = 1;
      if (def.moveType === "air") moveEnemy(enemy, shipCenter, dt);
      else {
        const step = nextGroundTile(enemy);
        if (step) moveEnemy(enemy, tileCenter(step.x, step.y), dt);
      }
    });
    updateTowers(dt);
    const dead = sim.enemies.filter((enemy) => enemy.hp <= 0);
    dead.forEach((enemy) => { sim.fightTimes.push(sim.time - (enemy.firstHit ?? enemy.born)); rollDrops(enemy); });
    sim.kills += dead.length;
    sim.enemies = sim.enemies.filter((enemy) => enemy.hp > 0);
  }

  function tick(dt) {
    sim.time += dt;
    updateBot(dt);
    if (!sim.enemies.length && sim.time >= sim.nextNight) {
      startNight();
      sim.nextNight += PW.CONFIG.phases.day + PW.CONFIG.phases.night;
    }
    if (sim.enemies.length) updateEnemies(dt);
  }

  function draw() {
    const scale = canvas.width / world().width;
    ctx.drawImage(sim.terrainLayer, 0, 0);
    world().resources.forEach((node) => {
      ctx.fillStyle = resourceColors[node.type] || "#c59d76";
      ctx.fillRect(node.x * scale + 1, node.y * scale + 1, Math.max(2, scale - 2), Math.max(2, scale - 2));
    });
    const shipData = ship();
    ctx.fillStyle = "#27334d";
    ctx.fillRect(shipData.x * scale, shipData.y * scale, shipData.size * scale, shipData.size * scale);
    sim.structures.forEach((structure) => {
      const def = PW.BUILDINGS[structure.type];
      ctx.fillStyle = def.category === "wall" ? "#8b633d" : "#d6a24d";
      const inset = def.category === "wall" ? 0 : 1;
      ctx.fillRect(structure.x * scale + inset, structure.y * scale + inset, scale - inset * 2, scale - inset * 2);
    });
    sim.drops.forEach((drop) => {
      ctx.fillStyle = PW.RESOURCES[drop.resource].color;
      ctx.fillRect(drop.tileX * scale + scale * 0.3, drop.tileY * scale + scale * 0.3, scale * 0.4, scale * 0.4);
    });
    sim.enemies.forEach((enemy) => {
      ctx.fillStyle = PW.ENEMIES[enemy.type].color;
      ctx.fillRect(enemy.x / PW.CONFIG.tileSize * scale - 2, enemy.y / PW.CONFIG.tileSize * scale - 2, 4, 4);
    });
    ctx.fillStyle = "#f4d8a3";
    ctx.fillRect(sim.bot.x / PW.CONFIG.tileSize * scale - 3, sim.bot.y / PW.CONFIG.tileSize * scale - 3, 6, 6);
  }

  function renderPlan() {
    dom.plan.innerHTML = sim.queue.map((item, index) => `<li class="${index < sim.buildIndex ? "done" : ""}">${PW.BUILDINGS[item.type].name}</li>`).join("");
  }

  function renderMetrics() {
    const average = sim.fightTimes.length ? sim.fightTimes.reduce((sum, value) => sum + value, 0) / sim.fightTimes.length : 0;
    const entries = [["Zeit", `${sim.time.toFixed(1)} s`], ["Nacht", sim.night - 1], ["Gegner aktiv", sim.enemies.length], ["Gespawnt / Kills", `${sim.spawned} / ${sim.kills}`], ["Kampfzeit", `${average.toFixed(1)} s`], ["Palisaden / Tuerme", `${[...sim.structures.values()].filter((item) => PW.BUILDINGS[item.type].category === "wall").length} / ${sim.towers.length}`], ["Knoten uebrig", world().resources.length], ["Holz / Stein", `${Math.floor(PW.state.inventory.wood)} / ${Math.floor(PW.state.inventory.stone)}`], ["Schrott / Bauteile", `${Math.floor(PW.state.inventory.scrap)} / ${Math.floor(PW.state.inventory.parts)}`]];
    dom.metrics.innerHTML = entries.map(([name, value]) => `<dt>${name}</dt><dd>${value}</dd>`).join("");
    dom.status.textContent = sim.notice;
  }

  function renderRoles() {
    dom.roles.innerHTML = Object.values(PW.BUILDINGS).filter((item) => item.category === "tower").map((tower) => `<div class="role-row"><strong>${tower.name}</strong><span>${Math.round(tower.damage * tower.rate)} DPS</span><span>${Object.entries(tower.cost).map(([id, amount]) => `${amount}${PW.RESOURCES[id].icon}`).join(" ")}</span></div>`).join("");
  }

  const refreshSliders = () => Object.entries(dom.sliders).forEach(([id, input]) => { document.getElementById(`${id}Value`).textContent = `${Number(input.value).toFixed(2)}x`; });
  const frame = (time) => {
    const dt = Math.min(0.12, (time - last) / 1000);
    last = time;
    if (!sim.paused) for (let step = 0; step < sim.speed; step += 1) tick(dt);
    draw();
    renderMetrics();
    requestAnimationFrame(frame);
  };

  document.querySelectorAll(".speed-button").forEach((button) => button.addEventListener("click", () => {
    sim.speed = Number(button.dataset.speed);
    document.querySelectorAll(".speed-button").forEach((item) => item.classList.toggle("active", item === button));
  }));
  Object.values(dom.sliders).forEach((input) => input.addEventListener("input", refreshSliders));
  dom.pause.addEventListener("click", () => { sim.paused = !sim.paused; dom.pause.textContent = sim.paused ? "Fortsetzen" : "Pause"; });
  dom.reset.addEventListener("click", reset);
  dom.mode.addEventListener("change", reset);
  dom.difficulty.addEventListener("change", reset);
  refreshSliders();
  reset();
  renderRoles();
  requestAnimationFrame(frame);
})();
