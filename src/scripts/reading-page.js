import { applyPreferences, publishPreferences, readPreferences } from "./experience/preferences.js";
import { initExperienceAudio } from "./experience/audio.js";
import { initAmbientDock } from "./experience/ambient-dock.js";
import { createWeatherController } from "./experience/weather.js";
import { initArticleListen } from "./experience/listen-session.js";
import { initLoadTracksXiiiConcept } from "./experience/load-tracks-xiii.js";
import { initOptions } from "./experience/options.js";
import { writeArticleContinue } from "../lib/experience-continue";
import { recordBlogActivity } from "../lib/blog-activity";
import { initAchievementSystem } from "../lib/experience-achievements";
import { initBlogInteractionScene } from "./blog-interactions";
import { sceneArt } from "./experience/config.js";
import {
  createGalBlogLaunchIntent,
  createGalBlogLaunchUrl,
  createSaveLaunchUrl,
} from "../lib/gal-blog/launch-session";
import { getGalBlogSave } from "../lib/gal-blog/save-store";
import {
  EXPERIENCE_CHANGE_EVENT,
  readExperienceState,
  resolveExperienceState,
  sceneForCurrentTime,
  writeExperienceState,
} from "./experience/state.js";

let activeReadingSystem = null;
let disposeReadingPage = () => {};
let articleRequest = null;
let articleSwitchToken = 0;
const articleDocumentCache = new Map();
let readingSystemAssetsPromise = null;

function loadReadingSystemAssets() {
  readingSystemAssetsPromise ||= import("./experience/reading-system-assets.js");
  return readingSystemAssetsPromise;
}

function isArticleUrl(url) {
  return url.origin === window.location.origin && url.pathname.startsWith("/posts/");
}

async function loadArticleDocument(url, signal) {
  const cacheKey = `${url.pathname}${url.search}`;
  let cached = articleDocumentCache.get(cacheKey);
  if (!cached) {
    const fragmentUrl = new URL(url.href);
    fragmentUrl.pathname = `/reading-fragments/${url.pathname.slice("/posts/".length)}`;
    cached = fetch(fragmentUrl.href, {
      headers: { Accept: "text/html", "X-Requested-With": "reading-page" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Article request failed: ${response.status}`);
      const html = await response.text();
      articleDocumentCache.set(cacheKey, html);
      return html;
    }).catch((error) => {
      articleDocumentCache.delete(cacheKey);
      throw error;
    });
    articleDocumentCache.set(cacheKey, cached);
  }
  const html = typeof cached === "string" ? cached : await cached;
  if (signal?.aborted) throw new DOMException("Article request aborted", "AbortError");
  const documentPage = new DOMParser().parseFromString(html, "text/html");
  if (!documentPage.querySelector(".reading-system")) throw new Error("Article shell missing");
  return documentPage;
}

function replaceReadingRegion(root, nextRoot, selector) {
  const current = root.querySelector(selector);
  const next = nextRoot.querySelector(selector);
  if (current && next) current.replaceWith(next);
  return Boolean(current && next);
}

function syncReadingToc(root, nextRoot) {
  const current = root.querySelector(".reading-toc");
  const next = nextRoot.querySelector(".reading-toc");
  if (current && next) {
    current.replaceChildren(...next.children);
    return;
  }
  if (current && !next) {
    current.remove();
    return;
  }
  if (!current && next) root.querySelector(".reading-ledger")?.prepend(next);
}

function syncArticleShell(root, nextRoot) {
  const replacedArticle = replaceReadingRegion(root, nextRoot, ".reading-main article");
  if (!replacedArticle) throw new Error("Article content missing");
  syncReadingToc(root, nextRoot);
  replaceReadingRegion(root, nextRoot, ".reading-menu nav");
  replaceReadingRegion(root, nextRoot, ".reading-article-dialog > section");
}

async function switchArticle(destination, { historyMode = "push", root = activeReadingSystem } = {}) {
  if (!(root instanceof HTMLElement) || !isArticleUrl(destination)) return false;

  const currentUrl = new URL(window.location.href);
  if (
    destination.pathname === currentUrl.pathname
    && destination.search === currentUrl.search
    && historyMode === "push"
  ) {
    root.querySelector("[data-reading-article-dialog]")?.close?.();
    return true;
  }

  articleRequest?.abort();
  articleRequest = new AbortController();
  const token = ++articleSwitchToken;
  root.classList.add("is-article-switching");

  try {
    const documentPage = await loadArticleDocument(destination, articleRequest.signal);
    if (token !== articleSwitchToken) return true;
    const nextRoot = documentPage.querySelector(".reading-system");

    disposeReadingPage();
    syncArticleShell(root, nextRoot);
    root.dataset.readingRecord = nextRoot.dataset.readingRecord || "01";
    root.classList.remove("is-ready", "is-menu-open");
    root.querySelector("[data-reading-transition-layer]")?.setAttribute("aria-hidden", "true");

    if (historyMode === "push") window.history.pushState({ readingArticle: true }, "", destination.href);
    else if (historyMode === "replace") window.history.replaceState({ readingArticle: true }, "", destination.href);

    document.title = documentPage.title;
    const canonical = document.querySelector('link[rel="canonical"]');
    const nextCanonical = documentPage.querySelector('link[rel="canonical"]');
    if (canonical && nextCanonical) canonical.href = nextCanonical.href;

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    activeReadingSystem = root;
    disposeReadingPage = initReadingPage(root);
    root.classList.remove("is-article-switching");
    return true;
  } catch (error) {
    if (error?.name === "AbortError") return true;
    root.classList.remove("is-article-switching");
    console.error("[reading-page] article switch failed", error);
    window.location.assign(destination.href);
    return false;
  }
}

const READING_SCENES = new Set(["mist", "day", "night", "crimson"]);
const READING_WEATHER = new Set(["clear", "snow", "rain"]);
const readingOverlayControllers = new WeakMap();

function setReadingScene(root, scene) {
  const normalizedScene = READING_SCENES.has(scene) ? scene : "mist";
  const next = { ...readExperienceState(), scene: normalizedScene };
  writeExperienceState(next);
  root.dataset.readingScene = normalizedScene;
  document.body.dataset.scene = normalizedScene;
  root.style.setProperty("--reading-scene-art", `url('${sceneArt[normalizedScene]}')`);
  return normalizedScene;
}

function syncReadingScene(root) {
  let scene = "mist";
  const saved = readExperienceState();
  if (typeof saved.scene === "string" && sceneArt[saved.scene]) scene = saved.scene;
  root.dataset.readingScene = scene;
  document.body.dataset.scene = scene;
  root.style.setProperty("--reading-scene-art", `url('${sceneArt[scene]}')`);
  return scene;
}

function setReadingWeather(weather) {
  const normalizedWeather = READING_WEATHER.has(weather) ? weather : "clear";
  const next = { ...readExperienceState(), weather: normalizedWeather };
  writeExperienceState(next);
  document.body.dataset.weather = normalizedWeather;
  return normalizedWeather;
}

function syncReadingWeather() {
  const saved = readExperienceState();
  const weather = READING_WEATHER.has(saved.weather) ? saved.weather : "clear";
  document.body.dataset.weather = weather;
  return weather;
}

function initReadingSystemOverlay(readingSystem, { onBeforeOpen = () => {} } = {}) {
  const existing = readingOverlayControllers.get(readingSystem);
  if (existing) {
    existing.setBeforeOpen(onBeforeOpen);
    return existing;
  }

  const layer = readingSystem.querySelector("[data-reading-system-layer]");
  if (!(layer instanceof HTMLElement)) {
    return { open() {}, close() {}, setBeforeOpen() {} };
  }
  let loadScreen = layer.querySelector('[data-screen="load"]');
  let optionScreen = layer.querySelector('[data-screen="option"]');
  let systemMarkupPromise = null;

  let beforeOpen = onBeforeOpen;
  let active = "";
  let loadController = null;
  let optionController = null;
  const weatherCanvas = readingSystem.querySelector(".reading-weather");
  const weatherCanvasHome = weatherCanvas?.parentNode || null;
  const weatherCanvasNext = weatherCanvas?.nextSibling || null;
  const reduceMotion = {
    get matches() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches || readPreferences().reducedMotion;
    },
  };
  const syncFixedSystemScale = () => {
    layer.style.setProperty("--reading-system-scale", String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)));
  };

  const loadSystemMarkup = () => {
    if (systemMarkupPromise) return systemMarkupPromise;
    const source = layer.dataset.systemSource || "/reading-system/";
    systemMarkupPromise = fetch(source, {
      headers: { Accept: "text/html", "X-Requested-With": "reading-system" },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Reading system request failed: ${response.status}`);
      return response.text();
    }).catch((error) => {
      systemMarkupPromise = null;
      throw error;
    });
    return systemMarkupPromise;
  };

  const ensureScreens = async () => {
    if (loadScreen instanceof HTMLElement && optionScreen instanceof HTMLElement) return;
    const html = await loadSystemMarkup();
    const page = new DOMParser().parseFromString(html, "text/html");
    const fragment = page.querySelector("[data-reading-system-fragment]");
    if (!(fragment instanceof HTMLElement)) throw new Error("Reading system fragment missing");
    layer.append(...fragment.children);
    loadScreen = layer.querySelector('[data-screen="load"]');
    optionScreen = layer.querySelector('[data-screen="option"]');
    if (!(loadScreen instanceof HTMLElement) || !(optionScreen instanceof HTMLElement)) {
      throw new Error("Reading system screens missing");
    }
    optionScreen.querySelector("[data-back]")?.addEventListener("click", () => close());
  };

  const restoreWeatherCanvas = () => {
    if (!(weatherCanvas instanceof HTMLCanvasElement) || !weatherCanvasHome) return;
    if (weatherCanvas.parentNode === weatherCanvasHome) return;
    weatherCanvasHome.insertBefore(
      weatherCanvas,
      weatherCanvasNext?.parentNode === weatherCanvasHome ? weatherCanvasNext : null,
    );
  };

  const mountWeatherCanvas = () => {
    if (!(weatherCanvas instanceof HTMLCanvasElement) || weatherCanvas.parentNode === layer) return;
    layer.prepend(weatherCanvas);
  };

  function close({ restoreFocus = true } = {}) {
    if (!active) {
      restoreWeatherCanvas();
      return;
    }
    articleRequest?.abort();
    layer.removeAttribute("aria-busy");
    layer.classList.remove("is-preparing");
    layer.querySelectorAll(".is-opening").forEach((slot) => slot.classList.remove("is-opening"));
    loadController?.deactivate();
    optionController?.deactivate();
    loadScreen?.setAttribute("aria-hidden", "true");
    optionScreen?.setAttribute("aria-hidden", "true");
    layer.setAttribute("aria-hidden", "true");
    readingSystem.classList.remove("is-system-layer-open");
    document.body.classList.remove("is-reading-system-open");
    delete document.documentElement.dataset.readingSystemFixed;
    window.removeEventListener("resize", syncFixedSystemScale);
    restoreWeatherCanvas();
    active = "";
    if (restoreFocus) readingSystem.querySelector("[data-reading-menu-toggle]")?.focus({ preventScroll: true });
  }

  const getLoadController = () => {
    if (loadController) return loadController;
    loadController = initLoadTracksXiiiConcept({
      reduceMotion,
      root: layer,
      initialPage: "articles",
      onBack: () => close(),
      onArticleOpen: (href) => {
        const destination = new URL(href, window.location.href);
        if (!isArticleUrl(destination)) return;
        layer.setAttribute("aria-busy", "true");
        layer.querySelectorAll("[data-xiii-article-slot]").forEach((slot) => {
          slot.classList.toggle("is-opening", slot.dataset.href === href);
        });
        void switchArticle(destination, { root: readingSystem }).finally(() => {
          layer.removeAttribute("aria-busy");
          layer.querySelectorAll(".is-opening").forEach((slot) => slot.classList.remove("is-opening"));
        });
      },
    });
    return loadController;
  };
  const getOptionController = () => {
    if (optionController) return optionController;
    optionController = initOptions({
      onReplayOpening: () => window.location.assign("/"),
      onResetExperience: () => window.dispatchEvent(new CustomEvent(EXPERIENCE_CHANGE_EVENT, {
        detail: readExperienceState(),
      })),
    });
    return optionController;
  };

  const launchGame = (url) => {
    layer.setAttribute("aria-busy", "true");
    if (window.parent !== window) {
      window.parent.postMessage({ type: "lonely-sea:shell-cover", label: "CONNECTING STORY" }, window.location.origin);
    }
    window.requestAnimationFrame(() => window.location.assign(url));
  };
  const handleStoryEnter = (event) => {
    if (active !== "load") return;
    const { gameSlug, releaseId, sceneId } = event.detail || {};
    if (!gameSlug || !sceneId) return;
    try {
      const intent = createGalBlogLaunchIntent({
        gameSlug,
        releaseId: releaseId || undefined,
        target: { kind: "scene", id: sceneId },
      });
      launchGame(createGalBlogLaunchUrl(intent));
    } catch {
      layer.removeAttribute("aria-busy");
    }
  };
  const handleSaveSelect = (event) => {
    if (active !== "load") return;
    const save = getGalBlogSave(event.detail?.saveId || "");
    if (!save) return;
    try {
      launchGame(createSaveLaunchUrl(save));
    } catch {
      layer.removeAttribute("aria-busy");
    }
  };

  optionScreen?.querySelector("[data-back]")?.addEventListener("click", () => close());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && active) close();
  });
  window.addEventListener("lonely-sea:story-enter", handleStoryEnter);
  window.addEventListener("lonely-sea:save-select", handleSaveSelect);

  const controller = {
    open(kind) {
      if (!["load", "option"].includes(kind)) return;
      beforeOpen();
      document.documentElement.dataset.readingSystemFixed = "true";
      syncFixedSystemScale();
      window.addEventListener("resize", syncFixedSystemScale, { passive: true });
      active = kind;
      mountWeatherCanvas();
      layer.setAttribute("aria-hidden", "false");
      readingSystem.classList.add("is-system-layer-open");
      document.body.classList.add("is-reading-system-open");
      layer.classList.add("is-preparing");
      void Promise.all([loadReadingSystemAssets(), ensureScreens()]).then(() => {
        if (active !== kind) return;
        loadScreen.setAttribute("aria-hidden", String(kind !== "load"));
        optionScreen.setAttribute("aria-hidden", String(kind !== "option"));
        if (kind === "load") getLoadController().activate();
        else getOptionController().activate({ category: "blog", panel: "reading" });
        layer.classList.remove("is-preparing");
        window.requestAnimationFrame(() => {
          const screen = kind === "load" ? loadScreen : optionScreen;
          screen.querySelector("[data-back]")?.focus({ preventScroll: true });
        });
      }).catch(() => {
        layer.classList.remove("is-preparing");
        const screen = kind === "load" ? loadScreen : optionScreen;
        screen?.setAttribute("aria-hidden", "true");
        close();
      });
    },
    close,
    setBeforeOpen(callback) {
      beforeOpen = callback;
    },
  };
  const warmSystem = () => {
    void loadSystemMarkup().catch(() => {});
    void loadReadingSystemAssets().catch(() => {});
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(warmSystem, { timeout: 1800 });
  else window.setTimeout(warmSystem, 900);
  readingOverlayControllers.set(readingSystem, controller);
  return controller;
}

function initReadingPage(readingSystem) {
  if (!(readingSystem instanceof HTMLElement)) return () => {};
  let preferences = applyPreferences(readPreferences());
  resolveExperienceState(preferences);
  let readingScene = syncReadingScene(readingSystem);
  let readingWeather = syncReadingWeather();
  const experienceAudio = initExperienceAudio();
  initArticleListen();
  experienceAudio.setTitleActive(true);
  initAchievementSystem();
  const interactionControllers = [...readingSystem.querySelectorAll("[data-blog-interaction]")]
    .map((element) => initBlogInteractionScene(element));
  const transitionLayer = readingSystem.querySelector("[data-reading-transition-layer]");
  const readingContent = readingSystem.querySelector("[data-reading-content]");
  const progressLabel = readingSystem.querySelector("[data-reading-percent]");
  const heartFill = readingSystem.querySelector("[data-reading-heart-fill]");
  const scrollRail = readingSystem.querySelector("[data-reading-scroll-rail]");
  const scrollThumb = readingSystem.querySelector("[data-reading-scroll-thumb]");
  const cgDialog = readingSystem.querySelector("[data-reading-cg-dialog]");
  const cgImage = cgDialog?.querySelector("[data-reading-cg-img]");
  const articleDialog = readingSystem.querySelector("[data-reading-article-dialog]");
  const articleMenuButton = readingSystem.querySelector("[data-reading-article-menu]");
  const bgmButton = readingSystem.querySelector("[data-reading-bgm]");
  const commentJumpButton = readingSystem.querySelector("[data-reading-comment-jump]");
  const commentAnchor = readingSystem.querySelector("#reading-comments");
  const readingMenu = readingSystem.querySelector("[data-reading-menu]");
  const readingMenuToggle = readingSystem.querySelector("[data-reading-menu-toggle]");
  const readingMenuClose = readingSystem.querySelector("[data-reading-menu-close]");
  const readingAutoButton = readingSystem.querySelector("[data-reading-auto]");
  const ambientDock = readingSystem.querySelector("[data-ambient-dock]");
  const ambientSceneButtons = [...readingSystem.querySelectorAll("[data-scene-option]")];
  const ambientWeatherButtons = [...readingSystem.querySelectorAll("[data-weather-option]")];
  const settingsButton = readingSystem.querySelector("[data-reading-settings]");
  const settingsDialog = readingSystem.querySelector("[data-reading-settings-dialog]");
  const settingsBgmButton = readingSystem.querySelector("[data-reading-setting-bgm]");
  const settingRanges = [...readingSystem.querySelectorAll("[data-reading-setting]")];
  const sceneChoiceButtons = [...readingSystem.querySelectorAll("[data-reading-scene-choice]")];
  const termDialog = readingSystem.querySelector("[data-reading-term-dialog]");
  const termTitle = termDialog?.querySelector("[data-reading-term-title]");
  const termDefinition = termDialog?.querySelector("[data-reading-term-definition]");
  const tocLinks = [...readingSystem.querySelectorAll("[data-reading-toc]")];
  const systemReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = systemReduceMotion.matches || preferences.reducedMotion;
  const weatherMotion = {
    get matches() {
      return systemReduceMotion.matches || preferences.reducedMotion;
    },
  };
  const weather = createWeatherController({
    body: document.body,
    reduceMotion: weatherMotion,
    initialDensity: preferences.particleDensity / 100,
    onChange(value) {
      readingWeather = setReadingWeather(value);
      syncAmbientControls();
    },
  });
  const disposeAmbientDock = initAmbientDock(ambientDock);
  const positionKey = `lonely-sea-reading-position:${window.location.pathname}`;
  let saveTimer = 0;
  let scrollFrame = 0;
  let autoFrame = 0;
  let autoPreviousTime = 0;
  let progressStart = 0;
  let progressEnd = 1;
  let affectionCompleteCelebrated = false;
  let affectionCompleteTimer = 0;

  function saveReadingPosition() {
    writeArticleContinue(`${window.location.pathname}${window.location.search}`, document.title);
    if (!preferences.autoSavePosition) return;
    try {
      localStorage.setItem(positionKey, String(Math.max(0, Math.round(window.scrollY))));
    } catch {}
  }

  function restoreReadingPosition() {
    if (!preferences.autoSavePosition || window.location.hash) return;
    let savedPosition = 0;
    try {
      savedPosition = Number(localStorage.getItem(positionKey) || 0);
    } catch {}
    if (!Number.isFinite(savedPosition) || savedPosition < 80) return;
    window.scrollTo({ top: savedPosition, left: 0, behavior: "instant" });
  }

  function updateToc() {
    if (tocLinks.length === 0) return;
    const headings = tocLinks
      .map((link) => document.getElementById(link.dataset.readingToc))
      .filter(Boolean);
    const threshold = Math.min(window.innerHeight * .28, 190);
    let active = headings[0];
    headings.forEach((heading) => {
      if (heading.getBoundingClientRect().top <= threshold) active = heading;
    });
    tocLinks.forEach((link) => {
      if (link.dataset.readingToc === active?.id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function updateProgress() {
    scrollFrame = 0;
    const contentRect = readingContent?.getBoundingClientRect();
    const contentTop = contentRect ? contentRect.top + window.scrollY : 0;
    const contentBottom = contentRect ? contentRect.bottom + window.scrollY : document.documentElement.scrollHeight;
    progressStart = Math.max(0, contentTop - Math.min(window.innerHeight * .2, 160));
    progressEnd = Math.max(progressStart + 1, contentBottom - window.innerHeight + 24);
    const progress = Math.min(1, Math.max(0, (window.scrollY - progressStart) / (progressEnd - progressStart)));
    const percent = Math.round(progress * 100);
    readingSystem.style.setProperty("--reading-progress-value", String(progress));
    readingSystem.classList.toggle("is-reading-body", window.scrollY > Math.min(window.innerHeight * .58, 560));
    if (progressLabel) progressLabel.textContent = String(percent);
    if (heartFill instanceof SVGRectElement) {
      const fillHeight = 21.8 * progress;
      heartFill.setAttribute("y", String(27.5 - fillHeight));
      heartFill.setAttribute("height", String(fillHeight));
    }
    if (scrollThumb instanceof HTMLButtonElement && scrollRail instanceof HTMLElement) {
      const travel = Math.max(0, scrollRail.clientHeight - scrollThumb.offsetHeight);
      scrollThumb.style.transform = `translateY(${Math.round(travel * progress)}px)`;
      scrollThumb.setAttribute("aria-valuenow", String(percent));
      scrollThumb.setAttribute("aria-valuetext", `本文好感度 ${percent}%`);
      scrollThumb.title = `好感度 ${percent}%`;
      scrollThumb.dataset.affectionTier = percent >= 100
        ? "complete"
        : percent >= 80
          ? "devoted"
          : percent >= 60
            ? "close"
            : percent >= 40
              ? "warm"
              : percent >= 20
                ? "curious"
                : "distant";
    }
    scrollThumb?.classList.toggle("is-complete", percent >= 100);
    if (percent >= 100 && !affectionCompleteCelebrated) {
      affectionCompleteCelebrated = true;
      scrollThumb?.classList.add("is-completing");
      recordBlogActivity("articleCompletions", window.location.pathname);
      affectionCompleteTimer = window.setTimeout(() => {
        scrollThumb?.classList.remove("is-completing");
      }, 900);
    }
    updateToc();

    if (preferences.autoSavePosition) {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(saveReadingPosition, 420);
    }
  }

  function requestProgressUpdate() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateProgress);
  }

  const handleTocClick = (event) => {
    const link = event.currentTarget;
    const heading = document.getElementById(link.dataset.readingToc || "");
    if (!(heading instanceof HTMLElement)) return;
    event.preventDefault();
    const top = heading.getBoundingClientRect().top + window.scrollY - Math.min(96, window.innerHeight * .14);
    window.history.replaceState(window.history.state, "", `#${encodeURIComponent(heading.id)}`);
    window.scrollTo({ top, left: 0, behavior: "auto" });
  };

  tocLinks.forEach((link) => link.addEventListener("click", handleTocClick));

  function scrollToArticleProgress(progress, behavior = "auto") {
    const normalized = Math.min(1, Math.max(0, progress));
    window.scrollTo({
      top: progressStart + (progressEnd - progressStart) * normalized,
      left: 0,
      behavior,
    });
  }

  const handleRailPointerDown = (event) => {
    if (!(scrollRail instanceof HTMLElement) || event.target?.closest?.("[data-reading-scroll-thumb]")) return;
    const rect = scrollRail.getBoundingClientRect();
    const thumbHeight = scrollThumb instanceof HTMLElement ? scrollThumb.offsetHeight : 0;
    const travel = Math.max(1, rect.height - thumbHeight);
    if (travel < 8) return;
    scrollToArticleProgress((event.clientY - rect.top - thumbHeight / 2) / travel, reduceMotion ? "auto" : "smooth");
  };

  const handleThumbPointerDown = (event) => {
    if (!(scrollThumb instanceof HTMLButtonElement) || !(scrollRail instanceof HTMLElement)) return;
    if (scrollRail.clientHeight - scrollThumb.offsetHeight < 8) return;
    event.preventDefault();
    scrollThumb.setPointerCapture?.(event.pointerId);
  };

  const handleThumbPointerMove = (event) => {
    if (!(scrollThumb instanceof HTMLButtonElement) || !(scrollRail instanceof HTMLElement)) return;
    if (!scrollThumb.hasPointerCapture?.(event.pointerId)) return;
    const rect = scrollRail.getBoundingClientRect();
    const travel = Math.max(1, rect.height - scrollThumb.offsetHeight);
    if (travel < 8) return;
    scrollToArticleProgress((event.clientY - rect.top - scrollThumb.offsetHeight / 2) / travel);
  };

  const handleThumbPointerUp = (event) => {
    if (!(scrollThumb instanceof HTMLButtonElement)) return;
    if (scrollThumb.hasPointerCapture?.(event.pointerId)) scrollThumb.releasePointerCapture(event.pointerId);
  };

  const handleThumbKeydown = (event) => {
    const current = Number(scrollThumb?.getAttribute("aria-valuenow") || 0) / 100;
    const steps = { ArrowUp: -.04, ArrowDown: .04, PageUp: -.15, PageDown: .15 };
    if (event.key === "Home") scrollToArticleProgress(0);
    else if (event.key === "End") scrollToArticleProgress(1);
    else if (Object.hasOwn(steps, event.key)) scrollToArticleProgress(current + steps[event.key]);
    else return;
    event.preventDefault();
  };

  scrollRail?.addEventListener("pointerdown", handleRailPointerDown);
  scrollThumb?.addEventListener("pointerdown", handleThumbPointerDown);
  scrollThumb?.addEventListener("pointermove", handleThumbPointerMove);
  scrollThumb?.addEventListener("pointerup", handleThumbPointerUp);
  scrollThumb?.addEventListener("pointercancel", handleThumbPointerUp);
  scrollThumb?.addEventListener("keydown", handleThumbKeydown);

  function syncAmbientControls() {
    ambientSceneButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sceneOption === readingScene));
    });
    ambientWeatherButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.weatherOption === readingWeather));
    });
  }

  const handleAmbientScene = (event) => {
    const button = event.currentTarget;
    readingScene = setReadingScene(readingSystem, button.dataset.sceneOption);
    weather.handlePreferenceChange();
    syncAmbientControls();
  };

  const handleAmbientWeather = (event) => {
    const button = event.currentTarget;
    const nextWeather = button.dataset.weatherOption;
    if (!READING_WEATHER.has(nextWeather)) return;
    if (nextWeather === readingWeather) return;
    weather.set(nextWeather);
  };

  ambientSceneButtons.forEach((button) => button.addEventListener("click", handleAmbientScene));
  ambientWeatherButtons.forEach((button) => button.addEventListener("click", handleAmbientWeather));
  syncAmbientControls();
  weather.resize();
  weather.start();
  systemReduceMotion.addEventListener("change", weather.handlePreferenceChange);

  function stopAutoScroll() {
    if (autoFrame) window.cancelAnimationFrame(autoFrame);
    autoFrame = 0;
    autoPreviousTime = 0;
    readingSystem.classList.remove("is-auto-reading");
    readingAutoButton?.setAttribute("aria-pressed", "false");
  }

  function runAutoScroll(time) {
    if (!autoFrame) return;
    const delta = autoPreviousTime ? Math.min(40, time - autoPreviousTime) : 16;
    autoPreviousTime = time;
    const speed = 14 + (Number(preferences.readingAutoSpeed) || 5) * 7;
    window.scrollBy({ top: speed * delta / 1000, left: 0, behavior: "instant" });
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (atEnd) {
      stopAutoScroll();
      return;
    }
    autoFrame = window.requestAnimationFrame(runAutoScroll);
  }

  function startAutoScroll() {
    if (autoFrame) return;
    readingSystem.classList.add("is-auto-reading");
    readingAutoButton?.setAttribute("aria-pressed", "true");
    autoFrame = window.requestAnimationFrame(runAutoScroll);
  }

  const handleAutoToggle = () => {
    const shouldStart = !autoFrame;
    setReadingMenuOpen(false);
    if (shouldStart) startAutoScroll();
    else stopAutoScroll();
  };
  const stopAutoFromUser = () => stopAutoScroll();
  readingAutoButton?.addEventListener("click", handleAutoToggle);
  window.addEventListener("wheel", stopAutoFromUser, { passive: true });
  window.addEventListener("touchstart", stopAutoFromUser, { passive: true });

  function finishEntryTransition() {
    if (window.parent !== window) {
      readingSystem.classList.add("is-ready");
      transitionLayer?.setAttribute("aria-hidden", "true");
      return;
    }
    if (reduceMotion) {
      readingSystem.classList.add("is-ready");
      transitionLayer?.setAttribute("aria-hidden", "true");
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        readingSystem.classList.add("is-ready");
        window.setTimeout(() => transitionLayer?.setAttribute("aria-hidden", "true"), 300);
      });
    });
  }

  function navigateWithTransition(event) {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.hash && destination.pathname === window.location.pathname) return;

    if (window.parent !== window && destination.pathname === "/") {
      event.preventDefault();
      setReadingMenuOpen(false);
      window.parent.postMessage({
        type: "lonely-sea:game-navigate",
        path: `${destination.pathname}${destination.search}${destination.hash}`,
      }, window.location.origin);
      return;
    }

    if (isArticleUrl(destination)) {
      event.preventDefault();
      setReadingMenuOpen(false);
      articleDialog?.close?.();
      void switchArticle(destination);
      return;
    }

    if (reduceMotion || !preferences.articleTransition) return;

    event.preventDefault();
    saveReadingPosition();
    transitionLayer?.setAttribute("aria-hidden", "false");
    readingSystem.dataset.transitionState = "covering";
    window.setTimeout(() => window.location.assign(destination.href), 220);
  }

  const transitionAnchors = [...readingSystem.querySelectorAll("[data-reading-transition]")];
  transitionAnchors.forEach((anchor) => {
    anchor.addEventListener("click", navigateWithTransition);
  });

  function syncBgmButton() {
    const enabled = experienceAudio.isBgmEnabled() && !experienceAudio.isMuted();
    [bgmButton, settingsBgmButton].forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", enabled ? "关闭背景音乐" : "开启背景音乐");
      if (button === settingsBgmButton) button.textContent = enabled ? "开启" : "关闭";
    });
  }

  function syncReadingSettings() {
    preferences = applyPreferences(readPreferences());
    settingRanges.forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      const key = input.dataset.readingSetting;
      if (!key || !Object.hasOwn(preferences, key)) return;
      input.value = String(preferences[key]);
      const output = readingSystem.querySelector(`[data-reading-setting-output="${key}"]`);
      if (output) output.textContent = `${preferences[key]}%`;
    });
    sceneChoiceButtons.forEach((button) => {
      const selected = button.dataset.readingSceneChoice === readingScene;
      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    syncBgmButton();
  }

  function setReadingMenuOpen(open) {
    readingSystem.classList.toggle("is-menu-open", open);
    readingMenu?.setAttribute("aria-hidden", String(!open));
    readingMenuToggle?.setAttribute("aria-expanded", String(open));
  }

  const handleMenuToggle = () => {
    setReadingMenuOpen(!readingSystem.classList.contains("is-menu-open"));
  };

  const handleMenuClose = () => {
    setReadingMenuOpen(false);
    readingMenuToggle?.focus({ preventScroll: true });
  };

  const systemOverlay = initReadingSystemOverlay(readingSystem, {
    onBeforeOpen: () => setReadingMenuOpen(false),
  });

  const handleArticleMenu = () => {
    if (!(articleDialog instanceof HTMLDialogElement)) return;
    setReadingMenuOpen(false);
    if (!articleDialog.open) articleDialog.showModal();
    articleDialog.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "center" });
  };

  const handleBgmToggle = () => {
    if (experienceAudio.isMuted()) {
      experienceAudio.setMuted(false);
      experienceAudio.setBgmEnabled(true);
    } else {
      experienceAudio.setBgmEnabled(!experienceAudio.isBgmEnabled());
    }
    preferences = readPreferences();
    syncBgmButton();
  };

  const handleCommentJump = () => {
    setReadingMenuOpen(false);
    commentAnchor?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const handleSettingsOpen = () => {
    if (!(settingsDialog instanceof HTMLDialogElement)) return;
    setReadingMenuOpen(false);
    syncReadingSettings();
    if (!settingsDialog.open) settingsDialog.showModal();
  };

  const handleSettingInput = (event) => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const key = input.dataset.readingSetting;
    if (!key || !Object.hasOwn(preferences, key)) return;
    preferences = publishPreferences({ ...preferences, [key]: Number(input.value) });
    const output = readingSystem.querySelector(`[data-reading-setting-output="${key}"]`);
    if (output) output.textContent = `${preferences[key]}%`;
  };

  const handleSceneChoice = (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;
    readingScene = setReadingScene(readingSystem, button.dataset.readingSceneChoice);
    syncReadingSettings();
  };

  const handleMenuBackdrop = (event) => {
    if (event.target === readingMenu) handleMenuClose();
  };

  readingMenuToggle?.addEventListener("click", handleMenuToggle);
  readingMenuClose?.addEventListener("click", handleMenuClose);
  articleMenuButton?.addEventListener("click", handleArticleMenu);
  bgmButton?.addEventListener("click", handleBgmToggle);
  settingsBgmButton?.addEventListener("click", handleBgmToggle);
  commentJumpButton?.addEventListener("click", handleCommentJump);
  settingsButton?.addEventListener("click", handleSettingsOpen);
  readingMenu?.addEventListener("click", handleMenuBackdrop);
  settingRanges.forEach((input) => input.addEventListener("input", handleSettingInput));
  sceneChoiceButtons.forEach((button) => button.addEventListener("click", handleSceneChoice));

  window.addEventListener("lonely-sea:bgm-state-change", syncBgmButton);
  window.addEventListener("lonely-sea:audio-mute-change", syncBgmButton);
  const handlePreferencesChange = (event) => {
    const previous = preferences;
    preferences = applyPreferences(event.detail?.preferences || readPreferences());
    if (preferences.particleDensity !== previous.particleDensity) {
      weather.setDensity(preferences.particleDensity / 100);
    } else if (preferences.reducedMotion !== previous.reducedMotion) {
      weather.handlePreferenceChange();
    }
    if (preferences.automaticTheme && !previous.automaticTheme) {
      readingScene = setReadingScene(readingSystem, sceneForCurrentTime());
      weather.handlePreferenceChange();
      syncAmbientControls();
    }
    syncBgmButton();
  };
  const handleExperiencePreferenceChange = (event) => {
    const nextScene = event.detail?.scene;
    const nextWeather = event.detail?.weather;
    if (READING_SCENES.has(nextScene) && nextScene !== readingScene) {
      readingScene = nextScene;
      readingSystem.dataset.readingScene = nextScene;
      document.body.dataset.scene = nextScene;
      readingSystem.style.setProperty("--reading-scene-art", `url('${sceneArt[nextScene]}')`);
    }
    if (READING_WEATHER.has(nextWeather) && nextWeather !== readingWeather) weather.set(nextWeather);
    syncAmbientControls();
  };
  const handleVisibilityChange = () => {
    if (document.hidden) weather.stop();
    else weather.start();
  };
  window.addEventListener("lonely-sea:preferences-change", handlePreferencesChange);
  window.addEventListener(EXPERIENCE_CHANGE_EVENT, handleExperiencePreferenceChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  syncReadingSettings();

  const modalDialogs = [articleDialog, settingsDialog, cgDialog].filter(Boolean);
  const handleDialogBackdrop = (event) => {
    if (event.target instanceof HTMLDialogElement) event.target.close();
  };
  modalDialogs.forEach((dialog) => dialog.addEventListener("click", handleDialogBackdrop));

  const handleReadingKeydown = (event) => {
    if (event.key !== "Escape" || !readingSystem.classList.contains("is-menu-open")) return;
    setReadingMenuOpen(false);
    readingMenuToggle?.focus({ preventScroll: true });
  };
  document.addEventListener("keydown", handleReadingKeydown);

  readingSystem.querySelectorAll('a[href^="http"]').forEach((anchor) => {
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin === window.location.origin || preferences.externalLinks !== "NEW") return;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
  });

  const handleReadingClick = (event) => {
    const clickTarget = event.target instanceof Element ? event.target : null;
    if (
      readingSystem.classList.contains("is-menu-open")
      && clickTarget
      && !clickTarget.closest("[data-reading-menu]")
      && !clickTarget.closest("[data-reading-menu-toggle]")
    ) setReadingMenuOpen(false);
    const systemCommand = clickTarget?.closest("[data-reading-system-open]") || null;
    if (systemCommand instanceof HTMLButtonElement) {
      event.preventDefault();
      systemOverlay.open(systemCommand.dataset.readingSystemOpen);
      return;
    }
    const print = clickTarget?.closest("[data-cg]") || null;
    if (print && cgDialog instanceof HTMLDialogElement && cgImage instanceof HTMLImageElement) {
      cgImage.src = print.dataset.cg || "";
      cgImage.alt = print.querySelector("img")?.alt || "封面";
      if (!cgDialog.open) cgDialog.showModal();
      return;
    }
    const term = clickTarget?.closest("[data-reading-term]") || null;
    if (!(term instanceof HTMLButtonElement) || !(termDialog instanceof HTMLDialogElement)) return;
    event.preventDefault();
    if (termTitle) termTitle.textContent = term.dataset.readingTerm || term.textContent?.trim() || "术语";
    if (termDefinition) termDefinition.textContent = term.dataset.readingDefinition || "文章没有为这个术语补充注释。";
    if (!termDialog.open) termDialog.showModal();
  };
  readingSystem.addEventListener("click", handleReadingClick);

  if (preferences.smartPreload && !preferences.dataSaver) {
    const preload = () => {
      readingSystem.querySelectorAll(".record-neighbours a[href]").forEach((anchor) => {
        const destination = new URL(anchor.href, window.location.href);
        if (isArticleUrl(destination)) void loadArticleDocument(destination).catch(() => {});
      });
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 1800 });
    else window.setTimeout(preload, 700);
  }

  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", weather.resize, { passive: true });
  const handlePageHide = () => {
    saveReadingPosition();
    interactionControllers.forEach((controller) => controller.destroy());
  };
  window.addEventListener("pagehide", handlePageHide);

  let resizeObserver = null;
  if (readingContent) {
    resizeObserver = new ResizeObserver(requestProgressUpdate);
    resizeObserver.observe(readingContent);
  }

  restoreReadingPosition();
  updateProgress();
  writeArticleContinue(`${window.location.pathname}${window.location.search}`, document.title);
  recordBlogActivity("articles", window.location.pathname);
  finishEntryTransition();

  return () => {
    saveReadingPosition();
    interactionControllers.forEach((controller) => controller.destroy());
    window.removeEventListener("scroll", requestProgressUpdate);
    window.removeEventListener("resize", requestProgressUpdate);
    window.removeEventListener("resize", weather.resize);
    systemReduceMotion.removeEventListener("change", weather.handlePreferenceChange);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("lonely-sea:bgm-state-change", syncBgmButton);
    window.removeEventListener("lonely-sea:audio-mute-change", syncBgmButton);
    window.removeEventListener("lonely-sea:preferences-change", handlePreferencesChange);
    window.removeEventListener(EXPERIENCE_CHANGE_EVENT, handleExperiencePreferenceChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.removeEventListener("keydown", handleReadingKeydown);
    transitionAnchors.forEach((anchor) => anchor.removeEventListener("click", navigateWithTransition));
    tocLinks.forEach((link) => link.removeEventListener("click", handleTocClick));
    readingMenuToggle?.removeEventListener("click", handleMenuToggle);
    readingMenuClose?.removeEventListener("click", handleMenuClose);
    readingAutoButton?.removeEventListener("click", handleAutoToggle);
    articleMenuButton?.removeEventListener("click", handleArticleMenu);
    bgmButton?.removeEventListener("click", handleBgmToggle);
    settingsBgmButton?.removeEventListener("click", handleBgmToggle);
    commentJumpButton?.removeEventListener("click", handleCommentJump);
    settingsButton?.removeEventListener("click", handleSettingsOpen);
    readingMenu?.removeEventListener("click", handleMenuBackdrop);
    settingRanges.forEach((input) => input.removeEventListener("input", handleSettingInput));
    sceneChoiceButtons.forEach((button) => button.removeEventListener("click", handleSceneChoice));
    modalDialogs.forEach((dialog) => dialog.removeEventListener("click", handleDialogBackdrop));
    readingSystem.removeEventListener("click", handleReadingClick);
    scrollRail?.removeEventListener("pointerdown", handleRailPointerDown);
    scrollThumb?.removeEventListener("pointerdown", handleThumbPointerDown);
    scrollThumb?.removeEventListener("pointermove", handleThumbPointerMove);
    scrollThumb?.removeEventListener("pointerup", handleThumbPointerUp);
    scrollThumb?.removeEventListener("pointercancel", handleThumbPointerUp);
    scrollThumb?.removeEventListener("keydown", handleThumbKeydown);
    ambientSceneButtons.forEach((button) => button.removeEventListener("click", handleAmbientScene));
    ambientWeatherButtons.forEach((button) => button.removeEventListener("click", handleAmbientWeather));
    window.removeEventListener("wheel", stopAutoFromUser);
    window.removeEventListener("touchstart", stopAutoFromUser);
    stopAutoScroll();
    systemOverlay.close({ restoreFocus: false });
    weather.stop();
    disposeAmbientDock();
    if (saveTimer) window.clearTimeout(saveTimer);
    if (affectionCompleteTimer) window.clearTimeout(affectionCompleteTimer);
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    resizeObserver?.disconnect();
  };
}

function startReadingPage() {
  const nextReadingSystem = document.querySelector(".reading-system");
  if (nextReadingSystem === activeReadingSystem) return;
  disposeReadingPage();
  activeReadingSystem = nextReadingSystem;
  disposeReadingPage = initReadingPage(nextReadingSystem);
}

window.addEventListener("popstate", () => {
  if (!(activeReadingSystem instanceof HTMLElement)) return;
  const destination = new URL(window.location.href);
  if (isArticleUrl(destination)) void switchArticle(destination, { historyMode: "none" });
  else window.location.assign(destination.href);
});

document.addEventListener("astro:before-swap", () => {
  disposeReadingPage();
  disposeReadingPage = () => {};
  activeReadingSystem = null;
});
document.addEventListener("astro:page-load", startReadingPage);
startReadingPage();
