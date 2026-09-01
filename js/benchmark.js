"use strict";

(() => {
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");
  const dom = {
    status: document.getElementById("simStatus"), metrics: document.getElementById("simMetrics"), plan: document.getElementById("buildPlan"), roles: document.getElementById("roleTable"), pause: document.getElementById("pauseButton"), reset: document.getElementById("resetButton"), seed: document.getElementById("seedInput"), mode: document.getElementById("modeSelect"), difficulty: document.getElementById("difficultySelect")
  };
  const plan = ["ballista", "ballista", "catapult", "flak", "ballista", "tesla", "laser"];
  let sim;
  let last = performance.now();

  const difficultyMultiplier = () => PW.CONFIG.difficulty.profiles.find((item) => item.id === dom.difficulty.value).threatMultiplier;
  const modeProfile = () => PW.CONFIG.gameModes.profiles.find((item) => item.id === dom.mode.value);
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  const reset = () => {
    const rng = PW.Random.create(Number(dom.seed.value) || 1);
    sim = { rng, elapsed: 0, night: 1, nextNightAt: 18, nextBuild: 0, enemies: [], towers: [], kills: 0, spawned: 0, resources: { wood: 0, stone: 0, iron: 0, gold: 0, crystal: 0, scrap: 0, parts: 0 }, paused: false, speed: 1, warning: "Tag: Bot sammelt Material." };
    renderPlan();
  };
  const canAffordReserve = (cost) => Object.entries(cost).every(([id, amount]) => (sim.resources[id] || 0) >= amount * 2);
  const buildNext = () => {
    const type = plan[sim.nextBuild];
    if (!type) return;
    const def = PW.BUILDINGS[type];
    if (!canAffordReserve(def.cost)) return;
    Object.entries(def.cost).forEach(([id, amount]) => { sim.resources[id] -= amount; });
    const angle = sim.towers.length * 1.91;
    sim.towers.push({ type, x: center.x + Math.cos(angle) * (72 + sim.towers.length * 13), y: center.y + Math.sin(angle) * (72 + sim.towers.length * 13), cooldown: 0 });
    sim.nextBuild += 1;
    sim.warning = `${def.name} errichtet.`;
    renderPlan();
  };
  const collect = (dt) => {
    const rates = { wood: 5.4, stone: 3.6, iron: 1.4, scrap: 1.15, crystal: 0.42, gold: 0.28, parts: 0.18 };
    Object.entries(rates).forEach(([id, rate]) => { sim.resources[id] += rate * dt; });
    buildNext();
  };
  const beginNight = () => {
    const wave = PW.WAVES[Math.min(sim.night - 1, PW.WAVES.length - 1)];
    const mode = modeProfile();
    const base = 13 + (sim.night - 1) * 5.4;
    const budget = base * difficultyMultiplier() * mode.waveMultiplier;
    const countMultiplier = mode.id === "classic" ? 2 : 1;
    const count = Math.max(2, Math.round(budget * countMultiplier));
    for (let i = 0; i < count; i++) {
      const type = sim.rng.pick(wave.enemies);
      const def = PW.ENEMIES[type];
      const angle = sim.rng.float(0, Math.PI * 2);
      const distance = sim.rng.float(390, 510);
      sim.enemies.push({ type, x: center.x + Math.cos(angle) * distance, y: center.y + Math.sin(angle) * distance, hp: def.hp, maxHp: def.hp, born: sim.elapsed, firstHit: null });
    }
    sim.spawned += count;
    sim.warning = `Nacht ${sim.night}: ${count} Gegner (${wave.note})`;
  };
  const updateCombat = (dt) => {
    sim.enemies.forEach((enemy) => {
      const def = PW.ENEMIES[enemy.type];
      const dx = center.x - enemy.x; const dy = center.y - enemy.y; const length = Math.hypot(dx, dy) || 1;
      enemy.x += dx / length * def.speed * dt * 0.72; enemy.y += dy / length * def.speed * dt * 0.72;
    });
    sim.towers.forEach((tower) => {
      const def = PW.BUILDINGS[tower.type]; tower.cooldown -= dt;
      if (tower.cooldown > 0) return;
      const target = sim.enemies.filter((enemy) => def.targets.includes(PW.ENEMIES[enemy.type].moveType)).sort((a, b) => Math.hypot(a.x - tower.x, a.y - tower.y) - Math.hypot(b.x - tower.x, b.y - tower.y))[0];
      if (!target || Math.hypot(target.x - tower.x, target.y - tower.y) > def.range * 32) return;
      target.firstHit = target.firstHit ?? sim.elapsed; target.hp -= def.damage; tower.cooldown = 1 / def.rate;
    });
    const dead = sim.enemies.filter((enemy) => enemy.hp <= 0);
    sim.kills += dead.length; sim.enemies = sim.enemies.filter((enemy) => enemy.hp > 0);
  };
  const tick = (dt) => {
    sim.elapsed += dt;
    if (!sim.enemies.length) collect(dt);
    if (!sim.enemies.length && sim.elapsed >= sim.nextNightAt) { beginNight(); sim.nextNightAt += 32; sim.night += 1; }
    if (sim.enemies.length) updateCombat(dt);
  };
  const draw = () => {
    ctx.fillStyle = "#f4f4ee"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#d4d6cf"; for (let x = 0; x < canvas.width; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); } for (let y = 0; y < canvas.height; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    ctx.fillStyle = "#26313b"; ctx.fillRect(center.x - 24, center.y - 24, 48, 48);
    sim.towers.forEach((tower) => { ctx.fillStyle = PW.BUILDINGS[tower.type].targets.includes("air") ? "#7588bc" : "#9c6d47"; ctx.fillRect(tower.x - 6, tower.y - 6, 12, 12); });
    sim.enemies.forEach((enemy) => { const def = PW.ENEMIES[enemy.type]; ctx.fillStyle = def.color; ctx.fillRect(enemy.x - 4, enemy.y - 4, 8, 8); });
  };
  const renderPlan = () => { dom.plan.innerHTML = plan.map((type, index) => `<li class="${index < sim.nextBuild ? "done" : ""}">${PW.BUILDINGS[type].name}</li>`).join(""); };
  const renderMetrics = () => { const entries = [["Zeit", `${sim.elapsed.toFixed(1)} s`], ["Nacht", sim.night - 1], ["Gegner aktiv", sim.enemies.length], ["Gegner gespawnt", sim.spawned], ["Kills", sim.kills], ["Türme", sim.towers.length], ["Holz / Stein", `${Math.floor(sim.resources.wood)} / ${Math.floor(sim.resources.stone)}`], ["Schrott", Math.floor(sim.resources.scrap)]]; dom.metrics.innerHTML = entries.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join(""); dom.status.textContent = sim.warning; };
  const renderRoles = () => { dom.roles.innerHTML = Object.values(PW.BUILDINGS).filter((item) => item.category === "tower").map((tower) => `<div class="role-row"><strong>${tower.name}</strong><span>${Math.round(tower.damage * tower.rate)} DPS</span><span>${Object.entries(tower.cost).map(([id, amount]) => `${amount}${PW.RESOURCES[id].icon}`).join(" ")}</span></div>`).join(""); };
  const frame = (time) => { const dt = Math.min(.15, (time - last) / 1000); last = time; if (!sim.paused) { const steps = Math.max(1, Math.ceil(sim.speed)); for (let i = 0; i < steps; i++) tick(dt); } draw(); renderMetrics(); requestAnimationFrame(frame); };
  document.querySelectorAll(".speed-button").forEach((button) => button.addEventListener("click", () => { sim.speed = Number(button.dataset.speed); document.querySelectorAll(".speed-button").forEach((item) => item.classList.toggle("active", item === button)); }));
  dom.pause.addEventListener("click", () => { sim.paused = !sim.paused; dom.pause.textContent = sim.paused ? "Fortsetzen" : "Pause"; }); dom.reset.addEventListener("click", reset); dom.mode.addEventListener("change", reset); dom.difficulty.addEventListener("change", reset);
  reset(); renderRoles(); requestAnimationFrame(frame);
})();
