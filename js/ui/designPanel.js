"use strict";

Object.assign(PW.UI, {
  ensureDesignState() {
    if (this.designState) return this.designState;
    const category = PW.PixelArt.categories()[0];
    const asset = PW.PixelArt.byCategory(category)[0];
    this.designState = {
      category,
      assetId: asset.id,
      tool: "pen",
      color: "#f0b84d",
      mirrorX: false,
      drawing: false,
      lastCell: null,
      hover: null,
      working: this.designWorkingFromAsset(asset.id)
    };
    return this.designState;
  },

  designWorkingFromAsset(assetId) {
    const asset = PW.PixelArt.assetDef(assetId);
    const stored = PW.PixelArt.get(assetId);
    const art = stored || PW.PixelArt.blank(asset);
    return {
      id: assetId,
      cols: art.cols,
      rows: art.rows,
      scale: PW.PixelArt.normalizeScale(art.scale),
      pixels: art.pixels.slice()
    };
  },

  renderDesign(body) {
    const state = this.ensureDesignState();
    const asset = PW.PixelArt.assetDef(state.assetId);
    body.innerHTML = "";

    const actions = document.createElement("div");
    actions.className = "design-actions build-card";
    const exportMod = document.createElement("button");
    exportMod.textContent = "Mod-Datei exportieren";
    exportMod.addEventListener("click", () => this.downloadPixelMod("js"));
    const exportJson = document.createElement("button");
    exportJson.textContent = "JSON exportieren";
    exportJson.addEventListener("click", () => this.downloadPixelMod("json"));
    const importButton = document.createElement("button");
    importButton.textContent = "Importieren";
    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".json,.js,application/json,text/javascript";
    importInput.className = "hidden";
    importButton.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", () => this.importPixelMod(importInput));
    actions.append(exportMod, exportJson, importButton, importInput);
    body.appendChild(actions);

    const categoryRow = document.createElement("div");
    categoryRow.className = "design-tabs";
    PW.PixelArt.categories().forEach((category) => {
      const button = document.createElement("button");
      button.textContent = category;
      button.className = category === state.category ? "active" : "";
      button.addEventListener("click", () => {
        state.category = category;
        const first = PW.PixelArt.byCategory(category)[0];
        state.assetId = first.id;
        state.working = this.designWorkingFromAsset(first.id);
        this.renderDesign(body);
      });
      categoryRow.appendChild(button);
    });
    body.appendChild(categoryRow);

    const assetList = document.createElement("div");
    assetList.className = "design-asset-list";
    PW.PixelArt.byCategory(state.category).forEach((item) => {
      const button = document.createElement("button");
      button.className = `design-asset ${item.id === state.assetId ? "active" : ""}`;
      const preview = document.createElement("canvas");
      preview.width = 32;
      preview.height = 32;
      preview.className = "design-preview";
      this.drawDesignPreview(preview, item);
      const label = document.createElement("span");
      label.textContent = item.name;
      const badge = document.createElement("strong");
      badge.textContent = PW.PixelArt.has(item.id) ? "gemalt" : "original";
      button.append(preview, label, badge);
      button.addEventListener("click", () => {
        state.assetId = item.id;
        state.working = this.designWorkingFromAsset(item.id);
        this.renderDesign(body);
      });
      assetList.appendChild(button);
    });
    body.appendChild(assetList);

    const editorCard = document.createElement("div");
    editorCard.className = "build-card design-editor-card";
    const title = document.createElement("div");
    title.className = "build-title";
    const h3 = document.createElement("h3");
    h3.textContent = asset.name;
    const dimensions = document.createElement("strong");
    dimensions.textContent = `${asset.cols} x ${asset.rows}`;
    title.append(h3, dimensions);

    const toolbar = document.createElement("div");
    toolbar.className = "design-toolbar";
    const pen = this.designToolButton("pen", "Pinsel");
    const eraser = this.designToolButton("eraser", "Radierer");
    const picker = this.designToolButton("picker", "Pipette");
    const mirror = document.createElement("label");
    mirror.className = "design-check";
    const mirrorInput = document.createElement("input");
    mirrorInput.type = "checkbox";
    mirrorInput.checked = state.mirrorX;
    mirrorInput.addEventListener("change", () => { state.mirrorX = mirrorInput.checked; });
    mirror.append(mirrorInput, document.createTextNode("Links/Rechts spiegeln"));
    toolbar.append(pen, eraser, picker, mirror);

    const scaleRow = document.createElement("div");
    scaleRow.className = "design-scale-row";
    const scaleLabel = document.createElement("label");
    scaleLabel.textContent = "Skalierung";
    const scaleInput = document.createElement("input");
    scaleInput.type = "range";
    scaleInput.min = "0.5";
    scaleInput.max = "1.5";
    scaleInput.step = "0.05";
    scaleInput.value = String(state.working.scale || 1);
    const scaleValue = document.createElement("strong");
    scaleValue.textContent = Number(state.working.scale || 1).toFixed(2);
    scaleInput.addEventListener("input", () => {
      state.working.scale = PW.PixelArt.normalizeScale(scaleInput.value);
      scaleValue.textContent = state.working.scale.toFixed(2);
      PW.PixelArt.setAsset(state.assetId, state.working);
      PW.Render.draw();
    });
    scaleRow.append(scaleLabel, scaleInput, scaleValue);

    const colorRow = document.createElement("div");
    colorRow.className = "design-color-row";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = state.color;
    colorInput.addEventListener("input", () => {
      state.color = colorInput.value.toLowerCase();
      this.renderDesign(body);
    });
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.maxLength = 7;
    hexInput.spellcheck = false;
    hexInput.value = state.color.toUpperCase();
    hexInput.addEventListener("change", () => {
      const value = hexInput.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(value)) state.color = value.toLowerCase();
      this.renderDesign(body);
    });
    const swatches = document.createElement("div");
    swatches.className = "design-swatches";
    PW.PixelArt.palette.forEach((color) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = color ? "design-swatch" : "design-swatch transparent";
      if (color) swatch.style.background = color;
      swatch.title = color || "Transparent";
      swatch.addEventListener("click", () => {
        if (color) {
          state.color = color;
          state.tool = "pen";
        } else {
          state.tool = "eraser";
        }
        this.renderDesign(body);
      });
      swatches.appendChild(swatch);
    });
    colorRow.append(colorInput, hexInput, swatches);

    const stage = document.createElement("div");
    stage.className = "design-stage";
    const canvas = document.createElement("canvas");
    canvas.className = "design-canvas";
    canvas.setAttribute("aria-label", "Pixel-Zeichenfläche");
    stage.appendChild(canvas);

    const editActions = document.createElement("div");
    editActions.className = "design-actions";
    const template = document.createElement("button");
    template.textContent = "Vorlage übernehmen";
    template.addEventListener("click", () => {
      state.working = PW.PixelArt.defaultPixels(state.assetId);
      this.drawDesignEditor(canvas);
    });
    const save = document.createElement("button");
    save.textContent = "Speichern";
    save.addEventListener("click", () => {
      PW.PixelArt.setAsset(state.assetId, state.working);
      PW.Messages.add("Design gespeichert.", "ok");
      PW.UI.renderHud();
      PW.Render.draw();
      this.renderDesign(body);
    });
    const reset = document.createElement("button");
    reset.textContent = "Zurücksetzen";
    reset.addEventListener("click", () => {
      PW.PixelArt.resetAsset(state.assetId);
      state.working = this.designWorkingFromAsset(state.assetId);
      PW.Messages.add("Design zurückgesetzt.", "ok");
      PW.UI.renderHud();
      PW.Render.draw();
      this.renderDesign(body);
    });
    editActions.append(template, save, reset);

    editorCard.append(title, toolbar, scaleRow, colorRow, stage, editActions);
    body.appendChild(editorCard);
    this.attachDesignCanvas(canvas);
    this.drawDesignEditor(canvas);
  },

  designToolButton(tool, label) {
    const state = this.ensureDesignState();
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = state.tool === tool ? "active" : "";
    button.addEventListener("click", () => {
      state.tool = tool;
      this.renderDesign(PW.state.dom.panelBody);
    });
    return button;
  },

  drawDesignPreview(canvas, asset) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawTransparentBackground(ctx, canvas.width, canvas.height, 4);
    if (!PW.PixelArt.draw(ctx, asset.id, 0, 0, canvas.width, canvas.height)) {
      try {
        PW.PixelArt.suppressed = true;
        PW.PixelArt.drawDefaultAsset(ctx, asset, 0, 0, canvas.width, canvas.height);
      } finally {
        PW.PixelArt.suppressed = false;
      }
    }
  },

  attachDesignCanvas(canvas) {
    const state = this.ensureDesignState();
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const cell = this.designEventCell(canvas, event);
      if (state.tool === "picker") {
        this.pickDesignColor(cell.c, cell.r);
        this.renderDesign(PW.state.dom.panelBody);
        return;
      }
      state.drawing = true;
      canvas.setPointerCapture(event.pointerId);
      state.lastCell = cell;
      this.paintDesignCell(cell.c, cell.r);
      this.drawDesignEditor(canvas);
    });
    canvas.addEventListener("pointermove", (event) => {
      const cell = this.designEventCell(canvas, event);
      state.hover = cell;
      if (!state.drawing || state.tool === "picker") {
        this.drawDesignEditor(canvas);
        return;
      }
      for (const point of this.designLineCells(state.lastCell.c, state.lastCell.r, cell.c, cell.r)) {
        this.paintDesignCell(point.c, point.r);
      }
      state.lastCell = cell;
      this.drawDesignEditor(canvas);
    });
    const end = () => {
      state.drawing = false;
      state.lastCell = null;
      this.drawDesignEditor(canvas);
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", () => {
      state.hover = null;
      if (!state.drawing) this.drawDesignEditor(canvas);
    });
  },

  drawDesignEditor(canvas) {
    const state = this.ensureDesignState();
    const art = state.working;
    const cell = Math.max(8, Math.min(18, Math.floor(304 / Math.max(art.cols, art.rows))));
    const w = art.cols * cell;
    const h = art.rows * cell;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    this.drawTransparentBackground(ctx, w, h, cell);
    for (let r = 0; r < art.rows; r++) {
      for (let c = 0; c < art.cols; c++) {
        const color = art.pixels[r * art.cols + c];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= art.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cell + 0.5, 0);
      ctx.lineTo(c * cell + 0.5, h);
      ctx.stroke();
    }
    for (let r = 0; r <= art.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cell + 0.5);
      ctx.lineTo(w, r * cell + 0.5);
      ctx.stroke();
    }
    if (state.hover && this.designInBounds(state.hover.c, state.hover.r)) {
      ctx.strokeStyle = "#f0b84d";
      ctx.lineWidth = 2;
      ctx.strokeRect(state.hover.c * cell + 1, state.hover.r * cell + 1, cell - 2, cell - 2);
    }
  },

  drawTransparentBackground(ctx, w, h, size) {
    ctx.fillStyle = "#f2eddc";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#c8c1a9";
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        if (((x / size) + (y / size)) % 2 === 0) ctx.fillRect(x, y, size, size);
      }
    }
  },

  designEventCell(canvas, event) {
    const state = this.ensureDesignState();
    const rect = canvas.getBoundingClientRect();
    const art = state.working;
    return {
      c: Math.floor((event.clientX - rect.left) / rect.width * art.cols),
      r: Math.floor((event.clientY - rect.top) / rect.height * art.rows)
    };
  },

  paintDesignCell(c, r) {
    const state = this.ensureDesignState();
    const art = state.working;
    const color = state.tool === "eraser" ? null : state.color;
    const cells = [{ c, r }];
    if (state.mirrorX) cells.push({ c: art.cols - 1 - c, r });
    cells.forEach((cell) => {
      if (this.designInBounds(cell.c, cell.r)) art.pixels[cell.r * art.cols + cell.c] = color;
    });
  },

  pickDesignColor(c, r) {
    const state = this.ensureDesignState();
    const art = state.working;
    if (!this.designInBounds(c, r)) return;
    const color = art.pixels[r * art.cols + c];
    if (!color) return;
    state.color = color;
    state.tool = "pen";
  },

  designInBounds(c, r) {
    const art = this.ensureDesignState().working;
    return c >= 0 && r >= 0 && c < art.cols && r < art.rows;
  },

  designLineCells(c0, r0, c1, r1) {
    const cells = [];
    let dx = Math.abs(c1 - c0);
    let dy = Math.abs(r1 - r0);
    const sx = c0 < c1 ? 1 : -1;
    const sy = r0 < r1 ? 1 : -1;
    let err = dx - dy;
    let c = c0;
    let r = r0;
    while (true) {
      cells.push({ c, r });
      if (c === c1 && r === r1) break;
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; c += sx; }
      if (e2 < dx) { err += dx; r += sy; }
    }
    return cells;
  },

  downloadPixelMod(format) {
    const js = format === "js";
    const text = js ? PW.PixelArt.exportJs() : PW.PixelArt.exportJson();
    const type = js ? "text/javascript" : "application/json";
    const name = js ? "pixel-overrides.js" : "planet-wrack-pixel-mod.json";
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    PW.Messages.add("Design-Paket exportiert.", "ok");
  },

  importPixelMod(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const count = PW.PixelArt.importText(reader.result);
        const state = this.ensureDesignState();
        state.working = this.designWorkingFromAsset(state.assetId);
        PW.Messages.add(`${count} Designs importiert.`, "ok");
        PW.UI.renderHud();
        PW.Render.draw();
        this.renderDesign(PW.state.dom.panelBody);
      } catch (error) {
        console.error(error);
        PW.Messages.add("Design-Import fehlgeschlagen.", "danger");
      } finally {
        input.value = "";
      }
    };
    reader.readAsText(file);
  }
});
