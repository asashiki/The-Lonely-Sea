import { all, required } from "./dom.js";
import {
  applyPreferences,
  defaultPreferences,
  normalizePreferences,
  readPreferences,
  writePreferences,
} from "./preferences.js";

const KEYBOARD_CURSOR_STORAGE_KEY = "lonely-sea-load-keyboard-cursor";

export function initOptions({ onReplayOpening, onResetExperience }) {
  const optionScreen = required(".option-screen");
  const optionCanvas = required(".option-canvas", optionScreen);
  const optionTabs = all("[data-option-tab]", optionScreen);
  const optionPanels = all("[data-option-panel]", optionScreen);
  const settingRows = all(".setting-row", optionScreen);
  const optionHeading = required("#option-heading", optionScreen);
  const optionPage = required("#option-page", optionScreen);
  const optionHelp = required("#option-help", optionScreen);
  const optionGuideNumber = required("#option-guide-number", optionScreen);
  const optionState = required("[data-option-state]", optionScreen);
  const applyButton = required("#apply-options", optionScreen);
  const applyLabel = required("span", applyButton);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let savedPreferences = readPreferences();
  let draftPreferences = { ...savedPreferences };
  let activeTab = optionTabs[0]?.dataset.optionTab || "display";
  let transition = null;
  let transitionToken = 0;

  function formatValue(row, value) {
    const range = row.querySelector("[data-setting-range]");
    if (range) return `${value}${range.dataset.suffix || "%"}`;
    if (typeof value === "boolean") return value ? "ON" : "OFF";
    return String(value);
  }

  function setRangeProgress(input) {
    const minimum = Number(input.min || 0);
    const maximum = Number(input.max || 100);
    const progress = (Number(input.value) - minimum) / Math.max(1, maximum - minimum);
    input.closest(".setting-range")?.style.setProperty("--setting-progress", `${progress * 100}%`);
  }

  function hydrateRow(row) {
    const key = row.dataset.settingKey;
    if (!key) return;
    const value = draftPreferences[key];
    const output = required("output", row);
    const range = row.querySelector("[data-setting-range]");
    const toggle = row.querySelector("[data-setting-toggle]");
    const choice = row.querySelector("[data-setting-choice]");

    if (range) {
      range.value = String(value);
      setRangeProgress(range);
    }
    if (toggle) toggle.setAttribute("aria-pressed", String(Boolean(value)));
    if (choice) {
      all("[data-setting-value]", choice).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.settingValue === String(value)));
      });
    }
    output.textContent = formatValue(row, value);
  }

  function updateDirtyState(label) {
    const dirty = JSON.stringify(normalizePreferences(draftPreferences))
      !== JSON.stringify(normalizePreferences(savedPreferences));
    optionCanvas.dataset.optionDirty = String(dirty);
    optionState.textContent = label || (dirty ? "CHANGED" : "SAVED");
  }

  function showSettingHelp(row) {
    if (row?.dataset.help) optionHelp.textContent = row.dataset.help;
  }

  function currentTabIndex() {
    return Math.max(0, optionTabs.findIndex((tab) => tab.dataset.optionTab === activeTab));
  }

  function commitTab(button) {
    activeTab = button.dataset.optionTab;
    const index = optionTabs.indexOf(button);
    optionTabs.forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab === button));
      tab.tabIndex = tab === button ? 0 : -1;
    });
    optionPanels.forEach((panel) => {
      const visible = panel.dataset.optionPanel === activeTab;
      panel.classList.toggle("is-active", visible);
      panel.hidden = !visible;
    });
    optionHeading.textContent = activeTab.toUpperCase();
    optionGuideNumber.textContent = String(index + 1).padStart(2, "0");
    optionPage.textContent = String(index + 1).padStart(2, "0");
    showSettingHelp(optionPanels[index]?.querySelector(".setting-row"));
  }

  async function activate(button, { animate = true } = {}) {
    if (!button || button.dataset.optionTab === activeTab) return;
    const current = optionPanels.find((panel) => panel.dataset.optionPanel === activeTab);
    const next = optionPanels.find((panel) => panel.dataset.optionPanel === button.dataset.optionTab);
    const token = ++transitionToken;
    transition?.cancel();

    if (!animate || reduceMotion.matches || document.documentElement.dataset.motion === "reduced") {
      commitTab(button);
      return;
    }

    transition = current.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: "translate3d(0,-10px,0)" },
      ],
      { duration: 110, easing: "ease-out", fill: "both" },
    );

    try {
      await transition.finished;
    } catch {
      return;
    }
    if (token !== transitionToken) return;

    commitTab(button);
    transition = next.animate(
      [
        { opacity: 0, transform: "translate3d(0,10px,0)" },
        { opacity: 1, transform: "translate3d(0,0,0)" },
      ],
      { duration: 240, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
    );

    try {
      await transition.finished;
    } catch {}
    if (token === transitionToken) {
      transition?.cancel();
      transition = null;
    }
  }

  function changePage(direction) {
    const next = Math.max(0, Math.min(currentTabIndex() + direction, optionTabs.length - 1));
    activate(optionTabs[next], { animate: false });
    optionTabs[next].focus({ preventScroll: true });
  }

  function updateDraft(row, value) {
    const key = row.dataset.settingKey;
    if (!key) return;
    draftPreferences = normalizePreferences({ ...draftPreferences, [key]: value });
    hydrateRow(row);
    updateDirtyState();
  }

  optionTabs.forEach((button) => {
    button.addEventListener("click", (event) => activate(button, { animate: event.detail > 0 }));
  });

  settingRows.forEach((row) => {
    row.addEventListener("pointerenter", () => showSettingHelp(row));
    row.addEventListener("focusin", () => showSettingHelp(row));

    const range = row.querySelector("[data-setting-range]");
    range?.addEventListener("input", () => updateDraft(row, Number(range.value)));

    const toggle = row.querySelector("[data-setting-toggle]");
    toggle?.addEventListener("click", () => {
      updateDraft(row, toggle.getAttribute("aria-pressed") !== "true");
    });

    all("[data-setting-value]", row).forEach((button) => {
      button.addEventListener("click", () => updateDraft(row, button.dataset.settingValue));
    });
  });

  function publishPreferences(label = "SAVED") {
    savedPreferences = writePreferences(draftPreferences);
    draftPreferences = { ...savedPreferences };
    applyPreferences(savedPreferences);
    try {
      localStorage.setItem(KEYBOARD_CURSOR_STORAGE_KEY, String(savedPreferences.keyboardCursor));
    } catch {}
    window.dispatchEvent(new CustomEvent("lonely-sea:keyboard-cursor-change", {
      detail: { enabled: savedPreferences.keyboardCursor },
    }));
    window.dispatchEvent(new CustomEvent("lonely-sea:preferences-change", {
      detail: { preferences: savedPreferences },
    }));
    updateDirtyState(label);
  }

  applyButton.addEventListener("click", () => {
    publishPreferences();
    applyLabel.textContent = "SAVED";
    window.setTimeout(() => {
      applyLabel.textContent = "APPLY";
      updateDirtyState();
    }, 900);
  });

  required("#reset-options", optionScreen).addEventListener("click", () => {
    draftPreferences = { ...defaultPreferences };
    settingRows.forEach(hydrateRow);
    publishPreferences("DEFAULT");
    onResetExperience();
  });

  required("#option-replay-opening", optionScreen).addEventListener("click", onReplayOpening);

  settingRows.forEach(hydrateRow);
  commitTab(optionTabs[0]);
  updateDirtyState();

  return {
    changePage,
    deactivate() {
      transitionToken += 1;
      transition?.cancel();
      transition = null;
    },
  };
}
