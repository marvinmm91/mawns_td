"use strict";

(() => {
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");
  const cell = 32;
  const baseTile = { x: 15, y: 9 };
  const base = { x: baseTile.x * cell + 16, y: baseTile.y * cell + 16 };
  const dom = {
    status: document.getElementById("simStatus"), metrics: document.getElementById("simMetrics"), plan: document.getElementById("buildPlan"), roles: document.getElementById("roleTable"), pause: document.getElementById("pauseButton"), reset: document.getElementById("resetButton"), seed: document.getElementById("seedInput"), mode: document.getElementById("modeSelect"), difficulty: document.getElementById("difficultySelect"), sliders: {}
  };
  ["classicCount", "classicHp", "aggressiveCount", "aggressiveHp", "reserve"].forEach((id) => { dom.sliders[id] = document.getElementById(id); });
  const maze = [
    ...Array.from({ length: 10 }, (_, i) => ({ x: 7 + i, y: 4 })), ...Array.from({ length: 9 }, (_, i) => ({ x: 7, y: 5 + i })),
    ...Array.from({ length: 10 }, (_, i) => ({ x: 8 + i, y: 14 })), ...Array.from({ length: 8 }, (_, i) => ({ x: 18, y: 6 + i })),
    ...Array.from({ length: 6 }, (_, i) => ({ x: 11 + i, y: 7 })), ...Array.from({ length: 5 }, (_, i) => ({ x: 11, y: 8 + i }))
  ];
  const mazeRoute = [{ x: 2, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 16 }, { x: 21, y: 16 }, { x: 21, y: 6 }, { x: 15, y: 6 }, baseTile];
  const towerSites = [{ type: "ballista", x: 9, y: 5 }, { type: "ballista", x: 16, y: 13 }, { type: "catapult", x: 14, y: 5 }, { type: "flak", x: 20, y: 10 }, { type: "ballista", x: 13, y: 10 }, { type: "tesla", x: 17, y: 8 }, { type: "laser", x: 15, y: 12 }];
  const nodeGroups = [
    ["tree", "wood", "#356f42", [[3,3],[4,6],[3,12],[5,16],[22,3],[26,5],[24,13],[27,16]]],
    ["rock", "stone", "#77786f", [[9,2],[2,9],[8,17],[24,9],[20,17]]], ["iron", "iron", "#7d9da9", [[12,2],[27,11],[22,16]]],
    ["scrap", "scrap", "#c59d76", [[14,2],[3,16],[25,13]]], ["crystal", "crystal", "#65cec8", [[27,5],[5,17]]],
    ["gold", "gold", "#d6a845", [[25,3]]], ["parts", "parts", "#e6d7a3", [[10,17]]]
  ];
  let sim;
  let last = performance.now();
  const point = (tile) => ({ x: tile.x * cell + 16, y: tile.y * cell + 16 });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const profile = () => PW.CONFIG.difficulty.profiles.find((item) => item.id === dom.difficulty.value);
  const slider = (name) => Number(dom.sliders[`${dom.mode.value}${name}`].value);
  const makeNodes = () => nodeGroups.flatMap(([type, resource, color, positions]) => positions.map(([x, y]) => ({ type, resource, color, x, y, amount: 999 })));
  const queue = () => {
    if (dom.mode.value !== "classic") return towerSites.map((site) => ({ ...site }));
    const result = [];
    for (let index = 0; index < maze.length; index += 6) result.push(...maze.slice(index, index + 6).map((tile) => ({ type: "palisade", ...tile })), ...(towerSites[index / 6] ? [towerSites[index / 6]] : []));
    return result;
  };
  const reset = () => {
    sim = { rng: PW.Random.create(Number(dom.seed.value) || 1), time: 0, night: 1, nextNight: 34, queue: queue(), buildIndex: 0, nodes: makeNodes(), resources: Object.fromEntries(Object.keys(PW.RESOURCES).map((id) => [id, 0])), bot: { ...base, target: null, gather: 0 }, walls: [], towers: [], enemies: [], spawned: 0, kills: 0, fightTimes: [], paused: false, speed: 1, notice: "Tag: Bot sucht Holz fuer die erste Palisade." };
    renderPlan();
  };
  const currentBuild = () => sim.queue[sim.buildIndex];
  const missing = (entry) => Object.entries(PW.BUILDINGS[entry.type].cost).map(([id, amount]) => ({ id, amount: amount * Number(dom.sliders.reserve.value) - sim.resources[id] })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
  const chooseTarget = () => {
    const entry = currentBuild();
    if (!entry) return null;
    const need = missing(entry);
    if (!need.length) return { type: "build", entry, ...point(entry) };
    const candidates = sim.nodes.filter((node) => node.resource === need[0].id && node.amount > 0).sort((a, b) => distance(sim.bot, point(a)) - distance(sim.bot, point(b)));
    return candidates.length ? { type: "gather", node: candidates[0], ...point(candidates[0]) } : null;
  };
  const updateBot = (dt) => {
    const build = currentBuild();
    if (!build) { sim.bot.target = null; return; }
    const isValidGatherTarget = sim.bot.target?.type === "gather" && sim.bot.target.node.amount > 0 && missing(build).some((item) => item.id === sim.bot.target.node.resource);
    sim.bot.target = isValidGatherTarget ? sim.bot.target : chooseTarget();
    const target = sim.bot.target;
    if (!target) return;
    const gap = distance(sim.bot, target);
    if (gap > 4) { const step = Math.min(gap, 112 * dt); sim.bot.x += (target.x - sim.bot.x) / gap * step; sim.bot.y += (target.y - sim.bot.y) / gap * step; return; }
    if (target.type === "build") {
      const def = PW.BUILDINGS[target.entry.type];
      Object.entries(def.cost).forEach(([id, amount]) => { sim.resources[id] -= amount; });
      (def.category === "wall" ? sim.walls : sim.towers).push({ ...target.entry, ...point(target.entry), cooldown: 0 });
      sim.buildIndex += 1; sim.notice = `${def.name} errichtet.`; renderPlan(); return;
    }
    sim.bot.gather -= dt;
    if (sim.bot.gather <= 0) { sim.resources[target.node.resource] += target.node.resource === "wood" ? 3 : 2; target.node.amount -= 1; sim.bot.gather = target.node.resource === "wood" ? .42 : .68; sim.notice = `${target.node.resource} wird gesammelt.`; }
  };
  const startNight = () => {
    const wave = PW.WAVES[Math.min(sim.night - 1, PW.WAVES.length - 1)];
    const count = Math.max(2, Math.round((7 + sim.night * 3.5) * profile().threatMultiplier * slider("Count")));
    for (let index = 0; index < count; index++) {
      const type = sim.rng.pick(wave.enemies); const def = PW.ENEMIES[type]; const angle = sim.rng.float(0, Math.PI * 2); const range = sim.rng.float(430, 510); const hp = def.hp * slider("Hp");
      sim.enemies.push({ type, x: base.x + Math.cos(angle) * range, y: base.y + Math.sin(angle) * range, hp, born: sim.time, firstHit: null, route: 0 });
    }
    sim.spawned += count; sim.notice = `Nacht ${sim.night}: ${count} Gegner. ${wave.note}`; sim.night += 1;
  };
  const enemyGoal = (enemy) => {
    const useMaze = dom.mode.value === "classic" && sim.walls.length >= Math.ceil(maze.length * .7);
    const route = useMaze ? mazeRoute : [baseTile];
    return point(route[Math.min(enemy.route, route.length - 1)]);
  };
  const updateEnemies = (dt) => {
    sim.enemies.forEach((enemy) => { const def = PW.ENEMIES[enemy.type]; const goal = enemyGoal(enemy); const gap = distance(enemy, goal) || 1; if (gap < 7 && enemy.route < mazeRoute.length - 1) enemy.route += 1; else { enemy.x += (goal.x - enemy.x) / gap * def.speed * dt * .7; enemy.y += (goal.y - enemy.y) / gap * def.speed * dt * .7; } });
    sim.towers.forEach((tower) => { const def = PW.BUILDINGS[tower.type]; tower.cooldown -= dt; if (tower.cooldown > 0) return; const target = sim.enemies.filter((enemy) => def.targets.includes(PW.ENEMIES[enemy.type].moveType) && distance(tower, enemy) <= def.range * cell).sort((a, b) => distance(tower, a) - distance(tower, b))[0]; if (!target) return; target.firstHit = target.firstHit ?? sim.time; target.hp -= def.damage; tower.cooldown = 1 / def.rate; });
    const dead = sim.enemies.filter((enemy) => enemy.hp <= 0); dead.forEach((enemy) => sim.fightTimes.push(sim.time - (enemy.firstHit ?? enemy.born))); sim.kills += dead.length; sim.enemies = sim.enemies.filter((enemy) => enemy.hp > 0);
  };
  const tick = (dt) => { sim.time += dt; updateBot(dt); if (!sim.enemies.length && sim.time >= sim.nextNight) { startNight(); sim.nextNight += 38; } if (sim.enemies.length) updateEnemies(dt); };
  const draw = () => {
    ctx.fillStyle = "#527f4b"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < 19; y++) for (let x = 0; x < 30; x++) if ((x + y) % 2) { ctx.fillStyle = "rgba(255,255,255,.025)"; ctx.fillRect(x * cell, y * cell, cell, cell); }
    sim.nodes.filter((node) => node.amount > 0).forEach((node) => { const p = point(node); ctx.fillStyle = node.color; if (node.type === "tree") { ctx.fillRect(p.x - 3, p.y + 4, 6, 9); ctx.fillRect(p.x - 10, p.y - 10, 20, 18); } else ctx.fillRect(p.x - 8, p.y - 8, 16, 16); });
    sim.walls.forEach((wall) => { ctx.fillStyle = "#785a3a"; ctx.fillRect(wall.x - 14, wall.y - 14, 28, 28); });
    ctx.fillStyle = "#2d3851"; ctx.fillRect(base.x - 30, base.y - 30, 60, 60);
    sim.towers.forEach((tower) => { ctx.fillStyle = PW.BUILDINGS[tower.type].targets.includes("air") ? "#8299c8" : "#c99351"; ctx.fillRect(tower.x - 11, tower.y - 11, 22, 22); });
    sim.enemies.forEach((enemy) => { ctx.fillStyle = PW.ENEMIES[enemy.type].color; ctx.fillRect(enemy.x - 6, enemy.y - 6, 12, 12); });
    ctx.fillStyle = "#f5d8a5"; ctx.fillRect(sim.bot.x - 7, sim.bot.y - 7, 14, 14);
  };
  const renderPlan = () => { dom.plan.innerHTML = sim.queue.map((item, index) => `<li class="${index < sim.buildIndex ? "done" : ""}">${PW.BUILDINGS[item.type].name}</li>`).join(""); };
  const renderMetrics = () => { const average = sim.fightTimes.length ? sim.fightTimes.reduce((sum, value) => sum + value, 0) / sim.fightTimes.length : 0; const entries = [["Zeit", `${sim.time.toFixed(1)} s`], ["Nacht", sim.night - 1], ["Gegner aktiv", sim.enemies.length], ["Gespawnt / Kills", `${sim.spawned} / ${sim.kills}`], ["Kampfzeit", `${average.toFixed(1)} s`], ["Palisaden / Türme", `${sim.walls.length} / ${sim.towers.length}`], ["Holz / Stein", `${Math.floor(sim.resources.wood)} / ${Math.floor(sim.resources.stone)}`], ["Schrott", Math.floor(sim.resources.scrap)]]; dom.metrics.innerHTML = entries.map(([name, value]) => `<dt>${name}</dt><dd>${value}</dd>`).join(""); dom.status.textContent = sim.notice; };
  const renderRoles = () => { dom.roles.innerHTML = Object.values(PW.BUILDINGS).filter((item) => item.category === "tower").map((tower) => `<div class="role-row"><strong>${tower.name}</strong><span>${Math.round(tower.damage * tower.rate)} DPS</span><span>${Object.entries(tower.cost).map(([id, amount]) => `${amount}${PW.RESOURCES[id].icon}`).join(" ")}</span></div>`).join(""); };
  const refreshSliders = () => Object.entries(dom.sliders).forEach(([id, input]) => { document.getElementById(`${id}Value`).textContent = `${Number(input.value).toFixed(2)}x`; });
  const frame = (time) => { const dt = Math.min(.12, (time - last) / 1000); last = time; if (!sim.paused) for (let step = 0; step < sim.speed; step++) tick(dt); draw(); renderMetrics(); requestAnimationFrame(frame); };
  document.querySelectorAll(".speed-button").forEach((button) => button.addEventListener("click", () => { sim.speed = Number(button.dataset.speed); document.querySelectorAll(".speed-button").forEach((item) => item.classList.toggle("active", item === button)); }));
  Object.values(dom.sliders).forEach((input) => input.addEventListener("input", refreshSliders)); dom.pause.addEventListener("click", () => { sim.paused = !sim.paused; dom.pause.textContent = sim.paused ? "Fortsetzen" : "Pause"; }); dom.reset.addEventListener("click", reset); dom.mode.addEventListener("change", reset); dom.difficulty.addEventListener("change", reset);
  refreshSliders(); reset(); renderRoles(); requestAnimationFrame(frame);
})();
