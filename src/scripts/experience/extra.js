import {
  achievementItems,
  bangumiItems,
  cgItems,
  extraDefaults,
  movieItems,
  musicItems,
  projectItems,
} from "../../data/extra-content.js";
import { all, required } from "./dom.js";
import { preferencesReduceMotion, readPreferences } from "./preferences.js";

const CG_PAGE_SIZE = 8;
const PROJECT_PAGE_SIZE = 6;
const BANGUMI_PAGE_SIZE = 5;
const ACHIEVEMENT_PAGE_SIZE = 6;
const HEAT_LEVELS = Object.freeze([
  0, 1, 0, 2, 1, 0, 3, 1, 2, 0, 1, 3,
  2, 1, 4, 2, 0, 1, 3, 2, 1, 2, 4, 1,
  0, 2, 3, 1, 2, 4, 3, 1, 0, 2, 1, 3,
]);
const WAVE_LEVELS = Object.freeze([
  18, 31, 46, 27, 54, 72, 42, 61, 34, 24, 49, 68,
  84, 57, 38, 63, 76, 45, 29, 52, 69, 91, 65, 41,
  58, 77, 48, 33, 55, 73, 62, 39, 25, 44, 59, 35,
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function artStyle(url) {
  return `--extra-art:url('${String(url).replaceAll("'", "%27")}')`;
}

function externalAttributes() {
  return readPreferences().externalLinks === "CURRENT"
    ? 'rel="noreferrer"'
    : 'target="_blank" rel="noreferrer"';
}

function roomHeading({ eyebrow, title, summary, note = "" }) {
  return `
    <header class="extra-room-heading">
      <p>${escapeHtml(eyebrow)}</p>
      <h3>${escapeHtml(title)}</h3>
      <div class="extra-room-summary">${summary}</div>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </header>
  `;
}

function heatmapMarkup(className = "") {
  return `
    <span class="extra-heatmap ${className}" aria-hidden="true">
      ${HEAT_LEVELS.map((level) => `<i data-level="${level}"></i>`).join("")}
    </span>
  `;
}

function waveMarkup() {
  return `
    <span class="extra-music-wave" aria-hidden="true">
      ${WAVE_LEVELS.map((level) => `<i style="--wave-level:${level}%"></i>`).join("")}
    </span>
  `;
}

export function initExtraScreen() {
  const extraCanvas = required("#extra-canvas");
  const extraStage = required("#extra-stage");
  const extraFocus = required("#extra-focus");
  const extraModeButtons = all("[data-extra-mode]", extraCanvas);
  const extraPageButtons = all("[data-extra-page-direction]", extraCanvas);
  const extraPageCurrent = required("#extra-page-current");
  const extraPageTotal = required("#extra-page-total");
  const extraPageProgress = required("#extra-page-progress");
  const cgViewer = required("#cg-viewer");
  const cgViewerArt = required("#cg-viewer-art");
  const cgViewerClose = required("#cg-viewer-close");

  let extraMode = "cg";
  let extraPage = 0;
  let cgIndex = 0;
  let musicIndex = 0;
  let bangumiCategory = "all";
  let bangumiStatus = "all";
  let stageTransition = null;
  let transitionToken = 0;
  let audioContext = null;
  let musicOutput = null;
  let musicSources = [];
  let musicGraph = [];
  let musicPlaying = false;

  function setFocus(title, action) {
    required("strong", extraFocus).textContent = title;
    required("small", extraFocus).textContent = action || "OPEN";
  }

  function syncMusicState() {
    extraCanvas.dataset.musicPlaying = String(musicPlaying);
    extraStage.querySelector(".extra-music-room")?.classList.toggle("is-playing", musicPlaying);
    all("[data-music-toggle]", extraStage).forEach((toggle) => {
      toggle.setAttribute("aria-pressed", String(musicPlaying));
      required("span", toggle).textContent = musicPlaying ? "Ⅱ" : "▶";
      required("strong", toggle).textContent = musicPlaying ? "PAUSE" : "PLAY";
    });
  }

  function stopMusic({ immediate = false } = {}) {
    const context = audioContext;
    const output = musicOutput;
    const sources = musicSources;
    const graph = musicGraph;
    musicOutput = null;
    musicSources = [];
    musicGraph = [];
    musicPlaying = false;
    syncMusicState();

    if (!context || !output) return;
    const now = context.currentTime;
    const release = immediate ? .01 : .18;
    try {
      output.gain.cancelScheduledValues(now);
      output.gain.setValueAtTime(Math.max(.0001, output.gain.value), now);
      output.gain.exponentialRampToValueAtTime(.0001, now + release);
    } catch {}
    sources.forEach((source) => {
      try { source.stop(now + release + .02); } catch {}
    });
    window.setTimeout(() => {
      [...sources, ...graph].forEach((node) => {
        try { node.disconnect(); } catch {}
      });
    }, Math.ceil((release + .05) * 1000));
  }

  async function startMusic() {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      setFocus(musicItems[musicIndex].title, "AUDIO IS NOT SUPPORTED");
      return;
    }

    stopMusic({ immediate: true });
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextConstructor();
    }
    await audioContext.resume();

    const current = musicItems[musicIndex];
    const now = audioContext.currentTime;
    const master = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const volume = Math.max(.004, readPreferences().bgmVolume / 100 * .045);
    master.gain.setValueAtTime(.0001, now);
    master.gain.exponentialRampToValueAtTime(volume, now + .48);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(current.cutoff, now);
    filter.Q.setValueAtTime(.65, now);
    master.connect(filter);
    filter.connect(audioContext.destination);

    const sources = [];
    const graph = [master, filter];
    current.frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const voice = audioContext.createGain();
      const drift = audioContext.createOscillator();
      const driftDepth = audioContext.createGain();
      oscillator.type = current.wave;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime((index - 1) * 2.5, now);
      voice.gain.setValueAtTime(1 / current.frequencies.length, now);
      drift.type = "sine";
      drift.frequency.setValueAtTime(current.drift + index * .009, now);
      driftDepth.gain.setValueAtTime(3.5 + index * 1.25, now);
      drift.connect(driftDepth);
      driftDepth.connect(oscillator.detune);
      oscillator.connect(voice);
      voice.connect(master);
      oscillator.start(now);
      drift.start(now);
      sources.push(oscillator, drift);
      graph.push(voice, driftDepth);
    });

    musicOutput = master;
    musicSources = sources;
    musicGraph = graph;
    musicPlaying = true;
    syncMusicState();
    setFocus(current.title, "PLAYING");
  }

  function filteredBangumiItems() {
    return bangumiItems.filter((item) => {
      const categoryMatches = bangumiCategory === "all" || item.category === bangumiCategory;
      const statusMatches =
        bangumiStatus === "all"
        || (bangumiStatus === "active" && ["playing", "watching"].includes(item.status))
        || item.status === bangumiStatus;
      return categoryMatches && statusMatches;
    });
  }

  function totalPages() {
    if (extraMode === "cg") return Math.max(1, Math.ceil(cgItems.length / CG_PAGE_SIZE));
    if (extraMode === "projects") return Math.max(1, Math.ceil(projectItems.length / PROJECT_PAGE_SIZE));
    if (extraMode === "bangumi") {
      return Math.max(1, Math.ceil(filteredBangumiItems().length / BANGUMI_PAGE_SIZE));
    }
    if (extraMode === "achievement") {
      return Math.max(1, Math.ceil(achievementItems.length / ACHIEVEMENT_PAGE_SIZE));
    }
    return 1;
  }

  function renderCg() {
    const start = extraPage * CG_PAGE_SIZE;
    const items = cgItems.slice(start, start + CG_PAGE_SIZE);
    const collected = cgItems.filter((item) => item.unlocked).length;
    extraStage.innerHTML = `
      <div class="extra-room extra-cg-room">
        ${roomHeading({
          eyebrow: "CG GALLERY",
          title: "CG 鉴赏",
          summary: `已收录 <b>${collected}</b><i>/</i>${cgItems.length}`,
          note: "SELECT A SCENE TO VIEW",
        })}
        <div class="extra-cg-grid">
          ${items.map((item, offset) => {
            const index = start + offset;
            const locked = !item.unlocked;
            return `
              <button
                class="extra-cg-card${item.portrait ? " is-portrait" : ""}${locked ? " is-locked" : ""}"
                type="button"
                ${locked ? "disabled" : `data-cg-index="${index}"`}
                data-focus-title="${escapeHtml(locked ? "未收录" : item.title)}"
                data-focus-action="${locked ? "NOT YET REGISTERED" : "OPEN CG"}"
                style="${artStyle(item.art)}"
              >
                <span class="extra-cg-art" aria-hidden="true"></span>
                <span class="extra-cg-copy">
                  <small>${escapeHtml(item.meta)}</small>
                  <strong>${escapeHtml(locked ? "未收录" : item.title)}</strong>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderMusic() {
    const current = musicItems[musicIndex];
    extraStage.innerHTML = `
      <div class="extra-room extra-music-room" data-music-tone="${escapeHtml(current.tone)}">
        ${roomHeading({
          eyebrow: "MUSIC GALLERY",
          title: "音乐鉴赏",
          summary: `<b>${musicItems.length}</b> TRACKS`,
          note: "SOUND TEST",
        })}
        <section class="extra-music-now" style="${artStyle(current.cover)}">
          <span class="extra-music-cover" aria-hidden="true"></span>
          <div class="extra-music-current">
            <small>NOW SELECTED</small>
            <h4>${escapeHtml(current.title)}</h4>
            <p>${escapeHtml(current.artist)}</p>
            <blockquote>${escapeHtml(current.note)}</blockquote>
          </div>
          ${waveMarkup()}
          <button class="extra-music-toggle" type="button" data-music-toggle aria-pressed="${musicPlaying}">
            <span aria-hidden="true">${musicPlaying ? "Ⅱ" : "▶"}</span>
            <strong>${musicPlaying ? "PAUSE" : "PLAY"}</strong>
          </button>
        </section>
        <div class="extra-track-list" aria-label="音乐列表">
          ${musicItems.map((track, index) => `
            <button
              type="button"
              data-music-index="${index}"
              data-focus-title="${escapeHtml(track.title)}"
              data-focus-action="SELECT MUSIC"
              aria-pressed="${index === musicIndex}"
            >
              <span>
                <strong>${escapeHtml(track.title)}</strong>
                <small>${escapeHtml(track.artist)}</small>
              </span>
              <em>${escapeHtml(track.length)}</em>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    syncMusicState();
  }

  function renderProjects() {
    const start = extraPage * PROJECT_PAGE_SIZE;
    const items = projectItems.slice(start, start + PROJECT_PAGE_SIZE);
    extraStage.innerHTML = `
      <div class="extra-room extra-project-room">
        ${roomHeading({
          eyebrow: "PROJECT ARCHIVE",
          title: "项目",
          summary: `<b>${projectItems.length}</b> PROJECTS`,
          note: "HOVER THE IMAGE FOR LINKS",
        })}
        <div class="extra-project-grid">
          ${items.map((item) => `
            <article
              class="extra-project-record"
              data-focus-title="${escapeHtml(item.title)}"
              data-focus-action="OPEN PROJECT"
            >
              <div class="extra-project-art" style="${artStyle(item.art)}">
                <span aria-hidden="true"></span>
                <nav aria-label="${escapeHtml(item.title)} 链接">
                  <a href="${escapeHtml(item.href)}" ${externalAttributes()}>DETAIL</a>
                  <a href="${escapeHtml(item.source)}" ${externalAttributes()}>GITHUB</a>
                </nav>
              </div>
              <div class="extra-project-copy">
                <small>${escapeHtml(item.state)}</small>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</p>
              </div>
            </article>
          `).join("")}
        </div>
        <aside class="extra-project-tide">
          <p><strong>CONTRIBUTION TIDE</strong><small>过去十二周 · 126 次更新</small></p>
          ${heatmapMarkup("extra-project-heatmap")}
        </aside>
      </div>
    `;
  }

  function renderBangumi() {
    const items = filteredBangumiItems();
    const categories = [
      ["all", "全部"],
      ["game", "游戏"],
      ["anime", "动画"],
      ["book", "书籍"],
      ["music", "音乐"],
    ];
    const statuses = [
      ["all", "全部"],
      ["active", "在看 / 在玩"],
      ["finished", "看过 / 玩过"],
      ["wishlist", "想看 / 想玩"],
    ];
    extraStage.innerHTML = `
      <div class="extra-room extra-bangumi-room">
        ${roomHeading({
          eyebrow: "BANGUMI RECORD",
          title: "收藏记录",
          summary: `<b>${items.length}</b> RECORDS`,
          note: "WHEEL OR DRAG TO BROWSE",
        })}
        <section class="extra-bangumi-toolbar">
          <div class="extra-bangumi-filters">
            <nav aria-label="Bangumi 类型">
              ${categories.map(([value, label]) => `
                <button type="button" data-bangumi-category="${value}" aria-pressed="${bangumiCategory === value}">
                  ${label}
                </button>
              `).join("")}
            </nav>
            <nav aria-label="Bangumi 状态">
              ${statuses.map(([value, label]) => `
                <button type="button" data-bangumi-status="${value}" aria-pressed="${bangumiStatus === value}">
                  ${label}
                </button>
              `).join("")}
            </nav>
          </div>
          <div class="extra-bangumi-activity">
            <span><strong>ACTIVITY</strong><small>近十二周</small></span>
            ${heatmapMarkup("extra-bangumi-heatmap")}
          </div>
        </section>
        <div class="extra-bangumi-viewport" tabindex="0" aria-label="Bangumi 收藏横向列表">
          <div class="extra-bangumi-track">
            ${items.length ? items.map((item) => `
              <a
                class="extra-bangumi-card"
                href="${escapeHtml(item.href)}"
                ${externalAttributes()}
                data-focus-title="${escapeHtml(item.title)}"
                data-focus-action="OPEN BANGUMI"
              >
                <span class="extra-bangumi-cover" style="${artStyle(item.cover)}" aria-hidden="true"></span>
                <span class="extra-bangumi-copy">
                  <small>${escapeHtml(item.state)} · ${escapeHtml(item.year)}</small>
                  <strong>${escapeHtml(item.title)}</strong>
                </span>
              </a>
            `).join("") : `
              <p class="extra-bangumi-empty">这里还没有符合条件的记录。</p>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderMovie() {
    extraStage.innerHTML = `
      <div class="extra-room extra-movie-room">
        ${roomHeading({
          eyebrow: "MOVIE GALLERY",
          title: "影片鉴赏",
          summary: `<b>${movieItems.length}</b> MOVIES`,
          note: "SELECT A MOVIE",
        })}
        <div class="extra-movie-stage">
          ${movieItems.map((item) => `
            <button
              class="extra-movie-frame"
              type="button"
              data-movie-title="${escapeHtml(item.title)}"
              data-focus-title="${escapeHtml(item.title)}"
              data-focus-action="PLAY MOVIE"
              style="${artStyle(item.art)}"
            >
              <span class="extra-movie-art" aria-hidden="true"></span>
              <span class="extra-movie-play" aria-hidden="true">▶</span>
              <span class="extra-movie-copy">
                <small>${escapeHtml(item.meta)}</small>
                <strong>${escapeHtml(item.title)}</strong>
              </span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderAchievement() {
    const unlocked = achievementItems.filter((item) => item.unlocked);
    const latest = unlocked.at(-1);
    const start = extraPage * ACHIEVEMENT_PAGE_SIZE;
    const items = achievementItems.slice(start, start + ACHIEVEMENT_PAGE_SIZE);
    extraStage.innerHTML = `
      <div class="extra-room extra-achievement-room">
        ${roomHeading({
          eyebrow: "ACHIEVEMENTS",
          title: "成就",
          summary: `已解锁 <b>${unlocked.length}</b><i>/</i>${achievementItems.length}`,
          note: `最近解锁 · ${latest.title}`,
        })}
        <div class="extra-achievement-ledger" aria-label="成就列表">
          ${items.map((item) => `
            <article
              class="extra-achievement-row${item.unlocked ? " is-unlocked" : " is-locked"}"
              data-focus-title="${escapeHtml(item.title)}"
              data-focus-action="${item.unlocked ? "ACHIEVEMENT UNLOCKED" : "NOT YET UNLOCKED"}"
            >
              <span class="extra-achievement-mark" aria-hidden="true">${item.unlocked ? "✓" : "—"}</span>
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.detail)}</small>
              </div>
              <em>${escapeHtml(item.unlocked ? item.date : "未解锁")}</em>
            </article>
          `).join("")}
        </div>
        <p class="extra-achievement-note">成就只记录是否抵达，不计算完成百分比。</p>
      </div>
    `;
  }

  function bindFocusNodes() {
    all("[data-focus-title]", extraStage).forEach((node) => {
      const update = () => setFocus(node.dataset.focusTitle, node.dataset.focusAction);
      node.addEventListener("pointerenter", update);
      node.addEventListener("focus", update);
    });
  }

  function syncBangumiPageFromScroll(viewport) {
    const total = totalPages();
    if (total <= 1) {
      extraPage = 0;
      updatePageControls();
      return;
    }
    const max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
    extraPage = Math.max(0, Math.min(total - 1, Math.round((viewport.scrollLeft / max) * (total - 1))));
    updatePageControls();
  }

  function bindBangumiViewport() {
    const viewport = extraStage.querySelector(".extra-bangumi-viewport");
    if (!viewport) return;
    let pointerId = null;
    let pointerStart = 0;
    let scrollStart = 0;
    let dragged = false;

    viewport.addEventListener("wheel", (event) => {
      if (viewport.scrollWidth <= viewport.clientWidth) return;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      viewport.scrollLeft += delta;
    }, { passive: false });
    viewport.addEventListener("scroll", () => syncBangumiPageFromScroll(viewport), { passive: true });
    viewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || viewport.scrollWidth <= viewport.clientWidth) return;
      pointerId = event.pointerId;
      pointerStart = event.clientX;
      scrollStart = viewport.scrollLeft;
      dragged = false;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientX - pointerStart;
      dragged ||= Math.abs(distance) > 5;
      viewport.scrollLeft = scrollStart - distance;
    });
    const stopDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      viewport.classList.remove("is-dragging");
      pointerId = null;
    };
    viewport.addEventListener("pointerup", stopDrag);
    viewport.addEventListener("pointercancel", stopDrag);
    viewport.addEventListener("click", (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);
  }

  function bindStage() {
    bindFocusNodes();

    all("[data-cg-index]", extraStage).forEach((node) => {
      node.addEventListener("click", () => openCg(Number(node.dataset.cgIndex)));
    });

    all("[data-music-index]", extraStage).forEach((node) => {
      node.addEventListener("click", () => {
        const resume = musicPlaying;
        stopMusic({ immediate: true });
        musicIndex = Number(node.dataset.musicIndex);
        renderMode();
        setFocus(musicItems[musicIndex].title, "MUSIC SELECTED");
        if (resume) startMusic();
      });
    });

    all("[data-music-toggle]", extraStage).forEach((toggle) => {
      toggle.addEventListener("click", () => {
        if (musicPlaying) {
          stopMusic();
          setFocus(musicItems[musicIndex].title, "PAUSED");
        } else {
          startMusic();
        }
      });
    });

    all("[data-bangumi-category]", extraStage).forEach((button) => {
      button.addEventListener("click", () => {
        bangumiCategory = button.dataset.bangumiCategory;
        extraPage = 0;
        renderMode();
      });
    });
    all("[data-bangumi-status]", extraStage).forEach((button) => {
      button.addEventListener("click", () => {
        bangumiStatus = button.dataset.bangumiStatus;
        extraPage = 0;
        renderMode();
      });
    });

    all("[data-movie-title]", extraStage).forEach((button) => {
      button.addEventListener("click", () => {
        setFocus(button.dataset.movieTitle, "MOVIE PREVIEW");
        button.animate(
          [
            { filter: "brightness(1)" },
            { filter: "brightness(1.12)", offset: .45 },
            { filter: "brightness(1)" },
          ],
          { duration: preferencesReduceMotion() ? 1 : 360, easing: "ease-out" },
        );
      });
    });

    bindBangumiViewport();
  }

  function updatePageControls() {
    const total = totalPages();
    extraPage = Math.max(0, Math.min(extraPage, total - 1));
    extraCanvas.dataset.hasMultiplePages = String(total > 1);
    extraPageCurrent.textContent = String(extraPage + 1).padStart(2, "0");
    extraPageTotal.textContent = String(total).padStart(2, "0");
    extraPageProgress.style.width = `${((extraPage + 1) / total) * 100}%`;
    extraPageButtons.forEach((button) => {
      const direction = Number(button.dataset.extraPageDirection);
      button.disabled = direction < 0 ? extraPage === 0 : extraPage >= total - 1;
    });
  }

  function renderMode() {
    if (extraMode === "cg") renderCg();
    if (extraMode === "music") renderMusic();
    if (extraMode === "projects") renderProjects();
    if (extraMode === "bangumi") renderBangumi();
    if (extraMode === "movie") renderMovie();
    if (extraMode === "achievement") renderAchievement();
    bindStage();
    updatePageControls();
  }

  function commitMode(mode) {
    if (extraMode === "music" && mode !== "music") stopMusic();
    extraMode = mode;
    extraPage = 0;
    extraCanvas.dataset.extraMode = mode;
    extraModeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.extraMode === mode));
    });
    renderMode();
    setFocus(...extraDefaults[mode]);
  }

  async function setMode(mode, { animate = true } = {}) {
    if (!extraDefaults[mode] || mode === extraMode) return;
    const token = ++transitionToken;
    stageTransition?.cancel();

    if (!animate || preferencesReduceMotion()) {
      commitMode(mode);
      return;
    }

    stageTransition = extraStage.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: "translate3d(12px,0,0)" },
      ],
      { duration: 110, easing: "ease-out", fill: "both" },
    );
    try {
      await stageTransition.finished;
    } catch {
      return;
    }
    if (token !== transitionToken) return;

    commitMode(mode);
    stageTransition = extraStage.animate(
      [
        { opacity: 0, transform: "translate3d(14px,0,0)" },
        { opacity: 1, transform: "translate3d(0,0,0)" },
      ],
      { duration: 260, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
    );
    try {
      await stageTransition.finished;
    } catch {}
    if (token === transitionToken) {
      stageTransition?.cancel();
      stageTransition = null;
    }
  }

  function openCg(index) {
    const item = cgItems[index];
    if (!item?.unlocked) return;
    cgIndex = index;
    cgViewerArt.style.setProperty("--cg-art", `url("${item.art}")`);
    cgViewerArt.classList.toggle("is-portrait", Boolean(item.portrait));
    const unlocked = cgItems.filter((entry) => entry.unlocked);
    const unlockedIndex = unlocked.indexOf(item);
    required("#cg-viewer-index").textContent =
      `CG ${String(unlockedIndex + 1).padStart(2, "0")} / ${String(unlocked.length).padStart(2, "0")}`;
    required("#cg-viewer-title").textContent = item.title;
    cgViewer.setAttribute("aria-hidden", "false");
    cgViewerClose.focus({ preventScroll: true });
  }

  function moveCgViewer(direction) {
    let next = cgIndex;
    do {
      next = (next + direction + cgItems.length) % cgItems.length;
    } while (!cgItems[next].unlocked && next !== cgIndex);
    openCg(next);
  }

  function closeCg() {
    if (cgViewer.getAttribute("aria-hidden") === "true") return false;
    cgViewer.setAttribute("aria-hidden", "true");
    return true;
  }

  function scrollBangumiToPage(page) {
    const viewport = extraStage.querySelector(".extra-bangumi-viewport");
    if (!viewport) return;
    const total = totalPages();
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const left = total <= 1 ? 0 : max * (page / (total - 1));
    viewport.scrollTo({ left, behavior: preferencesReduceMotion() ? "auto" : "smooth" });
  }

  function changePage(direction) {
    if (cgViewer.getAttribute("aria-hidden") === "false") {
      moveCgViewer(direction);
      return;
    }
    const next = Math.max(0, Math.min(extraPage + direction, totalPages() - 1));
    if (next === extraPage) return;
    extraPage = next;
    if (extraMode === "bangumi") {
      updatePageControls();
      scrollBangumiToPage(next);
      return;
    }
    renderMode();
  }

  extraModeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      setMode(button.dataset.extraMode, { animate: event.detail > 0 });
    });
  });
  extraPageButtons.forEach((button) => {
    button.addEventListener("click", () => changePage(Number(button.dataset.extraPageDirection)));
  });
  all("[data-cg-direction]", cgViewer).forEach((button) => {
    button.addEventListener("click", () => moveCgViewer(Number(button.dataset.cgDirection)));
  });
  cgViewerClose.addEventListener("click", closeCg);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMusic({ immediate: true });
  });
  window.addEventListener("pagehide", () => stopMusic({ immediate: true }));

  commitMode("cg");

  return {
    changePage,
    closeCg,
    deactivate() {
      transitionToken += 1;
      stageTransition?.cancel();
      stageTransition = null;
      stopMusic({ immediate: true });
    },
  };
}
