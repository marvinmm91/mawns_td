"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname, "..", "index.html")).href);

  const modeChoices = page.locator('[role="radio"][data-game-mode]');
  if (await modeChoices.count() !== 2) throw new Error("Startdialog bietet nicht genau zwei Spielmodi.");
  await page.locator('[data-game-mode="aggressive"]').click();
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(150);

  const result = await page.evaluate(() => {
    const state = PW.state;
    const selected = state.gameMode;
    PW.Save.save(false);
    state.gameMode = "classic";
    const savedLoad = PW.Save.load(false);
    const savedMode = PW.state.gameMode;

    const legacy = JSON.parse(localStorage.getItem(PW.CONFIG.saveKey));
    delete legacy.gameMode;
    localStorage.setItem(PW.CONFIG.saveKey, JSON.stringify(legacy));
    PW.state.gameMode = "aggressive";
    const legacyLoad = PW.Save.load(false);
    const legacyMode = PW.state.gameMode;
    PW.UI.renderPanel();
    return {
      selected,
      savedLoad,
      savedMode,
      legacyLoad,
      legacyMode,
      statusText: document.getElementById("panelBody").textContent,
      profiles: PW.CONFIG.gameModes.profiles.map((profile) => ({ id: profile.id, targeting: profile.structureTargeting }))
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.selected !== "aggressive" || !result.savedLoad || result.savedMode !== "aggressive") {
    throw new Error(`Spielmodus wird nicht korrekt ausgewaehlt oder gespeichert: ${JSON.stringify(result)}`);
  }
  if (!result.legacyLoad || result.legacyMode !== "classic") throw new Error(`Legacy-Migration fehlerhaft: ${JSON.stringify(result)}`);
  if (!/Spielmodus/.test(result.statusText) || !/Classic/.test(result.statusText)) {
    throw new Error(`Status zeigt den Spielmodus nicht: ${result.statusText}`);
  }
  if (JSON.stringify(result.profiles) !== JSON.stringify([
    { id: "classic", targeting: "blockade" },
    { id: "aggressive", targeting: "direct-path" }
  ])) {
    throw new Error(`Modusprofile fehlerhaft: ${JSON.stringify(result.profiles)}`);
  }
  console.log("OK game mode foundation");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
