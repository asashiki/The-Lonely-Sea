import { readBlogActivity } from '../../lib/blog-activity';

export function initArticleSelection(canvas, { language, reducedMotion, onOpen }) {
  const preview = canvas.querySelector('[data-article-preview]');
  if (!preview) return { refresh() {}, select() {} };
  const slots = [...canvas.querySelectorAll('[data-xiii-article-slot]')];
  const image = preview.querySelector('[data-article-preview-image]');
  const empty = canvas.querySelector('[data-article-empty]');
  const openButton = preview.querySelector('[data-article-preview-open]');
  let selected = null;
  let artAnimation = null;
  const text = () => language() === 'EN-US'
    ? { read: 'Read this record', empty: 'No articles in this category yet.', minute: 'min read', visited: 'Opened before', complete: 'Reached the end', fresh: 'Unread' }
    : language() === 'JA-JP'
      ? { read: 'この記録を読む', empty: 'このカテゴリにはまだ記事がありません。', minute: '分', visited: '閲覧済み', complete: '最後まで閲覧', fresh: '未読' }
      : { read: '读取这篇文章', empty: '这个分类还没有文章。', minute: '分钟', visited: '曾经打开', complete: '已读至末尾', fresh: '未读' };

  function select(slot, animate = true) {
    if (!slot || slot.classList.contains('is-page-hidden')) return;
    const changed = selected !== slot;
    selected = slot;
    preview.hidden = false;
    const copy = text();
    slots.forEach(node => node.toggleAttribute('data-preview-current', node === slot));
    const set = (selector, value) => { preview.querySelector(selector).textContent = value; };
    set('[data-article-preview-title]', slot.dataset.title);
    set('[data-article-preview-excerpt]', slot.dataset.excerpt);
    set('[data-article-preview-label]', slot.dataset.label);
    set('[data-article-preview-number]', slot.querySelector('.tracks-xiii-slot-number')?.textContent || '01');
    set('[data-article-preview-date]', slot.dataset.date);
    set('[data-article-preview-time]', `~ ${slot.dataset.minutes} ${copy.minute}`);
    set('[data-article-preview-open-copy]', copy.read);
    const activity = readBlogActivity();
    set('[data-article-preview-state]', activity.articleCompletions[slot.dataset.href] ? copy.complete : activity.articles[slot.dataset.href] ? copy.visited : copy.fresh);
    openButton.setAttribute('aria-label', `${copy.read}：${slot.dataset.title}`);
    if (image.getAttribute('src') !== slot.dataset.cover) image.src = slot.dataset.cover;
    image.alt = slot.dataset.title;
    if (changed && animate && !reducedMotion() && preview.animate) {
      artAnimation?.cancel();
      artAnimation = preview.animate([{ opacity: .55, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    }
  }
  slots.forEach(slot => {
    slot.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') select(slot); });
    slot.addEventListener('focus', () => select(slot, false));
  });
  openButton.addEventListener('click', () => { if (selected) onOpen(selected); });
  return {
    select,
    refresh() {
      const visible = slots.filter(slot => !slot.classList.contains('is-page-hidden'));
      empty.hidden = visible.length > 0;
      empty.textContent = text().empty;
      preview.hidden = visible.length === 0;
      if (!visible.length) { selected = null; return; }
      select(visible.includes(selected) ? selected : visible[0], false);
    },
  };
}
