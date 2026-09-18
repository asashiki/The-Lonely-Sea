import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:4323/start/stories/lonely-sea-chapter-one/');
 const game=page.frameLocator('[data-game-frame]');
 await game.locator('#dialogue').waitFor({state:'visible'});
 await game.locator('#dialogue').click();
 await page.keyboard.down('Control');
 assert.equal(await game.locator('#skipBtn').getAttribute('aria-pressed'),'true');
 await page.keyboard.up('Control');
 assert.equal(await game.locator('#skipBtn').getAttribute('aria-pressed'),'false');
 console.log('Game Control hold/release: OK');
}finally{await browser.close();}
