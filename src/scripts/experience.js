import { sceneArt, sceneLabels, sceneNames, weatherLabels } from "./experience/config.js";
import { all, required, updatePressed, wait } from "./experience/dom.js";
import { initExitDialog } from "./experience/exit.js";
import { initExtraScreen } from "./experience/extra.js";
import { initLoadScreen } from "./experience/load.js";
import { initLoadTracksConcept } from "./experience/load-tracks.js";
import { initLoadTracksXiConcept } from "./experience/load-tracks-xi.js";
import { initLoadTracksXiiConcept } from "./experience/load-tracks-xii.js";
import { initOptions } from "./experience/options.js";
import { createWeatherController } from "./experience/weather.js";

const EXPERIENCE_STORAGE_KEY = "lonely-sea-experience-v1";
const OPENING_STORAGE_KEY = "lonely-sea-opening-seen";
const ROUTES = new Set(["load", "extra", "option"]);

const body = document.body;
const stage = required(".stage");
const titleMenu = required(".title-menu");
const fxPanel = required("#fx-panel");
const showFx = required("#show-fx");
const status = required("#menu-status");
const menuNote = required(".menu-note span");
const opening = required("#opening");
const openingSteps = all("[data-opening-step]");
const curtain = required("#route-curtain");
const screens = all("[data-screen]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let requestedRoute = new URLSearchParams(window.location.search).get("screen");
if (!ROUTES.has(requestedRoute)) requestedRoute = null;
let routeBusy = false;
let openingTimers = [];

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
}

function setWeather(nextWeather) {
  if (!weatherLabels[nextWeather]) return;
  weather.set(nextWeather);
}

function setRoute(route) {
  body.dataset.route = route;
  titleMenu.inert = route !== "title";
  fxPanel.inert = route !== "title";
  screens.forEach((screen) => {
    screen.setAttribute("aria-hidden", String(screen.dataset.screen !== route));
  });
  if (route === "title") weather.start();
  else weather.stop();
}

async function navigateTo(route, { instant = false } = {}) {
  if (routeBusy || route === body.dataset.route) return;
  routeBusy = true;
  stage.inert = true;
  const coverDuration = instant || reduceMotion.matches ? 0 : 430;
  const revealDuration = instant || reduceMotion.matches ? 0 : 620;

  if (coverDuration) {
    curtain.setAttribute("aria-hidden", "false");
    curtain.classList.add("is-covering");
    await wait(coverDuration);
  }

  setRoute(route);

  if (coverDuration) {
    await wait(30);
    curtain.classList.remove("is-covering");
    await wait(revealDuration);
    curtain.setAttribute("aria-hidden", "true");
  }

  routeBusy = false;
  stage.inert = false;
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
  try { return sessionStorage.getItem(OPENING_STORAGE_KEY) === "1"; } catch { return false; }
}

function dismissOpening({ remember = true } = {}) {
  clearOpeningTimers();
  opening.classList.add("is-dismissed");
  opening.setAttribute("aria-hidden", "true");
  stage.inert = false;
  if (remember) rememberOpening();
  if (requestedRoute) {
    const route = requestedRoute;
    requestedRoute = null;
    navigateTo(route, { instant: true });
  }
}

function playOpening() {
  clearOpeningTimers();
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

async function replayOpeningFromTitle() {
  if (body.dataset.route !== "title") await navigateTo("title");
  playOpening();
}

function resetExperience() {
  try { localStorage.removeItem(EXPERIENCE_STORAGE_KEY); } catch {}
  setScene("mist");
  setWeather("snow");
}

const loadScreen = initLoadScreen({ reduceMotion });
const loadTracksConcept = initLoadTracksConcept({ reduceMotion });
const loadTracksXiConcept = initLoadTracksXiConcept({ reduceMotion });
const loadTracksXiiConcept = initLoadTracksXiiConcept({ reduceMotion });
loadScreen.registerReferenceControllers({
  tracks: loadTracksConcept,
  "tracks-xi": loadTracksXiConcept,
  "tracks-xii": loadTracksXiiConcept,
});
const extraScreen = initExtraScreen();
const optionScreen = initOptions({
  onReplayOpening: replayOpeningFromTitle,
  onResetExperience: resetExperience,
});
const exitDialog = initExitDialog();

all("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    const command = button.dataset.command;
    const route = { LOAD: "load", EXTRA: "extra", OPTION: "option" }[command];
    if (route) {
      navigateTo(route);
      return;
    }
    if (command === "START") {
      menuNote.textContent = "START / STORY ROUTE IS NOT YET AVAILABLE";
      window.setTimeout(() => { menuNote.textContent = "MAIN MENU"; }, 1500);
    }
  });
});

all("[data-back]").forEach((button) => {
  button.addEventListener("click", () => navigateTo("title"));
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
  const target = event.target;
  const editing = target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']");
  const key = event.key.toLowerCase();

  if (key === "escape") {
    const activeLoadController = loadScreen.getActiveController() || loadScreen;
    if (exitDialog.close() || extraScreen.closeCg() || activeLoadController.closeArticle()) {
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
    const activeLoad = loadScreen.getActiveController() || loadScreen;
    activeLoad.changePage(horizontalDirection);
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
weather.start();

if (hasSeenOpening()) dismissOpening({ remember: false });
else playOpening();

const initialImage = new Image();
initialImage.src = sceneArt[body.dataset.scene] || sceneArt.mist;
const reveal = () => requestAnimationFrame(() => body.classList.add("is-ready"));
if (initialImage.complete) reveal();
else {
  initialImage.addEventListener("load", reveal, { once: true });
  initialImage.addEventListener("error", reveal, { once: true });
}
