import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.EXPERIENCE_BASE_URL || "http://127.0.0.1:4321";

async function openTitle(context) {
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem("lonely-sea-opening-seen", "true"));
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
  assert.equal(await page.locator("#toggle-bgm").textContent(), "OFF", "BGM 开关应刷新保留");
  await page.locator('[data-command="OPTION"]').click();
  await page.getByRole("tab", { name: "游戏", exact: true }).click();
  await page.getByRole("tab", { name: "声音", exact: true }).click();
  assert.equal(await page.getByRole("slider", { name: "背景音乐音量" }).inputValue(), "23");

  await page.getByRole("button", { name: "返回标题" }).click();
  for (const scene of ["晴天", "暗夜", "赤夜"]) {
    await page.getByRole("button", { name: scene, exact: true }).click();
  }
  await page.locator(".achievement-toast.is-visible").waitFor({ state: "visible" });
  assert.match(await page.locator(".achievement-toast").innerText(), /四潮巡礼/);

  await page.locator('[data-command="EXTRA"]').click();
  await page.getByRole("button", { name: "ACHIEVE", exact: true }).click();
  await page.locator(".extra-achievement-row").first().waitFor({ state: "visible" });
  assert.equal(await page.locator(".extra-achievement-row").count(), 9);
  assert.match(await page.locator(".extra-achievement-row").nth(3).innerText(), /四潮巡礼/);
  await assertInsideViewport(page, ".extra-achievement-room");
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

const browser = await chromium.launch({ headless: true });
try {
  await checkViewport(browser, { width: 820, height: 900 });
  await checkViewport(browser, { width: 390, height: 844 });
  await checkClearAll(browser);
  console.log("OPTION / ACHIEVE / CONTINUE 定向回归通过");
} finally {
  await browser.close();
}
