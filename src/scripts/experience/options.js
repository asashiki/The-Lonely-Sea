import { all, required } from "./dom.js";
import {
  defaultPreferences,
  normalizePreferences,
  publishPreferences,
  readPreferences,
} from "./preferences.js";
import { initSoundLaboratory } from "./sound-laboratory.js";
import {
  isDocumentFullscreen,
  onDocumentFullscreenChange,
  toggleDocumentFullscreen,
} from "./fullscreen.js";
import { readExperienceState, writeExperienceState } from "./state.js";

const KEYBOARD_CURSOR_STORAGE_KEY = "lonely-sea-load-keyboard-cursor";
const DEFAULT_CATEGORY = "system";
const DEFAULT_PANEL = "language";
const EXPERIENCE_VALUES = Object.freeze({
  scene: Object.freeze(["mist", "day", "night", "crimson"]),
  weather: Object.freeze(["clear", "snow", "rain"]),
});

const OPTION_COPY = Object.freeze({
  "EN-US": Object.freeze({
    系统: "System", 博客: "Blog", 游戏: "Game", 语言与显示: "Language & display",
    操作与无障碍: "Controls & accessibility", 声音: "Sound", 音效试听: "Sound preview",
    本机数据: "Local data", 阅读: "Reading", 场景与天气: "Scene & weather",
    页面行为: "Page behavior", 文字: "Text", 角色语音: "Character voice",
    显示语言: "Display language", 全屏显示: "Fullscreen", 进入全屏: "Enter fullscreen",
    退出全屏: "Exit fullscreen", 海潮指针: "Tide cursor", 减少动态效果: "Reduce motion",
    恢复默认设置: "Reset preferences", 恢复默认: "Reset", 清除本浏览器数据: "Clear browser data",
    清除全部: "Clear all", 对话文字大小: "Dialogue text size", 文字推进速度: "Text speed",
    全部静音: "Mute all", 站点背景音乐: "Site BGM", 站点音乐音量: "Site BGM volume",
    界面音效: "Interface sounds", 游戏背景音乐: "Game BGM", 游戏音乐音量: "Game BGM volume",
    爱丽丝: "Alice", 推进时停止语音: "Stop voice on advance", 段落间距: "Paragraph spacing",
    正文行距: "Line spacing", 自动阅读速度: "Auto-read speed", 记录阅读位置: "Remember position",
    主题随现实时间: "Follow local time", 背景时段: "Scene", 天气: "Weather",
    系统页天气: "Weather on system pages", 天气位置: "Weather layer", 天气密度: "Weather density",
    标题画面暗角: "Title vignette", 手机自动横屏: "Landscape on phones",
    系统页面转场: "System transitions", 文章转场: "Article transitions", 开场演出: "Opening sequence",
    站外链接: "External links", 开场演出预览: "Opening preview", 重播开场: "Replay opening",
    开: "ON", 关: "OFF", 小: "LOW", 大: "HIGH", 慢: "SLOW", 快: "FAST", 紧: "TIGHT",
    松: "LOOSE", 少: "LOW", 多: "HIGH", 舒展: "Relaxed", 紧凑: "Compact",
    灰霭: "Mist", 晴昼: "Day", 暗夜: "Night", 赤夜: "Crimson", 无: "Clear", 雪: "Snow",
    雨: "Rain", 界面后: "Behind UI", 界面前: "Above UI", 每次会话: "Once per session",
    每次进入: "Every visit", 新标签页: "New tab", 当前页面: "Current page",
    音效试听台: "Sound preview", 恢复初始方案: "Reset sound set", 停止尾音: "Stop preview",
    当前采用: "Current set", 搜索: "Search", 设置即时保存: "Changes save instantly",
    再次选择以确认: "Select again to confirm", 再次选择以清除: "Select again to clear",
    "正在清除…": "Clearing…", 已恢复默认: "Defaults restored", 已即时保存: "Saved",
    已保存: "Saved", 浏览器未允许全屏: "Fullscreen was not allowed", 场景已切换: "Scene changed",
    "同步用于 Blog 与游戏": "Shared by the Blog and game",
    "切换整个 Blog 与游戏宿主的全屏状态": "Toggle fullscreen for the Blog and game host",
    用于标题与系统页面: "Used on the title and system pages",
    减少页面转场与游戏演出: "Reduce page transitions and game effects",
    保留文章进度与游戏存档: "Keep reading progress and game saves",
    "删除设置、阅读进度、存档与离线缓存": "Delete preferences, reading progress, saves, and offline cache",
    同时用于游戏对话与文章正文: "Used for game dialogue and article text",
    调整游戏文字显示与自动推进速度: "Adjust game text and auto-advance speed",
    关闭Blog与游戏的所有音轨: "Mute all Blog and game audio",
    "控制标题、文章与鉴赏室的背景音乐": "Control title, article, and EXTRA music",
    "调整标题、文章与鉴赏室的音乐音量": "Adjust title, article, and EXTRA music volume",
    "调整确认、返回与推进音效": "Adjust confirm, back, and advance sounds",
    只控制游戏自己的背景音乐: "Control only the game's own BGM",
    "调整游戏内 BGM 音量，不影响站点音乐": "Adjust game BGM without changing site music",
    调整爱丽丝的游戏语音音量: "Adjust Alice's in-game voice volume",
    "关闭时，语音会播放到结束或下一句语音开始": "When off, voice continues until it ends or another voice begins",
    调整Markdown正文的段落留白: "Adjust paragraph spacing in Markdown articles",
    只影响文章正文行距: "Affect only article line spacing",
    调整文章AUTO的自动滚动速度: "Adjust AUTO scrolling speed for articles",
    供CONTINUE恢复文章阅读位置: "Allow CONTINUE to restore the article position",
    "开启时，每次新会话按现实时间每 8 小时轮换主题；手动选择只影响当前会话": "Change the theme every 8 hours in each new session; manual changes affect only the current session",
    切换标题与系统页面的背景时段: "Change the title and system-page scene",
    切换标题与系统页面天气: "Change title and system-page weather",
    "LOAD、EXTRA 与 OPTION 使用当前雨雪效果": "Use the current rain or snow in LOAD, EXTRA, and OPTION",
    选择雨雪位于系统文字下方或上方: "Place weather behind or above system-page text",
    调整雨雪粒子的数量: "Adjust rain and snow density",
    只影响标题画面的暗角: "Affect only the title vignette",
    "手机打开标题与系统页时自动横屏。文章页保持竖屏阅读": "Use landscape for title and system pages on phones; keep articles in portrait",
    "用于标题、LOAD、EXTRA 与 OPTION": "Used for TITLE, LOAD, EXTRA, and OPTION",
    用于LOAD与文章页面之间: "Used between LOAD and article pages",
    设置标题开场演出的播放时机: "Choose when the title opening plays",
    选择站外链接的打开方式: "Choose how external links open",
    返回标题并立即重播开场: "Return to TITLE and replay the opening",
    正在删除本浏览器中的站点数据: "Deleting this site's browser data",
  }),
  "JA-JP": Object.freeze({
    系统: "システム", 博客: "ブログ", 游戏: "ゲーム", 语言与显示: "言語・表示",
    操作与无障碍: "操作・アクセシビリティ", 声音: "サウンド", 音效试听: "効果音試聴",
    本机数据: "端末データ", 阅读: "読書", 场景与天气: "シーン・天候",
    页面行为: "ページ動作", 文字: "テキスト", 角色语音: "キャラクターボイス",
    显示语言: "表示言語", 全屏显示: "フルスクリーン", 进入全屏: "フルスクリーンにする",
    退出全屏: "フルスクリーンを終了", 海潮指针: "潮のカーソル", 减少动态效果: "動きを減らす",
    恢复默认设置: "設定を初期化", 恢复默认: "初期化", 清除本浏览器数据: "ブラウザデータを消去",
    清除全部: "すべて消去", 对话文字大小: "会話文字サイズ", 文字推进速度: "テキスト速度",
    全部静音: "すべてミュート", 站点背景音乐: "サイト BGM", 站点音乐音量: "サイト BGM 音量",
    界面音效: "UI 効果音", 游戏背景音乐: "ゲーム BGM", 游戏音乐音量: "ゲーム BGM 音量",
    爱丽丝: "アリス", 推进时停止语音: "次へ進む時に音声停止", 段落间距: "段落間隔",
    正文行距: "本文行間", 自动阅读速度: "自動読書速度", 记录阅读位置: "読書位置を保存",
    主题随现实时间: "現実時間に連動", 背景时段: "背景時間", 天气: "天候",
    系统页天气: "システム画面の天候", 天气位置: "天候レイヤー", 天气密度: "天候密度",
    标题画面暗角: "タイトル画面の周辺減光", 手机自动横屏: "スマホを自動横表示",
    系统页面转场: "システム画面転換", 文章转场: "記事画面転換", 开场演出: "オープニング演出",
    站外链接: "外部リンク", 开场演出预览: "オープニング確認", 重播开场: "もう一度再生",
    开: "ON", 关: "OFF", 小: "小", 大: "大", 慢: "遅", 快: "速", 紧: "狭",
    松: "広", 少: "少", 多: "多", 舒展: "ゆったり", 紧凑: "コンパクト",
    灰霭: "霧", 晴昼: "晴昼", 暗夜: "暗夜", 赤夜: "赤夜", 无: "なし", 雪: "雪",
    雨: "雨", 界面后: "UI の後ろ", 界面前: "UI の前", 每次会话: "セッションごと",
    每次进入: "毎回", 新标签页: "新しいタブ", 当前页面: "現在のページ",
    音效试听台: "効果音試聴", 恢复初始方案: "初期セットに戻す", 停止尾音: "試聴停止",
    当前采用: "使用中", 搜索: "検索", 设置即时保存: "設定は自動保存されます",
    再次选择以确认: "もう一度選んで確定", 再次选择以清除: "もう一度選んで消去",
    "正在清除…": "消去中…", 已恢复默认: "初期設定に戻しました", 已即时保存: "保存しました",
    已保存: "保存しました", 浏览器未允许全屏: "フルスクリーンが許可されませんでした", 场景已切换: "シーンを変更しました",
    "同步用于 Blog 与游戏": "Blog とゲームで共有します",
    "切换整个 Blog 与游戏宿主的全屏状态": "Blog とゲーム画面のフルスクリーンを切り替えます",
    用于标题与系统页面: "タイトル・システム画面で使用します",
    减少页面转场与游戏演出: "画面転換とゲーム演出を減らします",
    保留文章进度与游戏存档: "読書進捗とゲームセーブは残します",
    "删除设置、阅读进度、存档与离线缓存": "設定・読書進捗・セーブ・オフラインキャッシュを消去します",
    同时用于游戏对话与文章正文: "ゲーム会話と記事本文に使用します",
    调整游戏文字显示与自动推进速度: "ゲーム文字と自動送りの速度を調整します",
    关闭Blog与游戏的所有音轨: "Blog とゲームの全音声をミュートします",
    "控制标题、文章与鉴赏室的背景音乐": "タイトル・記事・EXTRA の BGM を切り替えます",
    "调整标题、文章与鉴赏室的音乐音量": "タイトル・記事・EXTRA の BGM 音量を調整します",
    "调整确认、返回与推进音效": "決定・戻る・送りの効果音を調整します",
    只控制游戏自己的背景音乐: "ゲーム固有の BGM だけを切り替えます",
    "调整游戏内 BGM 音量，不影响站点音乐": "サイト音楽に影響せずゲーム BGM を調整します",
    调整爱丽丝的游戏语音音量: "アリスのゲーム音声音量を調整します",
    "关闭时，语音会播放到结束或下一句语音开始": "OFF の場合、音声は終了または次の音声まで続きます",
    调整Markdown正文的段落留白: "Markdown 記事の段落間隔を調整します",
    只影响文章正文行距: "記事本文の行間だけに反映します",
    调整文章AUTO的自动滚动速度: "記事 AUTO のスクロール速度を調整します",
    供CONTINUE恢复文章阅读位置: "CONTINUE で記事の位置を復元します",
    "开启时，每次新会话按现实时间每 8 小时轮换主题；手动选择只影响当前会话": "新しいセッションでは現実時間に合わせて 8 時間ごとにテーマを切り替えます",
    切换标题与系统页面的背景时段: "タイトル・システム画面の背景時間を切り替えます",
    切换标题与系统页面天气: "タイトル・システム画面の天候を切り替えます",
    "LOAD、EXTRA 与 OPTION 使用当前雨雪效果": "LOAD・EXTRA・OPTION に現在の雨雪を表示します",
    选择雨雪位于系统文字下方或上方: "天候をシステム文字の後ろまたは前に置きます",
    调整雨雪粒子的数量: "雨雪の粒子数を調整します",
    只影响标题画面的暗角: "タイトル画面の周辺減光だけに反映します",
    "手机打开标题与系统页时自动横屏。文章页保持竖屏阅读": "スマホではタイトル・システム画面を横表示、記事は縦表示にします",
    "用于标题、LOAD、EXTRA 与 OPTION": "TITLE・LOAD・EXTRA・OPTION に使用します",
    用于LOAD与文章页面之间: "LOAD と記事画面の間で使用します",
    设置标题开场演出的播放时机: "タイトル演出を再生するタイミングを選びます",
    选择站外链接的打开方式: "外部リンクの開き方を選びます",
    返回标题并立即重播开场: "TITLE に戻り、オープニングを再生します",
    正在删除本浏览器中的站点数据: "このサイトのブラウザデータを消去しています",
  }),
});

function translatedOptionCopy(source, language) {
  return OPTION_COPY[language]?.[source] || source;
}

async function clearBrowserSiteData() {
  // Stop live audio/controllers before clearing storage. Otherwise their
  // pagehide handlers can write the just-deleted listening session back.
  window.dispatchEvent(new CustomEvent("lonely-sea:before-site-data-clear"));
  // WebGAL keeps IndexedDB connections open while its iframe is alive. Close
  // the same-origin game document first; otherwise deleteDatabase is blocked
  // and a "clear all" followed by reload can resurrect native engine saves.
  const gameFrames = [...document.querySelectorAll("iframe[data-game-frame]")];
  await Promise.all(gameFrames.map((frame) => new Promise((resolve) => {
    const finish = () => resolve(undefined);
    frame.addEventListener("load", finish, { once: true });
    frame.src = "about:blank";
    window.setTimeout(finish, 1_000);
  })));
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {}
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations || []).map((registration) => registration.unregister()));
  } catch {}
  try {
    if (typeof indexedDB?.databases === "function") {
      const databases = await indexedDB.databases();
      await Promise.all(databases.flatMap((database) => {
        if (!database.name) return [];
        return [new Promise((resolve) => {
          const request = indexedDB.deleteDatabase(database.name);
          const finish = () => resolve(undefined);
          request.addEventListener("success", finish, { once: true });
          request.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, 2_500);
        })];
      }));
    }
  } catch {}
  try {
    const directory = await navigator.storage?.getDirectory?.();
    if (directory) {
      for await (const name of directory.keys()) {
        await directory.removeEntry(name, { recursive: true });
      }
    }
  } catch {}
  try {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (name) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    });
  } catch {}
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
}

export function initOptions({ onReplayOpening = () => {}, onResetExperience = () => {} } = {}) {
  const optionScreen = required(".option-screen");
  const optionCanvas = required(".option-canvas", optionScreen);
  const primaryButtons = all("[data-option-primary]", optionScreen);
  const secondaryGroups = all("[data-option-secondary-group]", optionScreen);
  const secondaryButtons = all("[data-option-secondary]", optionScreen);
  const panels = all("[data-option-panel]", optionScreen);
  const settingRows = all(".option-setting[data-setting-key]", optionScreen);
  const experienceRows = all(".option-setting[data-experience-key]", optionScreen);
  const stateLabel = required("[data-option-state]", optionScreen);
  const resetButton = required("#reset-options", optionScreen);
  const clearButton = required("#clear-browser-data", optionScreen);
  const replayButton = required("#option-replay-opening", optionScreen);
  const fullscreenButton = required("#option-toggle-fullscreen", optionScreen);
  const systemReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let preferences = readPreferences();
  let experience = readExperienceState();
  let activeCategory = DEFAULT_CATEGORY;
  let activePanel = DEFAULT_PANEL;
  let transitionToken = 0;
  let resetTimer = 0;
  let clearTimer = 0;
  let stateTimer = 0;
  let soundLaboratory = null;

  const translatableNodes = all([
    ".option-primary button > span",
    ".option-secondary button",
    ".option-panel-intro h3",
    ".option-setting-copy strong",
    ".option-choice-group button",
    ".option-range > span",
    ".option-command",
  ].join(","), optionScreen);
  translatableNodes.forEach((node) => {
    node.dataset.optionCopySource = node.textContent?.trim() || "";
  });

  function optionCopy(source) {
    return translatedOptionCopy(source, preferences.language);
  }

  function applyOptionLanguage() {
    optionCanvas.dataset.optionLanguage = preferences.language;
    translatableNodes.forEach((node) => {
      node.textContent = optionCopy(node.dataset.optionCopySource || "");
    });
    settingRows.forEach(hydratePreferenceRow);
    syncFullscreen();
    soundLaboratory?.syncLanguage?.();
  }

  function reducedMotion() {
    return systemReduceMotion.matches || preferences.reducedMotion;
  }

  function primaryButton(id) {
    return primaryButtons.find((button) => button.dataset.optionPrimary === id);
  }

  function secondaryButton(owner, id) {
    return secondaryButtons.find((button) => (
      button.dataset.optionCategoryOwner === owner && button.dataset.optionSecondary === id
    ));
  }

  function firstSecondary(owner) {
    return secondaryButtons.find((button) => button.dataset.optionCategoryOwner === owner);
  }

  function panel(owner, id) {
    return panels.find((item) => (
      item.dataset.optionPanelOwner === owner && item.dataset.optionPanel === id
    ));
  }

  function cancelPanelAnimations() {
    panels.forEach((item) => item.getAnimations().forEach((animation) => animation.cancel()));
  }

  function interruptPanelTransition() {
    transitionToken += 1;
    cancelPanelAnimations();
  }

  function rangeProgress(input) {
    const minimum = Number(input.min || 0);
    const maximum = Number(input.max || 100);
    const progress = (Number(input.value) - minimum) / Math.max(1, maximum - minimum);
    input.style.setProperty("--option-range-progress", `${progress * 100}%`);
  }

  function formatValue(row, value) {
    const input = row.querySelector("[data-setting-range]");
    if (["autoSpeed", "readingAutoSpeed"].includes(row.dataset.settingKey)) return `${Math.round(Number(value) * 10)}%`;
    if (input) return `${value}${input.hasAttribute("data-suffix") ? input.dataset.suffix : "%"}`;
    if (typeof value === "boolean") return optionCopy(value ? "开" : "关");
    return String(value);
  }

  function hydratePreferenceRow(row) {
    const key = row.dataset.settingKey;
    const value = preferences[key];
    if (value === undefined) return;

    const range = row.querySelector("[data-setting-range]");
    if (range) {
      range.value = String(value);
      rangeProgress(range);
    }

    const toggle = row.querySelector("[data-setting-toggle]");
    if (toggle) toggle.setAttribute("aria-pressed", String(Boolean(value)));

    all("[data-setting-value]", row).forEach((button) => {
      const selected = button.dataset.settingValue === String(value);
      if (button.getAttribute("role") === "radio") button.setAttribute("aria-checked", String(selected));
      else button.setAttribute("aria-pressed", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });

    const output = row.querySelector("output");
    if (output) output.textContent = formatValue(row, value);
  }

  function hydrateExperienceRow(row) {
    const key = row.dataset.experienceKey;
    const value = experience[key];
    all("[data-setting-value]", row).forEach((button) => {
      const selected = button.dataset.settingValue === value;
      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }

  function rowHint(row) {
    const hint = row.dataset.hint || row.querySelector(".option-setting-copy span")?.textContent?.trim() || "";
    const compact = hint.replaceAll(" ", "");
    const translated = translatedOptionCopy(compact, preferences.language);
    return translated === compact ? translatedOptionCopy(hint, preferences.language) : translated;
  }

  function setHint(text) {
    if (optionCanvas.dataset.optionSync === "active") return;
    stateLabel.textContent = text || "";
  }

  function showSynced(message = "已保存") {
    window.clearTimeout(stateTimer);
    optionCanvas.dataset.optionSync = "active";
    stateLabel.textContent = optionCopy(message);
    stateTimer = window.setTimeout(() => {
      optionCanvas.dataset.optionSync = "idle";
      stateLabel.textContent = "";
    }, 900);
  }

  function publishPreference(key, value, message = "已即时保存") {
    preferences = publishPreferences(normalizePreferences({ ...preferences, [key]: value }));
    if (key === "language") applyOptionLanguage();
    settingRows.filter((row) => row.dataset.settingKey === key).forEach(hydratePreferenceRow);
    if (key === "keyboardCursor") {
      try { localStorage.setItem(KEYBOARD_CURSOR_STORAGE_KEY, String(preferences.keyboardCursor)); } catch {}
      window.dispatchEvent(new CustomEvent("lonely-sea:keyboard-cursor-change", {
        detail: { enabled: preferences.keyboardCursor },
      }));
    }
    showSynced(message);
  }

  function publishExperienceValue(key, value) {
    if (!EXPERIENCE_VALUES[key]?.includes(value)) return;
    experience = writeExperienceState({ ...experience, [key]: value });
    experienceRows.filter((row) => row.dataset.experienceKey === key).forEach(hydrateExperienceRow);
    showSynced("场景已切换");
  }

  function selectPanel(owner, id, { focus = false } = {}) {
    const nextButton = secondaryButton(owner, id);
    const nextPanel = panel(owner, id);
    if (!nextButton || !nextPanel) return;

    activeCategory = owner;
    activePanel = id;
    optionCanvas.dataset.optionCategory = owner;
    optionCanvas.dataset.optionSubcategory = id;

    secondaryButtons.forEach((button) => {
      const selected = button === nextButton;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((item) => {
      const selected = item === nextPanel;
      item.hidden = !selected;
      item.classList.toggle("is-active", selected);
    });
    soundLaboratory?.setActive(owner === "system" && id === "sound-lab");
    if (focus) nextButton.focus({ preventScroll: true });
  }

  function selectCategory(id, { focus = false, panelId = "" } = {}) {
    const nextButton = primaryButton(id);
    if (!nextButton) return;
    activeCategory = id;
    optionCanvas.dataset.optionCategory = id;

    primaryButtons.forEach((button) => {
      const selected = button === nextButton;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    secondaryGroups.forEach((group) => {
      group.hidden = group.dataset.optionSecondaryGroup !== id;
    });

    const target = panelId ? secondaryButton(id, panelId) : firstSecondary(id);
    selectPanel(id, target?.dataset.optionSecondary || "");
    if (focus) nextButton.focus({ preventScroll: true });
  }

  async function transitionToCategory(id, { focus = false, animate = true } = {}) {
    const token = ++transitionToken;
    cancelPanelAnimations();
    if (!id || id === activeCategory || !animate || reducedMotion()) {
      selectCategory(id || activeCategory, { focus });
      return;
    }
    const current = panel(activeCategory, activePanel);
    if (current) {
      const exit = current.animate(
        [{ opacity: 1, transform: "translate3d(0,0,0)" }, { opacity: 0, transform: "translate3d(-8px,0,0)" }],
        { duration: 90, easing: "cubic-bezier(.25,1,.5,1)", fill: "both" },
      );
      try { await exit.finished; } catch {}
      exit.cancel();
    }
    if (token !== transitionToken) return;
    selectCategory(id, { focus });
    panel(activeCategory, activePanel)?.animate(
      [{ opacity: 0, transform: "translate3d(8px,0,0)" }, { opacity: 1, transform: "translate3d(0,0,0)" }],
      { duration: 180, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }

  function moveIn(items, current, direction) {
    const index = Math.max(0, items.indexOf(current));
    return items[(index + direction + items.length) % items.length];
  }

  function bindChoiceKeys(buttons, activate) {
    buttons.forEach((button) => {
      button.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "Home") next = buttons[0];
        if (event.key === "End") next = buttons.at(-1);
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = moveIn(buttons, button, -1);
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = moveIn(buttons, button, 1);
        if (!next) return;
        event.preventDefault();
        event.stopPropagation();
        next.focus({ preventScroll: true });
        activate(next);
      });
    });
  }

  soundLaboratory = initSoundLaboratory({ optionScreen });

  primaryButtons.forEach((button) => {
    button.addEventListener("click", (event) => transitionToCategory(button.dataset.optionPrimary, {
      animate: event.detail !== 0,
    }));
  });
  bindChoiceKeys(primaryButtons, (button) => transitionToCategory(button.dataset.optionPrimary, {
    focus: true,
    animate: false,
  }));

  secondaryGroups.forEach((group) => {
    const buttons = all("[data-option-secondary]", group);
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        interruptPanelTransition();
        selectPanel(button.dataset.optionCategoryOwner, button.dataset.optionSecondary);
      });
    });
    bindChoiceKeys(buttons, (button) => {
      interruptPanelTransition();
      selectPanel(button.dataset.optionCategoryOwner, button.dataset.optionSecondary, { focus: true });
    });
  });

  function bindHint(row) {
    const show = () => setHint(rowHint(row));
    const hide = () => setHint("");
    row.addEventListener("pointerenter", show);
    row.addEventListener("focusin", show);
    row.addEventListener("pointerleave", hide);
    row.addEventListener("focusout", hide);
  }

  settingRows.forEach((row) => {
    bindHint(row);
    const key = row.dataset.settingKey;
    const range = row.querySelector("[data-setting-range]");
    range?.addEventListener("input", () => publishPreference(key, Number(range.value)));

    const toggle = row.querySelector("[data-setting-toggle]");
    toggle?.addEventListener("click", () => {
      publishPreference(key, toggle.getAttribute("aria-pressed") !== "true");
    });
    toggle?.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      publishPreference(key, event.key === "ArrowRight");
    });

    const choices = all("[data-setting-value]", row);
    choices.forEach((button) => {
      button.addEventListener("click", () => publishPreference(key, button.dataset.settingValue));
    });
    bindChoiceKeys(choices, (button) => publishPreference(key, button.dataset.settingValue));
  });

  all(".option-command-setting", optionScreen).forEach(bindHint);

  experienceRows.forEach((row) => {
    bindHint(row);
    const key = row.dataset.experienceKey;
    const choices = all("[data-setting-value]", row);
    choices.forEach((button) => {
      button.addEventListener("click", () => publishExperienceValue(key, button.dataset.settingValue));
    });
    bindChoiceKeys(choices, (button) => publishExperienceValue(key, button.dataset.settingValue));
  });

  resetButton.addEventListener("click", () => {
    if (resetButton.dataset.confirm !== "true") {
      resetButton.dataset.confirm = "true";
      resetButton.textContent = optionCopy("再次选择以确认");
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        resetButton.dataset.confirm = "false";
        resetButton.textContent = optionCopy("恢复默认");
      }, 3_000);
      return;
    }
    window.clearTimeout(resetTimer);
    resetButton.dataset.confirm = "false";
    resetButton.textContent = optionCopy("恢复默认");
    preferences = publishPreferences({ ...defaultPreferences });
    applyOptionLanguage();
    try { localStorage.setItem(KEYBOARD_CURSOR_STORAGE_KEY, String(preferences.keyboardCursor)); } catch {}
    window.dispatchEvent(new CustomEvent("lonely-sea:keyboard-cursor-change", {
      detail: { enabled: preferences.keyboardCursor },
    }));
    onResetExperience();
    soundLaboratory?.reset();
    experience = readExperienceState();
    settingRows.forEach(hydratePreferenceRow);
    experienceRows.forEach(hydrateExperienceRow);
    showSynced("已恢复默认");
  });

  clearButton.addEventListener("click", async () => {
    if (clearButton.dataset.confirm !== "true") {
      clearButton.dataset.confirm = "true";
      clearButton.textContent = optionCopy("再次选择以清除");
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        clearButton.dataset.confirm = "false";
        clearButton.textContent = optionCopy("清除全部");
      }, 4_000);
      return;
    }
    window.clearTimeout(clearTimer);
    clearButton.disabled = true;
    clearButton.textContent = optionCopy("正在清除…");
    stateLabel.textContent = "正在删除本浏览器中的站点数据";
    await clearBrowserSiteData();
    window.location.replace("/?freshReset=1");
  });

  replayButton.addEventListener("click", onReplayOpening);

  function syncFullscreen() {
    const active = isDocumentFullscreen();
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.textContent = optionCopy(active ? "退出全屏" : "进入全屏");
  }

  fullscreenButton.addEventListener("click", async () => {
    try {
      await toggleDocumentFullscreen();
    } catch {
      showSynced("浏览器未允许全屏");
    }
  });
  onDocumentFullscreenChange(syncFullscreen);

  function activate(target = {}) {
    interruptPanelTransition();
    preferences = readPreferences();
    experience = readExperienceState();
    applyOptionLanguage();
    settingRows.forEach(hydratePreferenceRow);
    experienceRows.forEach(hydrateExperienceRow);
    const category = primaryButton(target.category) ? target.category : DEFAULT_CATEGORY;
    const panelId = secondaryButton(category, target.panel) ? target.panel : "";
    selectCategory(category, { panelId: panelId || undefined });
    syncFullscreen();
    optionCanvas.dataset.optionSync = "idle";
    stateLabel.textContent = "";
  }

  activate();

  return {
    activate,
    changePage(direction) {
      const current = Math.max(0, primaryButtons.findIndex((button) => button.dataset.optionPrimary === activeCategory));
      const next = Math.max(0, Math.min(current + direction, primaryButtons.length - 1));
      transitionToCategory(primaryButtons[next]?.dataset.optionPrimary, { focus: true, animate: false });
    },
    deactivate() {
      interruptPanelTransition();
      soundLaboratory?.setActive(false);
      window.clearTimeout(resetTimer);
      window.clearTimeout(clearTimer);
      window.clearTimeout(stateTimer);
      resetButton.dataset.confirm = "false";
      resetButton.textContent = optionCopy("恢复默认");
      clearButton.dataset.confirm = "false";
      clearButton.disabled = false;
      clearButton.textContent = optionCopy("清除全部");
    },
  };
}
