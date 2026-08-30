import { saveNvlProgress } from "../../lib/nvl/save-store";
import { readPreferences } from "./preferences.js";

/**
 * DIARY NVL reader.
 * Text remains authored in nvl-chapters.ts; this module only owns presentation,
 * navigation, backlog, auto mode, and the blog-level save handoff.
 */
export function initNvlEngine() {
  const modal = document.getElementById("nvl-theater-modal");
  if (!modal || modal.dataset.nvlReady === "true") return;
  modal.dataset.nvlReady = "true";

  const required = (id) => {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing NVL node: ${id}`);
    return node;
  };

  const backdropImage = required("nvl-backdrop-image");
  const backdropTone = required("nvl-backdrop-tone");
  const entryOverlay = required("nvl-entry-overlay");
  const entryMonth = required("nvl-entry-month");
  const cutscene = required("nvl-cutscene");
  const cutsceneSub = required("nvl-cutscene-sub");
  const cutsceneMain = required("nvl-cutscene-main");
  const povTitle = required("nvl-pov-title");
  const povTime = required("nvl-pov-time");
  const page = required("nvl-page");
  const textFlow = required("nvl-text-flow");
  const clickTarget = required("nvl-click-target");
  const pageCurrent = required("nvl-page-current");
  const pageTotal = required("nvl-page-total");
  const chapterMonth = required("nvl-chapter-month");
  const chapterTitle = required("nvl-chapter-title");
  const progress = required("nvl-progress");
  const nextCue = required("nvl-next-cue");
  const btnClose = required("nvl-btn-close");
  const btnSave = required("nvl-btn-save");
  const btnLoad = required("nvl-btn-load");
  const btnLog = required("nvl-btn-log");
  const btnAuto = required("nvl-btn-auto");
  const backlogModal = required("nvl-backlog-modal");
  const backlogBody = required("nvl-backlog-body");
  const backlogClose = required("nvl-backlog-close");
  const saveNotice = required("nvl-save-notice");
  const saveNoticeTitle = required("nvl-save-notice-title");
  const stage = document.querySelector(".stage");
  const systemReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let playerPreferences = readPreferences();

  let chapters = {};
  try {
    const dataScript = document.getElementById("nvl-chapters-data");
    chapters = JSON.parse(dataScript?.textContent || "{}");
  } catch (error) {
    console.error("Failed to parse NVL chapters data", error);
  }

  let currentChapter = null;
  let currentScenario = [];
  let currentLines = [];
  let currentScene = { povName: "POV", timestamp: "", pov: "self" };
  let stepIndex = 0;
  let lineIndex = 0;
  let autoPlay = false;
  let isEnding = false;
  let activeTyping = null;
  let backlogHistory = [];
  let reachedPages = new Set();
  let lastFocused = null;
  let introTimer = 0;
  let cutsceneTimer = 0;
  let autoTimer = 0;
  let transitionTimer = 0;
  let noticeTimer = 0;

  const motionReduced = () => systemReducedMotion.matches || playerPreferences.reducedMotion;
  const typeSpeed = () => Math.round(42 - playerPreferences.autoSpeed * 3.2);
  const autoDelay = () => Math.round(2800 - playerPreferences.autoSpeed * 210);

  function clearTimers() {
    window.clearTimeout(introTimer);
    window.clearTimeout(cutsceneTimer);
    window.clearTimeout(autoTimer);
    window.clearTimeout(transitionTimer);
    window.clearTimeout(noticeTimer);
    if (activeTyping?.timer) window.clearTimeout(activeTyping.timer);
    introTimer = 0;
    cutsceneTimer = 0;
    autoTimer = 0;
    transitionTimer = 0;
    noticeTimer = 0;
    activeTyping = null;
  }

  function findChapter(chapterOrMonthId) {
    return chapters[chapterOrMonthId]
      || Object.values(chapters).find((chapter) => (
        chapter.id === chapterOrMonthId || chapter.monthId === chapterOrMonthId
      ))
      || null;
  }

  function pageSteps() {
    return currentScenario
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === "page");
  }

  function currentPageNumber() {
    const index = pageSteps().findIndex((item) => item.index === stepIndex);
    return Math.max(0, index) + 1;
  }

  function padPage(value) {
    return String(Math.max(1, value)).padStart(2, "0");
  }

  function setBackdropImage(path) {
    const safePath = typeof path === "string" ? path.replace(/["'\\\n\r]/g, "") : "";
    backdropImage.style.backgroundImage = safePath ? `url("${safePath}")` : "none";
  }

  function buildProgress() {
    progress.innerHTML = "";
    pageSteps().forEach(({ item, index }, pageIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.nvlPageStep = String(index);
      button.setAttribute("aria-label", `第 ${pageIndex + 1} 页`);
      button.title = item.pageId || `PAGE ${pageIndex + 1}`;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!reachedPages.has(index) || index === stepIndex) return;
        jumpToPage(index);
      });
      progress.appendChild(button);
    });
  }

  function syncProgress() {
    const pages = pageSteps();
    const number = currentPageNumber();
    pageCurrent.textContent = padPage(number);
    pageTotal.textContent = padPage(pages.length);
    [...progress.children].forEach((button) => {
      const pageStep = Number(button.dataset.nvlPageStep);
      const current = pageStep === stepIndex;
      const reached = reachedPages.has(pageStep);
      button.classList.toggle("is-current", current);
      button.classList.toggle("is-reached", reached);
      button.disabled = !reached;
      button.setAttribute("aria-current", current ? "step" : "false");
    });
  }

  function applyScene(step) {
    currentScene = {
      povName: step.povName || "POV",
      timestamp: step.timestamp || "",
      pov: step.pov || "self",
    };
    povTitle.textContent = currentScene.povName;
    povTime.textContent = currentScene.timestamp;
    modal.dataset.nvlPov = currentScene.pov;
    if (step.bgStyle) backdropTone.style.background = step.bgStyle;
    if (step.bgImage) setBackdropImage(step.bgImage);
  }

  function restoreSceneBefore(targetStep) {
    const sceneStep = currentScenario
      .slice(0, targetStep + 1)
      .reverse()
      .find((item) => item.type === "scene_init");
    if (sceneStep) applyScene(sceneStep);
  }

  function lineClass(type) {
    return {
      quote: "line-quote",
      "alice-voice": "line-companion",
      terminal: "line-terminal",
      inner: "line-inner",
    }[type] || "line-narration";
  }

  function appendLine(lineData, { complete = false, remember = true } = {}) {
    const line = document.createElement("div");
    line.className = `nvl-line ${lineClass(lineData.type)}`;
    line.dataset.lineType = lineData.type;
    textFlow.appendChild(line);
    requestAnimationFrame(() => line.classList.add("is-visible"));

    if (remember) {
      backlogHistory.push({
        text: lineData.text,
        type: lineData.type,
        page: currentPageNumber(),
      });
    }

    if (complete || motionReduced()) {
      line.textContent = lineData.text;
      lineIndex += 1;
      if (!complete) scheduleAuto();
      return line;
    }

    line.classList.add("typewriter-active");
    activeTyping = { element: line, text: lineData.text, charIndex: 0, timer: 0 };

    const typeCharacter = () => {
      if (!activeTyping || activeTyping.element !== line) return;
      activeTyping.charIndex += 1;
      line.textContent = activeTyping.text.slice(0, activeTyping.charIndex);
      if (activeTyping.charIndex >= activeTyping.text.length) {
        finishTyping();
        return;
      }
      activeTyping.timer = window.setTimeout(typeCharacter, typeSpeed());
    };
    typeCharacter();
    return line;
  }

  function scheduleAuto() {
    window.clearTimeout(autoTimer);
    if (!autoPlay || activeTyping || isEnding) return;
    autoTimer = window.setTimeout(handleAdvance, autoDelay());
  }

  function finishTyping() {
    if (!activeTyping) return false;
    window.clearTimeout(activeTyping.timer);
    activeTyping.element.textContent = activeTyping.text;
    activeTyping.element.classList.remove("typewriter-active");
    activeTyping = null;
    lineIndex += 1;
    scheduleAuto();
    return true;
  }

  function showNextLine() {
    if (lineIndex >= currentLines.length || activeTyping) return;
    appendLine(currentLines[lineIndex]);
  }

  function preparePage(step, { restoredLineIndex = 0, animate = true } = {}) {
    window.clearTimeout(transitionTimer);
    page.classList.remove("is-leaving", "is-entering", "is-end", "is-solo-page");
    textFlow.innerHTML = "";
    currentLines = step.lines || [];
    lineIndex = 0;
    isEnding = false;
    reachedPages.add(stepIndex);
    page.classList.toggle(
      "is-solo-page",
      currentLines.length <= 2 && currentLines.some((line) => ["quote", "alice-voice", "inner"].includes(line.type)),
    );

    const restoredCount = Math.max(0, Math.min(Number(restoredLineIndex) || 0, currentLines.length));
    for (let index = 0; index < restoredCount; index += 1) {
      appendLine(currentLines[index], { complete: true });
    }

    syncProgress();
    if (animate && !motionReduced()) {
      page.classList.add("is-entering");
      requestAnimationFrame(() => requestAnimationFrame(() => page.classList.remove("is-entering")));
    }
    if (lineIndex < currentLines.length) showNextLine();
    else scheduleAuto();
  }

  function executeStep(options = {}) {
    if (stepIndex >= currentScenario.length) {
      showEndCue();
      return;
    }

    const step = currentScenario[stepIndex];
    if (step.type === "cutscene") {
      runCutscene(step);
      return;
    }
    if (step.type === "scene_init") {
      applyScene(step);
      stepIndex += 1;
      executeStep(options);
      return;
    }
    if (step.type === "page") preparePage(step, options);
  }

  function finishCutscene() {
    if (!cutscene.classList.contains("is-active")) return false;
    window.clearTimeout(cutsceneTimer);
    cutscene.classList.remove("is-active");
    cutscene.setAttribute("aria-hidden", "true");
    stepIndex += 1;
    executeStep();
    return true;
  }

  function runCutscene(step) {
    cutsceneSub.textContent = step.subTitle || "ANOTHER VIEWPOINT";
    cutsceneMain.textContent = step.mainTitle || "";
    cutscene.setAttribute("aria-hidden", "false");
    cutscene.classList.add("is-active");
    const duration = motionReduced() ? 260 : Math.min(Math.max(step.duration || 1200, 900), 1600);
    cutsceneTimer = window.setTimeout(finishCutscene, duration);
  }

  function advanceToNextStep() {
    if (page.classList.contains("is-leaving")) return;
    const commit = () => {
      page.classList.remove("is-leaving");
      stepIndex += 1;
      executeStep();
    };
    if (motionReduced()) {
      commit();
      return;
    }
    page.classList.add("is-leaving");
    transitionTimer = window.setTimeout(commit, 220);
  }

  function handleAdvance() {
    if (modal.getAttribute("aria-hidden") !== "false") return;
    if (backlogModal.classList.contains("is-open")) return;
    if (finishTyping()) return;
    if (isEnding) {
      closeTheater();
      return;
    }
    if (lineIndex < currentLines.length) showNextLine();
    else advanceToNextStep();
  }

  function jumpToPage(targetStep) {
    if (!reachedPages.has(targetStep)) return;
    if (activeTyping) finishTyping();
    window.clearTimeout(autoTimer);
    window.clearTimeout(transitionTimer);
    stepIndex = targetStep;
    restoreSceneBefore(stepIndex);
    preparePage(currentScenario[stepIndex], { animate: true });
  }

  function jumpRelative(direction) {
    const pages = pageSteps();
    const current = pages.findIndex((item) => item.index === stepIndex);
    const target = pages[current + direction];
    if (target && reachedPages.has(target.index)) jumpToPage(target.index);
  }

  function showEndCue() {
    currentLines = [];
    lineIndex = 0;
    isEnding = true;
    page.classList.remove("is-solo-page");
    page.classList.add("is-end");
    textFlow.innerHTML = "";
    const end = document.createElement("div");
    end.className = "nvl-end-mark";
    end.innerHTML = "<span>END OF RECORD</span><strong>―― 本章完 ――</strong><small>CLICK TO RETURN</small>";
    textFlow.appendChild(end);
    nextCue.querySelector("span").textContent = "CLICK TO RETURN";
  }

  function renderBacklog() {
    backlogBody.innerHTML = "";
    if (!backlogHistory.length) {
      const empty = document.createElement("p");
      empty.className = "nvl-backlog-empty";
      empty.textContent = "尚无已读文本";
      backlogBody.appendChild(empty);
      return;
    }
    backlogHistory.forEach((entry, index) => {
      const item = document.createElement("article");
      item.className = `nvl-backlog-entry ${lineClass(entry.type)}`;
      const number = document.createElement("span");
      number.textContent = `${padPage(entry.page)}.${String(index + 1).padStart(2, "0")}`;
      const copy = document.createElement("p");
      copy.textContent = entry.text;
      item.append(number, copy);
      backlogBody.appendChild(item);
    });
  }

  function toggleBacklog(force) {
    const willOpen = force ?? !backlogModal.classList.contains("is-open");
    if (willOpen) {
      renderBacklog();
      backlogModal.setAttribute("aria-hidden", "false");
      backlogModal.classList.add("is-open");
      backlogClose.focus({ preventScroll: true });
      backlogBody.scrollTop = backlogBody.scrollHeight;
    } else {
      backlogModal.setAttribute("aria-hidden", "true");
      backlogModal.classList.remove("is-open");
      btnLog.focus({ preventScroll: true });
      scheduleAuto();
    }
  }

  function showSaveNotice(save) {
    saveNoticeTitle.textContent = `${save.monthId.replace("-", ".")} / PAGE ${padPage(save.pageNumber)}`;
    saveNotice.setAttribute("aria-hidden", "false");
    saveNotice.classList.add("is-visible");
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
      saveNotice.classList.remove("is-visible");
      saveNotice.setAttribute("aria-hidden", "true");
    }, 1900);
  }

  function saveProgress() {
    if (!currentChapter || isEnding || currentScenario[stepIndex]?.type !== "page") return;
    finishTyping();
    try {
      const step = currentScenario[stepIndex];
      const save = saveNvlProgress({
        chapterId: currentChapter.id,
        monthId: currentChapter.monthId,
        title: currentChapter.subtitle || currentChapter.title,
        chapterTitle: currentChapter.title,
        coverArt: currentChapter.coverArt,
        stepIndex,
        lineIndex,
        pageId: step.pageId,
        pageNumber: currentPageNumber(),
        totalPages: pageSteps().length,
        povName: currentScene.povName,
        timestamp: currentScene.timestamp,
      });
      showSaveNotice(save);
      window.dispatchEvent(new CustomEvent("lonely-sea:ui-cue", {
        detail: { cue: "confirm", target: "nvl-save" },
      }));
    } catch (error) {
      console.error("Failed to save NVL progress", error);
    }
  }

  function openUnifiedLoad() {
    closeTheater({ restoreFocus: false });
    window.requestAnimationFrame(() => {
      if (document.body.dataset.route !== "load") {
        document.querySelector('[data-command="LOAD"]')?.click();
      }
      document.querySelector('[data-xiii-page-entry="game"]')?.click();
      window.requestAnimationFrame(() => {
        document.querySelector('[data-xiii-index-group="game"] [data-xiii-filter="save"]')?.click();
      });
    });
  }

  function toggleAuto() {
    autoPlay = !autoPlay;
    btnAuto.classList.toggle("is-active", autoPlay);
    btnAuto.setAttribute("aria-pressed", String(autoPlay));
    if (autoPlay) {
      if (!activeTyping) scheduleAuto();
    } else {
      window.clearTimeout(autoTimer);
    }
  }

  function openChapter(chapterOrMonthId, resume = null) {
    const chapter = findChapter(chapterOrMonthId);
    if (!chapter) return false;

    clearTimers();
    currentChapter = chapter;
    currentScenario = chapter.scenario || [];
    currentLines = [];
    currentScene = { povName: "POV", timestamp: "", pov: "self" };
    stepIndex = 0;
    lineIndex = 0;
    isEnding = false;
    autoPlay = false;
    backlogHistory = [];
    reachedPages = new Set();
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const monthLabel = `${chapter.year}.${chapter.monthNumber}`;
    chapterTitle.textContent = chapter.title;
    chapterMonth.textContent = monthLabel;
    entryMonth.textContent = monthLabel;
    nextCue.querySelector("span").textContent = "CLICK / SPACE";
    btnAuto.classList.remove("is-active");
    btnAuto.setAttribute("aria-pressed", "false");
    saveNotice.classList.remove("is-visible");
    saveNotice.setAttribute("aria-hidden", "true");
    setBackdropImage(chapter.coverArt);
    backdropTone.style.background = "linear-gradient(112deg, rgba(8, 19, 27, .72), rgba(14, 35, 48, .46))";
    buildProgress();

    modal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("nvl-open");
    if (stage instanceof HTMLElement) stage.inert = true;
    entryOverlay.classList.add("is-active");
    clickTarget.focus({ preventScroll: true });

    window.dispatchEvent(new CustomEvent("lonely-sea:ui-cue", {
      detail: { cue: "open", target: "nvl-theater" },
    }));

    const validResume = resume
      && resume.chapterId === chapter.id
      && Number.isInteger(resume.stepIndex)
      && currentScenario[resume.stepIndex]?.type === "page";
    const reveal = () => {
      entryOverlay.classList.remove("is-active");
      if (validResume) {
        stepIndex = resume.stepIndex;
        pageSteps().forEach(({ index }) => {
          if (index <= stepIndex) reachedPages.add(index);
        });
        restoreSceneBefore(stepIndex);
        executeStep({ restoredLineIndex: resume.lineIndex, animate: false });
      } else {
        executeStep();
      }
    };
    introTimer = window.setTimeout(reveal, motionReduced() ? 80 : 520);
    return true;
  }

  function closeTheater({ restoreFocus = true } = {}) {
    if (modal.getAttribute("aria-hidden") !== "false") return false;
    clearTimers();
    cutscene.classList.remove("is-active");
    cutscene.setAttribute("aria-hidden", "true");
    entryOverlay.classList.remove("is-active");
    backlogModal.setAttribute("aria-hidden", "true");
    backlogModal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("nvl-open");
    if (stage instanceof HTMLElement) stage.inert = false;
    if (restoreFocus) lastFocused?.focus?.({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("lonely-sea:ui-cue", {
      detail: { cue: "back", target: "nvl-theater" },
    }));
    return true;
  }

  function trapFocus(event) {
    const scope = backlogModal.classList.contains("is-open") ? backlogModal : modal;
    const controls = [...scope.querySelectorAll(
      'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
    )].filter((node) => !node.closest('[aria-hidden="true"]'));
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  clickTarget.addEventListener("click", handleAdvance);
  cutscene.addEventListener("click", finishCutscene);
  btnClose.addEventListener("click", () => closeTheater());
  btnSave.addEventListener("click", saveProgress);
  btnLoad.addEventListener("click", openUnifiedLoad);
  btnLog.addEventListener("click", () => toggleBacklog(true));
  backlogClose.addEventListener("click", () => toggleBacklog(false));
  btnAuto.addEventListener("click", toggleAuto);

  window.addEventListener("keydown", (event) => {
    if (modal.getAttribute("aria-hidden") !== "false") return;
    event.stopImmediatePropagation();
    if (event.key === "Tab") {
      trapFocus(event);
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "escape") {
      event.preventDefault();
      if (backlogModal.classList.contains("is-open")) toggleBacklog(false);
      else closeTheater();
      return;
    }
    if (backlogModal.classList.contains("is-open")) return;
    if (key === " " || key === "enter" || key === "arrowright") {
      event.preventDefault();
      if (!finishCutscene()) handleAdvance();
    } else if (key === "arrowleft") {
      event.preventDefault();
      jumpRelative(-1);
    } else if (key === "l") {
      event.preventDefault();
      toggleBacklog(true);
    } else if (key === "a") {
      event.preventDefault();
      toggleAuto();
    } else if (key === "s") {
      event.preventDefault();
      saveProgress();
    } else if (key === "q") {
      event.preventDefault();
      openUnifiedLoad();
    }
  }, true);

  window.addEventListener("lonely-sea:open-nvl", (event) => {
    const target = event.detail?.monthId || event.detail?.chapterId;
    if (!target) return;
    openChapter(target, event.detail?.resume || null);
  });

  window.addEventListener("lonely-sea:preferences-change", (event) => {
    playerPreferences = event.detail?.preferences || readPreferences();
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-open-nvl]");
    if (!trigger) return;
    const target = trigger.getAttribute("data-open-nvl");
    if (!target) return;
    event.preventDefault();
    openChapter(target);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initNvlEngine);
  else initNvlEngine();
}
