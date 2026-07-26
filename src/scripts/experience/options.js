import { all, required } from "./dom.js";

const KEYBOARD_CURSOR_STORAGE_KEY = "lonely-sea-load-keyboard-cursor";

export function initOptions({ onReplayOpening, onResetExperience }) {
  const optionTabs = all("[data-option-tab]");
  const optionPanels = all("[data-option-panel]");
  const optionHeading = required("#option-heading");
  const optionPage = required("#option-page");
  const optionHelp = required("#option-help");

  function showSettingHelp(row) {
    if (row?.dataset.help) optionHelp.textContent = row.dataset.help;
  }

  function activeIndex() {
    return Math.max(0, optionTabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"));
  }

  function activate(button) {
    const index = optionTabs.indexOf(button);
    optionTabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
    optionPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.optionPanel === button.dataset.optionTab));
    optionHeading.textContent = `${button.dataset.optionTab.toUpperCase()} / DESCRIPTION`;
    optionPage.textContent = `PAGE ${String(index + 1).padStart(2, "0")} / ${String(optionTabs.length).padStart(2, "0")}`;
    showSettingHelp(optionPanels[index]?.querySelector(".setting-row"));
  }

  function changePage(direction) {
    const next = Math.max(0, Math.min(activeIndex() + direction, optionTabs.length - 1));
    activate(optionTabs[next]);
    optionTabs[next].focus({ preventScroll: true });
  }

  optionTabs.forEach((button) => button.addEventListener("click", () => activate(button)));

  all(".setting-row").forEach((row) => {
    row.addEventListener("pointerenter", () => showSettingHelp(row));
    row.addEventListener("focusin", () => showSettingHelp(row));
  });

  all("[data-setting-range]").forEach((input) => {
    input.addEventListener("input", () => {
      const suffix = input.dataset.suffix || "%";
      required("output", input.closest(".setting-row")).textContent = `${input.value}${suffix}`;
    });
  });

  all(".setting-toggle").forEach((button) => {
    const output = required("output", button.closest(".setting-row"));
    button.dataset.defaultPressed = button.getAttribute("aria-pressed");
    button.dataset.defaultOutput = output.textContent;
    button.addEventListener("click", () => {
      const pressed = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(pressed));
      output.textContent = pressed ? "ON" : "OFF";
    });
  });

  const keyboardCursorToggle = required("[data-kb-cursor-toggle]");
  const keyboardCursorOutput = required("output", keyboardCursorToggle.closest(".setting-row"));
  let keyboardCursorEnabled = true;
  try {
    keyboardCursorEnabled = localStorage.getItem(KEYBOARD_CURSOR_STORAGE_KEY) !== "false";
  } catch {}
  keyboardCursorToggle.setAttribute("aria-pressed", String(keyboardCursorEnabled));
  keyboardCursorOutput.textContent = keyboardCursorEnabled ? "ON" : "OFF";
  keyboardCursorToggle.addEventListener("click", () => {
    const enabled = keyboardCursorToggle.getAttribute("aria-pressed") === "true";
    try {
      localStorage.setItem(KEYBOARD_CURSOR_STORAGE_KEY, String(enabled));
    } catch {}
    window.dispatchEvent(new CustomEvent("lonely-sea:keyboard-cursor-change", {
      detail: { enabled },
    }));
  });

  all("[data-setting-segment-group]").forEach((group) => {
    const buttons = all(".setting-segment", group);
    const output = required("output", group.closest(".setting-row"));
    buttons.forEach((button) => {
      button.dataset.defaultPressed = button.getAttribute("aria-pressed");
      button.addEventListener("click", () => {
        buttons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
        const values = { 中文: "ZH-CN", 日本語: "JA-JP", EN: "EN-US", "NEW TAB": "NEW" };
        output.textContent = values[button.textContent.trim()] || button.textContent.trim();
      });
    });
    output.dataset.defaultValue = output.textContent;
  });

  required("#apply-options").addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.textContent = "SAVED";
    window.setTimeout(() => { button.textContent = "APPLY"; }, 900);
  });

  required("#reset-options").addEventListener("click", () => {
    all("[data-setting-range]").forEach((input) => {
      input.value = input.defaultValue;
      input.dispatchEvent(new Event("input"));
    });
    all(".setting-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.defaultPressed);
      required("output", button.closest(".setting-row")).textContent = button.dataset.defaultOutput;
    });
    all("[data-setting-segment-group]").forEach((group) => {
      all(".setting-segment", group).forEach((button) => {
        button.setAttribute("aria-pressed", button.dataset.defaultPressed);
      });
      required("output", group.closest(".setting-row")).textContent = required("output", group.closest(".setting-row")).dataset.defaultValue;
    });
    try {
      localStorage.setItem(KEYBOARD_CURSOR_STORAGE_KEY, "true");
    } catch {}
    window.dispatchEvent(new CustomEvent("lonely-sea:keyboard-cursor-change", {
      detail: { enabled: true },
    }));
    onResetExperience();
  });

  required("#option-replay-opening").addEventListener("click", onReplayOpening);
  activate(optionTabs[0]);

  return {
    changePage,
  };
}
