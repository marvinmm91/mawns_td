"use strict";

PW.Render = {
  draw() {
    const state = PW.state;
    const ctx = state.ctx;
    if (!ctx) return;
    const scale = state.camera.pixelRatio || window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0b0d0d";
    ctx.fillRect(0, 0, state.camera.w, state.camera.h);
    PW.RenderWorld.draw(ctx);
    PW.RenderEntities.drawWorldEntities(ctx);
    PW.RenderEffects.draw(ctx);
    PW.RenderFog.draw(ctx);
    PW.RenderEntities.drawPlayer(ctx);
    this.drawOverlay(ctx);
    this.drawToolFeedback(ctx);
    this.drawPerformanceOverlay(ctx);
    if (PW.TacticalMap) PW.TacticalMap.render();
  },
  drawOverlay(ctx) {
    const state = PW.state;
    const target = this.buildTargetTile();
    if (state.player.selectedTool === "build") {
      const ts = state.world.tileSize;
      const def = PW.BUILDINGS[state.selectedBuild];
      const action = PW.Input.buildAction();
      const blueprintMode = action === "blueprint";
      const eraseBlueprintMode = action === "eraseBlueprint";
      const ok = eraseBlueprintMode
        ? Boolean(PW.Tiles.getBlueprint(target.x, target.y))
        : def && state.unlockedBuildings.has(state.selectedBuild) && (blueprintMode
        ? PW.BuildingSystem.canPlaceBlueprint(state.selectedBuild, target.x, target.y)
        : PW.BuildingSystem.canPlaceBuilding(state.selectedBuild, target.x, target.y) && PW.Utils.canAfford(def.cost));
      const sx = target.x * ts - state.camera.x;
      const sy = target.y * ts - state.camera.y;
      if (def && !eraseBlueprintMode) {
        ctx.save();
        ctx.translate(sx, sy);
        PW.Icons.drawBuilding(ctx, state.selectedBuild, ts, ok ? 0.5 : 0.24);
        ctx.restore();
        if (def.category === "tower") {
          const cx = sx + ts / 2;
          const cy = sy + ts / 2;
          ctx.strokeStyle = ok ? (blueprintMode ? "rgba(131,227,218,.38)" : "rgba(102,198,166,.32)") : "rgba(227,93,87,.24)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, def.range * ts, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = eraseBlueprintMode ? (ok ? "rgba(227,93,87,.96)" : "rgba(227,93,87,.42)") : ok ? (blueprintMode ? "rgba(131,227,218,.95)" : "rgba(110,195,110,.95)") : "rgba(227,93,87,.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
      if (eraseBlueprintMode) {
        ctx.beginPath();
        ctx.moveTo(sx + 7, sy + 7);
        ctx.lineTo(sx + ts - 7, sy + ts - 7);
        ctx.moveTo(sx + ts - 7, sy + 7);
        ctx.lineTo(sx + 7, sy + ts - 7);
        ctx.stroke();
      }
      if (!blueprintMode && !eraseBlueprintMode && def && !PW.Utils.canAfford(def.cost)) {
        this.drawMissingBuildCost(ctx, target, def.cost);
      }
    } else if (state.player.selectedTool === "repair") {
      if (PW.Tiles.isShipTile(target.x, target.y)) this.drawShipRepairCostPreview(ctx, target);
      else this.drawUpgradeCostPreview(ctx, target);
    } else if (state.mouse.inside) {
      const ts = state.world.tileSize;
      ctx.strokeStyle = "rgba(242,237,220,.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(state.mouse.tileX * ts - state.camera.x + 2, state.mouse.tileY * ts - state.camera.y + 2, ts - 4, ts - 4);
    }
    if (state.ship.launchActive) {
      const pct = 1 - state.ship.launchTimer / state.ship.launchDuration;
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(state.camera.w / 2 - 180, 18, 360, 18);
      ctx.fillStyle = "#f0b84d";
      ctx.fillRect(state.camera.w / 2 - 180, 18, 360 * pct, 18);
      ctx.strokeStyle = "#f2eddc";
      ctx.strokeRect(state.camera.w / 2 - 180, 18, 360, 18);
    }
  },
  drawMissingBuildCost(ctx, target, cost) {
    const state = PW.state;
    const missing = Object.entries(cost).filter(([resourceId, required]) => (state.inventory[resourceId] || 0) < required);
    if (!missing.length) return;
    const ts = state.world.tileSize;
    const width = 10 + missing.reduce((total, [resourceId, required]) => total + 31 + String(required - (state.inventory[resourceId] || 0)).length * 7, 0);
    const centerX = target.x * ts + ts / 2 - state.camera.x;
    const x = PW.Utils.clamp(Math.round(centerX - width / 2), 6, Math.max(6, state.camera.w - width - 6));
    const y = Math.max(6, Math.round(target.y * ts - state.camera.y - 28));
    ctx.save();
    ctx.fillStyle = "rgba(25, 12, 12, .9)";
    ctx.fillRect(x, y, width, 22);
    ctx.strokeStyle = "rgba(227, 93, 87, .9)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, 21);
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let cursor = x + 5;
    missing.forEach(([resourceId, required]) => {
      const missingAmount = required - (state.inventory[resourceId] || 0);
      ctx.save();
      ctx.translate(cursor, y + 3);
      PW.Icons.drawResource(ctx, resourceId, 16, false);
      ctx.restore();
      ctx.fillStyle = "#ffafa8";
      ctx.fillText(`-${missingAmount}`, cursor + 18, y + 11);
      cursor += 31 + String(missingAmount).length * 7;
    });
    ctx.restore();
  },
  drawShipRepairCostPreview(ctx, target) {
    const state = PW.state;
    if (state.ship.hp >= state.ship.maxHp) return;
    const options = PW.Progression.shipRepairCostOptions();
    const canAfford = PW.Utils.canAfford(options.scrap) || PW.Utils.canAfford(options.basic);
    const ts = state.world.tileSize;
    const width = 188;
    const height = 94;
    const centerX = target.x * ts + ts / 2 - state.camera.x;
    const x = PW.Utils.clamp(Math.round(centerX - width / 2), 6, Math.max(6, state.camera.w - width - 6));
    const y = Math.max(6, Math.round(target.y * ts - state.camera.y - height - 8));

    ctx.save();
    ctx.fillStyle = "rgba(9, 13, 12, .9)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = canAfford ? "rgba(102, 198, 166, .9)" : "rgba(227, 93, 87, .95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = canAfford ? "#d7fffb" : "#ffafa8";
    ctx.fillText(`Wrack +${PW.CONFIG.shipRepair.hpRestored} HP (Reparatur ${state.ship.repairCount + 1})`, x + width / 2, y + 13);
    this.drawRepairCostOption(ctx, x + 10, y + 34, options.scrap);
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#b8c7c2";
    ctx.fillText("ODER", x + width / 2, y + 56);
    this.drawRepairCostOption(ctx, x + 10, y + 76, options.basic);
    ctx.restore();
  },
  drawRepairCostOption(ctx, x, y, cost) {
    const state = PW.state;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let cursor = x;
    Object.entries(cost).forEach(([resourceId, required]) => {
      const have = state.inventory[resourceId] || 0;
      ctx.save();
      ctx.translate(cursor, y - 8);
      PW.Icons.drawResource(ctx, resourceId, 16, false);
      ctx.restore();
      ctx.fillStyle = have >= required ? "#a7e6a8" : "#ffafa8";
      ctx.fillText(`${have}/${required}`, cursor + 19, y);
      cursor += 28 + ctx.measureText(`${have}/${required}`).width;
    });
  },
  drawUpgradeCostPreview(ctx, target) {
    const state = PW.state;
    const building = PW.Tiles.getBuilding(target.x, target.y);
    if (!building || building.hp < building.maxHp) return;
    const def = PW.BUILDINGS[building.type];
    if (!def || !PW.BuildingSystem.canUpgrade(building)) return;

    const cost = PW.BuildingSystem.upgradeCost(building);
    const entries = Object.entries(cost);
    const benefits = this.upgradeBenefits(building, def);
    const canAfford = PW.Utils.canAfford(cost);
    const ts = state.world.tileSize;
    const centerX = target.x * ts + ts / 2 - state.camera.x;
    const anchorY = target.y * ts - state.camera.y - 8;
    const width = 180;
    const height = 48 + entries.length * 20 + benefits.length * 18;
    const x = PW.Utils.clamp(Math.round(centerX - width / 2), 6, Math.max(6, state.camera.w - width - 6));
    const y = Math.max(6, Math.round(anchorY - height));

    ctx.save();
    ctx.fillStyle = "rgba(9, 13, 12, .88)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = canAfford ? "rgba(102, 198, 166, .9)" : "rgba(227, 93, 87, .95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = canAfford ? "#d7fffb" : "#ffafa8";
    ctx.fillText(`Upgrade: Stufe ${building.level} → ${building.level + 1}`, x + width / 2, y + 13);

    ctx.font = "bold 12px monospace";
    entries.forEach(([resourceId, required], index) => {
      const have = state.inventory[resourceId] || 0;
      const rowY = y + 26 + index * 20;
      ctx.save();
      ctx.translate(x + 8, rowY - 8);
      PW.Icons.drawResource(ctx, resourceId, 16, false);
      ctx.restore();
      ctx.textAlign = "left";
      ctx.fillStyle = have >= required ? "#a7e6a8" : "#ffafa8";
      ctx.fillText(`${have}/${required}`, x + 30, rowY);
    });
    const benefitStartY = y + 32 + entries.length * 20;
    ctx.strokeStyle = "rgba(242, 237, 220, .22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, benefitStartY - 8);
    ctx.lineTo(x + width - 8, benefitStartY - 8);
    ctx.stroke();
    ctx.font = "bold 11px monospace";
    benefits.forEach((benefit, index) => {
      const rowY = benefitStartY + index * 18;
      ctx.textAlign = "left";
      ctx.fillStyle = "#b8c7c2";
      ctx.fillText(benefit.label, x + 10, rowY);
      ctx.textAlign = "right";
      ctx.fillStyle = "#b8c7c2";
      ctx.fillText(benefit.from, x + 105, rowY);
      ctx.textAlign = "center";
      ctx.fillStyle = "#83e3da";
      ctx.fillText("→", x + 121, rowY);
      ctx.textAlign = "left";
      ctx.fillStyle = "#a7e6a8";
      ctx.fillText(benefit.to, x + 132, rowY);
    });
    ctx.restore();
  },
  upgradeBenefits(building, def) {
    const format = (value, digits = 0) => Number(value).toLocaleString("de-DE", { maximumFractionDigits: digits });
    const nextMaxHp = Math.round(def.maxHp * (1 + building.level * 0.35));
    const benefits = [{ label: "HP", from: format(building.maxHp), to: format(nextMaxHp) }];
    if (def.category !== "tower") return benefits;

    const current = PW.Combat.towerStats(def, building.level);
    const next = PW.Combat.towerStats(def, building.level + 1);
    const addIfChanged = (label, from, to, digits = 0) => {
      const currentValue = Number(from.toFixed(6));
      const nextValue = Number(to.toFixed(6));
      if (currentValue !== nextValue) benefits.push({ label, from: format(from, digits), to: format(to, digits) });
    };
    addIfChanged("Schaden", current.damage, next.damage);
    addIfChanged("Schuss/min", current.rate * 60, next.rate * 60);
    addIfChanged("DPS", current.damage * current.rate, next.damage * next.rate, 1);
    addIfChanged("Reichweite", current.range, next.range, 1);
    addIfChanged("Fläche", current.splash, next.splash, 2);
    return benefits;
  },
  drawPerformanceOverlay(ctx) {
    const state = PW.state;
    if (!state.debug || !state.debug.enabled || !state.debug.profile) return;
    const profile = state.debug.profile;
    const rows = [
      `FPS ${profile.fps.toFixed(1)}  Frame ${profile.frameMs.toFixed(1)} ms`,
      `Update ${profile.updateMs.toFixed(2)} ms`,
      `Render ${profile.renderMs.toFixed(2)} ms`,
      `Arbeit ${profile.workMs.toFixed(2)} ms`,
      `Gegner ${state.enemies.length}  Türme ${state.world.buildings.length}`
    ];
    ctx.save();
    ctx.fillStyle = "rgba(10, 14, 13, .84)";
    ctx.fillRect(10, 10, 218, 92);
    ctx.strokeStyle = "rgba(131, 227, 218, .65)";
    ctx.strokeRect(10.5, 10.5, 217, 91);
    ctx.fillStyle = "#d7fffb";
    ctx.font = "12px monospace";
    ctx.textBaseline = "top";
    rows.forEach((row, index) => ctx.fillText(row, 18, 18 + index * 16));
    ctx.restore();
  },
  drawToolFeedback(ctx) {
    const feedback = PW.state.toolFeedback;
    const remaining = feedback.until - performance.now();
    if (!feedback.id || remaining <= 0) {
      if (remaining <= 0) PW.state.toolFeedback = { id: null, buildType: null, until: 0 };
      return;
    }
    const size = 48;
    const x = PW.state.camera.w - size - 18;
    const y = PW.state.camera.h - size - 18;
    ctx.save();
    ctx.globalAlpha = Math.min(1, remaining / 180);
    ctx.fillStyle = "rgba(11, 13, 13, .72)";
    ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
    ctx.translate(x, y);
    if (feedback.buildType) PW.Icons.drawBuilding(ctx, feedback.buildType, size, 1);
    else {
      PW.Icons.drawTool(ctx, feedback.id, size);
    }
    ctx.restore();
  },
  buildTargetTile() {
    return PW.Player.targetTile();
  }
};
