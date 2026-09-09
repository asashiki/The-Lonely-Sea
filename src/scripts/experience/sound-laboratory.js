import { all, required } from "./dom.js";
import { getSoundPreset, SOUND_CATEGORIES, SOUND_CUE_LABELS, SOUND_PRESETS } from "./sound-design.js";
import { readPreferences } from "./preferences.js";

const AUDIO_CONTROLLER_KEY = "__lonelySeaAudioController";

const SOUND_LAB_COPY = Object.freeze({
  "EN-US": {
    reset: "RESET SOUND SET", stop: "STOP PREVIEW", current: "CURRENT SET",
    currentHint: "Applied to Blog controls immediately", search: "SEARCH",
    searchPlaceholder: "Piano, scroll, long tail…", idle: "Choose a specimen to preview",
    idleDetail: "Site BGM is lowered while previewing", unavailable: "No audible sound",
    unavailableDetail: "Disable mute and raise interface sound volume first",
    stopped: "Preview stopped", compare: "Choose another specimen to compare",
    restored: "Default sound set restored", restoredDetail: "All actions now use the recommended sounds",
    sounds: "sounds", candidates: "candidates", using: "IN USE", use: "USE",
    selected: "Selected", nextAction: "The next action will use this sound",
    specimenCount: "real-time specimens", instruction: "Preview with the round button; USE replaces that action's sound.",
    forCue: "FOR", preview: "Preview",
  },
  "JA-JP": {
    reset: "初期セットに戻す", stop: "試聴を停止", current: "使用中のセット",
    currentHint: "Blog の操作音へすぐ反映します", search: "検索",
    searchPlaceholder: "ピアノ、巻物、長い余韻…", idle: "試聴する標本を選んでください",
    idleDetail: "試聴中はサイト BGM を小さくします", unavailable: "再生できる音がありません",
    unavailableDetail: "ミュートを解除し、UI 効果音の音量を上げてください",
    stopped: "試聴を停止しました", compare: "ほかの標本も比較できます",
    restored: "初期音セットに戻しました", restoredDetail: "すべての操作音を推奨設定に戻しました",
    sounds: "音色", candidates: "候補", using: "使用中", use: "選ぶ",
    selected: "選択済み", nextAction: "次の操作からこの音色を使用します",
    specimenCount: "種のリアルタイム音色", instruction: "丸い再生ボタンで試聴し、「選ぶ」で操作音を変更します。",
    forCue: "用途", preview: "試聴",
  },
});

const SOUND_CUE_COPY = Object.freeze({
  "EN-US": { hover: "Hover", select: "Focus", press: "Press", confirm: "Confirm", start: "Start", back: "Back", close: "Close", open: "Open", page: "Page", toggleOn: "Switch on", toggleOff: "Switch off", tick: "Slider", success: "Success", achievement: "Achievement", error: "Error" },
  "JA-JP": { hover: "ホバー", select: "フォーカス", press: "押下", confirm: "決定", start: "開始", back: "戻る", close: "閉じる", open: "開く", page: "ページ", toggleOn: "ON", toggleOff: "OFF", tick: "スライダー", success: "完了", achievement: "実績", error: "エラー" },
});

function cssColor(element, variable, fallback) {
  const value = getComputedStyle(element).getPropertyValue(variable).trim();
  return value && !value.startsWith("var(") ? value : fallback;
}

export function initSoundLaboratory({ optionScreen } = {}) {
  const root = required("[data-sound-lab]", optionScreen || document);
  const canvas = required("[data-sound-canvas]", root);
  const context = canvas.getContext("2d");
  const cards = all("[data-sound-card]", root);
  const filterButtons = all("[data-sound-filter]", root);
  const slotButtons = all("[data-sound-slot]", root);
  const search = required("[data-sound-search]", root);
  const resultLabel = required("[data-sound-result]", root);
  const nowTitle = required("[data-sound-now]", root);
  const nowDetail = required("[data-sound-now-detail]", root);
  const nowIndex = required("[data-sound-index]", root);
  const timeLabel = required("[data-sound-time]", root);
  const stopButton = required("[data-sound-stop]", root);
  const resetButton = required("[data-sound-reset]", root);
  const previewButtons = all("[data-sound-preview]", root);
  const selectButtons = all("[data-sound-select]", root);
  const controller = window[AUDIO_CONTROLLER_KEY];
  const meter = new Uint8Array(128);

  let active = false;
  let activeFilter = "all";
  let activeCue = "";
  let activePreset = null;
  let startedAt = 0;
  let endingAt = 0;
  let frame = 0;
  let searchFrame = 0;

  function language() {
    return readPreferences().language;
  }

  function copy(key, fallback) {
    return SOUND_LAB_COPY[language()]?.[key] || fallback;
  }

  function cueCopy(cue) {
    return SOUND_CUE_COPY[language()]?.[cue] || SOUND_CUE_LABELS[cue] || cue;
  }

  function soundTitle(sound) {
    return language() === "ZH-CN" ? sound?.title : (sound?.latin || sound?.title);
  }

  function applyLanguage() {
    const locale = language();
    root.dataset.soundLabLanguage = locale;
    root.querySelector("[data-sound-reset]").textContent = copy("reset", "恢复初始方案");
    root.querySelector("[data-sound-stop]").lastChild.textContent = copy("stop", "停止尾音");
    root.querySelector(".sound-lab-heading p").textContent = locale === "ZH-CN"
      ? `SOUND SPECIMEN ARCHIVE · ${SOUND_PRESETS.length} 种实时音色`
      : `SOUND SPECIMEN ARCHIVE · ${SOUND_PRESETS.length} ${copy("specimenCount", "种实时音色")}`;
    root.querySelector(".sound-lab-palette header strong").textContent = copy("current", "当前采用");
    root.querySelector(".sound-lab-palette header span").textContent = copy("currentHint", "选择后立即用于 Blog 界面");
    root.querySelector(".sound-lab-search > span").textContent = copy("search", "搜索");
    search.placeholder = copy("searchPlaceholder", "钢琴、卷轴、长尾…");
    root.querySelector(".sound-lab-result > small").textContent = copy("instruction", "点击圆形播放键试听；“选用”会替换对应动作的声音。");
    filterButtons.forEach((button) => {
      const category = SOUND_CATEGORIES.find((item) => item.id === button.dataset.soundFilter);
      const label = button.querySelector("span");
      if (label && category) label.textContent = locale === "ZH-CN" ? category.label : category.latin;
    });
    slotButtons.forEach((button) => {
      const label = button.querySelector("small");
      if (label) label.textContent = cueCopy(button.dataset.soundSlot);
    });
    cards.forEach((card) => {
      const sound = getSoundPreset(card.dataset.soundCard);
      const title = card.querySelector("h4");
      if (title) title.textContent = soundTitle(sound);
      const preview = card.querySelector("[data-sound-preview]");
      if (preview) preview.setAttribute("aria-label", `${copy("preview", "试听")} ${soundTitle(sound) || "SOUND"}`);
      const target = card.querySelector(".sound-card-select small");
      if (target) {
        const cue = cueCopy(card.dataset.soundCue);
        target.textContent = locale === "ZH-CN" ? `用于 ${cue}` : `${copy("forCue", "用于")} ${cue}`;
      }
    });
    renderSelection();
    applyFilters();
  }

  function selection() {
    return controller?.getSoundSelection?.() || {};
  }

  function renderSelection(nextSelection = selection()) {
    slotButtons.forEach((button) => {
      const id = nextSelection[button.dataset.soundSlot];
      const sound = getSoundPreset(id);
      const title = button.querySelector("[data-sound-slot-title]");
      if (title) title.textContent = soundTitle(sound) || (language() === "ZH-CN" ? "未选择" : "—");
      button.dataset.soundId = sound?.id || "";
    });
    selectButtons.forEach((button) => {
      const selected = nextSelection[button.dataset.soundTarget] === button.dataset.soundSelect;
      button.setAttribute("aria-pressed", String(selected));
      const label = button.querySelector("[data-sound-select-label]");
      if (label) label.textContent = selected ? copy("using", "正在使用") : copy("use", "选用");
      button.closest("[data-sound-card]")?.setAttribute("data-selected", String(selected));
    });
  }

  function setPlayingCard(id = "") {
    previewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.soundPreview === id)));
    cards.forEach((card) => card.dataset.playing = String(card.dataset.soundCard === id));
  }

  function showIdle(message = copy("idle", "选择任意标本试听"), detail = copy("idleDetail", "试听期间会暂时收起背景音乐")) {
    activePreset = null;
    startedAt = 0;
    endingAt = 0;
    nowIndex.textContent = "—";
    nowTitle.textContent = message;
    nowDetail.textContent = detail;
    timeLabel.textContent = "00.00";
    stopButton.disabled = true;
    setPlayingCard();
  }

  function audition(id) {
    const sound = getSoundPreset(id);
    if (!sound || !controller) return;
    const played = controller.playSoundPreset?.(sound.id);
    if (!played) {
      showIdle(copy("unavailable", "当前没有可听见的声音"), copy("unavailableDetail", "请先在「声音」中关闭全部静音，并提高界面音效音量"));
      return;
    }
    activePreset = sound;
    startedAt = performance.now();
    endingAt = startedAt + sound.duration * 1000;
    nowIndex.textContent = String(SOUND_PRESETS.indexOf(sound) + 1).padStart(2, "0");
    nowTitle.textContent = soundTitle(sound);
    nowDetail.textContent = language() === "ZH-CN"
      ? `${SOUND_CUE_LABELS[sound.cue]}候选 · ${sound.description}`
      : `${cueCopy(sound.cue)} · ${copy("candidates", "候选")}`;
    stopButton.disabled = false;
    setPlayingCard(sound.id);
    ensureDrawing();
  }

  function stopPreview(message = copy("stopped", "尾音已停止")) {
    controller?.stopSoundPreview?.();
    showIdle(message, copy("compare", "可以继续选择其他标本进行对比"));
  }

  function resetSelection({ announce = true } = {}) {
    const next = controller?.resetSoundSelection?.();
    if (!next) return false;
    renderSelection(next);
    if (announce) {
      nowTitle.textContent = copy("restored", "已恢复初始音效方案");
      nowDetail.textContent = copy("restoredDetail", "所有动作音效都已回到试听台的推荐选择");
    }
    return true;
  }

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase("zh-CN");
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatch = activeFilter === "all" || card.dataset.soundCategory === activeFilter;
      const cueMatch = !activeCue || card.dataset.soundCue === activeCue;
      const searchMatch = !query || card.dataset.soundSearchText.includes(query);
      card.hidden = !(categoryMatch && cueMatch && searchMatch);
      if (!card.hidden) visible += 1;
    });
    const activeCueCopy = activeCue ? ` · ${cueCopy(activeCue)} ${copy("candidates", "候选")}` : "";
    resultLabel.textContent = `${visible} ${copy("sounds", "个音色")}${activeCueCopy}`;
  }

  function chooseCategory(id) {
    activeFilter = id;
    activeCue = "";
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.soundFilter === id)));
    slotButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
    applyFilters();
  }

  function chooseCue(cue) {
    activeCue = activeCue === cue ? "" : cue;
    activeFilter = "all";
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.soundFilter === "all")));
    slotButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.soundSlot === activeCue)));
    applyFilters();
  }

  function resizeCanvas() {
    if (!context) return { width: 0, height: 0, ratio: 1 };
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { width, height, ratio };
  }

  function waveformSeed(id = "lonely-sea") {
    let value = 2166136261;
    for (let index = 0; index < id.length; index += 1) value = Math.imul(value ^ id.charCodeAt(index), 16777619);
    return Math.abs(value) || 1;
  }

  function drawScope(now = performance.now()) {
    if (!context || !active) return;
    const { width, height, ratio } = resizeCanvas();
    const accent = cssColor(root, "--v4-accent", "#bdefff");
    const ink = cssColor(root, "--v4-ink", "#e9f4f6");
    context.clearRect(0, 0, width, height);

    context.save();
    context.globalAlpha = .12;
    context.strokeStyle = ink;
    context.lineWidth = ratio;
    for (let row = 1; row < 4; row += 1) {
      const y = Math.round((height * row) / 4) + .5;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    for (let column = 1; column < 12; column += 1) {
      const x = Math.round((width * column) / 12) + .5;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    context.restore();

    const hasMeter = controller?.getSoundMeter?.(meter) === true;
    const playing = activePreset && now < endingAt;
    const progress = playing ? Math.min(1, (now - startedAt) / Math.max(1, endingAt - startedAt)) : 1;
    const envelope = playing ? Math.pow(1 - progress, activePreset.duration > 4 ? .42 : .72) : .025;
    const seed = waveformSeed(activePreset?.id);
    const center = height * .52;
    context.beginPath();
    for (let index = 0; index <= 128; index += 1) {
      const x = (index / 128) * width;
      const meterValue = hasMeter ? meter[Math.min(meter.length - 1, index)] / 255 : 0;
      const harmonic = Math.sin(index * .39 + now * .004 + seed % 17) * .42
        + Math.sin(index * .83 - now * .0026 + seed % 31) * .23
        + Math.sin(index * .13 + seed % 11) * .18;
      const amplitude = playing ? Math.max(meterValue * .86, Math.abs(harmonic) * envelope * .46) : .012;
      const y = center + harmonic * amplitude * height * .72;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = accent;
    context.globalAlpha = playing ? .9 : .34;
    context.lineWidth = Math.max(1, ratio * 1.25);
    context.shadowColor = accent;
    context.shadowBlur = playing ? 12 * ratio : 4 * ratio;
    context.stroke();
    context.shadowBlur = 0;

    if (playing) {
      const elapsed = Math.max(0, (now - startedAt) / 1000);
      timeLabel.textContent = elapsed.toFixed(2).padStart(5, "0");
    } else if (activePreset) {
      showIdle("试听结束", `${activePreset.title} · 可选用或继续比较其他标本`);
    }
    frame = requestAnimationFrame(drawScope);
  }

  function ensureDrawing() {
    if (!active || frame) return;
    frame = requestAnimationFrame((time) => {
      frame = 0;
      drawScope(time);
    });
  }

  previewButtons.forEach((button) => button.addEventListener("click", () => audition(button.dataset.soundPreview)));
  selectButtons.forEach((button) => button.addEventListener("click", () => {
    const next = controller?.selectSoundPreset?.(button.dataset.soundTarget, button.dataset.soundSelect);
    if (!next) return;
    renderSelection(next);
    const sound = getSoundPreset(button.dataset.soundSelect);
    nowTitle.textContent = `${copy("selected", "已选用")}「${soundTitle(sound) || "SOUND"}」`;
    nowDetail.textContent = language() === "ZH-CN"
      ? `下一次${SOUND_CUE_LABELS[button.dataset.soundTarget]}动作将立即使用这个音色`
      : `${cueCopy(button.dataset.soundTarget)} · ${copy("nextAction", "下一次动作将使用这个音色")}`;
  }));
  filterButtons.forEach((button) => button.addEventListener("click", () => chooseCategory(button.dataset.soundFilter)));
  slotButtons.forEach((button) => button.addEventListener("click", () => chooseCue(button.dataset.soundSlot)));
  stopButton.addEventListener("click", () => stopPreview());
  resetButton.addEventListener("click", () => resetSelection());
  search.addEventListener("input", () => {
    cancelAnimationFrame(searchFrame);
    searchFrame = requestAnimationFrame(applyFilters);
  });
  window.addEventListener("lonely-sea:sound-selection-change", (event) => renderSelection(event.detail?.selection));

  renderSelection();
  applyFilters();
  showIdle();
  applyLanguage();

  return {
    reset() {
      resetSelection({ announce: false });
    },
    syncLanguage() {
      applyLanguage();
      showIdle();
    },
    setActive(nextActive) {
      const next = Boolean(nextActive);
      if (active === next) return;
      active = next;
      window.dispatchEvent(new CustomEvent("lonely-sea:listen-hold", { detail: { active } }));
      if (active) {
        renderSelection();
        ensureDrawing();
      } else {
        controller?.stopSoundPreview?.();
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        showIdle();
      }
    },
  };
}
