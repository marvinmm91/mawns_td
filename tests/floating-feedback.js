"use strict";

const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname, "..", "index.html")).href);
  await page.getByRole("button", { name: "Neue Partie" }).click();
  await page.waitForTimeout(200);

  const result = await page.evaluate(() => {
    const state = PW.state;
    state.effects = [];
    state.messages = [];
    const enemy = PW.EnemySystem.spawn("crawler", state.player.x + 80, state.player.y);
    PW.EnemySystem.damage(enemy, 3.4, "ballista");
    PW.EnemySystem.damage(enemy, 2.4, "ballista");
    const damage = state.effects.find((effect) => effect.type === "floatingText" && effect.key === `damage:${enemy.id}`);

    const node = state.world.resources.find((item) => PW.RESOURCE_NODES[item.type].resource === "wood");
    node.hp = 1;
    state.player.selectedTool = "axe";
    const resourceAmount = node.amount;
    PW.ResourceSystem.interactWithTarget(node.x, node.y);
    const resource = state.effects.find((effect) => effect.type === "floatingText" && effect.text === `+${resourceAmount} Holz`);

    PW.DropSystem.spawn("scrap", 3, state.player.x, state.player.y);
    PW.DropSystem.update(0.016);
    const drop = state.effects.find((effect) => effect.type === "floatingText" && effect.text === "+3 Schrott");
    PW.RenderEffects.draw(state.ctx);
    const alphaAfterEffects = state.ctx.globalAlpha;
    state.phase.current = "night";
    PW.RenderFog.draw(state.ctx);
    const alphaAfterFog = state.ctx.globalAlpha;
    return {
      damageText: damage && damage.text,
      damageValue: damage && damage.value,
      resourceText: resource && resource.text,
      resourceColor: resource && resource.color,
      dropText: drop && drop.text,
      gainToasts: state.messages.filter((message) => /Holz \+|Schrott \+/.test(message.text)).length,
      alphaAfterEffects,
      alphaAfterFog
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browserfehler:\n${errors.join("\n")}`);
  if (result.damageText !== "-6" || Math.abs(result.damageValue - 5.8) > 0.001) {
    throw new Error(`Schadensanzeige nicht gebuendelt: ${JSON.stringify(result)}`);
  }
  if (result.resourceText === undefined || !result.resourceColor || result.dropText !== "+3 Schrott" || result.gainToasts !== 0 || result.alphaAfterEffects !== 1 || result.alphaAfterFog !== 1) {
    throw new Error(`Ressourcenanzeige nicht korrekt: ${JSON.stringify(result)}`);
  }
  console.log("OK floating feedback");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
