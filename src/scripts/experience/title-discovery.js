export function initTitleDiscovery({ onArticle, onArchive }) {
  const root = document.querySelector('[data-title-discovery]');
  const guide = document.querySelector('[data-title-guide]');
  const menu = document.querySelector('.title-menu');
  let currentLanguage = 'ZH-CN';
  let command = 'LOAD';
  const languages = {
    'ZH-CN': { latest: '最新文章', all: '全部文章', time: n => `约 ${n} 分钟`, guide: { START: '从第一章进入故事', LOAD: '文章、日记与游戏存档', CONTINUE: '回到上次停下的位置', EXTRA: '画廊、音乐与站外相遇', OPTION: '调整阅读、声音与画面', EXIT: '离开之前' } },
    'EN-US': { latest: 'LATEST RECORD', all: 'All articles', time: n => `About ${n} min`, guide: { START: 'Enter the story from chapter one', LOAD: 'Articles, diaries and saved games', CONTINUE: 'Return to where you left off', EXTRA: 'Gallery, music and friends', OPTION: 'Reading, sound and display', EXIT: 'Before you leave' } },
    'JA-JP': { latest: '最新の記事', all: '記事一覧', time: n => `約 ${n} 分`, guide: { START: '最初の章から物語へ', LOAD: '記事・日記・セーブデータ', CONTINUE: '前回の続きから', EXTRA: 'ギャラリー・音楽・リンク', OPTION: '文字・音声・画面の設定', EXIT: 'ここを離れる前に' } },
  };
  const copy = () => languages[currentLanguage] || languages['ZH-CN'];
  const updateGuide = () => { if (guide) guide.textContent = copy().guide[command] || ''; };
  function showGuide(event) {
    const button = event.target.closest('[data-command]');
    if (!button || button.disabled) return;
    command = button.dataset.command;
    updateGuide();
  }
  menu?.addEventListener('pointerover', showGuide);
  menu?.addEventListener('focusin', showGuide);
  const isPlainClick = event => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  root?.querySelector('[data-title-article]')?.addEventListener('click', event => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    onArticle(event.currentTarget.href);
  });
  root?.querySelector('[data-title-archive]')?.addEventListener('click', event => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    onArchive();
  });
  return {
    sync(hasContinue, language) {
      currentLanguage = language;
      const observatory = document.querySelector('[data-title-observatory]');
      if (observatory) observatory.textContent = language === 'EN-US' ? 'Enter the observatory' : language === 'JA-JP' ? '海の展望室へ' : '进入观海室';
      updateGuide();
      if (!root) return;
      root.hidden = hasContinue;
      root.setAttribute('aria-label', copy().latest);
      root.querySelector('[data-title-latest]').textContent = copy().latest;
      root.querySelector('[data-title-all]').textContent = copy().all;
      const minutes = root.querySelector('[data-title-minute]');
      minutes.textContent = copy().time(minutes.dataset.minutes);
    },
  };
}
