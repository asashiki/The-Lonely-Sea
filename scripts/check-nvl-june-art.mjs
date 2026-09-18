import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:1600,height:900}});
  await page.goto('http://127.0.0.1:4323/');
  await page.waitForFunction(()=>document.querySelector('#nvl-theater-modal')?.dataset.nvlReady==='true');
  const open = async (pageId, count, monthId='2026-06') => {
    await page.evaluate(({pageId,count,monthId})=>{
      const chapter=JSON.parse(document.querySelector('#nvl-chapters-data').textContent)['ZH-CN'][monthId];
      const stepIndex=chapter.scenario.findIndex(s=>s.pageId===pageId);
      window.dispatchEvent(new CustomEvent('lonely-sea:open-nvl',{detail:{monthId,resume:{chapterId:chapter.id,stepIndex,lineIndex:count}}}));
    },{pageId,count,monthId});
    await page.waitForFunction(()=>document.querySelector('#nvl-theater-modal').dataset.nvlTransition==='false');
    await page.waitForTimeout(100);
  };
  for(const language of ['ZH-CN','JA-JP','EN-US']) {
    await page.evaluate(async language=>{
      const {publishPreferences,readPreferences}=await import('/src/scripts/experience/preferences.js');
      publishPreferences({...readPreferences(),language});
    },language);
    for(const [id,count,subject] of [['ch2_claude_p01',1,'listen'],['ch2_claude_p01',5,'concern'],['ch2_claude_p02',2,'encourage'],['ch2_claude_p02',5,'concern'],['ch2_claude_p03',5,'listen'],['ch2_claude_p04',4,'encourage'],['ch2_claude_p05',6,'goodnight']]) {
      await open(id,count);
      await page.waitForFunction(subject=>document.querySelector('.nvl-june-art').dataset.subject===subject,subject);
      assert.equal(await page.locator('.nvl-june-portrait.is-shown').count(),1);
      const fit=await page.locator('#nvl-page').evaluate(el=>({width:el.clientWidth,height:el.clientHeight,scroll:el.scrollHeight}));
      assert(fit.width>400 && fit.scroll<=fit.height+2,JSON.stringify({language,id,fit}));
      if(language==='ZH-CN') await page.screenshot({path:`tmp/june-${id}-${count}.png`});
    }
  }
  await page.setViewportSize({width:765,height:947});
  await open('ch2_claude_p05',6);
  await page.screenshot({path:'tmp/june-mobile.png'});
  const fit=await page.locator('#nvl-page').evaluate(el=>({width:el.clientWidth,height:el.clientHeight,scroll:el.scrollHeight}));
  assert(fit.width>350 && fit.scroll<=fit.height+2,JSON.stringify(fit));
  await open('ch2_self_p01',3);
  assert.equal(await page.locator('.nvl-june-portrait.is-shown').count(),0);
  await open('ch1_anna_p01',4,'2026-04');
  assert.equal(await page.locator('#nvl-theater-modal').getAttribute('data-june-art'),'false');
  assert.equal(await page.locator('#nvl-theater-modal').getAttribute('data-april-art'),'true');
  console.log('June: three languages, seven restored beats, mobile layout and April handoff passed.');
} finally { await browser.close(); }
