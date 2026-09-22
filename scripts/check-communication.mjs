import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

// Exercise actual built markup and controller without a browser or live submissions.
const markup = readFileSync('dist/connect/index.html', 'utf8');
const sources = ['src/lib/blog-interactions.ts', 'src/lib/composer-drafts.ts', 'src/scripts/blog-interactions.ts'];
const code = sources.map(path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace(/import[\s\S]*?from\s+["'][^"']+["'];?/g, '').replace(/\bexport\s+/g, '')).join('\n');
function setup(endpoint = '') {
  const dom = new JSDOM(markup, { url: 'https://example.test/connect/', runScripts: 'outside-only' });
  const w = dom.window;
  const root = w.document.querySelector('[data-blog-interaction]');
  root.dataset.messageEndpoint = endpoint;
  w.eval('function readPreferences(){ return {language:"ZH-CN"}; }\n' + code + '\nwindow.start = initBlogInteractionScene;');
  w.fetch = () => { throw new Error('Unexpected network call'); };
  const controller = w.start(root);
  return { w, root, controller, q: s => root.querySelector(s) };
}
function input(t, selector, value) {
  const el = t.q(selector); el.value = value; el.dispatchEvent(new t.w.Event('input', { bubbles: true }));
}
function submit(t, selector) { t.q(selector).dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true })); }
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const records = t => JSON.parse(t.w.localStorage.getItem('lonely-sea:blog-interactions:v2') || '{"comments":[],"friendDrafts":[]}');

{
  const t = setup();
  input(t, '[name=message]', '未写完的第一篇');
  assert.equal(t.q('[data-comment-count]').textContent, '7 / 1000');
  t.controller.setContext('article:/second');
  assert.equal(t.q('[name=message]').value, '');
  input(t, '[name=message]', '第二篇草稿');
  t.controller.setContext('site:guestbook');
  assert.equal(t.q('[name=message]').value, '未写完的第一篇');
  t.controller.destroy();
  const restored = t.w.start(t.root);
  assert.equal(t.q('[name=message]').value, '未写完的第一篇');
  submit(t, '[data-blog-comment-form]'); await tick();
  assert.equal(records(t).comments.length, 1);
  assert.equal(t.q('[name=message]').value, '');
  assert.match(t.q('[data-blog-comment-feedback]').textContent, /未发送/);
  restored.destroy(); t.w.close();
}
{
  const t = setup('https://endpoint.test/messages'); let calls = 0; let finish;
  t.w.fetch = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  input(t, '[name=message]', '发送这句话');
  submit(t, '[data-blog-comment-form]'); submit(t, '[data-blog-comment-form]');
  assert.equal(calls, 1); assert.equal(records(t).comments.length, 1);
  assert.equal(t.q('[data-blog-comment-form] button[type=submit]').disabled, true);
  finish({ ok: false }); await tick();
  assert.equal(t.q('[name=message]').value, '发送这句话');
  assert.match(t.q('[data-blog-comment-feedback]').textContent, /未确认送达/);
  submit(t, '[data-blog-comment-form]');
  assert.equal(records(t).comments.length, 1, 'retry reuses its local record');
  input(t, '[name=message]', '发送中继续写的新内容');
  finish({ ok: true }); await tick();
  assert.equal(t.q('[name=message]').value, '发送中继续写的新内容');
  t.controller.destroy(); t.w.close();
}
{
  const t = setup();
  t.controller.selectView('friends');
  input(t, '[name=title]', 'My site'); input(t, '[name=url]', 'javascript:alert(1)');
  submit(t, '[data-blog-friend-form]'); await tick();
  assert.equal(records(t).friendDrafts.length, 0, 'unsafe URLs are rejected');
  input(t, '[name=url]', 'https://example.com'); input(t, '[name=note]', '网站介绍');
  submit(t, '[data-blog-friend-form]'); await tick();
  assert.equal(records(t).friendDrafts[0].note, '网站介绍');
  assert.equal(t.q('[name=title]').value, '');
  assert.equal(t.q('[data-blog-friend-url]').getAttribute('href'), 'https://example.com/');
  t.controller.destroy(); t.w.close();
}
{
  const t = setup();
  t.w.Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
  input(t, '[name=message]', '不能丢失的文字');
  assert.match(t.q('[data-comment-draft-status]').textContent, /无法保存/);
  submit(t, '[data-blog-comment-form]'); await tick();
  assert.equal(t.q('[name=message]').value, '不能丢失的文字');
  assert.equal(t.q('[data-blog-comment-form] button[type=submit]').disabled, false);
  t.controller.destroy(); t.w.close();
}
{
  const t = setup();
  input(t, '[name=message]', '<img src=x onerror=alert(1)>');
  const link = t.q('[data-public-comment]');
  link.addEventListener('click', event => event.preventDefault());
  link.dispatchEvent(new t.w.MouseEvent('click', { bubbles: true, cancelable: true }));
  const url = new URL(link.href);
  assert.equal(url.hostname, 'github.com');
  assert.match(url.searchParams.get('body'), /<img src=x/);
  assert.equal(records(t).comments.length, 0, 'opening the public editor does not submit');
  submit(t, '[data-blog-comment-form]'); await tick();
  assert.equal(t.q('[data-blog-comment-message]').textContent, '<img src=x onerror=alert(1)>');
  assert.equal(t.q('[data-blog-comment-message] img'), null, 'comment text cannot inject HTML');
  t.controller.destroy(); t.w.close();
}
{
  const t = setup(); let copied = '';
  Object.defineProperty(t.w.navigator, 'clipboard', { configurable: true, value: { writeText: async value => { copied = value; } } });
  t.q('[data-site-profile-copy]').click(); await tick();
  assert.match(copied, /https:\/\/asashiki.com/);
  assert.match(t.q('[data-site-profile-feedback]').textContent, /已复制/);
  t.w.navigator.clipboard.writeText = async () => { throw new Error('Denied'); };
  t.q('[data-site-profile-copy]').click(); await tick();
  const profile = t.q('[data-site-profile]');
  assert.equal(profile.selectionStart, 0);
  assert.equal(profile.selectionEnd, profile.value.length);
  assert.match(t.q('[data-site-profile-feedback]').textContent, /手动复制/);
  t.controller.destroy(); t.w.close();
}
console.log('Communication checks passed: draft/context restore, local-only save, duplicate guard, retry, in-flight edits, safe URLs and blocked storage.');
