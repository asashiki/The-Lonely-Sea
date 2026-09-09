import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => sessionStorage.setItem('lonely-sea-opening-seen', '1'));
  await page.goto('http://127.0.0.1:4323/');
  const payload = await page.locator('#nvl-chapters-data').textContent().then(JSON.parse);
  for (const month of ['04', '06', '08']) {
    const id = `2026-${month}`;
    const baseline = payload['ZH-CN'][id];
    for (const locale of ['zh-CN', 'ja-JP', 'en-US']) {
      const draft = JSON.parse(readFileSync(`content-drafts/nvl/${id}.${locale}.json`, 'utf8'));
      assert.deepEqual(payload[locale.toUpperCase()][id], draft);
      assert.deepEqual(draft.scenario.map(s => [s.type, s.pageId, s.lines?.length]), baseline.scenario.map(s => [s.type, s.pageId, s.lines?.length]));
    }
    const stepIndex = baseline.scenario.findIndex(s => s.type === 'page');
    await page.evaluate(({id, chapterId, stepIndex}) => window.dispatchEvent(new CustomEvent('lonely-sea:open-nvl', { detail: { monthId: id, resume: { chapterId, stepIndex, lineIndex: 2 } } })), { id, chapterId: baseline.id, stepIndex });
    await page.waitForTimeout(450);
    for (const language of ['EN-US', 'JA-JP', 'ZH-CN']) {
      await page.evaluate(async language => {
        const {publishPreferences,readPreferences} = await import('/src/scripts/experience/preferences.js');
        publishPreferences({...readPreferences(),language});
      }, language);
      const expected = payload[language][id].scenario[stepIndex].lines.slice(0,2).map(l=>l.text);
      assert.deepEqual(await page.locator('#nvl-text-flow .nvl-line').allTextContents(), expected);
    }
  }
  console.log('NVL: 9 drafts match; all three chapters switch language without losing the current two lines.');
} finally { await browser.close(); }
