const LAST_LOAD_STORAGE_KEY = "lonely-sea-last-load";
const PAGE_CAPACITY = 6;
const ARTICLE_SLOT_CAPACITY = 24;
const VIEW_DURATION = 220;
const FLOW_DURATION = 460;

export function initLoadTracksConcept({ reduceMotion }) {
  const loadCanvas = document.querySelector(".tracks-x-canvas");
  if (!loadCanvas) {
    return {
      changePage() {},
      closeArticle() {
        return false;
      },
    };
  }

  const all = (selector, scope = loadCanvas) => [...scope.querySelectorAll(selector)];
  const required = (selector, scope = loadCanvas) => {
    const node = scope.querySelector(selector);
    if (!node) throw new Error("Missing LOAD X node: " + selector);
    return node;
  };

  const kindTabs = all("[data-x-kind-tab]");
  const indexGroups = all("[data-x-index-group]");
  const panels = all("[data-x-panel]");
  const gameViews = all("[data-x-game-view]");
  const articleSlots = all("[data-x-article-slot]");
  const articleEmptySlots = all("[data-x-article-empty]");
  const pageControls = required("[data-x-page-controls]");
  const pageButtons = all("[data-x-page-direction]");
  const pageNav = required("[data-x-page-nav]");
  const pageMarkers = required("[data-x-page-markers]");
  const pageStatus = required("[data-x-page-status]");
  const routeCurtain = document.querySelector("#route-curtain");
  const flowShell = required("[data-x-flow-shell]");
  const flowExpand = required("[data-x-flow-expand]");
  const flowNodes = all("[data-x-flow-node]");
  const flowDetailArt = required("[data-x-flow-detail-art]");
  const flowDetailTitle = required("[data-x-flow-detail-title]");
  const flowDetailSummary = required("[data-x-flow-detail-summary]");
  const storyScroll = required("[data-x-story-scroll]");
  const storyRail = required("[data-x-story-rail]");
  const storyThumb = required("[data-x-story-thumb]");
  const diaryMonths = all("[data-x-diary-month]");
  const diaryReader = required("[data-x-diary-reader]");
  const diaryReaderArt = required("[data-x-diary-reader-art]");
  const diaryReaderDate = required("[data-x-diary-reader-date]");
  const diaryReaderTitle = required("[data-x-diary-reader-title]");
  const diaryReaderSummary = required("[data-x-diary-reader-summary]");
  const diaryReaderClose = required("[data-x-diary-reader-close]");
  const firstDiaryYear = required('[data-x-index-group="diary"] [data-x-filter]').dataset.xFilter;

  if (!routeCurtain) throw new Error("Missing route curtain");

  const activeFilter = {
    articles: "all",
    game: "flow",
    diary: firstDiaryYear,
  };
  const diaryPageByYear = {};

  let kind = "articles";
  let articlePage = 0;
  let flowExpanded = false;
  let flowAnimation = null;
  let flowChromeTimer = 0;
  let diaryReaderAnimation = null;
  let diaryReaderTrigger = null;
  let articleNavigationTimers = [];
  let transitionSerial = 0;
  let fallbackTransitionGhost = null;
  let fallbackTransitionAnimations = [];

  function clearFallbackTransition() {
    fallbackTransitionAnimations.forEach((animation) => animation.cancel());
    fallbackTransitionAnimations = [];
    fallbackTransitionGhost?.remove();
    fallbackTransitionGhost = null;
  }

  function clearArticleNavigation() {
    articleNavigationTimers.forEach((timer) => window.clearTimeout(timer));
    articleNavigationTimers = [];
    routeCurtain.classList.remove("is-covering");
    routeCurtain.setAttribute("aria-hidden", "true");
  }

  function runCrossfade(commit, { animate = true } = {}) {
    const serial = ++transitionSerial;
    if (!animate || reduceMotion.matches) {
      clearFallbackTransition();
      document.documentElement.classList.remove("tracks-x-view-transition");
      commit();
      return;
    }

    if (typeof document.startViewTransition === "function") {
      document.documentElement.classList.add("tracks-x-view-transition");
      const transition = document.startViewTransition(() => {
        if (serial !== transitionSerial) return;
        commit();
      });
      transition.finished.finally(() => {
        if (serial === transitionSerial) {
          document.documentElement.classList.remove("tracks-x-view-transition");
        }
      });
      return;
    }

    clearFallbackTransition();
    document.documentElement.classList.remove("tracks-x-view-transition");
    const stage = required(".tracks-x-stage");
    const ghost = stage.cloneNode(true);
    ghost.classList.add("tracks-x-stage-ghost");
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
    const oldAnimation = ghost.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      timing,
    );
    const newAnimation = stage.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      timing,
    );
    fallbackTransitionAnimations = [oldAnimation, newAnimation];

    Promise.allSettled(fallbackTransitionAnimations.map((animation) => animation.finished))
      .then(() => {
        if (serial !== transitionSerial) return;
        clearFallbackTransition();
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
    const page = Math.max(0, Math.min(diaryPageByYear[year] ?? 0, entries.length - 1));
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
        labels: entries.map((entry) => {
          const id = entry.dataset.xDiaryMonth || "";
          return id.split("-")[1] || "--";
        }),
        mode: "diary",
      };
    }

    return { active: 0, labels: [], mode: "none" };
  }

  function renderPagination() {
    const model = paginationModel();
    const total = model.labels.length;
    const visible = total > 1;
    loadCanvas.dataset.xPageMode = visible ? model.mode : "none";
    pageControls.setAttribute("aria-hidden", String(!visible));
    pageNav.setAttribute("aria-hidden", String(!visible));
    pageMarkers.textContent = "";

    if (!visible) return;

    model.labels.forEach((label, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.setAttribute("aria-label", model.mode === "diary" ? label + " 月" : "第 " + (index + 1) + " 页");
      button.setAttribute("aria-pressed", String(index === model.active));
      button.addEventListener("click", (event) => {
        goToPage(index, { animate: event.detail > 0 });
      });
      pageMarkers.appendChild(button);
    });

    pageStatus.textContent = model.mode === "diary"
      ? (activeDiaryEntry()?.querySelector(".tracks-x-diary-month-name")?.textContent || "")
      : String(model.active + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");

    pageButtons.forEach((button) => {
      const direction = Number(button.dataset.xPageDirection);
      button.disabled = direction < 0 ? model.active === 0 : model.active >= total - 1;
    });
  }

  function updateSelectionState() {
    const section = activeFilter[kind];
    loadCanvas.dataset.xKind = kind;
    loadCanvas.dataset.xSection = section;

    kindTabs.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.xKindTab === kind));
    });

    indexGroups.forEach((group) => {
      const visible = group.dataset.xIndexGroup === kind;
      group.setAttribute("aria-hidden", String(!visible));
      all("[data-x-filter]", group).forEach((button) => {
        button.setAttribute("aria-selected", String(visible && button.dataset.xFilter === section));
      });
    });

    panels.forEach((panel) => {
      panel.setAttribute("aria-hidden", String(panel.dataset.xPanel !== kind));
    });

    gameViews.forEach((view) => {
      view.setAttribute(
        "aria-hidden",
        String(kind !== "game" || view.dataset.xGameView !== activeFilter.game),
      );
    });

    if (kind === "articles") renderArticlePage();
    if (kind === "diary") renderDiaryMonth();
    renderPagination();
    window.requestAnimationFrame(updateStoryScrollbar);
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
    const group = loadCanvas.querySelector(`[data-x-index-group="${kind}"]`);
    if (!group?.querySelector(`[data-x-filter="${CSS.escape(nextFilter)}"]`)) return;
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
    if (flowExpanded) return;
    const model = paginationModel();
    goToPage(model.active + direction, { animate: false });
  }

  function openArticle(slot) {
    const href = slot.dataset.href;
    if (!href) return;
    clearArticleNavigation();
    articleSlots.forEach((candidate) => {
      candidate.classList.toggle("is-selected", candidate === slot);
    });

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

  function selectFlowNode(node, { animate = true } = {}) {
    flowNodes.forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === node));
    });

    const update = () => {
      const art = node.dataset.flowArt;
      if (art) flowDetailArt.style.setProperty("--detail-art", `url("${art}")`);
      flowDetailTitle.textContent = node.dataset.flowTitle || "";
      flowDetailSummary.textContent = node.dataset.flowSummary || "";
    };

    if (!animate || reduceMotion.matches || !flowExpanded) {
      update();
      return;
    }

    const out = flowDetailArt.parentElement.animate(
      [{ opacity: 1 }, { opacity: 0.45 }],
      { duration: 90, easing: "ease-out" },
    );
    out.finished.then(() => {
      update();
      flowDetailArt.parentElement.animate(
        [{ opacity: 0.45 }, { opacity: 1 }],
        { duration: 150, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }).catch(update);
  }

  function flowTransform(first, last) {
    return {
      x: first.left - last.left,
      y: first.top - last.top,
      scaleX: first.width / Math.max(last.width, 1),
      scaleY: first.height / Math.max(last.height, 1),
    };
  }

  function setFlowExpanded(expanded, { animate = true } = {}) {
    if (expanded === flowExpanded) return;
    if (flowAnimation) {
      flowAnimation.cancel();
      flowAnimation = null;
      flowShell.style.removeProperty("will-change");
    }
    window.clearTimeout(flowChromeTimer);

    const first = flowShell.getBoundingClientRect();
    loadCanvas.classList.add("is-flow-transitioning");

    if (expanded) {
      loadCanvas.classList.add("has-expanded-flow");
      flowShell.classList.add("is-expanded");
      document.documentElement.classList.add("tracks-x-flow-open");
    } else {
      flowShell.classList.remove("is-expanded");
      document.documentElement.classList.remove("tracks-x-flow-open");
      flowChromeTimer = window.setTimeout(() => {
        loadCanvas.classList.remove("has-expanded-flow");
      }, reduceMotion.matches ? 0 : FLOW_DURATION * 0.54);
    }

    flowExpanded = expanded;
    flowExpand.setAttribute("aria-expanded", String(expanded));
    flowExpand.setAttribute("aria-label", expanded ? "收起流程图" : "放大流程图");

    if (!animate || reduceMotion.matches) {
      loadCanvas.classList.toggle("has-expanded-flow", expanded);
      loadCanvas.classList.remove("is-flow-transitioning");
      return;
    }

    const last = flowShell.getBoundingClientRect();
    const inverse = flowTransform(first, last);
    flowShell.style.willChange = "transform";
    const animation = flowShell.animate(
      [
        {
          transform: `translate3d(${inverse.x}px, ${inverse.y}px, 0) scale(${inverse.scaleX}, ${inverse.scaleY})`,
        },
        { transform: "translate3d(0, 0, 0) scale(1, 1)" },
      ],
      {
        duration: FLOW_DURATION,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    );
    flowAnimation = animation;

    animation.finished.then(() => {
      if (flowAnimation !== animation) return;
      flowShell.style.removeProperty("will-change");
      loadCanvas.classList.remove("is-flow-transitioning");
      if (flowExpanded) {
        loadCanvas.classList.add("has-expanded-flow");
      } else {
        loadCanvas.classList.remove("has-expanded-flow");
      }
      flowAnimation = null;
      flowExpand.focus({ preventScroll: true });
    }).catch(() => {});
  }

  function openDiaryReader(entry, { animate = true } = {}) {
    const month = entry.closest("[data-x-diary-month]");
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
    all("[data-x-diary-entry]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === entry));
    });

    diaryReader.setAttribute("aria-hidden", "false");
    loadCanvas.classList.add("has-open-diary-reader");
    document.documentElement.classList.add("tracks-x-diary-open");

    if (animate && !reduceMotion.matches) {
      diaryReaderAnimation = diaryReader.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        {
          duration: VIEW_DURATION,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
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
      loadCanvas.classList.remove("has-open-diary-reader");
      document.documentElement.classList.remove("tracks-x-diary-open");
      diaryReaderTrigger?.focus({ preventScroll: true });
      diaryReaderAnimation = null;
    };

    if (!animate || reduceMotion.matches) {
      finish();
      return true;
    }

    diaryReaderAnimation = diaryReader.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: 180,
        easing: "ease-out",
      },
    );
    diaryReaderAnimation.finished.then(finish).catch(finish);
    return true;
  }

  function closeArticle() {
    if (closeDiaryReader()) {
      return true;
    }
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
    storyRail.classList.toggle("is-disabled", maxScroll === 0);
  }

  function scrollStoryBy(delta) {
    storyScroll.scrollTo({
      top: Math.max(0, Math.min(storyScroll.scrollTop + delta, storyScroll.scrollHeight)),
      behavior: "auto",
    });
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
    scrollStoryBy(commands[event.key]);
  }

  function handleStoryRailPointerDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    const railRect = storyRail.getBoundingClientRect();
    const thumbRect = storyThumb.getBoundingClientRect();
    const startedOnThumb = event.target === storyThumb;
    const pointerOffset = startedOnThumb
      ? event.clientY - thumbRect.top
      : thumbRect.height / 2;

    storyRail.classList.add("is-dragging");
    storyRail.setPointerCapture?.(event.pointerId);

    const move = (moveEvent) => {
      const available = Math.max(1, railRect.height - thumbRect.height);
      const thumbTop = Math.max(
        0,
        Math.min(moveEvent.clientY - railRect.top - pointerOffset, available),
      );
      const progress = thumbTop / available;
      storyScroll.scrollTop = progress * Math.max(0, storyScroll.scrollHeight - storyScroll.clientHeight);
    };
    const finish = () => {
      storyRail.classList.remove("is-dragging");
      storyRail.removeEventListener("pointermove", move);
      storyRail.removeEventListener("pointerup", finish);
      storyRail.removeEventListener("pointercancel", finish);
    };

    storyRail.addEventListener("pointermove", move);
    storyRail.addEventListener("pointerup", finish);
    storyRail.addEventListener("pointercancel", finish);
    move(event);
  }

  kindTabs.forEach((button) => {
    button.addEventListener("click", (event) => {
      applyKind(button.dataset.xKindTab, { animate: event.detail > 0 });
    });
  });

  indexGroups.forEach((group) => {
    all("[data-x-filter]", group).forEach((button) => {
      button.addEventListener("click", (event) => {
        if (group.dataset.xIndexGroup !== kind) return;
        applyFilter(button.dataset.xFilter, { animate: event.detail > 0 });
      });
    });
  });

  pageButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const model = paginationModel();
      goToPage(model.active + Number(button.dataset.xPageDirection), {
        animate: event.detail > 0,
      });
    });
  });

  articleSlots.forEach((slot) => {
    slot.addEventListener("click", () => openArticle(slot));
  });

  all("[data-x-save-slot]").forEach((slot) => {
    slot.addEventListener("click", () => {
      all("[data-x-save-slot]").forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === slot));
      });
    });
  });

  all("[data-x-story-slot]").forEach((slot) => {
    slot.addEventListener("click", () => {
      all("[data-x-story-slot]").forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === slot));
      });
    });
  });

  all("[data-x-diary-entry]").forEach((entry) => {
    entry.addEventListener("click", (event) => {
      openDiaryReader(entry, { animate: event.detail > 0 });
    });
  });

  flowNodes.forEach((node) => {
    node.addEventListener("click", (event) => {
      selectFlowNode(node, { animate: event.detail > 0 });
    });
  });
  flowExpand.addEventListener("click", (event) => {
    setFlowExpanded(!flowExpanded, { animate: event.detail > 0 });
  });
  diaryReaderClose.addEventListener("click", (event) => {
    closeDiaryReader({ animate: event.detail > 0 });
  });

  storyScroll.addEventListener("scroll", updateStoryScrollbar, { passive: true });
  storyRail.addEventListener("keydown", handleStoryRailKeydown);
  storyRail.addEventListener("pointerdown", handleStoryRailPointerDown);
  new ResizeObserver(updateStoryScrollbar).observe(storyScroll);

  updateSelectionState();

  function activate() {
    window.requestAnimationFrame(updateStoryScrollbar);
  }

  function deactivate() {
    closeDiaryReader();
    if (flowExpanded) setFlowExpanded(false, { animate: false });
    clearArticleNavigation();
    clearFallbackTransition();
  }

  return {
    activate,
    changePage,
    closeArticle,
    deactivate,
  };
}
