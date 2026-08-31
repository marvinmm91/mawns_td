"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 760 } });
  const url = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
  await page.goto(url);
  await page.evaluate(() => localStorage.removeItem(PW.CONFIG.saveKey));
  await page.reload();
  await page.locator("#dialogActions button").last().click();
  await page.waitForTimeout(300);

  const layout = await page.evaluate(() => {
    const shell = document.querySelector(".game-shell").getBoundingClientRect();
    const topbar = document.querySelector(".topbar").getBoundingClientRect();
    const canvas = document.querySelector(".canvas-wrap").getBoundingClientRect();
    const bottom = document.querySelector(".bottombar").getBoundingClientRect();
    return {
      viewport: window.innerHeight,
      bodyScroll: document.documentElement.scrollHeight,
      shellBottom: shell.bottom,
      topbarHeight: topbar.height,
      canvasHeight: canvas.height,
      bottomHeight: bottom.height,
      bottomColumns: getComputedStyle(document.querySelector(".bottombar")).gridTemplateColumns
    };
  });

  if (layout.bodyScroll > layout.viewport + 2 || layout.shellBottom > layout.viewport + 2) {
    throw new Error(`Linkes Spielfeld passt nicht in den Viewport: ${JSON.stringify(layout)}`);
  }
  if (layout.topbarHeight > 56) {
    throw new Error(`Topbar ist noch zu hoch: ${JSON.stringify(layout)}`);
  }
  if (layout.canvasHeight < 420) {
    throw new Error(`Spielfeld wurde zu klein: ${JSON.stringify(layout)}`);
  }
  if (layout.bottomHeight > 92) {
    throw new Error(`Bottombar bricht zu hoch um: ${JSON.stringify(layout)}`);
  }

  await browser.close();
  console.log("OK layout fit");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
