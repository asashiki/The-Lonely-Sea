import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const host = "127.0.0.1";
const baseUrl = process.env.EXPERIENCE_BASE_URL || `http://${host}:4321`;
let server = null;
let serverOutput = "";

async function isServerReady() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  if (await isServerReady()) return;
  const url = new URL(baseUrl);
  server = spawn(
    process.execPath,
    ["node_modules/astro/bin/astro.mjs", "dev", "--host", url.hostname, "--port", url.port || "4321"],
    { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  server.stdout.on("data", (chunk) => { serverOutput += chunk; });
  server.stderr.on("data", (chunk) => { serverOutput += chunk; });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null) throw new Error(`开发服务器提前退出\n${serverOutput}`);
    if (await isServerReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`等待开发服务器超时\n${serverOutput}`);
}

await waitForServer();
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  await page.addInitScript(() => sessionStorage.setItem("lonely-sea-opening-seen", "1"));
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-command="OPTION"]').click();
  await page.locator(".option-screen").waitFor({ state: "visible" });

  await page.evaluate(async () => {
    const click = (id) => document.querySelector(`[data-option-primary="${id}"]`)?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, detail: 1 }),
    );
    click("game");
    await new Promise((resolve) => setTimeout(resolve, 12));
    click("blog");
    await new Promise((resolve) => setTimeout(resolve, 12));
    click("game");
  });
  await page.waitForTimeout(30);
  await page.locator('[data-option-primary="system"]').dispatchEvent("click", { detail: 1 });
  await page.waitForTimeout(40);

  const state = await page.locator("#option-panel-language").evaluate((panel) => {
    const style = getComputedStyle(panel);
    const rect = panel.getBoundingClientRect();
    return {
      hidden: panel.hidden,
      opacity: Number(style.opacity),
      width: rect.width,
      height: rect.height,
      animations: panel.getAnimations().map((animation) => ({
        playState: animation.playState,
        fill: animation.effect?.getTiming().fill,
      })),
    };
  });

  assert.equal(state.hidden, false, "快速切换后系统面板不应 hidden");
  assert(state.opacity > 0.95, `快速切换后系统面板应可见，实际 ${JSON.stringify(state)}`);
  assert(state.width > 0 && state.height > 0, "快速切换后系统面板应保留布局尺寸");
  console.log("OPTION 快速切换回归通过");
} finally {
  await browser.close();
  server?.kill();
}
