import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const markup = readFileSync('dist/index.html', 'utf8');
const galleryCode = readFileSync('src/scripts/experience/cg-gallery.js', 'utf8').replace('export function', 'function');
const previewCode = readFileSync('src/scripts/experience/continue-preview.js', 'utf8').replace('export function', 'function');
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function setup({ reduced = false } = {}) {
  const dom = new JSDOM(markup, { url: 'https://example.test/', runScripts: 'outside-only' });
  const w = dom.window;
  Object.defineProperty(w.HTMLElement.prototype, 'inert', {
    get() { return this.hasAttribute('inert'); },
    set(value) { this.toggleAttribute('inert', value); },
  });
  const loads = [], views = [], animations = [];
  w.Image = class {
    decode() { return new Promise((resolve, reject) => loads.push({ src: this.src, resolve, reject })); }
  };
  w.HTMLElement.prototype.animate = () => {
    const animation = { cancelled: false, cancel() { animation.cancelled = true; } }; animations.push(animation); return animation;
  };
  w.eval(`${galleryCode}\n${previewCode}\nwindow.createCgGallery = createCgGallery; window.initContinuePreview = initContinuePreview;`);
  const root = w.document.querySelector('#cg-viewer');
  const trigger = w.document.querySelector('button[data-extra-mode="cg"]');
  const items = [
    { title: 'A', art: '/a.webp', unlocked: true },
    { title: 'Locked', art: '/private.webp', unlocked: false },
    { title: 'C', art: '/c.webp', unlocked: true },
    { title: 'D', art: '/d.webp', unlocked: true },
  ];
  const controller = w.createCgGallery({ root, items, reduceMotion: () => reduced, language: () => 'ZH-CN', onView: value => views.push(value) });
  const key = value => w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  return { dom, w, root, controller, trigger, loads, views, animations, key, q: selector => root.querySelector(selector) };
}

{
  const t = setup();
  t.trigger.focus();
  await t.controller.open(1, t.trigger);
  assert.equal(t.controller.isOpen(), false, 'locked images cannot be opened');
  const opening = t.controller.open(0, t.trigger);
  assert.equal(t.root.getAttribute('aria-busy'), 'true');
  assert.equal(t.w.document.querySelector('.extra-safe-frame').inert, true);
  t.loads[0].resolve(); await opening;
  assert.equal(t.q('[data-cg-image]').getAttribute('src'), '/a.webp');
  assert.deepEqual(t.views, [0]);
  assert.equal(t.q('[data-cg-tray]').childElementCount, 0, 'index defers asset requests until opened');
  t.key('i');
  assert.equal(t.q('[data-cg-tray]').children.length, 3, 'locked images excluded from index');
  t.key('h');
  assert.equal(t.q('[data-cg-controls]').inert, true);
  assert.equal(t.w.document.activeElement, t.q('[data-cg-return]'));
  t.key('Escape');
  assert.equal(t.controller.isOpen(), true, 'first Escape restores controls in clean view');
  assert.equal(t.q('[data-cg-controls]').inert, false);
  t.key('ArrowRight');
  assert.equal(t.loads.at(-1).src, '/c.webp', 'keyboard skips locked image');
  t.loads.at(-1).resolve(); await tick();
  t.q('[data-cg-close]').focus();
  t.q('[data-cg-close]').dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  assert.equal(t.w.document.activeElement, t.q('[data-cg-pick="3"]'), 'Shift+Tab stays inside modal');
  t.key('Tab');
  assert.equal(t.w.document.activeElement, t.q('[data-cg-close]'));
  t.key('Escape');
  assert.equal(t.controller.isOpen(), false);
  assert.equal(t.w.document.activeElement, t.trigger, 'closing restores original selection');
  assert.equal(t.w.document.querySelector('.extra-safe-frame').inert, false);
  t.controller.destroy(); t.w.close();
}

{
  const t = setup({ reduced: true });
  const first = t.controller.open(0, t.trigger);
  const latest = t.controller.open(2);
  t.loads[1].resolve(); await latest;
  t.loads[0].resolve(); await first;
  assert.equal(t.q('[data-cg-image]').getAttribute('src'), '/c.webp', 'late decode cannot overwrite newest selection');
  assert.deepEqual(t.views, [2], 'only a successfully displayed image is recorded');
  assert.equal(t.animations.length, 0, 'reduced motion skips animation');
  const failed = t.controller.open(3);
  t.loads[2].reject(new Error('offline')); await failed;
  assert.match(t.q('[data-cg-status]').textContent, /未能载入/);
  assert.equal(t.q('[data-cg-image]').getAttribute('src'), '/c.webp', 'failure preserves previous image');
  assert.equal(t.q('[data-cg-retry]').hidden, false);
  t.q('[data-cg-retry]').click();
  t.loads[3].resolve(); await tick();
  assert.equal(t.q('[data-cg-image]').getAttribute('src'), '/d.webp');
  const pending = t.controller.open(0);
  t.controller.close();
  t.loads[4].resolve(); await pending;
  assert.equal(t.controller.isOpen(), false, 'late image cannot reopen a closed viewer');
  t.controller.destroy(); t.w.close();
}

{
  const t = setup();
  const root = t.w.document.querySelector('[data-continue-preview]');
  const button = t.w.document.querySelector('[data-command="CONTINUE"]');
  const preview = t.w.initContinuePreview(root, button);
  const q = selector => root.querySelector(selector);
  preview.sync(null, null);
  assert.equal(root.hidden, true);
  const catalogue = JSON.parse(t.w.document.querySelector('#continue-catalogue').textContent);
  const article = catalogue[0];
  preview.sync({ kind: 'article', path: article.url, title: 'stale title', updatedAt: '2026-10-28T10:00:00Z' }, null, 'EN-US');
  assert.equal(q('[data-continue-title]').textContent, article.title);
  assert.match(q('[data-continue-kind]').textContent, /ARTICLE/);
  assert.equal(button.getAttribute('aria-describedby'), 'continue-description');
  preview.sync({ kind: 'nvl', updatedAt: '2026-10-28T10:00:00Z' }, { title: '<img src=x>', pageNumber: 3, totalPages: 8, coverArt: 'https://external.test/tracker' });
  assert.match(q('[data-continue-detail]').textContent, /3 \/ 8/);
  assert.equal(q('[data-continue-title]').querySelector('img'), null);
  assert.equal(q('[data-continue-art]').hasAttribute('src'), false, 'stored remote URLs do not trigger requests');
  preview.sync({ kind: 'game', updatedAt: '2026-10-28T10:00:00Z' }, { title: 'Save', slot: 2, thumbnail: '/games/scene.webp' }, 'JA-JP');
  assert.match(q('[data-continue-detail]').textContent, /02/);
  assert.equal(q('[data-continue-art]').hidden, false);
  preview.sync(null, null);
  assert.equal(button.hasAttribute('aria-describedby'), false);
  t.controller.destroy(); t.w.close();
}
console.log('CG theater checks passed: async race/close, locked assets, retry, focus trap/return, clean view, reduced motion, and real continue previews.');
