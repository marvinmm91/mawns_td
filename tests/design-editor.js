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
  await page.evaluate(() => {
    localStorage.removeItem("planet-wrack-pixel-art-v1");
    localStorage.removeItem(PW.CONFIG.saveKey);
  });
  await page.reload();
  await page.locator("#dialogActions button").last().click();
  await page.getByRole("button", { name: "Design" }).click();

  const panel = await page.evaluate(() => ({
    assets: document.querySelectorAll(".design-asset").length,
    hasCanvas: Boolean(document.querySelector(".design-canvas")),
    hasExport: Array.from(document.querySelectorAll("button")).some((button) => button.textContent === "Mod-Datei exportieren"),
    catalog: PW.PixelArt.catalog.length
  }));
  if (panel.assets < 3 || !panel.hasCanvas || !panel.hasExport || panel.catalog < 40) {
    throw new Error(`Design-Panel unvollstaendig: ${JSON.stringify(panel)}`);
  }

  const override = await page.evaluate(() => {
    PW.PixelArt.setAsset("tool.axe", { cols: 1, rows: 1, scale: 1.35, pixels: ["#ff0000"] });
    const canvas = PW.Icons.toolCanvas("axe", 28);
    const data = canvas.getContext("2d").getImageData(14, 14, 1, 1).data;
    const offscreen = document.createElement("canvas");
    offscreen.width = 4;
    offscreen.height = 4;
    const ctx = offscreen.getContext("2d");
    ctx.globalAlpha = 0.2;
    PW.PixelArt.draw(ctx, "tool.axe", 0, 0, 4, 4);
    const alpha = ctx.getImageData(2, 2, 1, 1).data[3];
    const js = PW.PixelArt.exportJs();
    const template = PW.PixelArt.defaultPixels("resource.tree");
    const scale = PW.PixelArt.get("tool.axe").scale;
    PW.PixelArt.resetAsset("tool.axe");
    return {
      red: data[0],
      green: data[1],
      blue: data[2],
      alpha,
      scale,
      exported: js.includes("PW_PIXEL_MODS.push") && js.includes("tool.axe"),
      templatePixels: template.pixels.filter(Boolean).length,
      reset: !PW.PixelArt.has("tool.axe")
    };
  });

  if (override.red < 240 || override.green > 20 || override.blue > 20 || override.alpha !== 255 || override.scale !== 1.35 || !override.exported || override.templatePixels < 10 || !override.reset) {
    throw new Error(`Pixel-Override fehlerhaft: ${JSON.stringify(override)}`);
  }

  const playerOpacity = await page.evaluate(() => {
    PW.PixelArt.setAsset("player.down", {
      cols: 1,
      rows: 1,
      scale: 1,
      pixels: ["#ff0000"]
    });
    PW.state.phase.current = "night";
    PW.state.player.dirX = 0;
    PW.state.player.dirY = 1;
    PW.state.camera.x = PW.state.player.x - 200;
    PW.state.camera.y = PW.state.player.y - 200;
    PW.state.camera.w = PW.state.canvas.width;
    PW.state.camera.h = PW.state.canvas.height;
    PW.Render.draw();
    const x = Math.round(PW.state.player.x - PW.state.camera.x);
    const y = Math.round(PW.state.player.y - PW.state.camera.y - 1);
    const pixel = PW.state.ctx.getImageData(x, y, 1, 1).data;
    PW.PixelArt.resetAsset("player.down");
    return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
  });

  if (playerOpacity.r < 245 || playerOpacity.g > 10 || playerOpacity.b > 10 || playerOpacity.a !== 255) {
    throw new Error(`Pixel-Figur wird abgedunkelt/transparent gerendert: ${JSON.stringify(playerOpacity)}`);
  }

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  console.log("OK design editor");
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
