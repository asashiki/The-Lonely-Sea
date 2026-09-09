import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => sessionStorage.setItem('lonely-sea-opening-seen', '1'));
  await page.goto('http://127.0.0.1:4323/');
  for (let i = 0; i < Number(process.env.CYCLES || 8); i++) {
    await page.locator('[data-scene-option]').nth(i % 4).dispatchEvent('click');
    await page.locator('[data-command=LOAD]').click();
    await page.locator('[data-xiii-page-entry=articles]').dispatchEvent('click', {detail: 1});
    await page.waitForTimeout(260);
    await page.locator('[data-xiii-index-group=articles] [data-xiii-filter]').nth(1).dispatchEvent('click', {detail: 1});
    await page.waitForTimeout(40 + i * 20);
    await page.locator('.load-screen .system-back').dispatchEvent('click');
    await page.locator('[data-scene-option]').nth((i + 1) % 4).dispatchEvent('click');
    await page.locator('[data-command=LOAD]').click();
    const reopened = await page.locator('[data-xiii-panel][aria-hidden="false"]').getAttribute('data-xiii-panel');
    for (const [step, name] of [reopened, 'game', 'diary', 'articles'].entries()) {
      if (step > 0) await page.locator(`[data-xiii-page-entry=${name}]`).click();
      await page.waitForTimeout(350);
      const state = await page.locator(`[data-xiii-index-group=${name}] button`).first().evaluate(el => {
        const chain = []; for(let e=el;e;e=e.parentElement) { const s=getComputedStyle(e); chain.push({class:e.className,opacity:s.opacity,visibility:s.visibility,display:s.display,color:s.color}); }
        return chain;
      });
      const bad = state.filter(s => s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < .5);
      if (bad.length) throw new Error(JSON.stringify({i,name,bad}));
      const content = await page.locator(`[data-xiii-panel=${name}]`).evaluate(panel => {
        const visible = el => {
          if (!el.getClientRects().length) return false;
          for (let e = el; e; e = e.parentElement) {
            const s = getComputedStyle(e);
            if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < .5) return false;
          }
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
        };
        return {visible: visible(panel), text: [...panel.querySelectorAll('strong,h2,h3')].filter(visible).map(el => el.textContent.trim()).filter(Boolean)};
      });
      if (!content.visible || !content.text.length) throw new Error('Missing LOAD content: ' + JSON.stringify({i,name,content}));
      const colors = await page.locator(`[data-xiii-index-group=${name}] button span`).first().evaluate(el => {
        const color = getComputedStyle(el).color;
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0,0,1,1);
        const rgb = [...ctx.getImageData(0,0,1,1).data].slice(0,3);
        ctx.clearRect(0,0,1,1); ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--v4-ink'); ctx.fillRect(0,0,1,1);
        return {scene: document.body.dataset.scene, color, rgb, expected: [...ctx.getImageData(0,0,1,1).data].slice(0,3)};
      });
      if (colors.rgb.some((v,i)=>Math.abs(v-colors.expected[i])>5)) {
        console.log(await page.locator(`[data-xiii-index-group=${name}] button span`).first().evaluate(el => { const chain=[];for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);chain.push({node:e.className,color:s.color,ink:s.getPropertyValue('--v4-ink'),xiii:s.getPropertyValue('--xiii-ink'),animations:e.getAnimations().map(a=>({state:a.playState,time:a.currentTime,frames:a.effect?.getKeyframes()}))});}return chain;}));
        throw new Error('Stale LOAD text: ' + JSON.stringify(colors));
      }
      if (['night','crimson'].includes(colors.scene) && Math.max(...colors.rgb) < 140) throw new Error('Dark LOAD text: ' + JSON.stringify(colors));
    }
    await page.locator('.load-screen .system-back').click();
  }
  console.log('LOAD theme cycles: OK');
} finally { await browser.close(); }
