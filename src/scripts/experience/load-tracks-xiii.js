import {
  GAL_BLOG_SAVE_CHANGE_EVENT,
  listGalBlogManualSaves,
} from "../../lib/gal-blog/save-store";
import { recordBlogActivity } from "../../lib/blog-activity";

const LAST_LOAD_STORAGE_KEY = "lonely-sea-last-load";
const KEYBOARD_CURSOR_STORAGE_KEY = "lonely-sea-load-keyboard-cursor";
const PAGE_CAPACITY = 6;
const ARTICLE_SLOT_CAPACITY = 24;
const VIEW_DURATION = 270;
const PAGE_DURATION = 520;
const FLOW_DURATION = 460;

/**
 * @param {{
 *   reduceMotion: { matches: boolean },
 *   initialPage?: string,
 *   initialGameFilter?: string,
 *   root?: Document | HTMLElement,
 *   initialSaveOperation?: "save" | "load",
 *   onBack?: () => void,
 *   onArticleOpen?: (href: string) => void,
 *   onSaveSlot?: (detail: { slot: number, existingSaveId: string }) => void,
 * }} options
 */
export function initLoadTracksXiiiConcept({
  reduceMotion,
  initialPage = "articles",
  initialGameFilter = "story",
  root = document,
  initialSaveOperation = "load",
  onBack = () => {},
  onArticleOpen = null,
  onSaveSlot = () => {},
}) {
  const loadCanvas = root.matches?.(".tracks-xiii-canvas")
    ? root
    : root.querySelector(".tracks-xiii-canvas");
  if (!loadCanvas) {
    return {
      activate() {},
      changePage() {},
      closeArticle() {
        return false;
      },
      deactivate() {},
      refreshSaves() {},
      setSaveOperation() {},
    };
  }

  const all = (selector, scope = loadCanvas) => [...scope.querySelectorAll(selector)];
  const required = (selector, scope = loadCanvas) => {
    const node = scope.querySelector(selector);
    if (!node) throw new Error("Missing LOAD XIII node: " + selector);
    return node;
  };

  const pageEntrances = all("[data-xiii-page-entry]");
  const indexGroups = all("[data-xiii-index-group]");
  const panels = all("[data-xiii-panel]");
  const gameViews = all("[data-xiii-game-view]");
  const articleSlots = all("[data-xiii-article-slot]");
  const articleEmptySlots = all("[data-xiii-article-empty]");
  const saveSlots = all("[data-xiii-save-slot]");
  const articleGrid = required("[data-xiii-article-grid]");
  const saveGrid = required(".tracks-xiii-save-grid");
  const stage = required(".tracks-xiii-stage");
  const index = required(".tracks-xiii-index");
  const indexStack = required(".tracks-xiii-index-stack");
  const view = required("[data-xiii-view-transition]");
  const pageControls = required("[data-xiii-page-controls]");
  const pageButtons = all("[data-xiii-page-direction]");
  const pageNav = required("[data-xiii-page-nav]");
  const pageMarkers = required("[data-xiii-page-markers]");
  const pageStatus = required("[data-xiii-page-status]");
  const routeCurtain = root.querySelector("#route-curtain") || document.querySelector("#route-curtain");
  const flowShell = required("[data-xiii-flow-shell]");
  const flowExpand = required("[data-xiii-flow-expand]");
  const flowViewport = required("[data-xiii-flow-viewport]");
  const flowMaps = all("[data-xiii-flow-map]");
  const flowNodes = all("[data-xiii-flow-node]");
  const flowThemeButtons = all("[data-xiii-flow-theme-option]");
  const flowCaptionNumber = required("[data-xiii-flow-caption-number]");
  const flowCaptionTitle = required("[data-xiii-flow-caption-title]");
  const flowDetailPaper = required(".tracks-xiii-flow-detail-paper");
  const flowDetailArt = required("[data-xiii-flow-detail-art]");
  const flowDetailNumber = required("[data-xiii-flow-detail-number]");
  const flowDetailTitle = required("[data-xiii-flow-detail-title]");
  const flowDetailSummary = required("[data-xiii-flow-detail-summary]");
  const flowScrollIndicator = required("[data-xiii-flow-scroll-indicator]");
  const flowScrollThumb = required("[data-xiii-flow-scroll-thumb]");
  const storyScroll = required("[data-xiii-story-scroll]");
  const storyRail = required("[data-xiii-story-rail]");
  const storyThumb = required("[data-xiii-story-thumb]");
  const storySlots = all("[data-xiii-story-slot]");
  const storyConfirm = required("[data-xiii-story-confirm]");
  const storyConfirmNumber = required("[data-xiii-story-confirm-number]");
  const storyConfirmTitle = required("[data-xiii-story-confirm-title]");
  const storyEnter = required("[data-xiii-story-enter]");
  const storyCancel = required("[data-xiii-story-cancel]");
  const diaryMonths = all("[data-xiii-diary-month]");
  const diaryReader = required("[data-xiii-diary-reader]");
  const diaryReaderArt = required("[data-xiii-diary-reader-art]");
  const diaryReaderDate = required("[data-xiii-diary-reader-date]");
  const diaryReaderTitle = required("[data-xiii-diary-reader-title]");
  const diaryReaderSummary = required("[data-xiii-diary-reader-summary]");
  const diaryReaderLinks = required("[data-xiii-diary-reader-links]");
  const diaryReaderClose = required("[data-xiii-diary-reader-close]");
  const firstDiaryYear = required('[data-xiii-index-group="diary"] [data-xiii-filter]').dataset.xiiiFilter;
  const primaryShell = required(".tracks-xiii-primary-shell");
  const systemBack = required(".system-back");
  const heading = required(".tracks-xiii-heading h2");
  const interfaceInertTargets = [
    systemBack,
    primaryShell,
    index,
    pageControls,
    pageNav,
  ];

  if (!routeCurtain) throw new Error("Missing route curtain");

  const activeFilter = {
    articles: "all",
    game: ["save", "flow", "story"].includes(initialGameFilter) ? initialGameFilter : "story",
    diary: firstDiaryYear,
  };
  const diaryPageByYear = {};
  const flowScrollByTheme = { blue: 0, red: 0 };
  const selectedFlowNodeByTheme = {};

  flowMaps.forEach((map) => {
    const theme = map.dataset.xiiiFlowMap;
    selectedFlowNodeByTheme[theme] = map.querySelector("[data-xiii-flow-node][aria-pressed='true']")
      || map.querySelector("[data-xiii-flow-node]");
  });

  let activePage = ["articles", "game", "diary"].includes(initialPage) ? initialPage : "articles";
  let articlePage = 0;
  let savePage = 0;
  let flowTheme = "blue";
  let flowExpanded = false;
  let flowAnimation = null;
  let flowDetailRevealTimer = 0;
  let flowThemeSerial = 0;
  let flowThemeAnimations = [];
  let flowDrag = null;
  let diaryReaderAnimation = null;
  let diaryReaderTrigger = null;
  let storyTrigger = null;
  let articleNavigationTimers = [];
  let transitionSerial = 0;
  let transitionGhost = null;
  let transitionIncomingGhost = null;
  let transitionIndexGhost = null;
  let transitionIncomingIndexGhost = null;
  let transitionAnimations = [];
  let transitionCleanupTimer = 0;
  let saveFeedbackTimer = 0;
  let keyboardCursorEnabled = true;
  let keyboardCursorItem = null;
  let saveOperation = initialSaveOperation === "save" ? "save" : "load";

  try {
    keyboardCursorEnabled = localStorage.getItem(KEYBOARD_CURSOR_STORAGE_KEY) !== "false";
  } catch {}
  loadCanvas.classList.toggle("is-keyboard-cursor-enabled", keyboardCursorEnabled);

  function dispatchCue(cue, detail = {}) {
    window.dispatchEvent(new CustomEvent("lonely-sea:ui-cue", {
      detail: { cue, source: "load-xiii", ...detail },
    }));
  }

  function clearTransition() {
    window.clearTimeout(transitionCleanupTimer);
    transitionCleanupTimer = 0;
    transitionAnimations.forEach((animation) => animation.cancel());
    transitionAnimations = [];
    all(".tracks-xiii-view-ghost, .tracks-xiii-index-ghost").forEach((ghost) => ghost.remove());
    transitionGhost?.remove();
    transitionGhost = null;
    transitionIncomingGhost?.remove();
    transitionIncomingGhost = null;
    transitionIndexGhost?.remove();
    transitionIndexGhost = null;
    transitionIncomingIndexGhost?.remove();
    transitionIncomingIndexGhost = null;
    view.style.removeProperty("visibility");
    indexStack.style.removeProperty("visibility");
    articleGrid.classList.remove("is-flipping");
  }

  function clearFlowThemeAnimations() {
    flowThemeAnimations.forEach((animation) => animation.cancel());
    flowThemeAnimations = [];
  }

  function clearArticleNavigation() {
    articleNavigationTimers.forEach((timer) => window.clearTimeout(timer));
    articleNavigationTimers = [];
    routeCurtain.classList.remove("is-covering");
    routeCurtain.setAttribute("aria-hidden", "true");
  }

  function setInterfaceInert(inert) {
    interfaceInertTargets.forEach((target) => {
      target.inert = inert;
    });
  }

  function runTransition(commit, { animate = true, direction = 0 } = {}) {
    const serial = ++transitionSerial;
    if (!animate || reduceMotion.matches) {
      clearTransition();
      commit();
      return;
    }

    clearTransition();
    const ghost = view.cloneNode(true);
    ghost.classList.add("tracks-xiii-view-ghost");
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    all("[id]", ghost).forEach((node) => node.removeAttribute("id"));
    stage.appendChild(ghost);
    transitionGhost = ghost;
    if (direction === 0) {
      const indexGhost = indexStack.cloneNode(true);
      indexGhost.classList.add("tracks-xiii-index-ghost");
      indexGhost.setAttribute("aria-hidden", "true");
      indexGhost.inert = true;
      all("[id]", indexGhost).forEach((node) => node.removeAttribute("id"));
      index.appendChild(indexGhost);
      transitionIndexGhost = indexGhost;
    }
    commit();

    const incomingGhost = view.cloneNode(true);
    incomingGhost.classList.add("tracks-xiii-view-ghost", "is-incoming");
    incomingGhost.setAttribute("aria-hidden", "true");
    incomingGhost.inert = true;
    all("[id]", incomingGhost).forEach((node) => node.removeAttribute("id"));
    stage.appendChild(incomingGhost);
    transitionIncomingGhost = incomingGhost;
    view.style.visibility = "hidden";

    if (transitionIndexGhost) {
      const incomingIndexGhost = indexStack.cloneNode(true);
      incomingIndexGhost.classList.add("tracks-xiii-index-ghost", "is-incoming");
      incomingIndexGhost.setAttribute("aria-hidden", "true");
      incomingIndexGhost.inert = true;
      all("[id]", incomingIndexGhost).forEach((node) => node.removeAttribute("id"));
      index.appendChild(incomingIndexGhost);
      transitionIncomingIndexGhost = incomingIndexGhost;
      indexStack.style.visibility = "hidden";
    }

    const duration = direction === 0 ? VIEW_DURATION : PAGE_DURATION;
    const travel = direction === 0 ? 0 : direction * 12;
    const easing = direction === 0
      ? "cubic-bezier(0.22, 1, 0.36, 1)"
      : "cubic-bezier(0.25, 1, 0.5, 1)";
    transitionAnimations = [
      ghost.animate(
        [
          { opacity: 1, transform: "translate3d(0,0,0)" },
          {
            opacity: 0,
            transform: direction === 0
              ? "translate3d(0,.45vh,0)"
              : `translate3d(${-travel}vw,0,0)`,
          },
        ],
        { duration, easing, fill: "both" },
      ),
      incomingGhost.animate(
        [
          {
            opacity: 0,
            transform: direction === 0
              ? "translate3d(0,-.35vh,0)"
              : `translate3d(${travel}vw,0,0)`,
          },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        { duration, easing, fill: "both" },
      ),
    ];
    if (transitionIndexGhost && transitionIncomingIndexGhost) {
      transitionAnimations.push(
        transitionIndexGhost.animate(
          [
            { opacity: 1, transform: "translate3d(0,0,0)" },
            { opacity: 0, transform: "translate3d(0,.3vh,0)" },
          ],
          { duration, easing, fill: "both" },
        ),
        transitionIncomingIndexGhost.animate(
          [
            { opacity: 0, transform: "translate3d(0,-.25vh,0)" },
            { opacity: 1, transform: "translate3d(0,0,0)" },
          ],
          { duration, easing, fill: "both" },
        ),
      );
    }
    Promise.allSettled(transitionAnimations.map((animation) => animation.finished))
      .then(() => {
        if (serial === transitionSerial) clearTransition();
      });
    transitionCleanupTimer = window.setTimeout(() => {
      if (serial === transitionSerial) clearTransition();
    }, duration + 100);
  }

  function runArticleFilterTransition(commit, { animate = true, direction = 1 } = {}) {
    const serial = ++transitionSerial;
    if (!animate || reduceMotion.matches) {
      clearTransition();
      commit();
      return;
    }

    clearTransition();
    articleGrid.classList.add("is-flipping");
    const visibleSlots = all(
      ".tracks-xiii-record-slot:not(.is-page-hidden)",
      articleGrid,
    );
    const travel = Math.max(96, (visibleSlots[0]?.getBoundingClientRect().height || 160) * .92);
    const visibleSlotContent = () => all(
      ".tracks-xiii-record-slot:not(.is-page-hidden) > *",
      articleGrid,
    );
    const outgoing = visibleSlotContent().map((node) => node.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: .08, transform: `translate3d(0, ${-direction * travel}px, 0)` },
      ],
      {
        duration: 220,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        fill: "both",
      },
    ));
    transitionAnimations = outgoing;

    Promise.allSettled(outgoing.map((animation) => animation.finished))
      .then(() => {
        if (serial !== transitionSerial) return;
        outgoing.forEach((animation) => animation.cancel());
        transitionAnimations = [];
        commit();

        const incoming = visibleSlotContent().map((node) => node.animate(
          [
            { opacity: .08, transform: `translate3d(0, ${direction * travel}px, 0)` },
            { opacity: 1, transform: "translate3d(0,0,0)" },
          ],
          {
            duration: 260,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both",
          },
        ));
        transitionAnimations = incoming;
        return Promise.allSettled(incoming.map((animation) => animation.finished));
      })
      .then(() => {
        if (serial === transitionSerial) clearTransition();
      });
  }

  function articleItems() {
    const filter = activeFilter.articles;
    const matched = filter === "all"
      ? articleSlots
      : articleSlots.filter((slot) => slot.dataset.category === filter);
    return [
      ...matched,
      ...articleEmptySlots.slice(0, Math.max(0, ARTICLE_SLOT_CAPACITY - matched.length)),
    ];
  }

  function articleTotalPages() {
    return Math.max(1, Math.ceil(articleItems().length / PAGE_CAPACITY));
  }

  function setPagedSlotVisible(slot, visible) {
    slot.classList.toggle("is-page-hidden", !visible);
    slot.setAttribute("aria-hidden", String(!visible));
    if (slot.matches("button")) slot.tabIndex = visible ? 0 : -1;
  }

  function renderArticlePage() {
    const items = articleItems();
    const total = articleTotalPages();
    articlePage = Math.max(0, Math.min(articlePage, total - 1));
    const start = articlePage * PAGE_CAPACITY;
    const shown = new Set(items.slice(start, start + PAGE_CAPACITY));
    items.forEach((slot, index) => {
      const number = slot.querySelector(".tracks-xiii-slot-number");
      if (number) number.textContent = String(index + 1).padStart(2, "0");
    });
    articleSlots.forEach((slot) => setPagedSlotVisible(slot, shown.has(slot)));
    articleEmptySlots.forEach((slot) => setPagedSlotVisible(slot, shown.has(slot)));
  }

  function saveItems() {
    return saveSlots;
  }

  function formatElapsed(elapsedMs) {
    if (!Number.isFinite(elapsedMs)) return "--:--:--";
    const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return [hours, minutes, seconds % 60].map((value) => String(value).padStart(2, "0")).join(":");
  }

  function formatSavedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return "----.--.-- --:--";
    const parts = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type)?.value || "--";
    return `${part("year")}.${part("month")}.${part("day")} ${part("hour")}:${part("minute")}`;
  }

  function syncSaveSlots() {
    const saves = listGalBlogManualSaves();
    saveSlots.forEach((slot, index) => {
      const save = saves.find((item) => item.slot === index + 1);
      const copy = required(".tracks-xiii-save-copy", slot);
      const labels = all("small > span", copy);
      const title = required("strong", copy);
      const savedAt = required(".tracks-xiii-save-meta time > span", copy);
      const elapsed = required(".tracks-xiii-save-meta > span > span", copy);
      const command = required(".tracks-xiii-save-command", slot);
      slot.dataset.saveNumber = String(index + 1).padStart(2, "0");
      delete slot.dataset.saveConfirm;
      slot.classList.remove("is-save-confirm");
      if (!save) {
        slot.classList.add("is-empty");
        slot.disabled = saveOperation !== "save";
        slot.setAttribute("aria-label", saveOperation === "save"
          ? `保存到空槽位 ${slot.dataset.saveNumber}`
          : "空存档槽位");
        ["saveId", "saveTitle", "saveChapter", "saveSection", "saveProgress", "saveSavedAt", "gameSlug", "releaseId", "savePointId"]
          .forEach((key) => delete slot.dataset[key]);
        slot.style.removeProperty("--save-art");
        labels[0].textContent = "NO SAVE DATA";
        labels[1].textContent = "";
        title.textContent = "EMPTY SLOT";
        savedAt.textContent = "";
        elapsed.textContent = "";
        command.textContent = saveOperation === "save" ? "SAVE" : "LOAD";
        return;
      }
      slot.classList.remove("is-empty");
      slot.disabled = false;
      slot.dataset.saveId = save.id;
      slot.dataset.saveTitle = save.title;
      slot.dataset.saveChapter = save.chapter || "CHECKPOINT";
      slot.dataset.saveSection = save.scene || save.target.id;
      slot.dataset.saveProgress = formatElapsed(save.elapsedMs);
      slot.dataset.saveSavedAt = formatSavedAt(save.savedAt);
      slot.dataset.gameSlug = save.gameSlug;
      slot.dataset.releaseId = save.releaseId;
      slot.dataset.savePointId = save.target.id;
      slot.setAttribute("aria-label", saveOperation === "save"
        ? `覆盖游戏存档 ${slot.dataset.saveNumber}：${save.title}`
        : `读取游戏存档 ${slot.dataset.saveNumber}：${save.title}`);
      if (save.thumbnail) slot.style.setProperty("--save-art", `url(${JSON.stringify(save.thumbnail)})`);
      else slot.style.removeProperty("--save-art");
      labels[0].textContent = slot.dataset.saveChapter;
      labels[1].textContent = slot.dataset.saveSection;
      title.textContent = save.title;
      savedAt.textContent = slot.dataset.saveSavedAt;
      elapsed.textContent = slot.dataset.saveProgress;
      command.textContent = saveOperation === "save" ? "OVERWRITE" : "LOAD";
    });
    heading.textContent = saveOperation === "save" ? "SAVE" : "LOAD";
    loadCanvas.dataset.xiiiSaveOperation = saveOperation;
  }

  function setSaveOperation(operation) {
    saveOperation = operation === "save" ? "save" : "load";
    activePage = "game";
    activeFilter.game = "save";
    savePage = 0;
    syncSaveSlots();
    updateSelectionState();
  }

  function saveTotalPages() {
    return Math.max(1, Math.ceil(saveItems().length / PAGE_CAPACITY));
  }

  function renderSavePage() {
    const items = saveItems();
    const total = saveTotalPages();
    savePage = Math.max(0, Math.min(savePage, total - 1));
    const start = savePage * PAGE_CAPACITY;
    const shown = new Set(items.slice(start, start + PAGE_CAPACITY));
    saveSlots.forEach((slot) => setPagedSlotVisible(slot, shown.has(slot)));
  }

  function diaryEntriesForYear(year) {
    return diaryMonths.filter((month) => month.dataset.diaryYear === year);
  }

  function activeDiaryEntry() {
    const year = activeFilter.diary;
    const entries = diaryEntriesForYear(year);
    const page = Math.max(0, Math.min(diaryPageByYear[year] ?? 0, Math.max(0, entries.length - 1)));
    diaryPageByYear[year] = page;
    return entries[page];
  }

  function renderDiaryMonth() {
    const entry = activeDiaryEntry();
    diaryMonths.forEach((month) => {
      month.setAttribute("aria-hidden", String(month !== entry));
    });
  }

  function paginationModel() {
    if (activePage === "articles") {
      const total = articleTotalPages();
      return {
        active: articlePage,
        labels: Array.from({ length: total }, (_, index) => String(index + 1).padStart(2, "0")),
        mode: "articles",
      };
    }

    if (activePage === "diary") {
      const year = activeFilter.diary;
      const entries = diaryEntriesForYear(year);
      return {
        active: diaryPageByYear[year] ?? 0,
        labels: entries.map((entry) => entry.dataset.xiiiDiaryMonth?.split("-")[1] || "--"),
        mode: "diary",
      };
    }

    if (activePage === "game" && activeFilter.game === "save") {
      const total = saveTotalPages();
      return {
        active: savePage,
        labels: Array.from({ length: total }, (_, index) => String(index + 1).padStart(2, "0")),
        mode: "save",
      };
    }

    return { active: 0, labels: [], mode: "none" };
  }

  function renderPagination() {
    const model = paginationModel();
    const total = model.labels.length;
    const visible = total > 1;
    loadCanvas.dataset.xiiiPageMode = visible ? model.mode : "none";
    pageControls.setAttribute("aria-hidden", String(!visible));
    pageNav.setAttribute("aria-hidden", String(!visible));
    pageMarkers.textContent = "";
    pageStatus.hidden = model.mode !== "diary" || !visible;
    pageStatus.textContent = model.mode === "diary"
      ? (activeDiaryEntry()?.dataset.diaryLabel || "")
      : "";
    pageMarkers.style.setProperty("--xiii-page-index", String(model.active));

    if (!visible) return;

    model.labels.forEach((label, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.setAttribute(
        "aria-label",
        model.mode === "diary" ? label + " 月" : "第 " + (index + 1) + " 页",
      );
      button.setAttribute("aria-pressed", String(index === model.active));
      button.addEventListener("click", (event) => {
        goToPage(index, {
          animate: event.detail > 0,
          direction: index > model.active ? 1 : -1,
        });
      });
      pageMarkers.appendChild(button);
    });

    pageButtons.forEach((button) => {
      const direction = Number(button.dataset.xiiiPageDirection);
      button.disabled = direction < 0 ? model.active === 0 : model.active >= total - 1;
    });
  }

  function updateRovingTabStops() {
    pageEntrances.forEach((button) => {
      button.tabIndex = button.dataset.xiiiPageEntry === activePage ? 0 : -1;
    });
    indexGroups.forEach((group) => {
      const visible = group.dataset.xiiiIndexGroup === activePage;
      all("[data-xiii-filter]", group).forEach((button) => {
        button.tabIndex = visible && button.dataset.xiiiFilter === activeFilter[activePage] ? 0 : -1;
      });
    });
  }

  function updateSelectionState() {
    const section = activeFilter[activePage];
    loadCanvas.dataset.xiiiPage = activePage;
    loadCanvas.dataset.xiiiSection = section;

    pageEntrances.forEach((button) => {
      button.setAttribute(
        "aria-current",
        button.dataset.xiiiPageEntry === activePage ? "page" : "false",
      );
    });

    indexGroups.forEach((group) => {
      const visible = group.dataset.xiiiIndexGroup === activePage;
      group.setAttribute("aria-hidden", String(!visible));
      all("[data-xiii-filter]", group).forEach((button) => {
        button.setAttribute("aria-selected", String(visible && button.dataset.xiiiFilter === section));
      });
    });

    panels.forEach((panel) => {
      panel.setAttribute("aria-hidden", String(panel.dataset.xiiiPanel !== activePage));
    });

    gameViews.forEach((gameView) => {
      gameView.setAttribute(
        "aria-hidden",
        String(activePage !== "game" || gameView.dataset.xiiiGameView !== activeFilter.game),
      );
    });

    if (activePage === "articles") renderArticlePage();
    if (activePage === "game" && activeFilter.game === "save") renderSavePage();
    if (activePage === "diary") renderDiaryMonth();
    renderPagination();
    updateRovingTabStops();
    syncKeyboardCursor();
    window.requestAnimationFrame(() => {
      updateStoryScrollbar();
      updateFlowScrollbar();
    });
  }

  function applyPage(nextPage, { animate = true } = {}) {
    if (!["articles", "game", "diary"].includes(nextPage) || nextPage === activePage) return;
    dispatchCue("confirm", { target: nextPage });
    runTransition(() => {
      activePage = nextPage;
      articlePage = 0;
      savePage = 0;
      updateSelectionState();
    }, { animate });
  }

  function applyFilter(nextFilter, { animate = true } = {}) {
    const group = loadCanvas.querySelector(`[data-xiii-index-group="${activePage}"]`);
    if (!group?.querySelector(`[data-xiii-filter="${CSS.escape(nextFilter)}"]`)) return;
    if (nextFilter === activeFilter[activePage]) return;

    dispatchCue("select", { target: nextFilter });
    const filterButtons = all("[data-xiii-filter]", group);
    const currentFilterIndex = filterButtons.findIndex(
      (button) => button.dataset.xiiiFilter === activeFilter[activePage],
    );
    const nextFilterIndex = filterButtons.findIndex(
      (button) => button.dataset.xiiiFilter === nextFilter,
    );
    const filterDirection = nextFilterIndex >= currentFilterIndex ? 1 : -1;
    const commit = () => {
      activeFilter[activePage] = nextFilter;
      if (activePage === "articles") articlePage = 0;
      if (activePage === "game" && nextFilter === "save") savePage = 0;
      if (activePage === "diary" && diaryPageByYear[nextFilter] === undefined) {
        diaryPageByYear[nextFilter] = 0;
      }
      updateSelectionState();
    };

    if (activePage === "articles") {
      runArticleFilterTransition(commit, { animate, direction: filterDirection });
    } else {
      runTransition(commit, { animate });
    }
  }

  function goToPage(nextPage, { animate = true, direction = 0 } = {}) {
    const model = paginationModel();
    if (model.labels.length <= 1) return;
    const clamped = Math.max(0, Math.min(nextPage, model.labels.length - 1));
    if (clamped === model.active) return;
    const travelDirection = direction || (clamped > model.active ? 1 : -1);

    dispatchCue("page", { direction: travelDirection });
    runTransition(() => {
      if (activePage === "articles") {
        articlePage = clamped;
        renderArticlePage();
      } else if (activePage === "game" && activeFilter.game === "save") {
        savePage = clamped;
        renderSavePage();
      } else if (activePage === "diary") {
        diaryPageByYear[activeFilter.diary] = clamped;
        renderDiaryMonth();
      }
      renderPagination();
      syncKeyboardCursor();
    }, { animate, direction: travelDirection });
  }

  function changePage(direction) {
    if (
      flowExpanded
      || storyConfirm.getAttribute("aria-hidden") === "false"
      || diaryReader.getAttribute("aria-hidden") === "false"
    ) return;
    const model = paginationModel();
    goToPage(model.active + direction, { animate: false, direction });
  }

  function openArticle(slot) {
    const href = slot.dataset.href;
    if (!href) return;
    clearArticleNavigation();
    dispatchCue("confirm", { target: "article" });
    try {
      localStorage.setItem(LAST_LOAD_STORAGE_KEY, href);
    } catch {}

    if (typeof onArticleOpen === "function") {
      onArticleOpen(href);
      return;
    }

    if (reduceMotion.matches) {
      window.location.assign(href);
      return;
    }

    routeCurtain.setAttribute("aria-hidden", "false");
    articleNavigationTimers.push(window.setTimeout(() => {
      routeCurtain.classList.add("is-covering");
    }, 40));
    articleNavigationTimers.push(window.setTimeout(() => {
      window.location.assign(href);
    }, 520));
  }

  function updateFlowCopy(node, { animate = true } = {}) {
    const commit = () => {
      const art = node?.dataset.flowArt;
      const number = node?.dataset.flowNumber || "--";
      if (art) flowDetailArt.style.setProperty("--detail-art", `url("${art}")`);
      flowCaptionNumber.textContent = number;
      flowCaptionTitle.textContent = node?.dataset.flowTitle || "";
      flowDetailNumber.textContent = "SCENE " + number;
      flowDetailTitle.textContent = node?.dataset.flowTitle || "";
      flowDetailSummary.textContent = node?.dataset.flowSummary || "";
    };

    if (!animate || reduceMotion.matches || !flowExpanded) {
      commit();
      return;
    }

    const out = flowDetailPaper.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: .35, transform: "translate3d(.5vw,0,0)" },
      ],
      { duration: 90, easing: "ease-out", fill: "both" },
    );
    out.finished.then(() => {
      commit();
      flowDetailPaper.animate(
        [
          { opacity: .35, transform: "translate3d(.5vw,0,0)" },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        { duration: 160, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
      );
    }).catch(commit);
  }

  function selectFlowNode(node, { animate = true } = {}) {
    const theme = node.dataset.flowTheme;
    selectedFlowNodeByTheme[theme] = node;
    flowNodes
      .filter((candidate) => candidate.dataset.flowTheme === theme)
      .forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === node));
      });
    if (theme === flowTheme) updateFlowCopy(node, { animate });
    dispatchCue("select", { target: "flow-node" });
  }

  function enterFlowNode(node) {
    const gameSlug = node.dataset.gameSlug || "";
    const releaseId = node.dataset.releaseId || "";
    const sceneId = node.dataset.sceneId || "";
    if (!gameSlug || !releaseId || !sceneId) return;
    dispatchCue("confirm", { target: "flow-node" });
    window.dispatchEvent(new CustomEvent("lonely-sea:story-enter", {
      detail: {
        number: node.dataset.flowNumber || "",
        title: node.dataset.flowTitle || "",
        gameSlug,
        releaseId,
        sceneId,
      },
    }));
  }

  async function switchFlowTheme(nextTheme, { animate = true } = {}) {
    if (!["blue", "red"].includes(nextTheme) || nextTheme === flowTheme) return;
    const serial = ++flowThemeSerial;
    const previousMap = flowMaps.find((map) => map.dataset.xiiiFlowMap === flowTheme);
    const nextMap = flowMaps.find((map) => map.dataset.xiiiFlowMap === nextTheme);
    if (!previousMap || !nextMap) return;

    flowScrollByTheme[flowTheme] = flowViewport.scrollTop;
    clearFlowThemeAnimations();
    dispatchCue("select", { target: "flow-" + nextTheme });

    if (animate && !reduceMotion.matches) {
      const fadeOut = previousMap.animate(
        [
          { opacity: 1, transform: "translate3d(0,0,0)" },
          { opacity: 0, transform: "translate3d(-1vw,0,0)" },
        ],
        { duration: 110, easing: "ease-out", fill: "both" },
      );
      flowThemeAnimations = [fadeOut];
      try {
        await fadeOut.finished;
      } catch {
        return;
      }
      if (serial !== flowThemeSerial) return;
    }

    previousMap.setAttribute("aria-hidden", "true");
    previousMap.getAnimations().forEach((animation) => animation.cancel());
    nextMap.setAttribute("aria-hidden", "false");
    flowTheme = nextTheme;
    loadCanvas.dataset.xiiiFlowTheme = nextTheme;
    flowThemeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.xiiiFlowThemeOption === nextTheme));
    });
    flowViewport.scrollTop = flowScrollByTheme[nextTheme] || 0;
    updateFlowCopy(selectedFlowNodeByTheme[nextTheme], { animate: false });
    syncKeyboardCursor();
    updateFlowScrollbar();

    if (animate && !reduceMotion.matches) {
      const fadeIn = nextMap.animate(
        [
          { opacity: 0, transform: "translate3d(1vw,0,0)" },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        { duration: 170, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
      );
      flowThemeAnimations = [fadeIn];
      try {
        await fadeIn.finished;
      } catch {}
      if (serial === flowThemeSerial) {
        fadeIn.cancel();
        flowThemeAnimations = [];
      }
    }
  }

  function flowTransform(first, last) {
    return {
      x: first.left - last.left,
      y: first.top - last.top,
      scaleX: first.width / Math.max(last.width, 1),
      scaleY: first.height / Math.max(last.height, 1),
    };
  }

  function updateFlowScrollbar() {
    const maxScroll = Math.max(0, flowViewport.scrollHeight - flowViewport.clientHeight);
    const railHeight = flowScrollIndicator.clientHeight;
    const ratio = flowViewport.scrollHeight
      ? flowViewport.clientHeight / flowViewport.scrollHeight
      : 1;
    const thumbHeight = Math.max(34, railHeight * Math.min(1, ratio));
    const available = Math.max(0, railHeight - thumbHeight);
    const progress = maxScroll ? flowViewport.scrollTop / maxScroll : 0;
    flowScrollThumb.style.height = thumbHeight + "px";
    flowScrollThumb.style.transform = `translate3d(0, ${available * progress}px, 0)`;
  }

  function setFlowExpanded(expanded, { animate = true } = {}) {
    if (expanded === flowExpanded) return;
    window.clearTimeout(flowDetailRevealTimer);
    flowDetailRevealTimer = 0;
    flowAnimation?.cancel();
    flowAnimation = null;
    const first = flowShell.getBoundingClientRect();
    loadCanvas.classList.add("is-flow-transitioning");

    if (expanded) {
      setInterfaceInert(true);
      loadCanvas.classList.add("has-expanded-flow");
      flowShell.classList.add("is-expanded");
      flowShell.classList.remove("is-detail-visible");
      document.documentElement.classList.add("tracks-xiii-flow-open");
    } else {
      flowScrollByTheme[flowTheme] = flowViewport.scrollTop;
      setInterfaceInert(false);
      flowShell.classList.remove("is-detail-visible");
      flowShell.classList.remove("is-expanded");
      loadCanvas.classList.remove("has-expanded-flow");
      document.documentElement.classList.remove("tracks-xiii-flow-open");
    }

    flowExpanded = expanded;
    flowExpand.setAttribute("aria-expanded", String(expanded));
    flowExpand.setAttribute("aria-label", expanded ? "收起流程图" : "放大流程图");
    dispatchCue(expanded ? "open" : "back", { target: "flowchart" });

    if (!animate || reduceMotion.matches) {
      flowShell.classList.toggle("is-detail-visible", expanded);
      loadCanvas.classList.remove("is-flow-transitioning");
      flowExpand.focus({ preventScroll: true });
      updateFlowScrollbar();
      return;
    }

    const last = flowShell.getBoundingClientRect();
    const inverse = flowTransform(first, last);
    flowShell.style.willChange = "transform";
    flowShell.style.transformOrigin = "0 0";
    flowAnimation = flowShell.animate(
      [
        { transform: `translate3d(${inverse.x}px, ${inverse.y}px, 0) scale(${inverse.scaleX}, ${inverse.scaleY})` },
        { transform: "translate3d(0,0,0) scale(1,1)" },
      ],
      {
        duration: FLOW_DURATION,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    );
    const animation = flowAnimation;
    if (expanded) {
      flowDetailRevealTimer = window.setTimeout(() => {
        flowDetailRevealTimer = 0;
        if (flowExpanded) flowShell.classList.add("is-detail-visible");
      }, Math.round(FLOW_DURATION * .58));
    }
    animation.finished.then(() => {
      if (flowAnimation !== animation) return;
      flowShell.style.removeProperty("will-change");
      flowShell.style.removeProperty("transform-origin");
      flowAnimation = null;
      if (flowExpanded) flowShell.classList.add("is-detail-visible");
      loadCanvas.classList.remove("is-flow-transitioning");
      flowExpand.focus({ preventScroll: true });
      updateFlowScrollbar();
    }).catch(() => {
      if (flowAnimation !== animation) return;
      loadCanvas.classList.remove("is-flow-transitioning");
      flowShell.style.removeProperty("will-change");
      flowShell.style.removeProperty("transform-origin");
      flowAnimation = null;
      updateFlowScrollbar();
    });
  }

  function beginFlowDrag(event) {
    if (event.button !== 0 || event.target.closest("button, a, input, select, textarea")) return;
    flowDrag = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScroll: flowViewport.scrollTop,
      moved: false,
    };
    flowViewport.setPointerCapture?.(event.pointerId);
  }

  function moveFlowDrag(event) {
    if (!flowDrag || event.pointerId !== flowDrag.pointerId) return;
    const delta = event.clientY - flowDrag.startY;
    if (!flowDrag.moved && Math.abs(delta) < 5) return;
    flowDrag.moved = true;
    flowViewport.classList.add("is-dragging");
    event.preventDefault();
    flowViewport.scrollTop = flowDrag.startScroll - delta;
  }

  function endFlowDrag(event) {
    if (!flowDrag || event.pointerId !== flowDrag.pointerId) return;
    flowViewport.classList.remove("is-dragging");
    if (flowViewport.hasPointerCapture?.(event.pointerId)) {
      flowViewport.releasePointerCapture(event.pointerId);
    }
    flowDrag = null;
  }

  function handleFlowViewportKeydown(event) {
    const commands = {
      ArrowUp: -64,
      ArrowDown: 64,
      PageUp: -flowViewport.clientHeight * .82,
      PageDown: flowViewport.clientHeight * .82,
      Home: -flowViewport.scrollHeight,
      End: flowViewport.scrollHeight,
    };
    if (!(event.key in commands)) return;
    event.preventDefault();
    event.stopPropagation();
    const maxScroll = Math.max(0, flowViewport.scrollHeight - flowViewport.clientHeight);
    flowViewport.scrollTop = Math.max(
      0,
      Math.min(flowViewport.scrollTop + commands[event.key], maxScroll),
    );
  }

  function openStoryConfirm(slot, { animate = true } = {}) {
    storyTrigger = slot;
    storyConfirmNumber.textContent = "SCENE " + (slot.dataset.storyNumber || "--");
    storyConfirmTitle.textContent = slot.dataset.storyTitle || "";
    storyConfirm.setAttribute("aria-hidden", "false");
    setInterfaceInert(true);
    storyScroll.inert = true;
    storyRail.inert = true;
    dispatchCue("open", { target: "story" });

    if (animate && !reduceMotion.matches) {
      storyConfirm.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 190, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      ).finished.catch(() => {});
    }
    storyEnter.focus({ preventScroll: true });
  }

  function closeStoryConfirm({ restoreFocus = true, cue = true } = {}) {
    if (storyConfirm.getAttribute("aria-hidden") === "true") return false;
    const trigger = storyTrigger;
    storyConfirm.setAttribute("aria-hidden", "true");
    setInterfaceInert(false);
    storyScroll.inert = false;
    storyRail.inert = false;
    storySlots.forEach((candidate) => candidate.removeAttribute("aria-pressed"));
    storyTrigger = null;
    if (restoreFocus) trigger?.focus({ preventScroll: true });
    if (cue) dispatchCue("back", { target: "story" });
    return true;
  }

  function enterStory() {
    if (!storyTrigger) return;
    dispatchCue("confirm", { target: "story-enter" });
    window.dispatchEvent(new CustomEvent("lonely-sea:story-enter", {
      detail: {
        number: storyTrigger.dataset.storyNumber || "",
        title: storyTrigger.dataset.storyTitle || "",
        gameSlug: storyTrigger.dataset.gameSlug || "",
        releaseId: storyTrigger.dataset.releaseId || "",
        sceneId: storyTrigger.dataset.sceneId || "",
      },
    }));
    closeStoryConfirm({ restoreFocus: true, cue: false });
  }

  function updateStoryScrollbar() {
    const maxScroll = Math.max(0, storyScroll.scrollHeight - storyScroll.clientHeight);
    const railHeight = storyRail.getBoundingClientRect().height;
    const progress = maxScroll
      ? maxScroll - storyScroll.scrollTop <= 1
        ? 1
        : storyScroll.scrollTop / maxScroll
      : 0;
    storyThumb.style.height = "1px";
    storyThumb.style.transform = `translate3d(-50%, ${railHeight * progress}px, 0)`;
    storyRail.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  }

  function scrollStoryBy(delta) {
    const maxScroll = Math.max(0, storyScroll.scrollHeight - storyScroll.clientHeight);
    storyScroll.scrollTop = Math.max(0, Math.min(storyScroll.scrollTop + delta, maxScroll));
  }

  function handleStoryRailKeydown(event) {
    const commands = {
      ArrowUp: -56,
      ArrowDown: 56,
      PageUp: -storyScroll.clientHeight * .82,
      PageDown: storyScroll.clientHeight * .82,
      Home: -storyScroll.scrollHeight,
      End: storyScroll.scrollHeight,
    };
    if (!(event.key in commands)) return;
    event.preventDefault();
    event.stopPropagation();
    scrollStoryBy(commands[event.key]);
  }

  function handleStoryRailPointerDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    const railRect = storyRail.getBoundingClientRect();
    storyRail.setPointerCapture?.(event.pointerId);

    const move = (moveEvent) => {
      const available = Math.max(1, railRect.height);
      const thumbTop = Math.max(0, Math.min(moveEvent.clientY - railRect.top, available));
      const maxScroll = Math.max(0, storyScroll.scrollHeight - storyScroll.clientHeight);
      storyScroll.scrollTop = (thumbTop / available) * maxScroll;
    };
    const finish = () => {
      storyRail.removeEventListener("pointermove", move);
      storyRail.removeEventListener("pointerup", finish);
      storyRail.removeEventListener("pointercancel", finish);
      if (storyRail.hasPointerCapture?.(event.pointerId)) {
        storyRail.releasePointerCapture(event.pointerId);
      }
    };

    storyRail.addEventListener("pointermove", move);
    storyRail.addEventListener("pointerup", finish);
    storyRail.addEventListener("pointercancel", finish);
    move(event);
  }

  function openDiaryReader(entry, { animate = true } = {}) {
    const month = entry.closest("[data-xiii-diary-month]");
    if (!month) return;

    diaryReaderAnimation?.cancel();
    diaryReaderTrigger = entry;
    diaryReaderArt.style.setProperty(
      "--diary-reader-art",
      `url("${month.dataset.diaryArt || "/assets/lonely-sea/mist.png"}")`,
    );
    diaryReaderDate.textContent = month.dataset.diaryDate || "";
    diaryReaderTitle.textContent = month.dataset.diaryTitle || "";
    diaryReaderSummary.textContent = month.dataset.diarySummary || "";
    recordBlogActivity("diaryMonths", month.dataset.xiiiDiaryMonth || month.dataset.diaryDate || "unknown");
    let monthRecords = [];
    try {
      const parsed = JSON.parse(month.dataset.diaryRecords || "[]");
      if (Array.isArray(parsed)) monthRecords = parsed;
    } catch {}
    diaryReaderLinks.replaceChildren(...monthRecords.flatMap((record) => {
      if (!record || typeof record !== "object" || typeof record.url !== "string") return [];
      const link = document.createElement("a");
      const title = document.createElement("strong");
      const date = document.createElement("small");
      link.href = record.url;
      title.textContent = typeof record.title === "string" ? record.title : "UNTITLED RECORD";
      date.textContent = typeof record.date === "string" ? record.date : "";
      link.append(title, date);
      return [link];
    }));
    all("[data-xiii-diary-entry]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === entry));
    });

    diaryReader.setAttribute("aria-hidden", "false");
    setInterfaceInert(true);
    diaryMonths.forEach((month) => {
      month.inert = true;
    });
    loadCanvas.classList.add("has-open-diary-reader");
    document.documentElement.classList.add("tracks-xiii-diary-open");
    dispatchCue("open", { target: "diary" });
    if (animate && !reduceMotion.matches) {
      diaryReaderAnimation = diaryReader.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 230, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      diaryReaderAnimation.finished.catch(() => {});
    }
    diaryReaderClose.focus({ preventScroll: true });
  }

  function closeDiaryReader({ animate = false } = {}) {
    if (diaryReader.getAttribute("aria-hidden") === "true") return false;
    diaryReaderAnimation?.cancel();
    const finish = () => {
      diaryReader.setAttribute("aria-hidden", "true");
      setInterfaceInert(false);
      diaryMonths.forEach((month) => {
        month.inert = false;
      });
      loadCanvas.classList.remove("has-open-diary-reader");
      document.documentElement.classList.remove("tracks-xiii-diary-open");
      diaryReaderTrigger?.focus({ preventScroll: true });
      diaryReaderAnimation = null;
      dispatchCue("back", { target: "diary" });
    };
    if (!animate || reduceMotion.matches) {
      finish();
      return true;
    }
    diaryReaderAnimation = diaryReader.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 180, easing: "ease-out" },
    );
    diaryReaderAnimation.finished.then(finish).catch(finish);
    return true;
  }

  function closeArticle() {
    if (closeStoryConfirm()) return true;
    if (closeDiaryReader()) return true;
    if (flowExpanded) {
      setFlowExpanded(false, { animate: false });
      return true;
    }
    if (articleNavigationTimers.length) {
      clearArticleNavigation();
      return true;
    }
    return false;
  }

  function keyboardCursorTargets() {
    let targets = [];
    if (activePage === "articles") {
      targets = articleSlots.filter((slot) => !slot.classList.contains("is-page-hidden"));
    } else if (activePage === "diary") {
      const entry = activeDiaryEntry()?.querySelector("[data-xiii-diary-entry]");
      if (entry) targets = [entry];
    } else if (activeFilter.game === "save") {
      targets = saveSlots;
    } else if (activeFilter.game === "story") {
      targets = storySlots;
    } else if (activeFilter.game === "flow") {
      targets = flowNodes.filter((node) => node.dataset.flowTheme === flowTheme);
    }

    return targets.filter((target) => (
      !target.disabled
      && target.offsetParent !== null
      && !target.closest('[aria-hidden="true"]')
    ));
  }

  function clearKeyboardCursor({ forget = false } = {}) {
    keyboardCursorItem?.classList.remove("is-kb-cursor");
    loadCanvas.classList.remove("has-keyboard-cursor");
    if (forget) keyboardCursorItem = null;
  }

  function setKeyboardCursor(target, { cue = true, scroll = true } = {}) {
    if (!keyboardCursorEnabled || !target) return;
    keyboardCursorItem?.classList.remove("is-kb-cursor");
    keyboardCursorItem = target;
    target.classList.add("is-kb-cursor");
    loadCanvas.classList.add("has-keyboard-cursor");
    target.focus({ preventScroll: true });
    if (scroll && (target.matches("[data-xiii-story-slot]") || target.matches("[data-xiii-flow-node]"))) {
      target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
    if (cue) dispatchCue("select", { target: "keyboard-cursor" });
  }

  function syncKeyboardCursor() {
    if (!keyboardCursorEnabled) {
      clearKeyboardCursor({ forget: true });
      return;
    }
    const targets = keyboardCursorTargets();
    if (keyboardCursorItem && !targets.includes(keyboardCursorItem)) {
      clearKeyboardCursor({ forget: true });
    }
  }

  function closestDirectionalTarget(current, targets, key) {
    const currentRect = current.getBoundingClientRect();
    const originX = currentRect.left + currentRect.width / 2;
    const originY = currentRect.top + currentRect.height / 2;
    const vertical = key === "ArrowUp" || key === "ArrowDown";
    const sign = key === "ArrowUp" || key === "ArrowLeft" ? -1 : 1;
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    targets.forEach((candidate) => {
      if (candidate === current) return;
      const rect = candidate.getBoundingClientRect();
      const deltaX = rect.left + rect.width / 2 - originX;
      const deltaY = rect.top + rect.height / 2 - originY;
      const primary = vertical ? deltaY : deltaX;
      const secondary = vertical ? deltaX : deltaY;
      if (Math.sign(primary) !== sign || Math.abs(primary) < 2) return;
      const score = Math.abs(primary) + Math.abs(secondary) * 1.7;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    });
    return best;
  }

  function archiveColumnCount(grid) {
    const columns = getComputedStyle(grid).gridTemplateColumns
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, columns);
  }

  function pageFromKeyboard(direction) {
    const model = paginationModel();
    const nextPage = model.active + direction;
    if (nextPage < 0 || nextPage >= model.labels.length) return false;
    goToPage(nextPage, { animate: false, direction });
    const targets = keyboardCursorTargets();
    setKeyboardCursor(direction > 0 ? targets[0] : targets.at(-1), { cue: true });
    return true;
  }

  function handleKeyboardCursor(event) {
    if (
      loadCanvas.getAttribute("aria-hidden") !== "false"
      || loadCanvas.closest("[data-screen]")?.getAttribute("aria-hidden") !== "false"
    ) return;
    if (!keyboardCursorEnabled || event.altKey || event.ctrlKey || event.metaKey) return;
    if (
      storyConfirm.getAttribute("aria-hidden") === "false"
      || diaryReader.getAttribute("aria-hidden") === "false"
    ) return;
    if (event.target instanceof Element && event.target.closest(
      ".tracks-xiii-primary-shell, .tracks-xiii-index, .tracks-xiii-edge-turners, "
      + ".tracks-xiii-page-nav, .tracks-xiii-reference-switcher, .system-back, "
      + ".tracks-xiii-flow-tools, .tracks-xiii-story-rail",
    )) return;

    const targets = keyboardCursorTargets();
    if (!targets.length) {
      const pagedArchive = activePage === "articles"
        || (activePage === "game" && activeFilter.game === "save");
      if (pagedArchive && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        event.stopPropagation();
        pageFromKeyboard(event.key === "ArrowRight" ? 1 : -1);
      }
      return;
    }
    const current = targets.includes(keyboardCursorItem)
      ? keyboardCursorItem
      : targets.includes(document.activeElement)
        ? document.activeElement
        : null;

    if (event.key === "Enter" || event.key === " ") {
      if (!current) return;
      event.preventDefault();
      event.stopPropagation();
      setKeyboardCursor(current, { cue: false });
      current.click();
      return;
    }

    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();

    if (!current) {
      setKeyboardCursor(targets[0]);
      return;
    }

    let next = null;
    if (activePage === "articles" || (activePage === "game" && activeFilter.game === "save")) {
      const columns = activePage === "articles"
        ? archiveColumnCount(articleGrid)
        : archiveColumnCount(saveGrid);
      const index = targets.indexOf(current);
      const offsets = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -columns,
        ArrowDown: columns,
      };
      const candidateIndex = index + offsets[event.key];
      const crossesRow = (
        (event.key === "ArrowLeft" && index % columns === 0)
        || (event.key === "ArrowRight" && index % columns === columns - 1)
      );
      if (!crossesRow && candidateIndex >= 0 && candidateIndex < targets.length) {
        next = targets[candidateIndex];
      } else if (
        (activePage === "articles" || (activePage === "game" && activeFilter.game === "save"))
        && event.key === "ArrowRight"
        && index === targets.length - 1
      ) {
        if (pageFromKeyboard(1)) return;
      } else if (
        (activePage === "articles" || (activePage === "game" && activeFilter.game === "save"))
        && event.key === "ArrowLeft"
        && index === 0
      ) {
        if (pageFromKeyboard(-1)) return;
      }
    } else if (activePage === "game" && activeFilter.game === "story") {
      const index = targets.indexOf(current);
      const offset = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
      if (offset) next = targets[index + offset];
    } else if (activePage === "game" && activeFilter.game === "flow") {
      next = closestDirectionalTarget(current, targets, event.key);
    } else if (activePage === "diary" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      pageFromKeyboard(event.key === "ArrowRight" ? 1 : -1);
      return;
    }

    if (next) setKeyboardCursor(next);
    else setKeyboardCursor(current, { cue: false, scroll: false });
  }

  function bindRovingKeys(buttons, previousKey, nextKey) {
    buttons.forEach((button, index) => {
      button.addEventListener("keydown", (event) => {
        const direction = event.key === previousKey ? -1 : event.key === nextKey ? 1 : 0;
        if (!direction) return;
        event.preventDefault();
        event.stopPropagation();
        const next = buttons[(index + direction + buttons.length) % buttons.length];
        next.focus({ preventScroll: true });
        next.click();
      });
    });
  }

  pageEntrances.forEach((button) => {
    button.addEventListener("click", (event) => {
      applyPage(button.dataset.xiiiPageEntry, { animate: event.detail > 0 });
    });
  });
  bindRovingKeys(pageEntrances, "ArrowLeft", "ArrowRight");
  systemBack.addEventListener("click", () => {
    dispatchCue("back", { target: "load" });
    onBack();
  });

  indexGroups.forEach((group) => {
    const buttons = all("[data-xiii-filter]", group);
    buttons.forEach((button) => {
      button.addEventListener("click", (event) => {
        if (group.dataset.xiiiIndexGroup !== activePage) return;
        applyFilter(button.dataset.xiiiFilter, { animate: event.detail > 0 });
      });
    });
    bindRovingKeys(buttons, "ArrowUp", "ArrowDown");
  });

  pageButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const model = paginationModel();
      const direction = Number(button.dataset.xiiiPageDirection);
      goToPage(model.active + direction, {
        animate: event.detail > 0,
        direction,
      });
    });
  });

  articleSlots.forEach((slot) => {
    slot.addEventListener("click", () => openArticle(slot));
  });

  function activateSaveSlot(slot, { animate = true } = {}) {
    if (slot.disabled) return;
    if (saveOperation === "save") {
      const occupied = Boolean(slot.dataset.saveId);
      if (occupied && slot.dataset.saveConfirm !== "true") {
        saveSlots.forEach((candidate) => {
          delete candidate.dataset.saveConfirm;
          candidate.classList.remove("is-save-confirm");
          const command = candidate.querySelector(".tracks-xiii-save-command");
          if (command) command.textContent = candidate.dataset.saveId ? "OVERWRITE" : "SAVE";
        });
        slot.dataset.saveConfirm = "true";
        slot.classList.add("is-save-confirm");
        required(".tracks-xiii-save-command", slot).textContent = "CONFIRM";
        dispatchCue("select", { target: "save-confirm" });
        return;
      }
      dispatchCue("confirm", { target: "save-data" });
      onSaveSlot({
        slot: Number(slot.dataset.saveNumber),
        existingSaveId: slot.dataset.saveId || "",
      });
      return;
    }
    if (!slot.dataset.saveId) return;
    window.clearTimeout(saveFeedbackTimer);
    saveSlots.forEach((candidate) => {
      candidate.classList.remove("is-load-feedback");
      if (candidate !== slot) candidate.classList.remove("is-load-acknowledged");
    });
    slot.classList.add("is-load-acknowledged");

    if (animate && !reduceMotion.matches) {
      slot.classList.add("is-load-feedback");
      saveFeedbackTimer = window.setTimeout(() => {
        slot.classList.remove("is-load-feedback");
        saveFeedbackTimer = 0;
      }, 240);

      slot.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(.986)", offset: .42 },
          { transform: "scale(1)" },
        ],
        { duration: 210, easing: "cubic-bezier(.22, 1, .36, 1)" },
      );
    }

    dispatchCue("select", { target: "save-data" });
    window.dispatchEvent(new CustomEvent("lonely-sea:save-select", {
      detail: {
        source: "load-xiii",
        saveId: slot.dataset.saveId,
        number: slot.dataset.saveNumber || "",
        title: slot.dataset.saveTitle || "",
        chapter: slot.dataset.saveChapter || "",
        section: slot.dataset.saveSection || "",
        progress: slot.dataset.saveProgress || "",
        savedAt: slot.dataset.saveSavedAt || "",
        gameSlug: slot.dataset.gameSlug || "",
        releaseId: slot.dataset.releaseId || "",
        savePointId: slot.dataset.savePointId || "",
      },
    }));
  }

  saveSlots.forEach((slot) => {
    slot.addEventListener("click", (event) => {
      activateSaveSlot(slot, { animate: event.detail > 0 });
    });
    slot.addEventListener("pointerleave", () => {
      slot.classList.remove("is-load-acknowledged");
      if (slot.dataset.saveConfirm === "true") {
        delete slot.dataset.saveConfirm;
        slot.classList.remove("is-save-confirm");
        required(".tracks-xiii-save-command", slot).textContent = "OVERWRITE";
      }
    });
    slot.addEventListener("blur", () => {
      slot.classList.remove("is-load-acknowledged");
    });
  });
  storySlots.forEach((slot) => {
    slot.addEventListener("click", (event) => {
      openStoryConfirm(slot, { animate: event.detail > 0 });
    });
  });
  all("[data-xiii-diary-entry]").forEach((entry) => {
    entry.addEventListener("click", (event) => {
      openDiaryReader(entry, { animate: event.detail > 0 });
    });
  });
  flowNodes.forEach((node) => {
    node.addEventListener("click", (event) => {
      selectFlowNode(node, { animate: event.detail > 0 });
      enterFlowNode(node);
    });
  });
  flowThemeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      switchFlowTheme(button.dataset.xiiiFlowThemeOption, { animate: event.detail > 0 });
    });
  });

  flowExpand.addEventListener("click", (event) => {
    setFlowExpanded(!flowExpanded, { animate: event.detail > 0 });
  });
  storyEnter.addEventListener("click", enterStory);
  storyCancel.addEventListener("click", () => closeStoryConfirm());
  storyConfirm.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeStoryConfirm();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [storyEnter, storyCancel];
    const current = controls.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    event.preventDefault();
    controls[(current + direction + controls.length) % controls.length].focus({ preventScroll: true });
  });
  diaryReaderClose.addEventListener("click", (event) => {
    closeDiaryReader({ animate: event.detail > 0 });
  });
  diaryReader.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    diaryReaderClose.focus({ preventScroll: true });
  });
  flowViewport.addEventListener("scroll", updateFlowScrollbar, { passive: true });
  flowViewport.addEventListener("pointerdown", beginFlowDrag);
  flowViewport.addEventListener("pointermove", moveFlowDrag);
  flowViewport.addEventListener("pointerup", endFlowDrag);
  flowViewport.addEventListener("pointercancel", endFlowDrag);
  flowViewport.addEventListener("lostpointercapture", () => {
    flowViewport.classList.remove("is-dragging");
    flowDrag = null;
  });
  flowViewport.addEventListener("keydown", handleFlowViewportKeydown);
  storyScroll.addEventListener("scroll", updateStoryScrollbar, { passive: true });
  storyRail.addEventListener("keydown", handleStoryRailKeydown);
  storyRail.addEventListener("pointerdown", handleStoryRailPointerDown);
  window.addEventListener("keydown", handleKeyboardCursor, true);
  loadCanvas.addEventListener("pointermove", () => {
    clearKeyboardCursor();
  }, { passive: true });
  window.addEventListener("lonely-sea:keyboard-cursor-change", (event) => {
    keyboardCursorEnabled = event.detail?.enabled !== false;
    loadCanvas.classList.toggle("is-keyboard-cursor-enabled", keyboardCursorEnabled);
    if (!keyboardCursorEnabled) clearKeyboardCursor({ forget: true });
  });
  window.addEventListener(GAL_BLOG_SAVE_CHANGE_EVENT, syncSaveSlots);
  window.addEventListener("storage", (event) => {
    if (event.key?.startsWith("lonely-sea:gal-blog-saves")) syncSaveSlots();
  });

  const storyResizeObserver = new ResizeObserver(updateStoryScrollbar);
  const flowResizeObserver = new ResizeObserver(updateFlowScrollbar);
  storyResizeObserver.observe(storyScroll);
  flowResizeObserver.observe(flowViewport);

  function activate() {
    syncSaveSlots();
    syncKeyboardCursor();
    window.requestAnimationFrame(() => {
      updateStoryScrollbar();
      updateFlowScrollbar();
    });
  }

  function deactivate() {
    clearKeyboardCursor({ forget: true });
    window.clearTimeout(saveFeedbackTimer);
    saveFeedbackTimer = 0;
    saveSlots.forEach((slot) => {
      slot.classList.remove("is-load-feedback");
      slot.classList.remove("is-load-acknowledged");
    });
    closeStoryConfirm({ restoreFocus: false });
    closeDiaryReader();
    if (flowExpanded) setFlowExpanded(false, { animate: false });
    clearArticleNavigation();
    window.clearTimeout(flowDetailRevealTimer);
    flowDetailRevealTimer = 0;
    clearTransition();
    flowThemeSerial += 1;
    clearFlowThemeAnimations();
  }

  syncSaveSlots();
  updateSelectionState();

  return {
    activate,
    changePage,
    closeArticle,
    deactivate,
    refreshSaves: syncSaveSlots,
    setSaveOperation,
  };
}
