import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({channel:'msedge'});
try {
  const page = await browser.newPage();
  await page.addInitScript(() => sessionStorage.setItem('lonely-sea-opening-seen','1'));
  await page.goto('http://127.0.0.1:4323/');
  for (const delay of [0,40,90,210,250,400]) {
    await page.evaluate(async delay => {
      const click = selector => document.querySelector(selector).dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
      const wait = ms => new Promise(r=>setTimeout(r,ms));
      click('[data-command=LOAD]');
      for (const name of ['game','diary','articles']) {click(`[data-xiii-page-entry=${name}]`);await wait(delay);}
      click('[data-xiii-index-group=articles] [data-xiii-filter=essay]');
      await wait(delay);
      click('.load-screen .system-back');
      click('[data-scene-option=night]');
      click('[data-command=LOAD]');
      for (const name of ['diary','game','articles']) {click(`[data-xiii-page-entry=${name}]`);await wait(delay);}
      await wait(600);
    },delay);
    const state = await page.locator('[data-xiii-panel][aria-hidden=false]').evaluate(panel => {
      const view=panel.parentElement;
      return {panel:panel.dataset.xiiiPanel,opacity:getComputedStyle(view).opacity,visibility:getComputedStyle(view).visibility,rect:panel.getBoundingClientRect().toJSON(),text:panel.innerText,animations:view.getAnimations({subtree:true}).map(a=>a.playState)};
    });
    assert(+state.opacity>.5 && state.visibility==='visible' && state.rect.width>0 && state.text.trim(),JSON.stringify({delay,state}));
    await page.locator('.load-screen .system-back').click();
  }
  console.log('Edge interrupted LOAD cycles: OK');
} finally {await browser.close();}
