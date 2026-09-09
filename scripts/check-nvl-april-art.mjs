import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => sessionStorage.setItem('lonely-sea-opening-seen', '1'));
  await page.goto('http://127.0.0.1:4323/');
  await page.waitForFunction(() => document.querySelector('#nvl-theater-modal')?.dataset.nvlReady === 'true');
  await page.evaluate(async () => {
    const { publishPreferences, readPreferences } = await import('/src/scripts/experience/preferences.js');
    publishPreferences({ ...readPreferences(), language: 'ZH-CN' });
  });
  for (const [id, count, expected] of [['ch1_anna_p01', 2, 0], ['ch1_anna_p01', 4, 1], ['ch1_anna_p01', 7, 1], ['ch1_anna_p03', 5, 1], ['ch1_anna_p04', 6, 1], ['ch1_self_p10', 5, 0], ['ch1_self_p01', 2, 0]]) {
    await page.evaluate(({ id, count }) => {
      const chapter = JSON.parse(document.querySelector('#nvl-chapters-data').textContent)['ZH-CN']['2026-04'];
      const stepIndex = chapter.scenario.findIndex(s => s.pageId === id);
      window.dispatchEvent(new CustomEvent('lonely-sea:open-nvl', { detail: { monthId: '2026-04', resume: { chapterId: chapter.id, stepIndex, lineIndex: count } } }));
    }, { id, count });
    await page.waitForTimeout(650);
    assert.equal(await page.locator('.nvl-april-illustration.is-shown.is-ready').count(), expected);
    await page.screenshot({ path: `C:/Users/Hey/AppData/Local/Temp/${id}-${count}-art.png` });
    const fits = await page.evaluate(() => {
      const flow = document.querySelector('#nvl-text-flow');
      const container = flow.closest('.nvl-content-container');
      const style = getComputedStyle(container);
      return flow.scrollHeight <= container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) + 1;
    });
    assert.ok(fits, `${id}: text must stay in the reading area`);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const language of ['ZH-CN', 'JA-JP', 'EN-US']) {
    await page.evaluate(async language => {
      const { publishPreferences, readPreferences } = await import('/src/scripts/experience/preferences.js');
      publishPreferences({ ...readPreferences(), language });
    }, language);
    await page.evaluate(() => {
      const chapter = JSON.parse(document.querySelector('#nvl-chapters-data').textContent)['ZH-CN']['2026-04'];
      window.dispatchEvent(new CustomEvent('lonely-sea:open-nvl', { detail: { monthId: '2026-04', resume: {
        chapterId: chapter.id, stepIndex: chapter.scenario.findIndex(s => s.pageId === 'ch1_anna_p03'), lineIndex: 3,
      } } }));
    });
    await page.waitForTimeout(700);
    await page.keyboard.press('Space');
    await page.waitForTimeout(60);
    await page.keyboard.press('Space');
    await page.waitForTimeout(450);
    assert.equal(await page.locator('.nvl-april-art').getAttribute('data-camera'), 'close');
    assert.equal(await page.locator('#nvl-text-flow .nvl-line').count(), 1, 'new command starts its own reading beat');
    assert.equal(await page.locator('.nvl-april-art').getAttribute('data-subject'), 'encourage');
    await page.screenshot({ path: `C:/Users/Hey/AppData/Local/Temp/april-command-${language}.png` });
  }
  console.log('April staging: empty room, chair, close-up, encouragement, ending and self-view restoration passed.');
} finally { await browser.close(); }
