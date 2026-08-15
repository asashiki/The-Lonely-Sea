import { all, required } from "./dom.js";
import {
  defaultPreferences,
  normalizePreferences,
  publishPreferences,
  readPreferences,
} from "./preferences.js";

const KEYBOARD_CURSOR_STORAGE_KEY = "lonely-sea-load-keyboard-cursor";
const EXPERIENCE_STORAGE_KEY = "lonely-sea-experience-v1";
const EXPERIENCE_CHANGE_EVENT = "lonely-sea:experience-preference-change";
const DEFAULT_CATEGORY = "system";
const DEFAULT_PANEL = "language";
const EXPERIENCE_VALUES = Object.freeze({
  scene: ["mist", "day", "night", "crimson"],
  weather: ["clear", "snow", "rain"],
});
const CATEGORY_LABELS = Object.freeze({ system: "系统设定", game: "游戏设定", blog: "博客设定" });

async function clearBrowserSiteData() {
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

function readExperience() {
  let source = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(EXPERIENCE_STORAGE_KEY) || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) source = parsed;
  } catch {}
  return {
    scene: EXPERIENCE_VALUES.scene.includes(source.scene) ? source.scene : "mist",
    weather: EXPERIENCE_VALUES.weather.includes(source.weather) ? source.weather : "snow",
  };
}

function writeExperience(next) {
  const normalized = {
    scene: EXPERIENCE_VALUES.scene.includes(next.scene) ? next.scene : "mist",
    weather: EXPERIENCE_VALUES.weather.includes(next.weather) ? next.weather : "snow",
  };
  try { localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(normalized)); } catch {}
  window.dispatchEvent(new CustomEvent(EXPERIENCE_CHANGE_EVENT, { detail: normalized }));
  return normalized;
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
  const contextLabel = required("[data-option-context]", optionScreen);
  const resetButton = required("#reset-options", optionScreen);
  const clearButton = required("#clear-browser-data", optionScreen);
  const replayButton = required("#option-replay-opening", optionScreen);
  const fullscreenButton = required("#option-toggle-fullscreen", optionScreen);
  const systemReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let preferences = readPreferences();
  let experience = readExperience();
  let activeCategory = DEFAULT_CATEGORY;
  let activePanel = DEFAULT_PANEL;
  let transitionToken = 0;
  let resetTimer = 0;
  let clearTimer = 0;
  let stateTimer = 0;

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
    if (row.dataset.settingKey === "autoSpeed") return `第 ${value} 档`;
    if (input) return `${value}${input.hasAttribute("data-suffix") ? input.dataset.suffix : "%"}`;
    if (typeof value === "boolean") return value ? "开" : "关";
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

  function showSynced(message = "已即时保存") {
    window.clearTimeout(stateTimer);
    optionCanvas.dataset.optionSync = "active";
    stateLabel.textContent = message;
    stateTimer = window.setTimeout(() => {
      optionCanvas.dataset.optionSync = "idle";
      stateLabel.textContent = "设置即时保存";
    }, 900);
  }

  function publishPreference(key, value, message = "已即时保存") {
    preferences = publishPreferences(normalizePreferences({ ...preferences, [key]: value }));
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
    experience = writeExperience({ ...experience, [key]: value });
    experienceRows.filter((row) => row.dataset.experienceKey === key).forEach(hydrateExperienceRow);
    showSynced("海景已切换");
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
    if (focus) nextButton.focus({ preventScroll: true });
  }

  function selectCategory(id, { focus = false, panelId = "" } = {}) {
    const nextButton = primaryButton(id);
    if (!nextButton) return;
    activeCategory = id;
    optionCanvas.dataset.optionCategory = id;
    contextLabel.textContent = CATEGORY_LABELS[id] || "设置";

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

  settingRows.forEach((row) => {
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

  experienceRows.forEach((row) => {
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
      resetButton.textContent = "再次选择以确认";
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        resetButton.dataset.confirm = "false";
        resetButton.textContent = "恢复默认";
      }, 3_000);
      return;
    }
    window.clearTimeout(resetTimer);
    resetButton.dataset.confirm = "false";
    resetButton.textContent = "恢复默认";
    preferences = publishPreferences({ ...defaultPreferences });
    try { localStorage.setItem(KEYBOARD_CURSOR_STORAGE_KEY, String(preferences.keyboardCursor)); } catch {}
    window.dispatchEvent(new CustomEvent("lonely-sea:keyboard-cursor-change", {
      detail: { enabled: preferences.keyboardCursor },
    }));
    onResetExperience();
    experience = readExperience();
    settingRows.forEach(hydratePreferenceRow);
    experienceRows.forEach(hydrateExperienceRow);
    showSynced("已恢复默认");
  });

  clearButton.addEventListener("click", async () => {
    if (clearButton.dataset.confirm !== "true") {
      clearButton.dataset.confirm = "true";
      clearButton.textContent = "再次选择以清除";
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        clearButton.dataset.confirm = "false";
        clearButton.textContent = "清除全部";
      }, 4_000);
      return;
    }
    window.clearTimeout(clearTimer);
    clearButton.disabled = true;
    clearButton.textContent = "正在清除…";
    stateLabel.textContent = "正在删除本浏览器中的站点数据";
    await clearBrowserSiteData();
    window.location.replace("/?freshReset=1");
  });

  replayButton.addEventListener("click", onReplayOpening);

  function syncFullscreen() {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.textContent = active ? "退出全屏" : "进入全屏";
  }

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      showSynced("浏览器未允许全屏");
    }
  });
  document.addEventListener("fullscreenchange", syncFullscreen);

  function activate() {
    interruptPanelTransition();
    preferences = readPreferences();
    experience = readExperience();
    settingRows.forEach(hydratePreferenceRow);
    experienceRows.forEach(hydrateExperienceRow);
    selectCategory(DEFAULT_CATEGORY, { panelId: DEFAULT_PANEL });
    syncFullscreen();
    optionCanvas.dataset.optionSync = "idle";
    stateLabel.textContent = "设置即时保存";
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
      window.clearTimeout(resetTimer);
      window.clearTimeout(clearTimer);
      window.clearTimeout(stateTimer);
      resetButton.dataset.confirm = "false";
      resetButton.textContent = "恢复默认";
      clearButton.dataset.confirm = "false";
      clearButton.disabled = false;
      clearButton.textContent = "清除全部";
    },
  };
}
