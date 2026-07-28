import {
  bangumiItems,
  cgItems,
  characterItems,
  developmentItems,
  extraDefaults,
  musicItems,
  projectItems,
} from "../../data/extra-content.js";
import { all, required } from "./dom.js";
import { preferencesReduceMotion, readPreferences } from "./preferences.js";

const CG_PAGE_SIZE = 6;

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

export function initExtraScreen() {
  const extraCanvas = required("#extra-canvas");
  const extraStage = required("#extra-stage");
  const extraFocus = required("#extra-focus");
  const extraModeButtons = all("[data-extra-mode]", extraCanvas);
  const extraPageButtons = all("[data-extra-page-direction]", extraCanvas);
  const extraPageCurrent = required("#extra-page-current");
  const extraPageTotal = required("#extra-page-total");
  const cgViewer = required("#cg-viewer");
  const cgViewerArt = required("#cg-viewer-art");
  const cgViewerClose = required("#cg-viewer-close");

  let extraMode = "cg";
  let extraPage = 0;
  let cgIndex = 0;
  let musicIndex = 0;
  let characterIndex = 0;
  let bangumiIndex = 0;
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
    all("[data-music-toggle]", extraStage).forEach((toggle) => {
      toggle.setAttribute("aria-pressed", String(musicPlaying));
      required("span", toggle).textContent = musicPlaying ? "Ⅱ" : "▶";
      required("strong", toggle).textContent = musicPlaying ? "PAUSE PREVIEW" : "PLAY PREVIEW";
    });
    extraStage.querySelector(".extra-music-disc")?.classList.toggle("is-playing", musicPlaying);
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
    setFocus(current.title, "PLAYING GENERATIVE PREVIEW");
  }

  function totalPages() {
    return extraMode === "cg" ? Math.ceil(cgItems.length / CG_PAGE_SIZE) : 1;
  }

  function renderCg() {
    const start = extraPage * CG_PAGE_SIZE;
    const items = cgItems.slice(start, start + CG_PAGE_SIZE);
    extraStage.innerHTML = `
      <div class="extra-cg-grid">
        ${items.map((item, offset) => {
          const index = start + offset;
          return `
            <button
              class="extra-cg-card${item.portrait ? " is-portrait" : ""}"
              type="button"
              data-cg-index="${index}"
              data-focus-title="${escapeHtml(item.title)}"
              data-focus-action="OPEN CG"
              style="${artStyle(item.art)}"
            >
              <span class="extra-cg-art" aria-hidden="true"></span>
              <span class="extra-cg-copy">
                <small>${escapeHtml(item.meta)}</small>
                <strong>${escapeHtml(item.title)}</strong>
                <em>${String(index + 1).padStart(2, "0")}</em>
              </span>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderMusic() {
    const current = musicItems[musicIndex];
    extraStage.innerHTML = `
      <div class="extra-music-room" data-music-tone="${escapeHtml(current.tone)}" data-music-playing="${musicPlaying}">
        <section class="extra-music-player">
          <div class="extra-music-disc${musicPlaying ? " is-playing" : ""}" aria-hidden="true"><span></span></div>
          <p><small>SOUND TEST / ${escapeHtml(current.number)}</small><strong>${escapeHtml(current.title)}</strong></p>
          <p class="extra-music-note">${escapeHtml(current.note)}</p>
          <button class="extra-music-pending" type="button" data-music-toggle aria-pressed="${musicPlaying}">
            <span aria-hidden="true">${musicPlaying ? "Ⅱ" : "▶"}</span>
            <strong>${musicPlaying ? "PAUSE PREVIEW" : "PLAY PREVIEW"}</strong>
            <small>GENERATIVE SOUND TEST</small>
          </button>
        </section>
        <button class="extra-music-compact-toggle" type="button" data-music-toggle aria-pressed="${musicPlaying}">
          <span aria-hidden="true">${musicPlaying ? "Ⅱ" : "▶"}</span>
          <strong>${musicPlaying ? "PAUSE PREVIEW" : "PLAY PREVIEW"}</strong>
          <small>${escapeHtml(current.number)} / ${escapeHtml(current.title)}</small>
        </button>
        <div class="extra-track-list" aria-label="音乐列表">
          ${musicItems.map((track, index) => `
            <button
              type="button"
              data-music-index="${index}"
              data-focus-title="${escapeHtml(track.title)}"
              data-focus-action="SELECT SOUND TEST"
              aria-pressed="${index === musicIndex}"
            >
              <b>${escapeHtml(track.number)}</b>
              <strong>${escapeHtml(track.title)}</strong>
              <small>${escapeHtml(track.length)}</small>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderCharacter() {
    const current = characterItems[characterIndex];
    extraStage.innerHTML = `
      <div class="extra-character-room">
        <figure class="extra-character-art${current.unlocked ? "" : " is-locked"}" style="${artStyle(current.art)}">
          <span aria-hidden="true"></span>
        </figure>
        <section class="extra-character-copy">
          <small>${escapeHtml(current.reading)}</small>
          <h3>${escapeHtml(current.unlocked ? current.name : "UNKNOWN")}</h3>
          <p class="extra-character-role">${escapeHtml(current.role)}</p>
          <p>${escapeHtml(current.text)}</p>
          <div class="extra-character-index" aria-label="角色资料">
            ${characterItems.map((item, index) => `
              <button
                type="button"
                data-character-index="${index}"
                data-focus-title="${escapeHtml(item.unlocked ? item.name : "LOCKED")}"
                data-focus-action="${item.unlocked ? "OPEN CHARACTER FILE" : "NOT YET REGISTERED"}"
                aria-pressed="${index === characterIndex}"
                ${item.unlocked ? "" : "disabled"}
              >
                <span>${String(index + 1).padStart(2, "0")}</span>
                <strong>${escapeHtml(item.unlocked ? item.name : "LOCKED")}</strong>
              </button>
            `).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function renderProjects() {
    extraStage.innerHTML = `
      <div class="extra-project-room">
        ${projectItems.map((item, index) => `
          <a
            class="extra-project-record"
            href="${escapeHtml(item.href)}"
            ${externalAttributes()}
            data-focus-title="${escapeHtml(item.title)}"
            data-focus-action="OPEN PROJECT"
            style="${artStyle(item.art)}"
          >
            <span class="extra-project-art" aria-hidden="true"></span>
            <span class="extra-project-number">${String(index + 1).padStart(2, "0")}</span>
            <span class="extra-project-copy">
              <small>${escapeHtml(item.state)}</small>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.description)}</p>
            </span>
            <span class="extra-project-open" aria-hidden="true">OPEN</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderBangumi() {
    const current = bangumiItems[bangumiIndex];
    extraStage.innerHTML = `
      <div class="extra-bangumi-room">
        <section class="extra-bangumi-feature">
          <div class="extra-bangumi-cover" style="${artStyle(current.cover)}" aria-hidden="true"></div>
          <div class="extra-bangumi-copy">
            <small>${escapeHtml(current.type)}</small>
            <h3>${escapeHtml(current.title)}</h3>
            <p>${escapeHtml(current.note)}</p>
            <a href="${escapeHtml(current.href)}" ${externalAttributes()}>OPEN BANGUMI</a>
          </div>
        </section>
        <div class="extra-bangumi-shelf" aria-label="Bangumi 收藏">
          ${bangumiItems.map((item, index) => `
            <button
              type="button"
              data-bangumi-index="${index}"
              data-focus-title="${escapeHtml(item.title)}"
              data-focus-action="OPEN RECORD"
              aria-pressed="${index === bangumiIndex}"
            >
              <span style="${artStyle(item.cover)}" aria-hidden="true"></span>
              <strong>${escapeHtml(item.title)}</strong>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderDevelopment() {
    extraStage.innerHTML = `
      <div class="extra-development-room">
        <header>
          <strong>THE LONELY SEA</strong>
          <span>CURRENT DEVELOPMENT RECORD</span>
          <a href="https://github.com/asashiki/The-Lonely-Sea" ${externalAttributes()}>SOURCE REPOSITORY</a>
        </header>
        <div class="extra-development-list">
          ${developmentItems.map((item, index) => `
            <article
              data-focus-title="${escapeHtml(item.title)}"
              data-focus-action="DEVELOPMENT RECORD"
            >
              <time>${escapeHtml(item.date)}</time>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <div><small>${escapeHtml(item.state)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div>
            </article>
          `).join("")}
        </div>
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
        setFocus(musicItems[musicIndex].title, "SOUND TEST SELECTED");
        if (resume) startMusic();
      });
    });

    all("[data-music-toggle]", extraStage).forEach((toggle) => {
      toggle.addEventListener("click", () => {
        if (musicPlaying) {
          stopMusic();
          setFocus(musicItems[musicIndex].title, "PREVIEW PAUSED");
        } else {
          startMusic();
        }
      });
    });

    all("[data-character-index]", extraStage).forEach((node) => {
      node.addEventListener("click", () => {
        characterIndex = Number(node.dataset.characterIndex);
        renderMode();
        setFocus(characterItems[characterIndex].name, "CHARACTER FILE");
      });
    });

    all("[data-bangumi-index]", extraStage).forEach((node) => {
      node.addEventListener("click", () => {
        bangumiIndex = Number(node.dataset.bangumiIndex);
        renderMode();
        setFocus(bangumiItems[bangumiIndex].title, "OPEN BANGUMI");
      });
    });
  }

  function updatePageControls() {
    const total = totalPages();
    extraCanvas.dataset.hasMultiplePages = String(total > 1);
    extraPageCurrent.textContent = String(extraPage + 1).padStart(2, "0");
    extraPageTotal.textContent = String(total).padStart(2, "0");
    extraPageButtons.forEach((button) => {
      const direction = Number(button.dataset.extraPageDirection);
      button.disabled = direction < 0 ? extraPage === 0 : extraPage >= total - 1;
    });
  }

  function renderMode() {
    if (extraMode === "cg") renderCg();
    if (extraMode === "music") renderMusic();
    if (extraMode === "character") renderCharacter();
    if (extraMode === "projects") renderProjects();
    if (extraMode === "bangumi") renderBangumi();
    if (extraMode === "development") renderDevelopment();
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
        { opacity: 0, transform: "translate3d(0,-10px,0)" },
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
        { opacity: 0, transform: "translate3d(0,10px,0)" },
        { opacity: 1, transform: "translate3d(0,0,0)" },
      ],
      { duration: 240, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
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
    cgIndex = (index + cgItems.length) % cgItems.length;
    const item = cgItems[cgIndex];
    cgViewerArt.style.setProperty("--cg-art", `url("${item.art}")`);
    cgViewerArt.classList.toggle("is-portrait", Boolean(item.portrait));
    required("#cg-viewer-index").textContent = `CG ${String(cgIndex + 1).padStart(2, "0")} / ${String(cgItems.length).padStart(2, "0")}`;
    required("#cg-viewer-title").textContent = item.title;
    cgViewer.setAttribute("aria-hidden", "false");
    cgViewerClose.focus({ preventScroll: true });
  }

  function closeCg() {
    if (cgViewer.getAttribute("aria-hidden") === "true") return false;
    cgViewer.setAttribute("aria-hidden", "true");
    return true;
  }

  function changePage(direction) {
    if (cgViewer.getAttribute("aria-hidden") === "false") {
      openCg(cgIndex + direction);
      return;
    }
    const next = Math.max(0, Math.min(extraPage + direction, totalPages() - 1));
    if (next === extraPage) return;
    extraPage = next;
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
    button.addEventListener("click", () => openCg(cgIndex + Number(button.dataset.cgDirection)));
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
