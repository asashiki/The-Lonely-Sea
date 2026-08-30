import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.EXPERIENCE_BASE_URL || "http://127.0.0.1:4321";

async function openTitle(context, { preferences = {} } = {}) {
  const page = await context.newPage();
  await page.addInitScript((prefs) => {
    sessionStorage.setItem("lonely-sea-opening-seen", "true");
    if (new URL(location.href).searchParams.get("freshReset") === "1") return;
    try {
      const current = JSON.parse(localStorage.getItem("lonely-sea-preferences-v2") || "{}");
      localStorage.setItem("lonely-sea-preferences-v2", JSON.stringify({
        mobileLandscape: false,
        ...current,
        ...prefs,
      }));
    } catch {
      localStorage.setItem("lonely-sea-preferences-v2", JSON.stringify({ mobileLandscape: false, ...prefs }));
    }
  }, preferences);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-command="OPTION"]').click();
  await page.locator(".option-screen").waitFor({ state: "visible" });
  return page;
}

async function assertInsideViewport(page, selector) {
  const viewport = page.viewportSize();
  const box = await page.locator(selector).boundingBox();
  assert(viewport && box, `${selector} 应当可见`);
  assert(box.x >= -1 && box.y >= -1, `${selector} 不应越过左上边界`);
  assert(box.x + box.width <= viewport.width + 1, `${selector} 不应横向裁切`);
  assert(box.y + box.height <= viewport.height + 1, `${selector} 不应纵向裁切`);
}

async function checkViewport(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await openTitle(context);
  await assertInsideViewport(page, ".option-primary");
  await assertInsideViewport(page, ".option-book");
  await assertInsideViewport(page, ".option-actions");

  await page.getByRole("tab", { name: "游戏", exact: true }).click();
  await page.getByRole("slider", { name: "文字推进速度" }).fill("9");
  await page.getByRole("tab", { name: "声音", exact: true }).click();
  await page.getByRole("button", { name: "背景音乐", exact: true }).click();
  await page.getByRole("slider", { name: "背景音乐音量" }).fill("23");

  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("#toggle-bgm").getAttribute("aria-pressed"), "false", "BGM 开关应刷新保留");
  await page.locator('[data-command="OPTION"]').click();
  await page.getByRole("tab", { name: "游戏", exact: true }).click();
  await page.getByRole("tab", { name: "声音", exact: true }).click();
  assert.equal(await page.getByRole("slider", { name: "背景音乐音量" }).inputValue(), "23");

  await page.getByRole("button", { name: "返回标题" }).click();
  for (const scene of ["day", "night", "crimson"]) {
    await page.locator('[data-ambient-trigger="scene"]').click();
    await page.locator(`[data-scene-option="${scene}"]`).click();
  }
  await page.locator(".achievement-toast.is-visible").waitFor({ state: "visible" });
  assert.match(await page.locator(".achievement-toast").innerText(), /四潮巡礼/);

  await page.locator('[data-command="EXTRA"]').click();
  await page.getByRole("button", { name: "ACHIEVE", exact: true }).click();
  await page.locator(".extra-achievement-row").first().waitFor({ state: "visible" });
  assert.equal(await page.locator(".extra-achievement-row").count(), 10);
  assert.match(await page.locator(".extra-achievement-row").nth(3).innerText(), /四潮巡礼/);
  await assertInsideViewport(page, ".extra-achievement-room");
  await context.close();
}

async function canvasChanged(page, waitMs = 180) {
  const first = await page.locator("#weather-canvas").evaluate((canvas) => canvas.toDataURL());
  await page.waitForTimeout(waitMs);
  const second = await page.locator("#weather-canvas").evaluate((canvas) => canvas.toDataURL());
  return first !== second;
}

async function checkSystemAtmosphere(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem("lonely-sea-opening-seen", "true");
    localStorage.setItem("lonely-sea-experience-v1", JSON.stringify({ scene: "mist", weather: "snow" }));
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".title-menu").waitFor({ state: "visible" });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.systemWeather), "true");
  assert(await canvasChanged(page), "标题雪效应持续绘制");

  await page.locator('[data-command="EXTRA"]').click();
  await page.locator(".extra-screen").waitFor({ state: "visible" });
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector(".stage-wash")).opacity) > 0.9);
  const extraLook = await page.evaluate(() => {
    const extra = document.querySelector(".extra-screen");
    const canvas = document.querySelector(".extra-canvas");
    const wash = document.querySelector(".stage-wash");
    const weather = document.querySelector("#weather-canvas");
    return {
      route: document.body.dataset.route,
      extraBg: getComputedStyle(extra).backgroundColor,
      canvasBg: getComputedStyle(canvas).backgroundImage,
      washOpacity: Number(getComputedStyle(wash).opacity),
      weatherOpacity: Number(getComputedStyle(weather).opacity),
      extraWidth: canvas.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
    };
  });
  assert.equal(extraLook.route, "extra");
  assert.equal(extraLook.extraBg, "rgba(0, 0, 0, 0)", "EXTRA 不应再铺一层实色底板");
  assert.equal(extraLook.canvasBg, "none", "EXTRA 不应再画第二张海景");
  assert(extraLook.washOpacity > 0.9, "EXTRA 应使用与标题共用的洗色层");
  assert(extraLook.weatherOpacity > 0.9, "默认应把标题天气带到 EXTRA");
  assert(Math.abs(extraLook.extraWidth - extraLook.viewportWidth) < 2, "EXTRA 背景应铺满视口");
  assert(await canvasChanged(page), "进入 EXTRA 后雪花不应重载中断");

  await page.locator(".extra-screen [data-back]").click();
  await page.locator('[data-command="OPTION"]').click();
  await page.locator(".option-screen").waitFor({ state: "visible" });
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector(".stage-wash")).opacity) > 0.9);
  const optionLook = await page.evaluate(() => {
    const screen = document.querySelector(".option-screen");
    const canvas = document.querySelector(".option-canvas");
    const frame = document.querySelector(".option-safe-frame");
    const wash = document.querySelector(".stage-wash");
    const rect = canvas.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    return {
      screenBg: getComputedStyle(screen).backgroundColor,
      canvasBg: getComputedStyle(canvas).backgroundImage,
      washOpacity: Number(getComputedStyle(wash).opacity),
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      frameWidth: frameRect.width,
      frameHeight: frameRect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
  assert.equal(optionLook.screenBg, "rgba(0, 0, 0, 0)", "OPTION 边缘不应再露出空白底板");
  assert.equal(optionLook.canvasBg, "none", "OPTION 应复用标题海景而不是另铺一张图");
  assert(optionLook.washOpacity > 0.9, "OPTION 洗色应与 EXTRA 相同");
  assert(Math.abs(optionLook.canvasWidth - optionLook.viewportWidth) < 2, "OPTION 画布应铺满视口");
  assert(Math.abs(optionLook.canvasHeight - optionLook.viewportHeight) < 2, "OPTION 画布应铺满视口");
  assert(optionLook.frameWidth <= optionLook.canvasWidth + 1, "OPTION 安全框不应溢出");
  await assertInsideViewport(page, ".option-book");
  assert(await canvasChanged(page), "进入 OPTION 后天气应继续下落");

  await page.getByRole("tab", { name: "博客", exact: true }).click();
  await page.getByRole("tab", { name: "场景与天气", exact: true }).click();
  await page.getByRole("button", { name: "系统页天气", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.systemWeather === "false");
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector("#weather-canvas")).opacity) === 0);
  const hidden = await page.locator("#weather-canvas").evaluate((node) => Number(getComputedStyle(node).opacity));
  assert.equal(hidden, 0, "关闭系统页天气后粒子应隐藏且不重载");

  await page.getByRole("button", { name: "系统页天气", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.systemWeather === "true");
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector("#weather-canvas")).opacity) > 0.9);
  const shown = await page.locator("#weather-canvas").evaluate((node) => Number(getComputedStyle(node).opacity));
  assert(shown > 0.9, "重新打开后应立刻回到同一场天气");
  assert(await canvasChanged(page), "重新显示后粒子应接着落，而不是重新铺一层");

  assert.equal(await page.evaluate(() => document.documentElement.dataset.weatherLayer), "inside");
  const insideLayer = await page.evaluate(() => Number(getComputedStyle(document.querySelector("#weather-canvas")).zIndex));
  assert(insideLayer < 20, "组件内天气应落在系统 UI 后面");
  await page.locator('[data-setting-key="weatherLayer"] [data-setting-value="OVERLAY"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.weatherLayer === "overlay");
  const overlayLayer = await page.evaluate(() => Number(getComputedStyle(document.querySelector("#weather-canvas")).zIndex));
  assert(overlayLayer > 20, "盖过 UI 时应让粒子浮在系统页上面");

  await page.getByRole("button", { name: "返回标题" }).click();
  await page.locator('[data-command="LOAD"]').click();
  await page.locator(".load-screen").waitFor({ state: "visible" });
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector(".stage-wash")).opacity) > 0.9);
  const loadLook = await page.evaluate(() => ({
    bg: getComputedStyle(document.querySelector(".load-canvas")).backgroundImage,
    wash: Number(getComputedStyle(document.querySelector(".stage-wash")).opacity),
  }));
  assert.equal(loadLook.bg, "none", "LOAD 也不应另画一张海景");
  assert(loadLook.wash > 0.9, "LOAD 应使用同一层洗色");

  await context.close();
}

async function checkClearAll(browser) {
  const context = await browser.newContext({ viewport: { width: 820, height: 900 } });
  const page = await openTitle(context);
  await page.getByRole("tab", { name: "本机数据", exact: true }).click();
  const clear = page.locator("#clear-browser-data");
  await clear.click();
  assert.equal(await clear.textContent(), "再次选择以清除");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    clear.click(),
  ]);
  await page.waitForURL(`${baseUrl}/`);
  assert.equal(await page.evaluate(() => localStorage.length), 0, "清除后 localStorage 应为空");
  await context.close();
}

async function bgmSnapshot(page) {
  return page.evaluate(() => {
    const audio = window.__lonelySeaAudioController;
    return {
      exists: Boolean(audio),
      paused: !audio?.isBgmPlaying?.(),
      currentTime: audio?.bgmCurrentTime?.() || 0,
    };
  });
}

async function checkBgmAndListenDock(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem("lonely-sea-opening-seen", "true"));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator("#opening.is-dismissed").waitFor();
  await page.locator(".title-menu").waitFor({ state: "visible" });

  await page.locator('[data-command="LOAD"]').click();
  await page.locator(".load-screen").waitFor({ state: "visible" });
  const onLoad = await bgmSnapshot(page);
  assert(onLoad.exists && !onLoad.paused, "进入 LOAD 后标题 BGM 应继续");
  const startTime = onLoad.currentTime;

  await page.locator('.load-screen [data-back]').click();
  await page.locator('[data-command="OPTION"]').click();
  await page.locator(".option-screen").waitFor({ state: "visible" });
  const onOption = await bgmSnapshot(page);
  assert(onOption.exists && !onOption.paused, "进入 OPTION 后标题 BGM 应继续");
  assert(onOption.currentTime >= startTime - 0.05, "切页后 BGM 不应从头开始");

  await page.locator('.option-screen [data-back]').click();
  await page.locator('[data-command="EXTRA"]').click();
  await page.locator(".extra-screen").waitFor({ state: "visible" });
  const onExtra = await bgmSnapshot(page);
  assert(onExtra.exists && !onExtra.paused, "进入 EXTRA 后标题 BGM 应继续");

  await page.getByRole("button", { name: "MUSIC", exact: true }).click();
  await page.locator(".extra-music-room").waitFor({ state: "visible" });
  await page.locator("button[data-music-loop]").click();
  assert.equal(await page.locator("button[data-music-loop]").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("#listen-dock [data-listen-loop]").count(), 1);

  await page.locator(".extra-music-toggle").click();
  const started = await page.waitForFunction(
    () => document.querySelector(".extra-canvas")?.dataset.musicPlaying === "true",
    null,
    { timeout: 8000 },
  ).then(() => true).catch(() => false);
  if (started) {
    await page.locator(".extra-screen [data-back]").click();
    assert.equal(await page.locator("#listen-dock").getAttribute("aria-hidden"), "false");
    assert.equal(await page.locator("#listen-dock [data-listen-loop]").getAttribute("aria-pressed"), "true");
    const whileListening = await bgmSnapshot(page);
    assert(whileListening.paused, "Extra 播放时应让出标题 BGM");
    await page.locator("#listen-dock [data-listen-expand]").click();
    await page.locator("#listen-dock [data-listen-stop]").click();
    assert.equal(await page.locator("#listen-dock").getAttribute("aria-hidden"), "true");
    const afterStop = await bgmSnapshot(page);
    assert(!afterStop.paused, "关闭 Extra 播放后标题 BGM 应恢复");
  }

  await context.close();
}

async function checkArticleAudio(browser) {
  const bgmContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const bgmPage = await bgmContext.newPage();
  await bgmPage.addInitScript(() => sessionStorage.setItem("lonely-sea-opening-seen", "true"));
  await bgmPage.goto(`${baseUrl}/posts/anime-2024/`, { waitUntil: "domcontentloaded" });
  await bgmPage.locator(".reading-system").waitFor({ state: "visible" });
  await bgmPage.mouse.click(24, 24);
  const articleBgm = await bgmPage.evaluate(() => {
    const audio = window.__lonelySeaAudioController;
    return {
      exists: Boolean(audio),
      playing: Boolean(audio?.isBgmPlaying?.()),
      dockHidden: document.querySelector("#listen-dock")?.getAttribute("aria-hidden"),
    };
  });
  assert(articleBgm.exists, "文章页应挂上体验音频");
  assert(articleBgm.playing, "没有 Extra 听歌时文章页应播放标题 BGM");
  assert.equal(articleBgm.dockHidden, "true", "没有听歌会话时文章页不应露出听歌坞");
  await bgmContext.close();

  const listenContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const listenPage = await listenContext.newPage();
  await listenPage.addInitScript(() => {
    sessionStorage.setItem("lonely-sea-opening-seen", "true");
    sessionStorage.setItem("lonely-sea-listen-session-v1", JSON.stringify({
      active: true,
      playing: false,
      index: 0,
      loop: true,
      shuffle: false,
      shuffleOrder: [],
      currentTime: 0,
    }));
  });
  await listenPage.goto(`${baseUrl}/posts/anime-2024/`, { waitUntil: "domcontentloaded" });
  await listenPage.locator(".reading-system").waitFor({ state: "visible" });
  const articleListen = await listenPage.evaluate(() => {
    const dock = document.querySelector("#listen-dock");
    return {
      dockHidden: dock?.getAttribute("aria-hidden"),
      loop: dock?.querySelector("[data-listen-loop]")?.getAttribute("aria-pressed"),
    };
  });
  assert.equal(articleListen.dockHidden, "false", "Extra 听歌会话应出现在文章页");
  assert.equal(articleListen.loop, "true", "文章页应保留 LOOP");
  await listenContext.close();
}

async function checkForcedLandscape(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem("lonely-sea-opening-seen", "true"));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".title-menu").waitFor({ state: "visible" });
  const titleLook = await page.evaluate(() => ({
    forced: document.documentElement.dataset.forcedLandscape,
    enabled: document.documentElement.dataset.mobileLandscape,
    rotate: getComputedStyle(document.body).transform,
    stageWidth: document.body.offsetWidth,
  }));
  assert.equal(titleLook.enabled, "true", "手机自动横屏默认打开");
  assert.equal(titleLook.forced, "true", "竖屏手机打开标题时应强制横屏");
  assert(titleLook.rotate.includes("matrix"), "标题应旋转成横屏构图");
  assert(titleLook.stageWidth > 700, "强制横屏后舞台应按横宽铺开");

  await page.goto(`${baseUrl}/posts/anime-2024/`, { waitUntil: "domcontentloaded" });
  await page.locator(".reading-system").waitFor({ state: "visible" });
  const articleLook = await page.evaluate(() => ({
    forced: document.documentElement.dataset.forcedLandscape,
    rotate: getComputedStyle(document.body).transform,
  }));
  assert.equal(articleLook.forced, "false", "文章页不应强制横屏");
  assert.equal(articleLook.rotate, "none", "文章页保持竖屏阅读");

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-command="OPTION"]').click();
  await page.locator(".option-screen").waitFor({ state: "visible" });
  await page.getByRole("tab", { name: "博客", exact: true }).click();
  await page.getByRole("tab", { name: "页面行为", exact: true }).click();
  await page.getByRole("button", { name: "手机自动横屏", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.forcedLandscape === "false");
  assert.equal(await page.evaluate(() => document.documentElement.dataset.mobileLandscape), "false");
  await context.close();
}

async function checkGameHostDynamicLandscape(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/start/stories/lonely-sea-chapter-one/`, { waitUntil: "domcontentloaded" });
  await page.locator(".game-host").waitFor({ state: "visible" });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.forcedLandscape), "false");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.dataset.forcedLandscape === "true");
  const portrait = await page.evaluate(() => ({
    width: getComputedStyle(document.documentElement).getPropertyValue("--forced-stage-width").trim(),
    height: getComputedStyle(document.documentElement).getPropertyValue("--forced-stage-height").trim(),
  }));
  assert.equal(portrait.width, "844px");
  assert.equal(portrait.height, "390px");

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForFunction(() => document.documentElement.dataset.forcedLandscape === "false");
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await checkViewport(browser, { width: 820, height: 900 });
  await checkViewport(browser, { width: 390, height: 844 });
  await checkSystemAtmosphere(browser);
  await checkClearAll(browser);
  await checkBgmAndListenDock(browser);
  await checkArticleAudio(browser);
  await checkForcedLandscape(browser);
  await checkGameHostDynamicLandscape(browser);
  console.log("OPTION / ACHIEVE / CONTINUE / 系统页海景 / 文章音频 / 手机横屏 定向回归通过");
} finally {
  await browser.close();
}
