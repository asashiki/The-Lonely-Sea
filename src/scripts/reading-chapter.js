export function initReadingChapter(root, { reducedMotion = () => false } = {}) {
  const abort = new AbortController();
  const focusButton = root.querySelector('[data-reading-focus]');
  const returnButton = root.querySelector('[data-reading-focus-return]');
  const begin = root.querySelector('[data-reading-begin]');
  const content = root.querySelector('[data-reading-content]');
  const hiddenControls = [...root.querySelectorAll('.reading-toc, .ambient-dock, .listen-dock, .reading-scroll-rail')];
  let previous = [];
  let active = false;
  const locale = root.querySelector('article')?.lang || 'zh-CN';
  if (returnButton) returnButton.textContent = locale.startsWith('en') ? 'Leave focus mode' : locale.startsWith('ja') ? '集中モードを終了' : '退出专注阅读';

  function focus(show, restore = true) {
    if (active === show) return;
    active = show;
    root.classList.toggle('is-focus-reading', show);
    focusButton?.setAttribute('aria-pressed', String(show));
    if (returnButton) returnButton.hidden = !show;
    if (show) {
      previous = hiddenControls.map(node => [node, node.inert]);
      hiddenControls.forEach(node => { node.inert = true; });
      returnButton?.focus({ preventScroll: true });
    } else {
      previous.forEach(([node, value]) => { node.inert = value; });
      previous = [];
      if (restore) focusButton?.focus({ preventScroll: true });
    }
  }
  const options = { signal: abort.signal };
  focusButton?.addEventListener('click', () => focus(!active), options);
  returnButton?.addEventListener('click', () => focus(false), options);
  begin?.addEventListener('click', event => {
    event.preventDefault();
    content?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });
    content?.focus({ preventScroll: true });
  }, options);
  document.addEventListener('keydown', event => {
    if (!active || event.key !== 'Escape' || root.querySelector('dialog[open]')) return;
    event.preventDefault();
    focus(false);
  }, options);
  return () => { focus(false, false); abort.abort(); };
}
