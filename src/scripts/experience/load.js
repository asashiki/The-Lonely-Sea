import { sceneArt } from "./config.js";
import { all, required, updatePressed } from "./dom.js";

export function initLoadScreen({ reduceMotion }) {
  const saveSlots = all(".save-slot");
  const loadGrid = required(".save-grid");
  const loadCanvas = required(".load-canvas");
  const loadEmpty = required("#load-empty");
  const loadPageLabel = required("#load-page-label");
  const loadPageProgress = required("#load-page-progress");
  const loadPageButtons = all("[data-load-page-direction]");
  const articleLaunch = required("#article-launch");
  const articleLaunchArt = required("#article-launch-art");
  const articleLaunchBack = required("#article-launch-back");
  const routeCurtain = required("#route-curtain");

  let loadPage = 0;
  let articleNavigationTimers = [];

  function filteredSlots() {
    return saveSlots.filter((slot) => !slot.hidden);
  }

  function totalPages() {
    const count = filteredSlots().length;
    return count <= 5 ? 1 : 1 + Math.ceil((count - 5) / 6);
  }

  function pageItems() {
    const items = filteredSlots();
    if (loadPage === 0) return items.slice(0, 5);
    const start = 5 + (loadPage - 1) * 6;
    return items.slice(start, start + 6);
  }

  function renderPage() {
    const total = totalPages();
    loadCanvas.dataset.hasMultiplePages = String(total > 1);
    loadPage = Math.max(0, Math.min(loadPage, total - 1));
    const shown = new Set(pageItems());

    saveSlots.forEach((slot) => {
      slot.classList.toggle("is-page-hidden", !shown.has(slot));
      slot.classList.remove("is-featured");
    });

    const first = pageItems()[0];
    if (loadPage === 0 && first) first.classList.add("is-featured");
    loadEmpty.hidden = filteredSlots().length > 0;
    loadGrid.dataset.page = String(loadPage + 1);
    loadPageLabel.textContent = `PAGE ${String(loadPage + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    loadPageProgress.style.width = `${(loadPage + 1) / total * 100}%`;
    loadPageButtons.forEach((button) => {
      const direction = Number(button.dataset.loadPageDirection);
      button.disabled = direction < 0 ? loadPage === 0 : loadPage >= total - 1;
    });
  }

  function changePage(direction) {
    loadPage += direction;
    renderPage();
  }

  function clearArticleNavigation() {
    articleNavigationTimers.forEach((timer) => window.clearTimeout(timer));
    articleNavigationTimers = [];
    routeCurtain.classList.remove("is-covering");
    routeCurtain.setAttribute("aria-hidden", "true");
  }

  function openArticle(slot) {
    clearArticleNavigation();
    saveSlots.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === slot));
    const thumb = slot.querySelector(".slot-thumb").style.getPropertyValue("--thumb")
      || `url(${sceneArt[slot.dataset.thumb || "mist"]})`;
    const title = slot.querySelector(".slot-title").textContent.trim();
    const meta = slot.querySelector(".slot-meta").textContent.trim();
    const href = slot.dataset.href;

    articleLaunchArt.style.setProperty("--article-art", thumb);
    required("#article-launch-title").textContent = title;
    required("#article-launch-meta").textContent = `${meta} / ${slot.dataset.date}`;
    required("#article-launch-excerpt").textContent = slot.dataset.excerpt;
    required("#article-launch-path").textContent = href || "ARTICLE LINK UNAVAILABLE";
    articleLaunch.setAttribute("aria-hidden", "false");
    articleLaunchBack.focus({ preventScroll: true });
    if (!href) return;

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
    return true;
  }

  all("[data-archive-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.archiveTab;
      updatePressed("[data-archive-tab]", category, "archiveTab");
      saveSlots.forEach((slot) => {
        slot.hidden = category !== "all" && slot.dataset.category !== category;
        slot.classList.remove("is-selected");
      });
      filteredSlots()[0]?.classList.add("is-selected");
      loadPage = 0;
      renderPage();
    });
  });
  loadPageButtons.forEach((button) => {
    button.addEventListener("click", () => changePage(Number(button.dataset.loadPageDirection)));
  });
  saveSlots.forEach((slot) => slot.addEventListener("click", () => openArticle(slot)));
  articleLaunchBack.addEventListener("click", closeArticle);
  renderPage();

  return {
    changePage,
    closeArticle,
  };
}
