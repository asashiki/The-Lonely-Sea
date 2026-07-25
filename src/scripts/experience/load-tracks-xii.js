const LAST_LOAD_STORAGE_KEY = "lonely-sea-last-load";
const PAGE_CAPACITY = 6;
const ARTICLE_SLOT_CAPACITY = 24;
const VIEW_DURATION = 270;
const FLOW_DURATION = 460;

export function initLoadTracksXiiConcept({ reduceMotion }) {
  const loadCanvas = document.querySelector(".tracks-xii-canvas");
  if (!loadCanvas) {
    return {
      activate() {},
      changePage() {},
      closeArticle() {
        return false;
      },
      deactivate() {},
    };
  }

  const all = (selector, scope = loadCanvas) => [...scope.querySelectorAll(selector)];
  const required = (selector, scope = loadCanvas) => {
    const node = scope.querySelector(selector);
    if (!node) throw new Error("Missing LOAD XII node: " + selector);
    return node;
  };

  const kindTabs = all("[data-xii-kind-tab]");
  const indexGroups = all("[data-xii-index-group]");
  const panels = all("[data-xii-panel]");
  const gameViews = all("[data-xii-game-view]");
  const articleSlots = all("[data-xii-article-slot]");
  const articleEmptySlots = all("[data-xii-article-empty]");
  const stage = required(".tracks-xii-stage");
  const index = required(".tracks-xii-index");
  const indexStack = required(".tracks-xii-index-stack");
  const view = required("[data-xii-view-transition]");
  const pageControls = required("[data-xii-page-controls]");
  const pageButtons = all("[data-xii-page-direction]");
  const pageNav = required("[data-xii-page-nav]");
  const pageMarkers = required("[data-xii-page-markers]");
  const pageStatus = required("[data-xii-page-status]");
  const routeCurtain = document.querySelector("#route-curtain");
  const flowShell = required("[data-xii-flow-shell]");
  const flowExpand = required("[data-xii-flow-expand]");
  const flowViewport = required("[data-xii-flow-viewport]");
  const flowMaps = all("[data-xii-flow-map]");
  const flowNodes = all("[data-xii-flow-node]");
  const flowThemeButtons = all("[data-xii-flow-theme-option]");
  const flowCaptionNumber = required("[data-xii-flow-caption-number]");
  const flowCaptionTitle = required("[data-xii-flow-caption-title]");
  const flowDetailPaper = required(".tracks-xii-flow-detail-paper");
  const flowDetailArt = required("[data-xii-flow-detail-art]");
  const flowDetailNumber = required("[data-xii-flow-detail-number]");
  const flowDetailTitle = required("[data-xii-flow-detail-title]");
  const flowDetailSummary = required("[data-xii-flow-detail-summary]");
  const flowScrollIndicator = required("[data-xii-flow-scroll-indicator]");
  const flowScrollThumb = required("[data-xii-flow-scroll-thumb]");
  const storyScroll = required("[data-xii-story-scroll]");
  const storyRail = required("[data-xii-story-rail]");
  const storyThumb = required("[data-xii-story-thumb]");
  const storySlots = all("[data-xii-story-slot]");
  const storyConfirm = required("[data-xii-story-confirm]");
  const storyConfirmNumber = required("[data-xii-story-confirm-number]");
  const storyConfirmTitle = required("[data-xii-story-confirm-title]");
  const storyEnter = required("[data-xii-story-enter]");
  const storyCancel = required("[data-xii-story-cancel]");
  const diaryMonths = all("[data-xii-diary-month]");
  const diaryReader = required("[data-xii-diary-reader]");
  const diaryReaderArt = required("[data-xii-diary-reader-art]");
  const diaryReaderDate = required("[data-xii-diary-reader-date]");
  const diaryReaderTitle = required("[data-xii-diary-reader-title]");
  const diaryReaderSummary = required("[data-xii-diary-reader-summary]");
  const diaryReaderClose = required("[data-xii-diary-reader-close]");
  const firstDiaryYear = required('[data-xii-index-group="diary"] [data-xii-filter]').dataset.xiiFilter;
  const primaryShell = required(".tracks-xii-primary-shell");
  const systemBack = required(".system-back");
  const referenceSwitcher = required(".tracks-xii-reference-switcher");
  const interfaceInertTargets = [
    systemBack,
    primaryShell,
    index,
    pageControls,
    pageNav,
    referenceSwitcher,
  ];

  if (!routeCurtain) throw new Error("Missing route curtain");

  const activeFilter = {
    articles: "all",
    game: "save",
    diary: firstDiaryYear,
  };
  const diaryPageByYear = {};
  const flowScrollByTheme = { blue: 0, red: 0 };
  const selectedFlowNodeByTheme = {};

  flowMaps.forEach((map) => {
    const theme = map.dataset.xiiFlowMap;
    selectedFlowNodeByTheme[theme] = map.querySelector("[data-xii-flow-node][aria-pressed='true']")
      || map.querySelector("[data-xii-flow-node]");
  });

  let kind = "articles";
  let articlePage = 0;
  let flowTheme = "blue";
  let flowExpanded = false;
  let flowAnimation = null;
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

  function dispatchCue(cue, detail = {}) {
    window.dispatchEvent(new CustomEvent("lonely-sea:ui-cue", {
      detail: { cue, source: "load-xii", ...detail },
    }));
  }

  function clearTransition() {
    transitionAnimations.forEach((animation) => animation.cancel());
    transitionAnimations = [];
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
    ghost.classList.add("tracks-xii-view-ghost");
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    all("[id]", ghost).forEach((node) => node.removeAttribute("id"));
    stage.appendChild(ghost);
    transitionGhost = ghost;
    if (direction === 0) {
      const indexGhost = indexStack.cloneNode(true);
      indexGhost.classList.add("tracks-xii-index-ghost");
      indexGhost.setAttribute("aria-hidden", "true");
      indexGhost.inert = true;
      all("[id]", indexGhost).forEach((node) => node.removeAttribute("id"));
      index.appendChild(indexGhost);
      transitionIndexGhost = indexGhost;
    }
    commit();

    const incomingGhost = view.cloneNode(true);
    incomingGhost.classList.add("tracks-xii-view-ghost", "is-incoming");
    incomingGhost.setAttribute("aria-hidden", "true");
    incomingGhost.inert = true;
    all("[id]", incomingGhost).forEach((node) => node.removeAttribute("id"));
    stage.appendChild(incomingGhost);
    transitionIncomingGhost = incomingGhost;
    view.style.visibility = "hidden";

    if (transitionIndexGhost) {
      const incomingIndexGhost = indexStack.cloneNode(true);
      incomingIndexGhost.classList.add("tracks-xii-index-ghost", "is-incoming");
      incomingIndexGhost.setAttribute("aria-hidden", "true");
      incomingIndexGhost.inert = true;
      all("[id]", incomingIndexGhost).forEach((node) => node.removeAttribute("id"));
      index.appendChild(incomingIndexGhost);
      transitionIncomingIndexGhost = incomingIndexGhost;
      indexStack.style.visibility = "hidden";
    }

    const travel = direction === 0 ? 0 : direction * 3.2;
    const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
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
        { duration: VIEW_DURATION, easing, fill: "both" },
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
        { duration: VIEW_DURATION, easing, fill: "both" },
      ),
    ];
    if (transitionIndexGhost && transitionIncomingIndexGhost) {
      transitionAnimations.push(
        transitionIndexGhost.animate(
          [
            { opacity: 1, transform: "translate3d(0,0,0)" },
            { opacity: 0, transform: "translate3d(0,.3vh,0)" },
          ],
          { duration: VIEW_DURATION, easing, fill: "both" },
        ),
        transitionIncomingIndexGhost.animate(
          [
            { opacity: 0, transform: "translate3d(0,-.25vh,0)" },
            { opacity: 1, transform: "translate3d(0,0,0)" },
          ],
          { duration: VIEW_DURATION, easing, fill: "both" },
        ),
      );
    }

    Promise.allSettled(transitionAnimations.map((animation) => animation.finished))
      .then(() => {
        if (serial === transitionSerial) clearTransition();
      });
  }

  function articleItems() {
    const filter = activeFilter.articles;
    const matched = filter === "all"
      ? articleSlots
      : articleSlots.filter((slot) => slot.dataset.category === filter);
    const capacity = filter === "all" ? ARTICLE_SLOT_CAPACITY : PAGE_CAPACITY;
    return [
      ...matched,
      ...articleEmptySlots.slice(0, Math.max(0, capacity - matched.length)),
    ];
  }

  function articleTotalPages() {
    return Math.max(1, Math.ceil(articleItems().length / PAGE_CAPACITY));
  }

  function setArticleSlotVisible(slot, visible) {
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
    articleSlots.forEach((slot) => setArticleSlotVisible(slot, shown.has(slot)));
    articleEmptySlots.forEach((slot) => setArticleSlotVisible(slot, shown.has(slot)));
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
    if (kind === "articles") {
      const total = articleTotalPages();
      return {
        active: articlePage,
        labels: Array.from({ length: total }, (_, index) => String(index + 1).padStart(2, "0")),
        mode: "articles",
      };
    }

    if (kind === "diary") {
      const year = activeFilter.diary;
      const entries = diaryEntriesForYear(year);
      return {
        active: diaryPageByYear[year] ?? 0,
        labels: entries.map((entry) => entry.dataset.xiiDiaryMonth?.split("-")[1] || "--"),
        mode: "diary",
      };
    }

    return { active: 0, labels: [], mode: "none" };
  }

  function renderPagination() {
    const model = paginationModel();
    const total = model.labels.length;
    const visible = total > 1;
    loadCanvas.dataset.xiiPageMode = visible ? model.mode : "none";
    pageControls.setAttribute("aria-hidden", String(!visible));
    pageNav.setAttribute("aria-hidden", String(!visible));
    pageMarkers.textContent = "";

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

    pageStatus.textContent = model.mode === "diary"
      ? (activeDiaryEntry()?.dataset.diaryLabel || "")
      : "PAGE " + String(model.active + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");

    pageButtons.forEach((button) => {
      const direction = Number(button.dataset.xiiPageDirection);
      button.disabled = direction < 0 ? model.active === 0 : model.active >= total - 1;
    });
  }

  function updateRovingTabStops() {
    kindTabs.forEach((button) => {
      button.tabIndex = button.dataset.xiiKindTab === kind ? 0 : -1;
    });
    indexGroups.forEach((group) => {
      const visible = group.dataset.xiiIndexGroup === kind;
      all("[data-xii-filter]", group).forEach((button) => {
        button.tabIndex = visible && button.dataset.xiiFilter === activeFilter[kind] ? 0 : -1;
      });
    });
  }

  function updateSelectionState() {
    const section = activeFilter[kind];
    loadCanvas.dataset.xiiKind = kind;
    loadCanvas.dataset.xiiSection = section;

    kindTabs.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.xiiKindTab === kind));
    });

    indexGroups.forEach((group) => {
      const visible = group.dataset.xiiIndexGroup === kind;
      group.setAttribute("aria-hidden", String(!visible));
      all("[data-xii-filter]", group).forEach((button) => {
        button.setAttribute("aria-selected", String(visible && button.dataset.xiiFilter === section));
      });
    });

    panels.forEach((panel) => {
      panel.setAttribute("aria-hidden", String(panel.dataset.xiiPanel !== kind));
    });

    gameViews.forEach((gameView) => {
      gameView.setAttribute(
        "aria-hidden",
        String(kind !== "game" || gameView.dataset.xiiGameView !== activeFilter.game),
      );
    });

    if (kind === "articles") renderArticlePage();
    if (kind === "diary") renderDiaryMonth();
    renderPagination();
    updateRovingTabStops();
    window.requestAnimationFrame(() => {
      updateStoryScrollbar();
      updateFlowScrollbar();
    });
  }

  function applyKind(nextKind, { animate = true } = {}) {
    if (!["articles", "game", "diary"].includes(nextKind) || nextKind === kind) return;
    dispatchCue("confirm", { target: nextKind });
    runTransition(() => {
      kind = nextKind;
      articlePage = 0;
      updateSelectionState();
    }, { animate });
  }

  function applyFilter(nextFilter, { animate = true } = {}) {
    const group = loadCanvas.querySelector(`[data-xii-index-group="${kind}"]`);
    if (!group?.querySelector(`[data-xii-filter="${CSS.escape(nextFilter)}"]`)) return;
    if (nextFilter === activeFilter[kind]) return;

    dispatchCue("select", { target: nextFilter });
    runTransition(() => {
      activeFilter[kind] = nextFilter;
      if (kind === "articles") articlePage = 0;
      if (kind === "diary" && diaryPageByYear[nextFilter] === undefined) {
        diaryPageByYear[nextFilter] = 0;
      }
      updateSelectionState();
    }, { animate });
  }

  function goToPage(nextPage, { animate = true, direction = 0 } = {}) {
    const model = paginationModel();
    if (model.labels.length <= 1) return;
    const clamped = Math.max(0, Math.min(nextPage, model.labels.length - 1));
    if (clamped === model.active) return;
    const travelDirection = direction || (clamped > model.active ? 1 : -1);

    dispatchCue("page", { direction: travelDirection });
    runTransition(() => {
      if (kind === "articles") {
        articlePage = clamped;
        renderArticlePage();
      } else if (kind === "diary") {
        diaryPageByYear[activeFilter.diary] = clamped;
        renderDiaryMonth();
      }
      renderPagination();
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

  async function switchFlowTheme(nextTheme, { animate = true } = {}) {
    if (!["blue", "red"].includes(nextTheme) || nextTheme === flowTheme) return;
    const serial = ++flowThemeSerial;
    const previousMap = flowMaps.find((map) => map.dataset.xiiFlowMap === flowTheme);
    const nextMap = flowMaps.find((map) => map.dataset.xiiFlowMap === nextTheme);
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
    loadCanvas.dataset.xiiFlowTheme = nextTheme;
    flowThemeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.xiiFlowThemeOption === nextTheme));
    });
    flowViewport.scrollTop = flowScrollByTheme[nextTheme] || 0;
    updateFlowCopy(selectedFlowNodeByTheme[nextTheme], { animate: false });
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
    flowAnimation?.cancel();
    flowAnimation = null;
    const first = flowShell.getBoundingClientRect();

    if (expanded) {
      setInterfaceInert(true);
      loadCanvas.classList.add("has-expanded-flow");
      flowShell.classList.add("is-expanded");
      document.documentElement.classList.add("tracks-xii-flow-open");
    } else {
      flowScrollByTheme[flowTheme] = flowViewport.scrollTop;
      setInterfaceInert(false);
      flowShell.classList.remove("is-expanded");
      loadCanvas.classList.remove("has-expanded-flow");
      document.documentElement.classList.remove("tracks-xii-flow-open");
    }

    flowExpanded = expanded;
    flowExpand.setAttribute("aria-expanded", String(expanded));
    flowExpand.setAttribute("aria-label", expanded ? "收起流程图" : "放大流程图");
    dispatchCue(expanded ? "open" : "back", { target: "flowchart" });
    window.requestAnimationFrame(updateFlowScrollbar);

    if (!animate || reduceMotion.matches) {
      flowExpand.focus({ preventScroll: true });
      return;
    }

    const last = flowShell.getBoundingClientRect();
    const inverse = flowTransform(first, last);
    flowShell.style.willChange = "transform";
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
    animation.finished.then(() => {
      if (flowAnimation !== animation) return;
      flowShell.style.removeProperty("will-change");
      flowAnimation = null;
      flowExpand.focus({ preventScroll: true });
      updateFlowScrollbar();
    }).catch(() => {});
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
    storySlots.forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === slot));
    });
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
    storyConfirm.setAttribute("aria-hidden", "true");
    setInterfaceInert(false);
    storyScroll.inert = false;
    storyRail.inert = false;
    if (restoreFocus) storyTrigger?.focus({ preventScroll: true });
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
      },
    }));
    closeStoryConfirm({ restoreFocus: true, cue: false });
  }

  function updateStoryScrollbar() {
    const maxScroll = Math.max(0, storyScroll.scrollHeight - storyScroll.clientHeight);
    const railHeight = storyRail.clientHeight;
    const ratio = storyScroll.scrollHeight
      ? storyScroll.clientHeight / storyScroll.scrollHeight
      : 1;
    const thumbHeight = Math.max(42, railHeight * Math.min(1, ratio));
    const available = Math.max(0, railHeight - thumbHeight);
    const progress = maxScroll ? storyScroll.scrollTop / maxScroll : 0;
    storyThumb.style.height = thumbHeight + "px";
    storyThumb.style.transform = `translate3d(-50%, ${available * progress}px, 0)`;
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
    const thumbRect = storyThumb.getBoundingClientRect();
    const pointerOffset = event.target === storyThumb
      ? event.clientY - thumbRect.top
      : thumbRect.height / 2;
    storyRail.setPointerCapture?.(event.pointerId);

    const move = (moveEvent) => {
      const available = Math.max(1, railRect.height - thumbRect.height);
      const thumbTop = Math.max(0, Math.min(moveEvent.clientY - railRect.top - pointerOffset, available));
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
    const month = entry.closest("[data-xii-diary-month]");
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
    all("[data-xii-diary-entry]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === entry));
    });

    diaryReader.setAttribute("aria-hidden", "false");
    setInterfaceInert(true);
    diaryMonths.forEach((month) => {
      month.inert = true;
    });
    loadCanvas.classList.add("has-open-diary-reader");
    document.documentElement.classList.add("tracks-xii-diary-open");
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
      document.documentElement.classList.remove("tracks-xii-diary-open");
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

  kindTabs.forEach((button) => {
    button.addEventListener("click", (event) => {
      applyKind(button.dataset.xiiKindTab, { animate: event.detail > 0 });
    });
  });
  bindRovingKeys(kindTabs, "ArrowLeft", "ArrowRight");
  systemBack.addEventListener("click", () => {
    dispatchCue("back", { target: "load" });
  });

  indexGroups.forEach((group) => {
    const buttons = all("[data-xii-filter]", group);
    buttons.forEach((button) => {
      button.addEventListener("click", (event) => {
        if (group.dataset.xiiIndexGroup !== kind) return;
        applyFilter(button.dataset.xiiFilter, { animate: event.detail > 0 });
      });
    });
    bindRovingKeys(buttons, "ArrowUp", "ArrowDown");
  });

  pageButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const model = paginationModel();
      const direction = Number(button.dataset.xiiPageDirection);
      goToPage(model.active + direction, {
        animate: event.detail > 0,
        direction,
      });
    });
  });

  articleSlots.forEach((slot) => {
    slot.addEventListener("click", () => openArticle(slot));
  });
  all("[data-xii-save-slot]").forEach((slot) => {
    slot.addEventListener("click", () => {
      all("[data-xii-save-slot]").forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === slot));
      });
      dispatchCue("select", { target: "save-data" });
      window.dispatchEvent(new CustomEvent("lonely-sea:save-select", {
        detail: {
          source: "load-xii",
          number: slot.dataset.saveNumber || "",
          title: slot.dataset.saveTitle || "",
          chapter: slot.dataset.saveChapter || "",
          progress: slot.dataset.saveProgress || "",
        },
      }));
    });
  });
  storySlots.forEach((slot) => {
    slot.addEventListener("click", (event) => {
      openStoryConfirm(slot, { animate: event.detail > 0 });
    });
  });
  all("[data-xii-diary-entry]").forEach((entry) => {
    entry.addEventListener("click", (event) => {
      openDiaryReader(entry, { animate: event.detail > 0 });
    });
  });
  flowNodes.forEach((node) => {
    node.addEventListener("click", (event) => {
      selectFlowNode(node, { animate: event.detail > 0 });
    });
  });
  flowThemeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      switchFlowTheme(button.dataset.xiiFlowThemeOption, { animate: event.detail > 0 });
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

  const storyResizeObserver = new ResizeObserver(updateStoryScrollbar);
  const flowResizeObserver = new ResizeObserver(updateFlowScrollbar);
  storyResizeObserver.observe(storyScroll);
  flowResizeObserver.observe(flowViewport);

  function activate() {
    window.requestAnimationFrame(() => {
      updateStoryScrollbar();
      updateFlowScrollbar();
    });
  }

  function deactivate() {
    closeStoryConfirm({ restoreFocus: false });
    closeDiaryReader();
    if (flowExpanded) setFlowExpanded(false, { animate: false });
    clearArticleNavigation();
    clearTransition();
    flowThemeSerial += 1;
    clearFlowThemeAnimations();
  }

  updateSelectionState();

  return {
    activate,
    changePage,
    closeArticle,
    deactivate,
  };
}
