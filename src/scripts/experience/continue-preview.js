export function initContinuePreview(root, button) {
  if (!root) return { sync() {} };
  let catalogue = [];
  try { catalogue = JSON.parse(document.querySelector('#continue-catalogue')?.textContent || '[]'); } catch {}
  const q = (selector) => root.querySelector(selector);
  const artwork = q('[data-continue-art]');
  artwork.addEventListener('error', () => { artwork.hidden = true; });

  function safeArt(value) {
    if (typeof value !== 'string') return '';
    if (/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(value) && value.length < 56000) return value;
    try {
      const url = new URL(value, location.origin);
      return url.origin === location.origin && /^\/(assets|games|_astro)\//.test(url.pathname) ? url.href : '';
    } catch { return ''; }
  }

  return {
    sync(target, save, language = 'ZH-CN') {
      root.hidden = !target;
      if (!target) { button.removeAttribute('aria-describedby'); artwork.removeAttribute('src'); return; }
      const copy = language === 'JA-JP'
        ? { article: '記事', game: 'ゲーム', nvl: '日記', resume: '前回の続きから', local: 'このブラウザの記録', page: 'ページ', slot: 'セーブ', label: '続きのプレビュー' }
        : language === 'EN-US'
          ? { article: 'ARTICLE', game: 'GAME', nvl: 'DIARY', resume: 'Resume reading', local: 'Saved in this browser', page: 'PAGE', slot: 'SAVE', label: 'Continue preview' }
          : { article: '文章', game: '游戏', nvl: '日记', resume: '从上次的位置继续', local: '保存在此浏览器', page: '页', slot: '存档', label: '继续读取预览' };
      const entry = target.kind === 'article' ? catalogue.find((item) => {
        try { return new URL(item.url, location.origin).pathname === new URL(target.path, location.origin).pathname; } catch { return false; }
      }) : null;
      q('[data-continue-kind]').textContent = `CONTINUE / ${copy[target.kind]}`;
      q('[data-continue-title]').textContent = entry?.title || save?.title || target.title || copy[target.kind];
      const detail = target.kind === 'nvl' && save
        ? `${copy.page} ${save.pageNumber} / ${save.totalPages}`
        : target.kind === 'game' && save?.slot ? `${copy.slot} ${String(save.slot).padStart(2, '0')}` : copy.resume;
      q('[data-continue-detail]').textContent = `${detail} · ${copy.local}`;
      const time = q('[data-continue-date]');
      time.dateTime = target.updatedAt;
      time.textContent = new Intl.DateTimeFormat(language, { month: '2-digit', day: '2-digit' }).format(new Date(target.updatedAt));
      root.setAttribute('aria-label', copy.label);
      const art = safeArt(entry?.coverUrl || save?.coverArt || save?.thumbnail);
      artwork.hidden = !art;
      if (art && artwork.src !== art) artwork.src = art;
      if (!art) artwork.removeAttribute('src');
      button.setAttribute('aria-describedby', 'continue-description');
    },
  };
}
