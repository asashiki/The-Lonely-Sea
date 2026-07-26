import { chromium } from "playwright";
const variants = ["tracks", "tracks-xi", "tracks-xii"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:4321/", { waitUntil: "domcontentloaded" });
for (const v of variants) {
  await page.evaluate((variant) => {
    sessionStorage.setItem("lonely-sea-opening-seen", "1");
    localStorage.setItem("lonely-sea-experience-v1", JSON.stringify({ scene: "night", weather: "clear" }));
    localStorage.setItem("lonely-sea-load-variant-v4", JSON.stringify(variant));
  }, v);
  await page.goto("http://127.0.0.1:4321/?screen=load", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "shots/xiii-ref-" + v + ".png" });
}
await browser.close();
console.log("done");
