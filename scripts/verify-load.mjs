import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:4323";
const OUT = new URL("../shots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const errors = [];
page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("console: " + msg.text());
});

await page.goto(BASE + "/?screen=load", { waitUntil: "networkidle" });
await page.mouse.click(800, 60);
await page.waitForSelector('.load-screen[aria-hidden="false"]', { timeout: 8000 });
await page.waitForTimeout(1400);

await page.locator('.save-slot[data-post-slot]:not(.is-page-hidden)').nth(2).click();
const lastLoad = await page.evaluate(() => localStorage.getItem("lonely-sea-last-load"));
console.log("last-load set:", lastLoad);
await page.waitForURL("**/posts/**", { timeout: 8000 });

await page.goto(BASE + "/?screen=load", { waitUntil: "networkidle" });
await page.mouse.click(800, 60);
await page.waitForSelector('.load-screen[aria-hidden="false"]', { timeout: 8000 });
await page.waitForTimeout(1400);

const badgeCount = await page.locator(".save-slot.is-last-load").count();
console.log("badge slots:", badgeCount);
await page.screenshot({ path: OUT + "final-badge.png" });
console.log("shot: final-badge");

await page.screenshot({ path: OUT + "final-pager-crop.png", clip: { x: 640, y: 810, width: 330, height: 60 } });
console.log("shot: final-pager-crop");

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();