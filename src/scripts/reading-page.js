import { applyPreferences, readPreferences } from "./experience/preferences.js";

const readingSystem = document.querySelector(".reading-system");

if (readingSystem) {
  const preferences = applyPreferences(readPreferences());
  const transitionLayer = readingSystem.querySelector("[data-reading-transition-layer]");
  const readingContent = readingSystem.querySelector("[data-reading-content]");
  const progressLabel = readingSystem.querySelector("[data-reading-percent]");
  const tocLinks = [...readingSystem.querySelectorAll("[data-reading-toc]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || preferences.reducedMotion;
  const positionKey = `lonely-sea-reading-position:${window.location.pathname}`;
  let saveTimer = 0;
  let scrollFrame = 0;

  function saveReadingPosition() {
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
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    readingSystem.style.setProperty("--reading-progress-value", String(progress));
    if (progressLabel) progressLabel.textContent = String(Math.round(progress * 100)).padStart(3, "0");
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

  function finishEntryTransition() {
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
      || event.detail === 0
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || reduceMotion
      || !preferences.articleTransition
    ) return;

    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.hash && destination.pathname === window.location.pathname) return;

    event.preventDefault();
    saveReadingPosition();
    transitionLayer?.setAttribute("aria-hidden", "false");
    readingSystem.dataset.transitionState = "covering";
    window.setTimeout(() => window.location.assign(destination.href), 290);
  }

  readingSystem.querySelectorAll("[data-reading-transition]").forEach((anchor) => {
    anchor.addEventListener("click", navigateWithTransition);
  });

  readingSystem.querySelectorAll('a[href^="http"]').forEach((anchor) => {
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin === window.location.origin || preferences.externalLinks !== "NEW") return;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
  });

  if (preferences.smartPreload && !preferences.dataSaver) {
    const preload = () => {
      readingSystem.querySelectorAll(".record-neighbours a[href]").forEach((anchor) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = anchor.href;
        document.head.append(link);
      });
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 1800 });
    else window.setTimeout(preload, 700);
  }

  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestProgressUpdate, { passive: true });
  window.addEventListener("pagehide", saveReadingPosition);
  window.addEventListener("load", () => {
    restoreReadingPosition();
    updateProgress();
  }, { once: true });

  if (readingContent) {
    const resizeObserver = new ResizeObserver(requestProgressUpdate);
    resizeObserver.observe(readingContent);
  }

  updateProgress();
  finishEntryTransition();
}
