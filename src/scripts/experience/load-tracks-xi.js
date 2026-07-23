const LAST_LOAD_STORAGE_KEY = "lonely-sea-last-load";
const PAGE_CAPACITY = 6;
const ARTICLE_SLOT_CAPACITY = 24;
const VIEW_DURATION = 220;
const FLOW_DURATION = 440;

export function initLoadTracksXiConcept({ reduceMotion }) {
  const loadCanvas = document.querySelector(".tracks-xi-canvas");
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
    if (!node) throw new Error("Missing LOAD XI node: " + selector);
    return node;
  };

  const kindTabs = all("[data-xi-kind-tab]");
  const indexGroups = all("[data-xi-index-group]");
  const panels = all("[data-xi-panel]");
  const gameViews = all("[data-xi-game-view]");
  const articleSlots = all("[data-xi-article-slot]");
  const articleEmptySlots = all("[data-xi-article-empty]");
  const pageControls = required("[data-xi-page-controls]");
  const pageButtons = all("[data-xi-page-direction]");
  const pageNav = required("[data-xi-page-nav]");
  const pageMarkers = required("[data-xi-page-markers]");
  const pageStatus = required("[data-xi-page-status]");
  const routeCurtain = document.querySelector("#route-curtain");
  const flowShell = required("[data-xi-flow-shell]");
  const flowExpand = required("[data-xi-flow-expand]");
  const flowViewport = required("[data-xi-flow-viewport]");
  const flowMaps = all("[data-xi-flow-map]");
  const flowNodes = all("[data-xi-flow-node]");
  const flowThemeButtons = all("[data-xi-flow-theme-option]");
  const flowDetailPaper = required(".tracks-xi-flow-detail-paper");
  const flowDetailArt = required("[data-xi-flow-detail-art]");
  const flowDetailTitle = required("[data-xi-flow-detail-title]");
  const flowDetailSummary = required("[data-xi-flow-detail-summary]");
  const flowScrollIndicator = required("[data-xi-flow-scroll-indicator]");
  const flowScrollThumb = required("[data-xi-flow-scroll-thumb]");
  const storyScroll = required("[data-xi-story-scroll]");
  const storyRail = required("[data-xi-story-rail]");
  const storyThumb = required("[data-xi-story-thumb]");
  const diaryMonths = all("[data-xi-diary-month]");
  const diaryReader = required("[data-xi-diary-reader]");
  const diaryReaderArt = required("[data-xi-diary-reader-art]");
  const diaryReaderDate = required("[data-xi-diary-reader-date]");
  const diaryReaderTitle = required("[data-xi-diary-reader-title]");
  const diaryReaderSummary = required("[data-xi-diary-reader-summary]");
  const diaryReaderClose = required("[data-xi-diary-reader-close]");
  const firstDiaryYear = required('[data-xi-index-group="diary"] [data-xi-filter]').dataset.xiFilter;
  const outerInterfaceTargets = [
    required(".system-back"),
    required(".tracks-xi-primary"),
    required(".tracks-xi-index"),
    pageControls,
    pageNav,
    required(".tracks-xi-reference-switcher"),
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
    const theme = map.dataset.xiFlowMap;
    selectedFlowNodeByTheme[theme] = map.querySelector("[data-xi-flow-node][aria-pressed='true']")
      || map.querySelector("[data-xi-flow-node]");
  });

  let kind = "articles";
  let articlePage = 0;
  let flowTheme = "blue";
  let flowExpanded = false;
  let flowAnimation = null;
  let diaryReaderAnimation = null;
  let diaryReaderTrigger = null;
  let articleNavigationTimers = [];
  let transitionSerial = 0;
  let fallbackTransitionGhost = null;
  let fallbackTransitionAnimations = [];
  let flowThemeAnimations = [];
  let flowThemeSerial = 0;
  let flowDrag = null;

  function clearFallbackTransition() {
    fallbackTransitionAnimations.forEach((animation) => animation.cancel());
    fallbackTransitionAnimations = [];
    fallbackTransitionGhost?.remove();
    fallbackTransitionGhost = null;
  }

  function clearFlowThemeAnimations() {
    flowThemeAnimations.forEach((animation) => animation.cancel());
    flowThemeAnimations = [];
    flowMaps.forEach((map) => {
      map.style.removeProperty("position");
      map.style.removeProperty("inset");
      map.style.removeProperty("opacity");
      map.style.removeProperty("pointer-events");
    });
  }

  function clearArticleNavigation() {
    articleNavigationTimers.forEach((timer) => window.clearTimeout(timer));
    articleNavigationTimers = [];
    routeCurtain.classList.remove("is-covering");
    routeCurtain.setAttribute("aria-hidden", "true");
  }

  function setOuterInterfaceInert(inert) {
    outerInterfaceTargets.forEach((target) => {
      target.inert = inert;
    });
  }

  function runCrossfade(commit, { animate = true } = {}) {
    const serial = ++transitionSerial;
    if (!animate || reduceMotion.matches) {
      clearFallbackTransition();
      document.documentElement.classList.remove("tracks-xi-view-transition");
      commit();
      return;
    }

    if (typeof document.startViewTransition === "function") {
      document.documentElement.classList.add("tracks-xi-view-transition");
      const transition = document.startViewTransition(() => {
        if (serial === transitionSerial) commit();
      });
      transition.finished.finally(() => {
        if (serial === transitionSerial) {
          document.documentElement.classList.remove("tracks-xi-view-transition");
        }
      });
      return;
    }

    clearFallbackTransition();
    const stage = required(".tracks-xi-stage");
    const ghost = stage.cloneNode(true);
    ghost.classList.add("tracks-xi-stage-ghost");
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    all("[id]", ghost).forEach((node) => node.removeAttribute("id"));
    stage.insertAdjacentElement("afterend", ghost);
    fallbackTransitionGhost = ghost;
    commit();

    const timing = {
      duration: VIEW_DURATION,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    };
    fallbackTransitionAnimations = [
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], timing),
      stage.animate([{ opacity: 0 }, { opacity: 1 }], timing),
    ];
    Promise.allSettled(fallbackTransitionAnimations.map((animation) => animation.finished))
      .then(() => {
        if (serial === transitionSerial) clearFallbackTransition();
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
        labels: entries.map((entry) => entry.dataset.xiDiaryMonth?.split("-")[1] || "--"),
        mode: "diary",
      };
    }

    return { active: 0, labels: [], mode: "none" };
  }

  function renderPagination() {
    const model = paginationModel();
    const total = model.labels.length;
    const visible = total > 1;
    loadCanvas.dataset.xiPageMode = visible ? model.mode : "none";
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
        goToPage(index, { animate: event.detail > 0 });
      });
      pageMarkers.appendChild(button);
    });

    pageStatus.textContent = model.mode === "diary"
      ? (activeDiaryEntry()?.dataset.diaryLabel || "")
      : "PAGE " + String(model.active + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");

    pageButtons.forEach((button) => {
      const direction = Number(button.dataset.xiPageDirection);
      button.disabled = direction < 0 ? model.active === 0 : model.active >= total - 1;
    });
  }

  function updateRovingTabStops() {
    kindTabs.forEach((button) => {
      button.tabIndex = button.dataset.xiKindTab === kind ? 0 : -1;
    });
    indexGroups.forEach((group) => {
      const visible = group.dataset.xiIndexGroup === kind;
      all("[data-xi-filter]", group).forEach((button) => {
        button.tabIndex = visible && button.dataset.xiFilter === activeFilter[kind] ? 0 : -1;
      });
    });
  }

  function updateSelectionState() {
    const section = activeFilter[kind];
    loadCanvas.dataset.xiKind = kind;
    loadCanvas.dataset.xiSection = section;

    kindTabs.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.xiKindTab === kind));
    });

    indexGroups.forEach((group) => {
      const visible = group.dataset.xiIndexGroup === kind;
      group.setAttribute("aria-hidden", String(!visible));
      all("[data-xi-filter]", group).forEach((button) => {
        button.setAttribute("aria-selected", String(visible && button.dataset.xiFilter === section));
      });
    });

    panels.forEach((panel) => {
      panel.setAttribute("aria-hidden", String(panel.dataset.xiPanel !== kind));
    });

    gameViews.forEach((view) => {
      view.setAttribute(
        "aria-hidden",
        String(kind !== "game" || view.dataset.xiGameView !== activeFilter.game),
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
    runCrossfade(() => {
      kind = nextKind;
      articlePage = 0;
      updateSelectionState();
    }, { animate });
  }

  function applyFilter(nextFilter, { animate = true } = {}) {
    const group = loadCanvas.querySelector(`[data-xi-index-group="${kind}"]`);
    if (!group?.querySelector(`[data-xi-filter="${CSS.escape(nextFilter)}"]`)) return;
    if (nextFilter === activeFilter[kind]) return;

    runCrossfade(() => {
      activeFilter[kind] = nextFilter;
      if (kind === "articles") articlePage = 0;
      if (kind === "diary" && diaryPageByYear[nextFilter] === undefined) {
        diaryPageByYear[nextFilter] = 0;
      }
      updateSelectionState();
    }, { animate });
  }

  function goToPage(nextPage, { animate = true } = {}) {
    const model = paginationModel();
    if (model.labels.length <= 1) return;
    const clamped = Math.max(0, Math.min(nextPage, model.labels.length - 1));
    if (clamped === model.active) return;

    runCrossfade(() => {
      if (kind === "articles") {
        articlePage = clamped;
        renderArticlePage();
      } else if (kind === "diary") {
        diaryPageByYear[activeFilter.diary] = clamped;
        renderDiaryMonth();
      }
      renderPagination();
    }, { animate });
  }

  function changePage(direction) {
    if (flowExpanded || diaryReader.getAttribute("aria-hidden") === "false") return;
    const model = paginationModel();
    goToPage(model.active + direction, { animate: false });
  }

  function openArticle(slot) {
    const href = slot.dataset.href;
    if (!href) return;
    clearArticleNavigation();
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

  function updateFlowDetail(node, { animate = true } = {}) {
    const commit = () => {
      const art = node?.dataset.flowArt;
      if (art) flowDetailArt.style.setProperty("--detail-art", `url("${art}")`);
      flowDetailTitle.textContent = node?.dataset.flowTitle || "";
      flowDetailSummary.textContent = node?.dataset.flowSummary || "";
    };

    if (!animate || reduceMotion.matches || !flowExpanded) {
      commit();
      return;
    }

    const out = flowDetailPaper.animate(
      [{ opacity: 1, transform: "translate3d(0,0,0)" }, { opacity: 0.35, transform: "translate3d(0,0.7vh,0)" }],
      { duration: 90, easing: "ease-out", fill: "both" },
    );
    out.finished.then(() => {
      commit();
      flowDetailPaper.animate(
        [{ opacity: 0.35, transform: "translate3d(0,0.7vh,0)" }, { opacity: 1, transform: "translate3d(0,0,0)" }],
        { duration: 150, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
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
    if (theme === flowTheme) updateFlowDetail(node, { animate });
  }

  function switchFlowTheme(nextTheme, { animate = true } = {}) {
    if (!["blue", "red"].includes(nextTheme) || nextTheme === flowTheme) return;
    const serial = ++flowThemeSerial;
    const previousMap = flowMaps.find((map) => map.dataset.xiFlowMap === flowTheme);
    const nextMap = flowMaps.find((map) => map.dataset.xiFlowMap === nextTheme);
    if (!previousMap || !nextMap) return;

    flowScrollByTheme[flowTheme] = flowViewport.scrollTop;
    clearFlowThemeAnimations();
    const finish = () => {
      if (serial !== flowThemeSerial) return;
      previousMap.setAttribute("aria-hidden", "true");
      nextMap.setAttribute("aria-hidden", "false");
      clearFlowThemeAnimations();
      flowTheme = nextTheme;
      loadCanvas.dataset.xiFlowTheme = nextTheme;
      flowThemeButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.xiFlowThemeOption === nextTheme));
      });
      flowViewport.scrollTop = flowScrollByTheme[nextTheme] || 0;
      updateFlowDetail(selectedFlowNodeByTheme[nextTheme], { animate: false });
      updateFlowScrollbar();
    };

    if (!animate || reduceMotion.matches) {
      finish();
      return;
    }

    nextMap.setAttribute("aria-hidden", "false");
    nextMap.style.position = "absolute";
    nextMap.style.inset = "0 auto auto 0";
    nextMap.style.pointerEvents = "none";
    previousMap.style.pointerEvents = "none";
    flowTheme = nextTheme;
    loadCanvas.dataset.xiFlowTheme = nextTheme;
    flowThemeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.xiFlowThemeOption === nextTheme));
    });
    updateFlowDetail(selectedFlowNodeByTheme[nextTheme], { animate: flowExpanded });

    const timing = {
      duration: 210,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    };
    flowThemeAnimations = [
      previousMap.animate([{ opacity: 1 }, { opacity: 0 }], timing),
      nextMap.animate([{ opacity: 0 }, { opacity: 1 }], timing),
    ];
    Promise.allSettled(flowThemeAnimations.map((animation) => animation.finished)).then(finish);
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
    const thumbHeight = Math.max(28, railHeight * Math.min(1, ratio));
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
      setOuterInterfaceInert(true);
      loadCanvas.classList.add("has-expanded-flow");
      flowShell.classList.add("is-expanded");
      document.documentElement.classList.add("tracks-xi-flow-open");
    } else {
      flowScrollByTheme[flowTheme] = flowViewport.scrollTop;
      setOuterInterfaceInert(false);
      flowShell.classList.remove("is-expanded");
      loadCanvas.classList.remove("has-expanded-flow");
      document.documentElement.classList.remove("tracks-xi-flow-open");
    }

    flowExpanded = expanded;
    flowExpand.setAttribute("aria-expanded", String(expanded));
    flowExpand.setAttribute("aria-label", expanded ? "收起流程图" : "放大流程图");
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
        { transform: "translate3d(0, 0, 0) scale(1, 1)" },
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
    if (!flowExpanded || event.button !== 0 || event.target.closest("button, a, input, select, textarea")) return;
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
    if (!flowExpanded) return;
    const commands = {
      ArrowUp: -64,
      ArrowDown: 64,
      PageUp: -flowViewport.clientHeight * 0.82,
      PageDown: flowViewport.clientHeight * 0.82,
      Home: -flowViewport.scrollHeight,
      End: flowViewport.scrollHeight,
    };
    if (!(event.key in commands)) return;
    event.preventDefault();
    event.stopPropagation();
    flowViewport.scrollTop = Math.max(
      0,
      Math.min(flowViewport.scrollTop + commands[event.key], flowViewport.scrollHeight),
    );
  }

  function openDiaryReader(entry, { animate = true } = {}) {
    const month = entry.closest("[data-xi-diary-month]");
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
    all("[data-xi-diary-entry]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === entry));
    });

    diaryReader.setAttribute("aria-hidden", "false");
    setOuterInterfaceInert(true);
    diaryMonths.forEach((month) => {
      month.inert = true;
    });
    loadCanvas.classList.add("has-open-diary-reader");
    document.documentElement.classList.add("tracks-xi-diary-open");
    if (animate && !reduceMotion.matches) {
      diaryReaderAnimation = diaryReader.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: VIEW_DURATION, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
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
      setOuterInterfaceInert(false);
      diaryMonths.forEach((month) => {
        month.inert = false;
      });
      loadCanvas.classList.remove("has-open-diary-reader");
      document.documentElement.classList.remove("tracks-xi-diary-open");
      diaryReaderTrigger?.focus({ preventScroll: true });
      diaryReaderAnimation = null;
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

  function updateStoryScrollbar() {
    const maxScroll = Math.max(0, storyScroll.scrollHeight - storyScroll.clientHeight);
    const railHeight = storyRail.clientHeight;
    const ratio = storyScroll.scrollHeight
      ? storyScroll.clientHeight / storyScroll.scrollHeight
      : 1;
    const thumbHeight = Math.max(38, railHeight * Math.min(1, ratio));
    const available = Math.max(0, railHeight - thumbHeight);
    const progress = maxScroll ? storyScroll.scrollTop / maxScroll : 0;
    storyThumb.style.height = thumbHeight + "px";
    storyThumb.style.transform = `translate3d(0, ${available * progress}px, 0)`;
    storyRail.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  }

  function scrollStoryBy(delta) {
    storyScroll.scrollTop = Math.max(
      0,
      Math.min(storyScroll.scrollTop + delta, storyScroll.scrollHeight),
    );
  }

  function handleStoryRailKeydown(event) {
    const commands = {
      ArrowUp: -56,
      ArrowDown: 56,
      PageUp: -storyScroll.clientHeight * 0.82,
      PageDown: storyScroll.clientHeight * 0.82,
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
      storyScroll.scrollTop = (thumbTop / available)
        * Math.max(0, storyScroll.scrollHeight - storyScroll.clientHeight);
    };
    const finish = () => {
      storyRail.removeEventListener("pointermove", move);
      storyRail.removeEventListener("pointerup", finish);
      storyRail.removeEventListener("pointercancel", finish);
    };

    storyRail.addEventListener("pointermove", move);
    storyRail.addEventListener("pointerup", finish);
    storyRail.addEventListener("pointercancel", finish);
    move(event);
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
      applyKind(button.dataset.xiKindTab, { animate: event.detail > 0 });
    });
  });
  bindRovingKeys(kindTabs, "ArrowLeft", "ArrowRight");

  indexGroups.forEach((group) => {
    const buttons = all("[data-xi-filter]", group);
    buttons.forEach((button) => {
      button.addEventListener("click", (event) => {
        if (group.dataset.xiIndexGroup !== kind) return;
        applyFilter(button.dataset.xiFilter, { animate: event.detail > 0 });
      });
    });
    bindRovingKeys(buttons, "ArrowUp", "ArrowDown");
  });

  pageButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const model = paginationModel();
      goToPage(model.active + Number(button.dataset.xiPageDirection), {
        animate: event.detail > 0,
      });
    });
  });

  articleSlots.forEach((slot) => {
    slot.addEventListener("click", () => openArticle(slot));
  });
  all("[data-xi-save-slot]").forEach((slot) => {
    slot.addEventListener("click", () => {
      all("[data-xi-save-slot]").forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === slot));
      });
    });
  });
  all("[data-xi-story-slot]").forEach((slot) => {
    slot.addEventListener("click", () => {
      all("[data-xi-story-slot]").forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === slot));
      });
    });
  });
  all("[data-xi-diary-entry]").forEach((entry) => {
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
      switchFlowTheme(button.dataset.xiFlowThemeOption, { animate: event.detail > 0 });
    });
  });

  flowExpand.addEventListener("click", (event) => {
    setFlowExpanded(!flowExpanded, { animate: event.detail > 0 });
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
    closeDiaryReader();
    if (flowExpanded) setFlowExpanded(false, { animate: false });
    clearArticleNavigation();
    clearFallbackTransition();
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
