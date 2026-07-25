import { sceneArt } from "./config.js";
import { all, required, updatePressed } from "./dom.js";

const VARIANT_STORAGE_KEY = "lonely-sea-load-variant-v4";
const LAST_LOAD_STORAGE_KEY = "lonely-sea-last-load";
const VARIANTS = new Set([
  "memory",
  "list",
  "editorial",
  "moon",
  "dossier",
  "tide",
  "vnclassic",
  "tsukihime",
  "cartagra",
  "tracks",
  "tracks-xi",
  "tracks-xii",
]);
const GAME_VARIANTS = new Set(["moon", "dossier", "tide", "vnclassic", "tsukihime", "cartagra"]);
const SLOT_CAPACITY = 24;

export function initLoadScreen({ reduceMotion }) {
  const postSlots = all("[data-post-slot]");
  const emptySlots = all("[data-empty-slot]");
  const saveSlots = [...postSlots, ...emptySlots];
  const loadGrid = required(".save-grid");
  const loadCanvas = required(".load-legacy-canvas");
  const loadScreenRoot = required(".load-screen");
  const tracksCanvas = required(".load-tracks-canvas");
  const tracksXiCanvas = required(".load-tracks-xi-canvas");
  const tracksXiiCanvas = required(".load-tracks-xii-canvas");
  const loadSurface = required(".load-view-surface");
  const loadPageLabel = required("#load-page-label");
  const loadPageProgress = required("#load-page-progress");
  const loadPageNumbers = required("#load-page-numbers");
  const loadPageButtons = all("[data-load-page-direction]");
  const previewArtLayers = all("[data-load-preview-art]");
  const previewCopy = required("[data-load-preview-copy]");
  const previewLabel = required("[data-load-preview-label]");
  const previewDate = required("[data-load-preview-date]");
  const previewNumber = required("[data-load-preview-number]");
  const previewTitle = required("[data-load-preview-title]");
  const previewExcerpt = required("[data-load-preview-excerpt]");
  const articleLaunch = required("#article-launch");
  const articleLaunchArt = required("#article-launch-art");
  const articleLaunchBack = required("#article-launch-back");
  const routeCurtain = required("#route-curtain");

  let variant = readVariant();
  let device = "a";
  let category = "all";
  let loadPage = 0;
  let articleNavigationTimers = [];
  let viewTransitionTimers = [];
  let previewCopyTimer = 0;
  let previewArtIndex = 0;
  let activeSlot = null;
  let activePreviewCover = "";
  let referenceControllers = {};

  function readVariant() {
    try {
      const stored = localStorage.getItem(VARIANT_STORAGE_KEY);
      return VARIANTS.has(stored) ? stored : "tracks-xii";
    } catch {
      return "tracks-xii";
    }
  }

  function persistVariant() {
    try {
      localStorage.setItem(VARIANT_STORAGE_KEY, variant);
    } catch {}
  }

  function readLastLoad() {
    try {
      return localStorage.getItem(LAST_LOAD_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  }

  function markLastLoad() {
    const lastHref = readLastLoad();
    postSlots.forEach((slot) => {
      slot.classList.toggle("is-last-load", Boolean(lastHref) && slot.dataset.href === lastHref);
    });
  }

  function visibleSlots() {
    if (variant === "memory" || GAME_VARIANTS.has(variant)) {
      if (device === "b") return [...emptySlots].slice(0, SLOT_CAPACITY);
      return [...postSlots, ...emptySlots.slice(0, Math.max(0, SLOT_CAPACITY - postSlots.length))];
    }
    const matched = category === "all"
      ? postSlots
      : postSlots.filter((slot) => slot.dataset.category === category);
    return [...matched, ...emptySlots.slice(0, Math.max(0, SLOT_CAPACITY - matched.length))];
  }

  function totalPages() {
    const count = visibleSlots().length;
    if (variant === "editorial") {
      return Math.max(1, 1 + Math.ceil(Math.max(0, count - 5) / 6));
    }
    const capacity = variant === "vnclassic" ? 8 : 6;
    return Math.max(1, Math.ceil(count / capacity));
  }

  function pageItems() {
    const items = visibleSlots();
    if (variant === "editorial") {
      if (loadPage === 0) return items.slice(0, 5);
      const start = 5 + (loadPage - 1) * 6;
      return items.slice(start, start + 6);
    }
    const capacity = variant === "vnclassic" ? 8 : 6;
    return items.slice(loadPage * capacity, loadPage * capacity + capacity);
  }

  function previewData(slot) {
    if (!slot) {
      return {
        cover: sceneArt.mist || "/assets/lonely-sea/mist.png",
        date: "----.--.--",
        excerpt: device === "b" ? "游戏记录将在内容接入后显示于此。" : "此记录尚未写入。",
        label: device === "b" ? "GAME RECORD" : "NO DATA",
        number: "--",
        title: device === "b" ? "NO GAME RECORDS" : "EMPTY RECORD",
      };
    }

    const numberText = slot.querySelector(".slot-number")?.textContent || "";
    return {
      cover: slot.dataset.cover || sceneArt[slot.dataset.thumb || "mist"] || sceneArt.mist,
      date: slot.dataset.savedAt || slot.dataset.date || "----.--.--",
      excerpt: slot.dataset.excerpt || "此记录没有附加说明。",
      label: slot.dataset.label || "READING RECORD",
      number: numberText.match(/\d+/)?.[0] || "--",
      title: slot.querySelector(".slot-title")?.textContent?.trim() || "UNTITLED RECORD",
    };
  }

  function applyPreviewCopy(data) {
    previewLabel.textContent = data.label;
    previewDate.textContent = data.date;
    previewNumber.textContent = data.number;
    previewTitle.textContent = data.title;
    previewExcerpt.textContent = data.excerpt;
  }

  function applyPreviewArt(cover, { instant = false } = {}) {
    if (!cover || cover === activePreviewCover) return;
    activePreviewCover = cover;
    const currentLayer = previewArtLayers[previewArtIndex];
    const nextIndex = (previewArtIndex + 1) % previewArtLayers.length;
    const nextLayer = previewArtLayers[nextIndex];
    nextLayer.style.setProperty("--focus-art", "url(" + JSON.stringify(cover) + ")");

    if (instant || reduceMotion.matches) {
      previewArtLayers.forEach((layer) => layer.classList.remove("is-active"));
      nextLayer.classList.add("is-active");
    } else {
      requestAnimationFrame(() => {
        nextLayer.classList.add("is-active");
        currentLayer.classList.remove("is-active");
      });
    }
    previewArtIndex = nextIndex;
  }

  function focusSlot(slot, { force = false, instant = false } = {}) {
    if (!force && slot === activeSlot) return;
    activeSlot = slot;
    saveSlots.forEach((candidate) => candidate.classList.toggle("is-focus-current", candidate === slot));

    const data = previewData(slot);
    applyPreviewArt(data.cover, { instant });
    window.clearTimeout(previewCopyTimer);
    if (instant || reduceMotion.matches) {
      previewCopy.classList.remove("is-changing");
      applyPreviewCopy(data);
      return;
    }

    previewCopy.classList.add("is-changing");
    previewCopyTimer = window.setTimeout(() => {
      applyPreviewCopy(data);
      previewCopy.classList.remove("is-changing");
    }, 90);
  }

  function clearViewTransition() {
    viewTransitionTimers.forEach((timer) => window.clearTimeout(timer));
    viewTransitionTimers = [];
    loadSurface.classList.remove("is-leaving", "is-entering");
  }

  function transitionView(commit, { animate = true } = {}) {
    clearViewTransition();
    if (!animate || reduceMotion.matches) {
      commit();
      return;
    }

    loadSurface.classList.add("is-leaving");
    viewTransitionTimers.push(window.setTimeout(() => {
      commit();
      loadSurface.classList.remove("is-leaving");
      loadSurface.classList.add("is-entering");
      void loadSurface.offsetWidth;
      viewTransitionTimers.push(window.setTimeout(() => {
        loadSurface.classList.remove("is-entering");
      }, 16));
    }, 110));
  }

  function renderPageNumbers(total) {
    loadPageNumbers.textContent = "";
    for (let index = 0; index < total; index += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-number";
      button.textContent = String(index + 1).padStart(2, "0");
      button.setAttribute("aria-label", "第 " + (index + 1) + " 页");
      button.setAttribute("aria-pressed", String(index === loadPage));
      button.addEventListener("click", () => goToPage(index));
      loadPageNumbers.appendChild(button);
    }
  }

  function formatSlotNumber(index) {
    const number = String(index + 1).padStart(2, "0");
    if (variant === "vnclassic") return "SAVE " + number;
    if (variant === "cartagra") return "記録 " + number;
    return "No." + number;
  }

  function renderPage({ previewInstant = false } = {}) {
    const items = visibleSlots();
    const total = totalPages();
    loadPage = Math.max(0, Math.min(loadPage, total - 1));
    const shown = new Set(pageItems());

    saveSlots.forEach((slot) => {
      const isShown = shown.has(slot);
      slot.classList.toggle("is-page-hidden", !isShown);
      slot.classList.remove("is-featured");
      if (isShown) {
        const numberNode = slot.querySelector(".slot-number");
        if (numberNode) {
          numberNode.textContent = formatSlotNumber(items.indexOf(slot));
        }
      }
    });

    if (variant === "editorial" && loadPage === 0) {
      const firstPost = pageItems().find((slot) => !slot.classList.contains("is-empty"));
      if (firstPost) firstPost.classList.add("is-featured");
    }

    const shownPost = pageItems().find((slot) => !slot.classList.contains("is-empty"));
    const nextFocus = activeSlot && shown.has(activeSlot) && !activeSlot.classList.contains("is-empty")
      ? activeSlot
      : shownPost || null;
    focusSlot(nextFocus, { force: true, instant: previewInstant });

    loadCanvas.dataset.hasMultiplePages = String(total > 1);
    loadCanvas.dataset.loadDevice = device;
    loadGrid.dataset.page = String(loadPage + 1);
    loadPageLabel.textContent = "PAGE " + String(loadPage + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    loadPageProgress.style.width = ((loadPage + 1) / total) * 100 + "%";
    loadPageButtons.forEach((button) => {
      const direction = Number(button.dataset.loadPageDirection);
      button.disabled = direction < 0 ? loadPage === 0 : loadPage >= total - 1;
    });
    renderPageNumbers(total);
  }

  function changePage(direction) {
    goToPage(loadPage + direction);
  }

  function goToPage(nextPage) {
    const clamped = Math.max(0, Math.min(nextPage, totalPages() - 1));
    if (clamped === loadPage) return;
    transitionView(() => {
      loadPage = clamped;
      activeSlot = null;
      renderPage({ previewInstant: true });
    });
  }

  function applyVariant(next, { animate = true, persist = true } = {}) {
    if (!VARIANTS.has(next) || next === variant && animate) return;
    const focusedElement = document.activeElement instanceof Element
      ? document.activeElement
      : null;
    const focusedVariantOption = focusedElement?.closest("[data-load-variant-option]");
    const focusWasInsideCanvas = [loadCanvas, tracksCanvas, tracksXiCanvas, tracksXiiCanvas].some(
      (canvas) => focusedElement && canvas.contains(focusedElement),
    );

    transitionView(() => {
      variant = next;
      loadCanvas.dataset.loadVariant = next;
      const previousReference = loadScreenRoot.dataset.loadReference || "legacy";
      const nextReference = {
        tracks: "tracks",
        "tracks-xi": "tracks-xi",
        "tracks-xii": "tracks-xii",
      }[next] ?? "legacy";
      referenceControllers[previousReference]?.deactivate?.();
      loadScreenRoot.dataset.loadReference = nextReference;
      loadCanvas.setAttribute("aria-hidden", String(nextReference !== "legacy"));
      tracksCanvas.setAttribute("aria-hidden", String(nextReference !== "tracks"));
      tracksXiCanvas.setAttribute("aria-hidden", String(nextReference !== "tracks-xi"));
      tracksXiiCanvas.setAttribute("aria-hidden", String(nextReference !== "tracks-xii"));
      updatePressed("[data-load-variant-option]", next, "loadVariantOption");
      loadPage = 0;
      activeSlot = null;
      renderPage({ previewInstant: true });
      referenceControllers[nextReference]?.activate?.();
      if (focusWasInsideCanvas) {
        const targetCanvas = {
          legacy: loadCanvas,
          tracks: tracksCanvas,
          "tracks-xi": tracksXiCanvas,
          "tracks-xii": tracksXiiCanvas,
        }[nextReference];
        const matchingVariantOption = [...targetCanvas.querySelectorAll("[data-load-variant-option]")]
          .find((button) => button.dataset.loadVariantOption === next);
        const focusTarget = focusedVariantOption
          ? matchingVariantOption
          : targetCanvas.querySelector("[data-back]");
        window.requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
      }
      if (persist) persistVariant();
    }, { animate });
  }

  function clearArticleNavigation() {
    articleNavigationTimers.forEach((timer) => window.clearTimeout(timer));
    articleNavigationTimers = [];
    routeCurtain.classList.remove("is-covering");
    routeCurtain.setAttribute("aria-hidden", "true");
  }

  function openArticle(slot) {
    clearArticleNavigation();
    focusSlot(slot, { instant: true });
    saveSlots.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === slot));
    const cover = slot.dataset.cover || sceneArt[slot.dataset.thumb || "mist"] || sceneArt.mist;
    const thumb = "url(" + JSON.stringify(cover) + ")";
    const title = slot.querySelector(".slot-title").textContent.trim();
    const href = slot.dataset.href;

    articleLaunchArt.style.setProperty("--article-art", thumb);
    required("#article-launch-title").textContent = title;
    required("#article-launch-meta").textContent = (slot.dataset.label || "") + " / " + (slot.dataset.savedAt || slot.dataset.date || "");
    required("#article-launch-excerpt").textContent = slot.dataset.excerpt || "";
    required("#article-launch-path").textContent = href || "ARTICLE LINK UNAVAILABLE";
    articleLaunch.setAttribute("aria-hidden", "false");
    articleLaunchBack.focus({ preventScroll: true });
    if (!href) return;

    try {
      localStorage.setItem(LAST_LOAD_STORAGE_KEY, href);
    } catch {}
    markLastLoad();

    articleNavigationTimers.push(window.setTimeout(() => {
      routeCurtain.setAttribute("aria-hidden", "false");
      routeCurtain.classList.add("is-covering");
    }, reduceMotion.matches ? 0 : 260));
    articleNavigationTimers.push(window.setTimeout(() => {
      window.location.assign(href);
    }, reduceMotion.matches ? 0 : 760));
  }

  function closeArticle() {
    if (articleLaunch.getAttribute("aria-hidden") === "true") return false;
    clearArticleNavigation();
    articleLaunch.setAttribute("aria-hidden", "true");
    activeSlot?.focus({ preventScroll: true });
    return true;
  }

  all("[data-device-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextDevice = button.dataset.deviceTab;
      if (nextDevice === device) return;
      transitionView(() => {
        device = nextDevice;
        updatePressed("[data-device-tab]", device, "deviceTab");
        loadPage = 0;
        activeSlot = null;
        renderPage({ previewInstant: true });
      });
    });
  });

  all("[data-archive-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextCategory = button.dataset.archiveTab;
      if (nextCategory === category) return;
      transitionView(() => {
        category = nextCategory;
        updatePressed("[data-archive-tab]", category, "archiveTab");
        saveSlots.forEach((slot) => slot.classList.remove("is-selected"));
        loadPage = 0;
        activeSlot = null;
        renderPage({ previewInstant: true });
      });
    });
  });

  all("[data-load-variant-option]").forEach((button) => {
    button.addEventListener("click", () => applyVariant(button.dataset.loadVariantOption));
  });

  document.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (document.body.dataset.route !== "load") return;
    const variantByKey = {
      1: "memory",
      2: "list",
      3: "editorial",
      4: "moon",
      5: "dossier",
      6: "tide",
      7: "vnclassic",
      8: "tsukihime",
      9: "cartagra",
      0: "tracks",
      "-": "tracks-xi",
      "=": "tracks-xii",
    }[event.key];
    if (variantByKey) {
      event.preventDefault();
      applyVariant(variantByKey);
      return;
    }

    if (GAME_VARIANTS.has(variant) && ["ArrowUp", "ArrowDown"].includes(event.key)) {
      const selectable = pageItems().filter((slot) => !slot.classList.contains("is-empty"));
      if (!selectable.length) return;
      const current = selectable.indexOf(activeSlot);
      const direction = event.key === "ArrowUp" ? -1 : 1;
      const next = current < 0
        ? selectable[0]
        : selectable[(current + direction + selectable.length) % selectable.length];
      event.preventDefault();
      focusSlot(next, { instant: true });
      next.focus({ preventScroll: true });
    }
  });

  loadPageButtons.forEach((button) => {
    button.addEventListener("click", () => changePage(Number(button.dataset.loadPageDirection)));
  });
  postSlots.forEach((slot) => {
    slot.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") focusSlot(slot);
    });
    slot.addEventListener("focus", () => focusSlot(slot));
    slot.addEventListener("click", () => openArticle(slot));
  });
  articleLaunchBack.addEventListener("click", closeArticle);

  markLastLoad();
  applyVariant(variant, { animate: false, persist: false });

  return {
    changePage,
    closeArticle,
    getActiveController() {
      return referenceControllers[loadScreenRoot.dataset.loadReference] || null;
    },
    registerReferenceControllers(controllers) {
      referenceControllers = controllers;
      referenceControllers[loadScreenRoot.dataset.loadReference]?.activate?.();
    },
  };
}
