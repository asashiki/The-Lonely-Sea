import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:4321/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  sessionStorage.setItem("lonely-sea-opening-seen", "1");
  localStorage.setItem("lonely-sea-experience-v1", JSON.stringify({ scene: "night", weather: "clear" }));
  localStorage.setItem("lonely-sea-load-variant-v4", "tracks-xiii");
});
await page.goto("http://127.0.0.1:4321/?screen=load", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "shots/xiii-baseline.png" });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.waitForTimeout(500);
console.log("errors:", errors.length ? errors : "none");
await browser.close();
