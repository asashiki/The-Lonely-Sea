import { all, required } from "./dom.js";
import { getSoundPreset, SOUND_CUE_LABELS, SOUND_PRESETS } from "./sound-design.js";

const AUDIO_CONTROLLER_KEY = "__lonelySeaAudioController";

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

  function selection() {
    return controller?.getSoundSelection?.() || {};
  }

  function renderSelection(nextSelection = selection()) {
    slotButtons.forEach((button) => {
      const id = nextSelection[button.dataset.soundSlot];
      const sound = getSoundPreset(id);
      const title = button.querySelector("[data-sound-slot-title]");
      if (title) title.textContent = sound?.title || "未选择";
      button.dataset.soundId = sound?.id || "";
    });
    selectButtons.forEach((button) => {
      const selected = nextSelection[button.dataset.soundTarget] === button.dataset.soundSelect;
      button.setAttribute("aria-pressed", String(selected));
      const label = button.querySelector("[data-sound-select-label]");
      if (label) label.textContent = selected ? "正在使用" : "选用";
      button.closest("[data-sound-card]")?.setAttribute("data-selected", String(selected));
    });
  }

  function setPlayingCard(id = "") {
    previewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.soundPreview === id)));
    cards.forEach((card) => card.dataset.playing = String(card.dataset.soundCard === id));
  }

  function showIdle(message = "选择任意标本试听", detail = "试听期间会暂时收起背景音乐") {
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
      showIdle("当前没有可听见的声音", "请先在「声音」中关闭全部静音，并提高界面音效音量");
      return;
    }
    activePreset = sound;
    startedAt = performance.now();
    endingAt = startedAt + sound.duration * 1000;
    nowIndex.textContent = String(SOUND_PRESETS.indexOf(sound) + 1).padStart(2, "0");
    nowTitle.textContent = sound.title;
    nowDetail.textContent = `${SOUND_CUE_LABELS[sound.cue]}候选 · ${sound.description}`;
    stopButton.disabled = false;
    setPlayingCard(sound.id);
    ensureDrawing();
  }

  function stopPreview(message = "尾音已停止") {
    controller?.stopSoundPreview?.();
    showIdle(message, "可以继续选择其他标本进行对比");
  }

  function resetSelection({ announce = true } = {}) {
    const next = controller?.resetSoundSelection?.();
    if (!next) return false;
    renderSelection(next);
    if (announce) {
      nowTitle.textContent = "已恢复初始音效方案";
      nowDetail.textContent = "所有动作音效都已回到试听台的推荐选择";
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
    const cueCopy = activeCue ? ` · ${SOUND_CUE_LABELS[activeCue]}候选` : "";
    resultLabel.textContent = `${visible} 个音色${cueCopy}`;
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
    nowTitle.textContent = `已选用「${sound?.title || "音效"}」`;
    nowDetail.textContent = `下一次${SOUND_CUE_LABELS[button.dataset.soundTarget]}动作将立即使用这个音色`;
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

  return {
    reset() {
      resetSelection({ announce: false });
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
