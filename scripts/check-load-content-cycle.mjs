import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined });
try {
  const page = await browser.newPage();
  await page.addInitScript(() => sessionStorage.setItem('lonely-sea-opening-seen', '1'));
  await page.goto('http://127.0.0.1:4323/');
  for (const scene of ['day', 'night', 'crimson']) {
    await page.locator(`[data-scene-option=${scene}]`).dispatchEvent('click');
    await page.locator('[data-command=LOAD]').click();
    for (const name of ['articles', 'game', 'diary', 'articles']) {
      await page.locator(`[data-xiii-page-entry=${name}]`).click();
      await page.waitForTimeout(350);
      const filters = page.locator(`[data-xiii-index-group=${name}] [data-xiii-filter]`);
      for (let i = 0; i < await filters.count(); i++) {
        await filters.nth(i).click();
        await page.waitForTimeout(600);
        const state = await page.locator(`[data-xiii-panel=${name}]`).evaluate(panel => {
          const nodes = [...panel.querySelectorAll('strong,h2,h3')].filter(el => !el.closest('[aria-hidden="true"],.is-page-hidden') && el.getClientRects().length);
          return nodes.map(el => {
            const chain = [];
            for (let e = el; e; e = e.parentElement) {
              const s = getComputedStyle(e);
              if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < .15) chain.push({node:e.className,opacity:s.opacity,visibility:s.visibility});
            }
            return {text:el.textContent.trim(),color:getComputedStyle(el).color,bad:chain};
          });
        });
        assert(state.length && state.every(s => !s.bad.length), JSON.stringify({scene,name,i,state}));
        if (scene === 'night' && name === 'articles' && i === 1) await page.screenshot({path: 'tmp/load-night-content.png'});
      }
    }
    await page.locator('.load-screen .system-back').click();
  }
  console.log('LOAD content cycles: OK');
} finally { await browser.close(); }


