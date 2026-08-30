/**
 * NVL Visual Novel Engine Client Script
 * 驱动全屏视觉小说渲染、打字机动画、换页转场、履历记录与音频反馈
 */

export function initNvlEngine() {
  const modal = document.getElementById("nvl-theater-modal");
  if (!modal) return;

  const backdrop = document.getElementById("nvl-backdrop");
  const cutscene = document.getElementById("nvl-cutscene");
  const cutsceneSub = document.getElementById("nvl-cutscene-sub");
  const cutsceneMain = document.getElementById("nvl-cutscene-main");
  const povTitle = document.getElementById("nvl-pov-title");
  const povTime = document.getElementById("nvl-pov-time");
  const textFlow = document.getElementById("nvl-text-flow");
  const clickTarget = document.getElementById("nvl-click-target");
  const chapterTitleEl = document.getElementById("nvl-chapter-title");
  const btnClose = document.getElementById("nvl-btn-close");
  const btnLog = document.getElementById("nvl-btn-log");
  const btnAuto = document.getElementById("nvl-btn-auto");
  const backlogModal = document.getElementById("nvl-backlog-modal");
  const backlogBody = document.getElementById("nvl-backlog-body");
  const backlogClose = document.getElementById("nvl-backlog-close");

  let chapters = {};
  try {
    const dataScript = document.getElementById("nvl-chapters-data");
    if (dataScript?.textContent) {
      chapters = JSON.parse(dataScript.textContent);
    }
  } catch (e) {
    console.error("Failed to parse NVL chapters data", e);
  }

  let currentScenario = [];
  let stepIndex = 0;
  let currentLines = [];
  let lineIndex = 0;
  let isTyping = false;
  let typingTimer = null;
  let autoPlay = false;
  let autoTimer = null;
  let backlogHistory = [];

  const TYPE_SPEED = 24; // 打字机速度 (ms/char)

  function openChapter(chapterOrMonthId) {
    let chapter = chapters[chapterOrMonthId];
    if (!chapter) {
      // 尝试匹配 id (ch1, ch2, ch3)
      chapter = Object.values(chapters).find(
        (c) => c.id === chapterOrMonthId || c.monthId === chapterOrMonthId,
      );
    }
    if (!chapter) {
      console.warn("NVL Chapter not found:", chapterOrMonthId);
      chapter = Object.values(chapters)[0];
    }
    if (!chapter) return;

    currentScenario = chapter.scenario || [];
    stepIndex = 0;
    lineIndex = 0;
    currentLines = [];
    backlogHistory = [];
    autoPlay = false;
    btnAuto?.classList.remove("is-active");

    if (chapterTitleEl) chapterTitleEl.textContent = chapter.title;
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("nvl-open");
    clickTarget?.focus();

    window.dispatchEvent(
      new CustomEvent("lonely-sea:ui-cue", {
        detail: { cue: "open", target: "nvl-theater" },
      }),
    );

    executeStep();
  }

  function closeTheater() {
    clearTimeout(typingTimer);
    clearTimeout(autoTimer);
    modal.setAttribute("aria-hidden", "true");
    backlogModal?.setAttribute("aria-hidden", "true");
    backlogModal?.classList.remove("is-open");
    document.documentElement.classList.remove("nvl-open");
    autoPlay = false;
    btnAuto?.classList.remove("is-active");

    window.dispatchEvent(
      new CustomEvent("lonely-sea:ui-cue", {
        detail: { cue: "back", target: "nvl-theater" },
      }),
    );
  }

  function executeStep() {
    if (stepIndex >= currentScenario.length) {
      // 播放完毕
      return;
    }

    const step = currentScenario[stepIndex];

    if (step.type === "cutscene") {
      runCutscene(step);
    } else if (step.type === "scene_init") {
      runSceneInit(step);
      stepIndex++;
      executeStep();
    } else if (step.type === "page") {
      textFlow.innerHTML = "";
      currentLines = step.lines || [];
      lineIndex = 0;
      showNextLine();
    }
  }

  function runCutscene(step) {
    if (cutsceneSub) cutsceneSub.textContent = step.subTitle || "ANOTHER VIEWPOINT";
    if (cutsceneMain) cutsceneMain.textContent = step.mainTitle || "";
    cutscene?.classList.add("is-active");

    setTimeout(() => {
      cutscene?.classList.remove("is-active");
      stepIndex++;
      executeStep();
    }, step.duration || 2200);
  }

  function runSceneInit(step) {
    if (povTitle) povTitle.textContent = step.povName || "POV";
    if (povTime) povTime.textContent = step.timestamp || "";
    if (backdrop && step.bgStyle) {
      backdrop.style.background = step.bgStyle;
    }
  }

  function showNextLine() {
    if (lineIndex >= currentLines.length) {
      // 当前页结束，准备翻页
      return;
    }

    const lineData = currentLines[lineIndex];
    backlogHistory.push(lineData.text);

    const lineEl = document.createElement("div");
    lineEl.className = "nvl-line";
    if (lineData.type === "quote") lineEl.classList.add("line-quote");
    if (lineData.type === "alice-voice") lineEl.classList.add("line-alice-voice");
    if (lineData.type === "terminal") lineEl.classList.add("line-terminal");

    textFlow.appendChild(lineEl);
    requestAnimationFrame(() => lineEl.classList.add("is-visible"));

    // 打字机渲染
    isTyping = true;
    lineEl.classList.add("typewriter-active");
    let charIdx = 0;
    const fullText = lineData.text;

    function typeChar() {
      if (!isTyping) {
        // 瞬间完成
        lineEl.textContent = fullText;
        lineEl.classList.remove("typewriter-active");
        onLineFinished();
        return;
      }

      if (charIdx < fullText.length) {
        charIdx++;
        lineEl.textContent = fullText.slice(0, charIdx);
        typingTimer = setTimeout(typeChar, TYPE_SPEED);
      } else {
        isTyping = false;
        lineEl.classList.remove("typewriter-active");
        onLineFinished();
      }
    }

    typeChar();
  }

  function onLineFinished() {
    lineIndex++;
    if (autoPlay) {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        handleAdvance();
      }, 1600);
    }
  }

  function handleAdvance() {
    if (isTyping) {
      // 点击瞬间显示当前行全文本
      isTyping = false;
      return;
    }

    if (lineIndex < currentLines.length) {
      // 还有下一行
      showNextLine();
    } else {
      // 当前页读完了，进入下一个 step（翻页 / 切场）
      stepIndex++;
      if (stepIndex < currentScenario.length) {
        executeStep();
      } else {
        // 全剧本完成
        showEndCue();
      }
    }
  }

  function showEndCue() {
    const endEl = document.createElement("div");
    endEl.className = "nvl-line";
    endEl.style.color = "#64748b";
    endEl.style.fontStyle = "italic";
    endEl.style.marginTop = "2rem";
    endEl.textContent = "―― 本章完 ―― (点击退出或查看履历)";
    textFlow.appendChild(endEl);
    requestAnimationFrame(() => endEl.classList.add("is-visible"));
  }

  function toggleBacklog(open) {
    if (!backlogModal) return;
    const willOpen = open !== undefined ? open : !backlogModal.classList.contains("is-open");
    if (willOpen) {
      backlogBody.innerHTML = "";
      backlogHistory.forEach((txt) => {
        const p = document.createElement("div");
        p.className = "nvl-backlog-entry";
        p.textContent = txt;
        backlogBody.appendChild(p);
      });
      backlogModal.setAttribute("aria-hidden", "false");
      backlogModal.classList.add("is-open");
      backlogBody.scrollTop = backlogBody.scrollHeight;
    } else {
      backlogModal.setAttribute("aria-hidden", "true");
      backlogModal.classList.remove("is-open");
    }
  }

  // 事件绑定
  clickTarget?.addEventListener("click", () => handleAdvance());
  btnClose?.addEventListener("click", () => closeTheater());

  btnLog?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBacklog(true);
  });
  backlogClose?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBacklog(false);
  });

  btnAuto?.addEventListener("click", (e) => {
    e.stopPropagation();
    autoPlay = !autoPlay;
    btnAuto.classList.toggle("is-active", autoPlay);
    if (autoPlay && !isTyping) {
      handleAdvance();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (modal.getAttribute("aria-hidden") !== "false") return;
    if (e.key === "Escape") {
      if (backlogModal?.classList.contains("is-open")) {
        toggleBacklog(false);
      } else {
        closeTheater();
      }
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleAdvance();
    } else if (e.key === "l" || e.key === "L") {
      toggleBacklog();
    }
  });

  // 全局唤起监听
  window.addEventListener("lonely-sea:open-nvl", (e) => {
    const target = e.detail?.monthId || e.detail?.chapterId || "2026-04";
    openChapter(target);
  });

  // 点击所有 data-open-nvl 按钮
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-open-nvl]");
    if (trigger) {
      e.preventDefault();
      const target = trigger.getAttribute("data-open-nvl") || "2026-04";
      openChapter(target);
    }
  });
}

// 自动初始化
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNvlEngine);
  } else {
    initNvlEngine();
  }
}


