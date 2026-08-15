import { sceneArt, sceneLabels, sceneNames, weatherLabels } from "./experience/config.js";
import { all, required, updatePressed } from "./experience/dom.js";
import { initExitDialog } from "./experience/exit.js";
import { initExtraScreen } from "./experience/extra.js";
import { initLoadTracksXiiiConcept } from "./experience/load-tracks-xiii.js";
import { initOptions } from "./experience/options.js";
import { initStartScreen } from "./experience/start.js";
import { createWeatherController } from "./experience/weather.js";
import {
  PREFERENCES_STORAGE_KEY,
  applyPreferences,
  publishPreferences,
  readPreferences,
} from "./experience/preferences.js";
import { initExperienceAudio } from "./experience/audio.js";
import {
  createGalBlogLaunchIntent,
  createGalBlogLaunchUrl,
  createSaveLaunchUrl,
} from "../lib/gal-blog/launch-session";
import { getGalBlogSave, listGalBlogSaves } from "../lib/gal-blog/save-store";
import { resolveContinueTarget } from "../lib/experience-continue";
import { recordBlogActivity } from "../lib/blog-activity";
import { initAchievementSystem } from "../lib/experience-achievements";

const EXPERIENCE_STORAGE_KEY = "lonely-sea-experience-v1";
const OPENING_STORAGE_KEY = "lonely-sea-opening-seen";
const ROUTES = new Set(["start", "load", "extra", "option"]);

const freshResetBoot = (() => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("freshReset") !== "1") return false;
  url.searchParams.delete("freshReset");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
})();

const body = document.body;
const stage = required(".stage");
const titleMenu = required(".title-menu");
const fxPanel = required("#fx-panel");
const showFx = required("#show-fx");
const status = required("#menu-status");
const opening = required("#opening");
const routeCurtain = required("#route-curtain");
const openingSteps = all("[data-opening-step]");
const screens = all("[data-screen]");
const systemReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let preferences = applyPreferences(readPreferences());
const experienceAudio = initExperienceAudio();
initAchievementSystem();
const bgmButton = required("#toggle-bgm");
const continueButton = required('[data-command="CONTINUE"]');
const languageGate = required("[data-first-language-gate]");
const languageButtons = all("[data-first-language]", languageGate);
const startCommand = required('[data-command="START"]');
let continueTarget = null;
const reduceMotion = {
  get matches() {
    return systemReduceMotion.matches || preferences.reducedMotion;
  },
  addEventListener(...args) {
    systemReduceMotion.addEventListener(...args);
  },
};

const routeQuery = new URLSearchParams(window.location.search);
let requestedRoute = routeQuery.get("screen");
if (!ROUTES.has(requestedRoute)) requestedRoute = null;
const requestedLoadPage = ["articles", "game", "diary"].includes(routeQuery.get("loadPage"))
  ? routeQuery.get("loadPage")
  : "game";
const requestedGameFilter = ["save", "flow", "story"].includes(routeQuery.get("loadFilter"))
  ? routeQuery.get("loadFilter")
  : "save";
let routeBusy = false;
let openingTimers = [];

function beginExternalNavigation(url, label = "NOW LOADING") {
  if (routeBusy) return false;
  routeBusy = true;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  active?.setAttribute("aria-busy", "true");
  routeCurtain.querySelector("strong").textContent = label;
  routeCurtain.classList.add("is-covering");
  routeCurtain.setAttribute("aria-hidden", "false");
  body.dataset.gameLaunchPending = "true";
  stage.inert = true;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.location.assign(url)));
  return true;
}

function hasStoredPreferences() {
  try { return localStorage.getItem(PREFERENCES_STORAGE_KEY) !== null; } catch { return false; }
}

function closeLanguageGate({ focusStart = true } = {}) {
  languageGate.hidden = true;
  languageGate.setAttribute("aria-hidden", "true");
  stage.inert = false;
  if (focusStart) startCommand.focus({ preventScroll: true });
}

function openLanguageGate() {
  languageGate.hidden = false;
  languageGate.setAttribute("aria-hidden", "false");
  stage.inert = true;
  languageButtons[0]?.focus({ preventScroll: true });
}

function launchFirstChapter() {
  try {
    const intent = createGalBlogLaunchIntent({
      gameSlug: "lonely-sea-chapter-one",
      target: { kind: "start", id: "start" },
    });
    beginExternalNavigation(createGalBlogLaunchUrl(intent), "CONNECTING STORY");
  } catch {
    refreshStatus("GAME LAUNCH UNAVAILABLE");
  }
}

languageButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    preferences = publishPreferences({ ...readPreferences(), language: button.dataset.firstLanguage });
    closeLanguageGate({ focusStart: false });
    launchFirstChapter();
  });
  button.addEventListener("keydown", (event) => {
    const direction = ["ArrowUp", "ArrowLeft"].includes(event.key)
      ? -1
      : ["ArrowDown", "ArrowRight"].includes(event.key)
        ? 1
        : 0;
    if (!direction) return;
    event.preventDefault();
    languageButtons[(index + direction + languageButtons.length) % languageButtons.length]
      ?.focus({ preventScroll: true });
  });
});

function readExperience() {
  try {
    const parsed = JSON.parse(localStorage.getItem(EXPERIENCE_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const savedExperience = readExperience();
if (sceneLabels[savedExperience.scene]) body.dataset.scene = savedExperience.scene;
if (weatherLabels[savedExperience.weather]) body.dataset.weather = savedExperience.weather;

function persistExperience() {
  try {
    localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify({
      scene: body.dataset.scene,
      weather: weather.value,
    }));
  } catch {}
}

function refreshStatus(message = "") {
  status.textContent = message || `${sceneLabels[body.dataset.scene]} / ${weatherLabels[weather.value]}`;
}

const weather = createWeatherController({
  body,
  reduceMotion,
  initialDensity: preferences.particleDensity / 100,
  onChange(value) {
    updatePressed("[data-weather-option]", value, "weatherOption");
    refreshStatus();
    persistExperience();
  },
});

function updateSceneLabels() {
  all("[data-scene-label]").forEach((node) => {
    node.textContent = sceneNames[body.dataset.scene] || sceneNames.mist;
  });
}

function setScene(scene) {
  if (!sceneLabels[scene] || scene === body.dataset.scene) return;
  body.dataset.scene = scene;
  updatePressed("[data-scene-option]", scene, "sceneOption");
  updateSceneLabels();
  refreshStatus();
  persistExperience();
  recordBlogActivity("scenes", scene);
}

function setWeather(nextWeather) {
  if (!weatherLabels[nextWeather]) return;
  weather.set(nextWeather);
}

function setRoute(route) {
  if (route !== "start") startScreen.deactivate();
  if (route !== "load") loadScreen.deactivate();
  if (route !== "extra") extraScreen.deactivate();
  if (route !== "option") optionScreen.deactivate();
  body.dataset.route = route;
  experienceAudio.setTitleActive(route === "title" && opening.classList.contains("is-dismissed"));
  titleMenu.inert = route !== "title";
  fxPanel.inert = route !== "title";
  screens.forEach((screen) => {
    screen.setAttribute("aria-hidden", String(screen.dataset.screen !== route));
  });
  if (route === "load") loadScreen.activate();
  if (route === "extra") extraScreen.activate?.();
  if (route === "option") optionScreen.activate();
  if (route === "title") weather.start();
  else weather.stop();
}

function navigateTo(route, { instant = false } = {}) {
  if (!routeBusy && route === body.dataset.route) return;
  routeBusy = true;
  const useTransition = !instant && !reduceMotion.matches && preferences.sceneCrossfade;
  if (!useTransition) body.classList.add("is-route-instant");
  setRoute(route);
  if (!useTransition) window.requestAnimationFrame(() => body.classList.remove("is-route-instant"));
  routeBusy = false;
  if (route !== "title") {
    const routeScreen = required(`[data-screen="${route}"]`);
    const visibleBack = all("[data-back]", routeScreen).find(
      (button) => !button.closest('[aria-hidden="true"]'),
    );
    (visibleBack || required("[data-back]", routeScreen)).focus({ preventScroll: true });
  }
}

function clearOpeningTimers() {
  openingTimers.forEach((timer) => window.clearTimeout(timer));
  openingTimers = [];
}

function showOpeningStep(index) {
  openingSteps.forEach((step) => {
    step.classList.toggle("is-active", Number(step.dataset.openingStep) === index);
  });
}

function rememberOpening() {
  try { sessionStorage.setItem(OPENING_STORAGE_KEY, "1"); } catch {}
}

function hasSeenOpening() {
  if (preferences.openingBehaviour === "ALWAYS") return false;
  try { return sessionStorage.getItem(OPENING_STORAGE_KEY) === "1"; } catch { return false; }
}

function dismissOpening({ remember = true, instant = false } = {}) {
  clearOpeningTimers();
  if (instant) opening.style.transition = "none";
  opening.classList.add("is-dismissed");
  opening.setAttribute("aria-hidden", "true");
  stage.inert = false;
  experienceAudio.setTitleActive(true);
  if (remember) rememberOpening();
  if (requestedRoute) {
    const route = requestedRoute;
    requestedRoute = null;
    navigateTo(route, { instant: true });
  }
  if (instant) window.requestAnimationFrame(() => opening.style.removeProperty("transition"));
}

function playOpening() {
  clearOpeningTimers();
  experienceAudio.setTitleActive(false);
  opening.classList.remove("is-dismissed");
  opening.setAttribute("aria-hidden", "false");
  stage.inert = true;
  showOpeningStep(0);
  openingTimers.push(
    window.setTimeout(() => showOpeningStep(1), reduceMotion.matches ? 350 : 2100),
    window.setTimeout(() => showOpeningStep(2), reduceMotion.matches ? 700 : 4400),
    window.setTimeout(() => dismissOpening(), reduceMotion.matches ? 1100 : 7200),
  );
}

function replayOpeningFromTitle() {
  if (body.dataset.route !== "title") navigateTo("title");
  playOpening();
}

function resetExperience() {
  try { localStorage.removeItem(EXPERIENCE_STORAGE_KEY); } catch {}
  setScene("mist");
  setWeather("snow");
}

function syncBgmButton(event) {
  const enabled = event?.detail?.enabled ?? experienceAudio.isBgmEnabled();
  bgmButton.setAttribute("aria-pressed", String(enabled));
  bgmButton.setAttribute("aria-label", enabled ? "关闭背景音乐" : "开启背景音乐");
  bgmButton.textContent = enabled ? "ON" : "OFF";
}

const loadScreen = initLoadTracksXiiiConcept({
  reduceMotion,
  initialPage: requestedLoadPage,
  initialGameFilter: requestedGameFilter,
});
const extraScreen = initExtraScreen();
const startScreen = initStartScreen({ reduceMotion });
const optionScreen = initOptions({
  onReplayOpening: replayOpeningFromTitle,
  onResetExperience: resetExperience,
});
const exitDialog = initExitDialog();

function syncContinueButton() {
  continueTarget = resolveContinueTarget(listGalBlogSaves());
  continueButton.disabled = !continueTarget;
  continueButton.setAttribute("aria-label", continueTarget?.kind === "game"
    ? "继续最近游戏存档"
    : continueTarget?.kind === "article"
      ? `继续阅读${continueTarget.title ? `：${continueTarget.title}` : ""}`
      : "没有可继续的记录");
}

syncBgmButton();
bgmButton.addEventListener("click", () => experienceAudio.setBgmEnabled(!experienceAudio.isBgmEnabled()));
window.addEventListener("lonely-sea:bgm-state-change", syncBgmButton);
window.addEventListener("lonely-sea:gal-blog-save-change", syncContinueButton);

window.addEventListener("lonely-sea:preferences-change", (event) => {
  const previousPreferences = preferences;
  preferences = applyPreferences(event.detail?.preferences || readPreferences());
  const densityChanged = preferences.particleDensity !== previousPreferences.particleDensity;
  const motionChanged = preferences.reducedMotion !== previousPreferences.reducedMotion;
  if (densityChanged) weather.setDensity(preferences.particleDensity / 100);
  else if (motionChanged) weather.handlePreferenceChange();
});

window.addEventListener("lonely-sea:experience-preference-change", (event) => {
  const next = event.detail || {};
  if (sceneLabels[next.scene]) setScene(next.scene);
  if (weatherLabels[next.weather]) setWeather(next.weather);
});

window.addEventListener("lonely-sea:story-enter", (event) => {
  const { gameSlug, releaseId, sceneId } = event.detail || {};
  if (!gameSlug || !sceneId) return;
  try {
    const intent = createGalBlogLaunchIntent({
      gameSlug,
      releaseId: releaseId || undefined,
      target: { kind: "scene", id: sceneId },
    });
    beginExternalNavigation(createGalBlogLaunchUrl(intent), "OPENING STORY");
  } catch {
    refreshStatus("STORY LAUNCH UNAVAILABLE");
  }
});

window.addEventListener("lonely-sea:save-select", (event) => {
  const save = getGalBlogSave(event.detail?.saveId || "");
  if (!save) return;
  try {
    beginExternalNavigation(createSaveLaunchUrl(save), "READING SAVE DATA");
  } catch {
    refreshStatus("SAVE DATA UNAVAILABLE");
  }
});

all("[data-command]").forEach((button) => {
  button.addEventListener("click", (event) => {
    const command = button.dataset.command;
    if (command === "START") {
      if (!hasStoredPreferences()) openLanguageGate();
      else launchFirstChapter();
      return;
    }
    if (command === "CONTINUE" && continueTarget) {
      if (continueTarget.kind === "article") {
        beginExternalNavigation(continueTarget.path, "OPENING RECORD");
        return;
      }
      const save = getGalBlogSave(continueTarget.saveId);
      if (save) beginExternalNavigation(createSaveLaunchUrl(save), "CONTINUING STORY");
      else syncContinueButton();
      return;
    }
    const route = { LOAD: "load", EXTRA: "extra", OPTION: "option" }[command];
    if (route) {
      navigateTo(route, { instant: event.detail === 0 });
      return;
    }
  });
});

all("[data-back]").forEach((button) => {
  button.addEventListener("click", (event) => navigateTo("title", { instant: event.detail === 0 }));
});

all("[data-scene-option]").forEach((button) => {
  button.addEventListener("click", () => setScene(button.dataset.sceneOption));
});
all("[data-weather-option]").forEach((button) => {
  button.addEventListener("click", () => setWeather(button.dataset.weatherOption));
});

opening.addEventListener("click", () => dismissOpening());
opening.addEventListener("keydown", (event) => {
  if (["Enter", " ", "Escape"].includes(event.key)) {
    event.preventDefault();
    dismissOpening();
  }
});
required("#replay-opening").addEventListener("click", replayOpeningFromTitle);

required("#hide-fx").addEventListener("click", () => {
  fxPanel.hidden = true;
  showFx.hidden = false;
});
showFx.addEventListener("click", () => {
  showFx.hidden = true;
  fxPanel.hidden = false;
});

function moveTitleFocus(direction) {
  const buttons = all(".menu-button:not(:disabled)");
  const current = buttons.indexOf(document.activeElement);
  const next = current < 0
    ? direction > 0 ? 0 : buttons.length - 1
    : (current + direction + buttons.length) % buttons.length;
  buttons[next].focus({ preventScroll: true });
}

document.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (!languageGate.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeLanguageGate();
    }
    return;
  }
  const target = event.target;
  const editing = target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']");
  const key = event.key.toLowerCase();

  if (key === "escape") {
    if (exitDialog.close() || extraScreen.closeCg() || loadScreen.closeArticle()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (body.dataset.route !== "title") {
      event.preventDefault();
      navigateTo("title", { instant: true });
      return;
    }
  }

  if (event.defaultPrevented) return;
  if (editing) return;
  const horizontalDirection = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;

  if (body.dataset.route === "load" && horizontalDirection) {
    event.preventDefault();
    loadScreen.changePage(horizontalDirection);
    return;
  }
  if (body.dataset.route === "start" && horizontalDirection) {
    event.preventDefault();
    startScreen.changePage(horizontalDirection);
    return;
  }
  if (body.dataset.route === "extra" && horizontalDirection) {
    event.preventDefault();
    extraScreen.changePage(horizontalDirection);
    return;
  }
  if (body.dataset.route === "option" && horizontalDirection) {
    event.preventDefault();
    optionScreen.changePage(horizontalDirection);
    return;
  }

  if (body.dataset.route !== "title" || !opening.classList.contains("is-dismissed")) return;
  if (["enter", " "].includes(key) && document.activeElement?.matches(".menu-button:not(:disabled)")) {
    event.preventDefault();
    document.activeElement.click();
    return;
  }
  if (["ArrowUp", "ArrowLeft"].includes(event.key)) {
    event.preventDefault();
    moveTitleFocus(-1);
    return;
  }
  if (["ArrowDown", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    moveTitleFocus(1);
    return;
  }
  if (key === "1") setScene("mist");
  if (key === "2") setScene("day");
  if (key === "3") setScene("night");
  if (key === "4") setScene("crimson");
  if (key === "c") setWeather("clear");
  if (key === "s") setWeather("snow");
  if (key === "r") setWeather("rain");
  if (key === "f") {
    const willShow = fxPanel.hidden;
    fxPanel.hidden = !willShow;
    showFx.hidden = willShow;
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) weather.stop();
  else weather.start();
});
reduceMotion.addEventListener("change", weather.handlePreferenceChange);
window.addEventListener("resize", weather.resize, { passive: true });

weather.resize();
updatePressed("[data-scene-option]", body.dataset.scene, "sceneOption");
updatePressed("[data-weather-option]", weather.value, "weatherOption");
updateSceneLabels();
refreshStatus();
if (!freshResetBoot) recordBlogActivity("scenes", body.dataset.scene);
syncContinueButton();
weather.start();

if (hasSeenOpening()) dismissOpening({ remember: false, instant: true });
else playOpening();

const initialImage = new Image();
initialImage.src = sceneArt[body.dataset.scene] || sceneArt.mist;
const reveal = () => requestAnimationFrame(() => body.classList.add("is-ready"));
if (initialImage.complete) reveal();
else {
  initialImage.addEventListener("load", reveal, { once: true });
  initialImage.addEventListener("error", reveal, { once: true });
}
