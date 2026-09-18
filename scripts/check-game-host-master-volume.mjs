import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__gameMessages = [];
    window.addEventListener('message', e => {
      if (e.data?.protocol === 'gal-blog-bridge/v1') window.__gameMessages.push(e.data);
    });
    window.__gainRamps = [];
    const ramp = AudioParam.prototype.exponentialRampToValueAtTime;
    AudioParam.prototype.exponentialRampToValueAtTime = function (value, time) {
      window.__gainRamps.push(value);
      return ramp.call(this, value, time);
    };
    sessionStorage.setItem('lonely-sea-opening-seen', '1');
  });
  await page.goto('http://127.0.0.1:4323/');
  await page.evaluate(async () => {
    const p = await import('/src/scripts/experience/preferences.js');
    p.publishPreferences({ ...p.readPreferences(), masterVolume: 25, masterMuted: false,
      gameBgmVolume: 100, voiceVolume: 100, interfaceVolume: 100, ambientVolume: 100 });
  });
  await page.locator('[data-command=START]').click();
  const host = page.frameLocator('[data-game-shell-frame]');
  const frame = host.frameLocator('[data-game-frame]');
  await frame.locator('#dialogue').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(700);
  const initial = await frame.locator('body').evaluate(() => ({
    url: location.href, bgm: document.querySelector('#bgm').volume,
    voice: document.querySelector('#voice').volume, messages: window.__gameMessages,
  }));
  assert(initial.url.includes('0.3.0-7be69beb'));
  assert.equal(initial.bgm, .25);
  assert.equal(initial.voice, .25);
  const launch = initial.messages.find(m => m.type === 'launch');
  assert.equal(launch.payload.settings['audio.effects'], 25);
  await frame.locator('#saveBtn').click();
  const ramps = await frame.locator('body').evaluate(() => window.__gainRamps);
  assert(ramps.some(v => Math.abs(v - .035 * .25) < 1e-9));
  await page.evaluate(async () => {
    const p = await import('/src/scripts/experience/preferences.js');
    p.publishPreferences({ ...p.readPreferences(), masterVolume: 0 });
  });
  await page.waitForTimeout(200);
  const muted = await frame.locator('body').evaluate(() => ({
    bgm: document.querySelector('#bgm').volume, voice: document.querySelector('#voice').volume,
    ramps: window.__gainRamps.length,
  }));
  assert.equal(muted.bgm, 0);
  assert.equal(muted.voice, 0);
  await host.locator('[data-host-load] [data-back]').click();
  await frame.locator('#saveBtn').click();
  assert.equal(await frame.locator('body').evaluate(() => window.__gainRamps.length), muted.ramps);
  console.log('4323 real START handshake, new release, master 25% live BGM/voice/UI gain, master 0 silence: OK');
} finally { await browser.close(); }
