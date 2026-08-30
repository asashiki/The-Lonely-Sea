import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.EXPERIENCE_BASE_URL || "http://127.0.0.1:4322";
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem("lonely-sea-opening-seen", "true");
    localStorage.setItem("lonely-sea-preferences-v2", JSON.stringify({ language: "ZH-CN", bgmEnabled: true }));
    const nativeRaf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => nativeRaf((time) => {
      if (document.body?.dataset.gameLaunchPending === "true") setTimeout(() => callback(time), 220);
      else callback(time);
    });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".title-menu").waitFor({ state: "visible" });

  await page.locator("#toggle-bgm").click();
  await page.locator("#toggle-bgm").click();
  await page.waitForFunction(() => window.__lonelySeaAudioController?.isBgmPlaying?.());
  await page.locator('[data-command="START"]').click();
  await page.waitForTimeout(60);

  const state = await page.evaluate(() => ({
    pending: document.body.dataset.gameLaunchPending,
    playing: window.__lonelySeaAudioController?.isBgmPlaying?.(),
  }));
  assert.equal(state.pending, "true", "测试必须命中游戏外部导航路径");
  assert.equal(state.playing, false, "进入游戏的反馈开始时必须立即停止 Blog BGM");
  await context.close();
  console.log("Blog → 游戏音频边界通过");
} finally {
  await browser.close();
}
