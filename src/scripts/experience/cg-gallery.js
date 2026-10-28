// One image, one quiet control layer. No autoplay or background rendering loop.
export function createCgGallery({ root, items, reduceMotion, language, onView = () => {} }) {
  const q = (selector) => root.querySelector(selector);
  const image = q('[data-cg-image]');
  const tray = q('[data-cg-tray]');
  const indexButton = q('[data-cg-index-toggle]');
  const cleanButton = q('[data-cg-clean]');
  const returnButton = q('[data-cg-return]');
  const closeButton = q('[data-cg-close]');
  const status = q('[data-cg-status]');
  const available = items.map((item, index) => ({ ...item, index })).filter((item) => item.unlocked && item.art);
  const abort = new AbortController();
  const listen = (node, type, fn, options = {}) => node.addEventListener(type, fn, { ...options, signal: abort.signal });
  let current = -1;
  let origin = null;
  let pending = 0;
  let animation = null;
  let siblings = [];
  let expanded = false;
  let clean = false;
  let ready = false;
  const titleOf = (item) => item.titles?.[language()] || item.title;

  function copy() {
    if (language() === 'JA-JP') return { close: '戻る', index: '一覧', clean: '画面のみ', restore: '操作を表示', loading: '画像を読み込み中', error: '画像を読み込めませんでした。別の画像を選ぶか、再試行してください。', retry: '再試行', prev: '前の CG', next: '次の CG', hint: '← → 切替 / H 画面のみ / I 一覧 / Esc 戻る' };
    if (language() === 'EN-US') return { close: 'Back', index: 'Index', clean: 'Hide UI', restore: 'Show controls', loading: 'Loading image', error: 'This image could not load. Choose another image or retry.', retry: 'Retry', prev: 'Previous CG', next: 'Next CG', hint: '← → Browse / H Hide UI / I Index / Esc Back' };
    return { close: '返回', index: '画面索引', clean: '纯画面', restore: '显示操作', loading: '正在读取画面', error: '画面未能载入，可切换其他画面或重试。', retry: '重试', prev: '上一张 CG', next: '下一张 CG', hint: '← → 切换 / H 纯画面 / I 索引 / Esc 返回' };
  }

  function localize() {
    const text = copy();
    closeButton.textContent = text.close;
    indexButton.textContent = text.index;
    cleanButton.textContent = text.clean;
    returnButton.textContent = text.restore;
    q('[data-cg-retry]').textContent = text.retry;
    q('[data-cg-hint]').textContent = text.hint;
    q('[data-cg-direction="-1"]').setAttribute('aria-label', text.prev);
    q('[data-cg-direction="1"]').setAttribute('aria-label', text.next);
    tray.setAttribute('aria-label', text.index);
    root.setAttribute('aria-label', 'CG GALLERY');
  }

  function setIndex(show) {
    expanded = show;
    root.classList.toggle('has-index', show);
    tray.hidden = !show;
    indexButton.setAttribute('aria-expanded', String(show));
    if (!show) return;
    if (!tray.childElementCount) {
      available.forEach((item, position) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.cgPick = String(item.index);
        button.setAttribute('aria-label', `CG ${String(position + 1).padStart(2, '0')} · ${titleOf(item)}`);
        const thumb = document.createElement('span');
        thumb.className = 'cg-theater-thumb';
        thumb.setAttribute('aria-hidden', 'true');
        thumb.style.backgroundImage = `url("${item.thumb || item.art}")`;
        if (item.thumbPosition) {
          thumb.style.backgroundPosition = item.thumbPosition;
          thumb.style.backgroundSize = '500% 400%';
        }
        const number = document.createElement('span');
        number.className = 'cg-theater-number';
        number.textContent = String(position + 1).padStart(2, '0');
        button.append(thumb, number);
        listen(button, 'click', () => open(item.index));
        tray.append(button);
      });
    }
    syncIndex();
  }

  function syncIndex() {
    tray.querySelectorAll('[data-cg-pick]').forEach((button) => {
      const selected = Number(button.dataset.cgPick) === current;
      button.setAttribute('aria-pressed', String(selected));
      if (selected && expanded) button.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    });
  }

  function setClean(show) {
    clean = show;
    root.classList.toggle('is-clean', show);
    q('[data-cg-controls]').inert = show;
    tray.inert = show;
    returnButton.hidden = !show;
    (show ? returnButton : cleanButton).focus({ preventScroll: true });
  }

  function isOpen() { return root.getAttribute('aria-hidden') === 'false'; }

  async function open(index, trigger = null) {
    const item = available.find((entry) => entry.index === index);
    if (!item) return;
    const wasOpen = isOpen();
    if (!wasOpen) {
      origin = trigger || document.activeElement;
      siblings = [];
      // Isolate the complete modal path, including the persistent music dock.
      for (let branch = root; branch.parentElement; branch = branch.parentElement) {
        if (branch === document.body) break;
        [...branch.parentElement.children].filter((node) => node !== branch && !node.matches('script, style, link')).forEach((node) => siblings.push([node, node.inert]));
      }
      siblings.forEach(([node]) => { node.inert = true; });
      root.setAttribute('aria-hidden', 'false');
      root.inert = false;
      root.focus({ preventScroll: true });
    }
    current = index;
    const token = ++pending;
    animation?.cancel();
    localize();
    root.setAttribute('aria-busy', 'true');
    q('[data-cg-retry]').hidden = true;
    status.textContent = copy().loading;
    // Keep the previous picture until the next is decoded, avoiding a white/black flash.
    const incoming = new Image();
    incoming.src = item.art;
    try {
      await incoming.decode();
      if (token !== pending || !isOpen()) return;
      image.src = item.art;
      image.alt = titleOf(item);
      image.hidden = false;
      ready = true;
      root.dataset.cgReady = 'true';
      q('#cg-viewer-index').textContent = `CG ${String(available.indexOf(item) + 1).padStart(2, '0')} / ${String(available.length).padStart(2, '0')}`;
      q('#cg-viewer-title').textContent = titleOf(item);
      status.textContent = '';
      root.setAttribute('aria-busy', 'false');
      syncIndex();
      onView(index);
      if (!reduceMotion() && image.animate) {
        animation = image.animate([{ opacity: .25, transform: 'scale(1.012)' }, { opacity: 1, transform: 'scale(1)' }], { duration: wasOpen ? 220 : 360, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    } catch {
      if (token !== pending || !isOpen()) return;
      root.setAttribute('aria-busy', 'false');
      status.textContent = copy().error;
      q('[data-cg-retry]').hidden = false;
      if (!ready) image.hidden = true;
    }
  }

  function move(direction) {
    if (!isOpen() || !available.length) return;
    const position = available.findIndex((item) => item.index === current);
    open(available[(position + direction + available.length) % available.length].index);
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen()) return false;
    pending += 1;
    animation?.cancel();
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('aria-busy', 'false');
    root.inert = true;
    siblings.forEach(([node, inert]) => { node.inert = inert; });
    siblings = [];
    clean = false;
    root.classList.remove('is-clean');
    q('[data-cg-controls]').inert = false;
    tray.inert = false;
    returnButton.hidden = true;
    status.textContent = '';
    if (restoreFocus && origin?.isConnected) origin.focus({ preventScroll: true });
    origin = null;
    return true;
  }

  listen(closeButton, 'click', () => close());
  listen(indexButton, 'click', () => setIndex(!expanded));
  listen(cleanButton, 'click', () => setClean(true));
  listen(returnButton, 'click', () => setClean(false));
  listen(image, 'click', () => setClean(!clean));
  listen(q('[data-cg-retry]'), 'click', () => open(current));
  root.querySelectorAll('[data-cg-direction]').forEach((button) => listen(button, 'click', () => move(Number(button.dataset.cgDirection))));
  // Capture within the viewer before the shared EXTRA page shortcuts handle the key.
  listen(root, 'keydown', (event) => {
    if (!isOpen() || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (['escape', 'arrowleft', 'arrowright', 'h', 'i', 'home', 'end'].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      if (key === 'escape') clean ? setClean(false) : close();
      else if (key === 'h') setClean(!clean);
      else if (key === 'i') { if (clean) setClean(false); setIndex(!expanded); }
      else if (key === 'home') open(available[0]?.index);
      else if (key === 'end') open(available.at(-1)?.index);
      else move(key === 'arrowleft' ? -1 : 1);
    }
    if (key === 'tab') {
      const controls = [...root.querySelectorAll('button')].filter((button) => !button.disabled && !button.closest('[hidden], [inert]'));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === root)) { event.preventDefault(); first?.focus(); }
    }
  });
  listen(window, 'lonely-sea:preferences-change', () => { localize(); if (reduceMotion()) animation?.cancel(); });
  root.inert = true;
  return { open, move, close, isOpen, destroy() { close({ restoreFocus: false }); abort.abort(); } };
}
