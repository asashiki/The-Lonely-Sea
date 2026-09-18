import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
 const page = await browser.newPage({viewport:{width:765,height:947}});
 await page.goto('http://127.0.0.1:4323/');
 await page.waitForFunction(()=>document.querySelector('#nvl-theater-modal')?.dataset.nvlReady==='true');
 const open = async (resume=false) => {
  await page.evaluate(resume=>{
   const c=JSON.parse(document.querySelector('#nvl-chapters-data').textContent)['ZH-CN']['2026-04'];
   window.dispatchEvent(new CustomEvent('lonely-sea:open-nvl',{detail:{monthId:'2026-04',...(resume?{resume:{chapterId:c.id,stepIndex:c.scenario.findIndex(s=>s.pageId==='ch1_self_p05'),lineIndex:2}}:{})}}));
  },resume);
  await page.waitForTimeout(700);
  await page.waitForFunction(()=>document.querySelector('#nvl-theater-modal').dataset.nvlTransition==='false');
 };
 await open(true);
 const width=await page.locator('#nvl-page').evaluate(e=>e.clientWidth);
 await page.locator('#nvl-btn-close').click();
 await open();
 const reopened=await page.locator('#nvl-page-current').textContent();
 await page.keyboard.down('Control'); await page.waitForTimeout(900); await page.keyboard.up('Control');
 const advanced=await page.locator('#nvl-text-flow').textContent();
 console.log({width,reopened,advanced});
 assert(width>400,'NVL text must use the available reading width at 765×947');
 assert.equal(reopened,'01','Opening a chapter without a save must restart');
 assert(advanced.length>80,'Holding Control must advance reading');
 const stopped=await page.locator('#nvl-text-flow .nvl-line').count();
 await page.waitForTimeout(200);
 assert.equal(await page.locator('#nvl-text-flow .nvl-line').count(),stopped,'Releasing Control must stop skipping');
 await page.locator('#nvl-btn-close').click();
 await open(true);
 const beforeWheel=await page.locator('#nvl-text-flow').textContent();
 for(let i=0;i<4;i++) await page.locator('#nvl-click-target').dispatchEvent('wheel',{deltaY:100});
 assert.notEqual(await page.locator('#nvl-text-flow').textContent(),beforeWheel,'Wheel down must advance reading');
 for(const viewport of [{width:765,height:947},{width:390,height:844}]) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(200);
  const size=await page.locator('#nvl-page').evaluate(e=>({width:e.clientWidth,scroll:e.scrollHeight,height:e.clientHeight}));
  assert(size.width>viewport.height*.7,JSON.stringify({viewport,size}));
  assert(size.scroll<=size.height+2,'NVL content must not be clipped in forced landscape');
 }
} finally {await browser.close();}
