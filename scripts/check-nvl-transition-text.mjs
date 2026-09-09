import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4323/');
  await page.waitForFunction(() => document.querySelector('#nvl-theater-modal')?.dataset.nvlReady === 'true');
  const open = () => page.evaluate(() => {
    const chapter = JSON.parse(document.querySelector('#nvl-chapters-data').textContent)['ZH-CN']['2026-04'];
    const stepIndex = chapter.scenario.findIndex(s => s.pageId === 'ch1_self_p10');
    window.dispatchEvent(new CustomEvent('lonely-sea:open-nvl', { detail: { monthId: '2026-04', resume: {
      chapterId: chapter.id, stepIndex, lineIndex: chapter.scenario[stepIndex].lines.length,
    } } }));
    return document.querySelector('#nvl-text-flow').textContent;
  });
  await open();
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  const reopenText = await open();
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('#nvl-cutscene').classList.contains('is-active'));
  const titleText = await page.locator('#nvl-text-flow').textContent();
  console.log(JSON.stringify({ reopenOldTextLength: reopenText.length, titleOldTextLength: titleText.length }));
  assert.equal(reopenText, '', 'entry must clear old words before showing the modal');
  assert.equal(titleText, '', 'viewpoint title must not share the old reading text');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#nvl-text-flow').textContent(), '', 'no new text under a fading title');
  await page.waitForFunction(() => document.querySelector('#nvl-text-flow').textContent.length > 0);
  assert.equal(await page.locator('#nvl-theater-modal').getAttribute('data-nvl-transition'), 'false');
} finally { await browser.close(); }
