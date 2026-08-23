import {
  bangumiItems,
  cgItems,
  characterItems,
  externalActivity,
  extraDefaults,
  movieItems,
  musicItems,
  musicPlaylist,
  projectCategories,
  projectItems,
  projectTagLabels,
  projectTagOrder,
} from "../../data/extra-content.js";
import { all, required } from "./dom.js";
import { clearListenSession, readListenSession, writeListenSession } from "./listen-session.js";
import { preferencesReduceMotion, readPreferences } from "./preferences.js";
import { recordBlogActivity } from "../../lib/blog-activity";
import { resolveAchievements } from "../../lib/experience-achievements";
import { writeArticleContinue } from "../../lib/experience-continue";

const CG_PAGE_SIZE = 9;
const PROJECT_PAGE_SIZE = 6;
const BANGUMI_PAGE_SIZE = 5;

function hasBangumiComment(item) {
  return typeof item?.comment === "string" && item.comment.trim().length > 0;
}
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

function heatmapMarkup(entries, className = "") {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  return `
    <span class="extra-heatmap ${className}" role="img" aria-label="最近 12 周共有 ${total} 次活动">
      ${entries.map((entry) => `<i data-level="${entry.level}" title="${entry.date} · ${entry.count}"></i>`).join("")}
    </span>
  `;
}

function waveMarkup() {
  return '<canvas class="extra-music-wave" data-music-wave aria-hidden="true"></canvas>';
}

function projectLanguage() {
  const language = readPreferences().language;
  return language === "JA-JP" || language === "EN-US" ? language : "ZH-CN";
}

function projectText(value) {
  if (typeof value === "string") return value;
  const language = projectLanguage();
  return value?.[language] || value?.["ZH-CN"] || "";
}

function projectTagText(tag) {
  return projectText(projectTagLabels[tag]) || tag;
}

function projectTitle(item) {
  return projectText(item.title);
}

function projectRoomCopy() {
  const language = projectLanguage();
  if (language === "JA-JP") {
    return {
      all: "すべて",
      empty: "この条件に合う項目はない。",
      note: "項目は src/data/extra-content.js で直せる",
      github: "GitHub",
      visit: "訪問",
      source: "ソース",
      article: "紹介",
    };
  }
  if (language === "EN-US") {
    return {
      all: "ALL",
      empty: "NO PROJECTS MATCH THIS FILTER.",
      note: "Edit entries in src/data/extra-content.js",
      github: "GitHub",
      visit: "Visit",
      source: "Source",
      article: "Note",
    };
  }
  return {
    all: "全部",
    empty: "没有符合筛选的项目。",
    note: "条目可在 src/data/extra-content.js 修改",
    github: "GitHub",
    visit: "访问",
    source: "源码",
    article: "介绍",
  };
}

function projectLinks(item) {
  const labels = projectRoomCopy();
  const links = [];
  if (item.github) links.push([labels.github, item.github, "external"]);
  if (item.href && item.href !== item.github) {
    links.push([item.href.includes("github.com") ? labels.github : labels.visit, item.href, "external"]);
  }
  if (item.source && item.source !== item.href && item.source !== item.github) {
    links.push([labels.source, item.source, "external"]);
  }
  if (item.note) links.push([labels.article, item.note, "internal"]);
  return links;
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
  let musicShuffle = false;
  let musicLoop = false;
  let musicShuffleOrder = [];
  let listenSession = false;
  let bangumiCategory = "all";
  let bangumiStatus = "all";
  let bangumiCommentsOnly = true;
  let bangumiIndex = 0;
  let projectCategory = "all";
  let projectTag = "all";
  let characterExpressionIndex = 0;
  let stageTransition = null;
  let transitionToken = 0;
  let audioContext = null;
  let musicPlayer = null;
  let musicOutput = null;
  let musicSources = [];
  let musicGraph = [];
  let musicPlaying = false;
  let musicMuted = document.documentElement.dataset.audioMuted === "true";
  let musicOutputVolume = 0;
  let musicWaveFrame = 0;
  let musicWavePhase = 0;
  let musicWaveAmplitude = .18;
  let pageSliding = false;
  let cgOriginRect = null;
  let cgViewerAnimation = null;
  let bangumiFocusLayer = 0;
  let bangumiFocusToken = 0;
  let bangumiShelfToken = 0;
  let projectGridToken = 0;

  function setFocus(title, action) {
    required("strong", extraFocus).textContent = title;
    required("small", extraFocus).textContent = action || "OPEN";
  }

  function persistListenSession() {
    if (!listenSession) {
      clearListenSession();
      return;
    }
    writeListenSession({
      active: true,
      playing: musicPlaying,
      index: musicIndex,
      loop: musicLoop,
      shuffle: musicShuffle,
      shuffleOrder: musicShuffleOrder,
      currentTime: musicPlayer?.currentTime || 0,
    });
  }

  function syncMusicState() {
    extraCanvas.dataset.musicPlaying = String(musicPlaying);
    extraCanvas.dataset.musicMuted = String(musicMuted);
    extraStage.querySelector(".extra-music-room")?.classList.toggle("is-playing", musicPlaying);
    extraCanvas.dataset.musicShuffle = String(musicShuffle);
    extraCanvas.dataset.musicLoop = String(musicLoop);
    persistListenSession();
    window.dispatchEvent(new CustomEvent("lonely-sea:listen-hold", { detail: { active: listenSession } }));
    syncListenDock();
    all("[data-music-shuffle]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(musicShuffle));
    });
    all("[data-music-loop]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(musicLoop));
    });
    all("[data-music-toggle]", extraStage).forEach((toggle) => {
      toggle.setAttribute("aria-pressed", String(musicPlaying));
      const label = toggle.querySelector("strong");
      if (label) label.textContent = musicPlaying ? "PAUSE" : "PLAY";
    });
  }

  function rebuildMusicShuffle() {
    const order = musicItems.map((_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }
    const current = order.indexOf(musicIndex);
    if (current > 0) {
      order.splice(current, 1);
      order.unshift(musicIndex);
    }
    musicShuffleOrder = order;
  }

  function nextMusicIndex(step) {
    if (!musicShuffle) {
      return (musicIndex + step + musicItems.length) % musicItems.length;
    }
    if (musicShuffleOrder.length !== musicItems.length) rebuildMusicShuffle();
    const at = musicShuffleOrder.indexOf(musicIndex);
    return musicShuffleOrder[(at + step + musicShuffleOrder.length) % musicShuffleOrder.length];
  }

  function toggleMusicShuffle() {
    musicShuffle = !musicShuffle;
    if (musicShuffle) rebuildMusicShuffle();
    else musicShuffleOrder = [];
    syncMusicState();
    setFocus(musicItems[musicIndex].title, musicShuffle ? "SHUFFLE ON" : "SHUFFLE OFF");
  }

  function applyMusicLoop() {
    if (musicPlayer) musicPlayer.loop = musicLoop;
  }

  function toggleMusicLoop() {
    musicLoop = !musicLoop;
    applyMusicLoop();
    syncMusicState();
    setFocus(musicItems[musicIndex].title, musicLoop ? "LOOP ON" : "LOOP OFF");
  }

  function pauseMusic() {
    if (!musicPlayer || !musicPlaying) {
      musicPlaying = false;
      syncMusicState();
      return;
    }
    musicPlaying = false;
    musicPlayer.pause();
    syncMusicState();
    setFocus(musicItems[musicIndex].title, "PAUSED");
  }

  function toggleMusic() {
    if (musicPlaying) pauseMusic();
    else startMusic();
  }

  function stopMusic({ immediate = false, releaseSession = true } = {}) {
    const player = musicPlayer;
    const context = audioContext;
    const output = musicOutput;
    const sources = musicSources;
    const graph = musicGraph;
    musicPlayer = null;
    musicOutput = null;
    musicSources = [];
    musicGraph = [];
    musicOutputVolume = 0;
    musicPlaying = false;
    if (releaseSession) listenSession = false;
    syncMusicState();

    if (player) {
      player.pause();
      player.currentTime = 0;
    }

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

  async function startMusic({ startAt = 0 } = {}) {
    const current = musicItems[musicIndex];
    if (musicPlayer && !musicPlaying && musicPlayer.src) {
      if (startAt > 0) {
        try { musicPlayer.currentTime = startAt; } catch {}
      }
      try {
        await musicPlayer.play();
      } catch {
        setFocus(current.title, "CLICK PLAY TO START");
        return;
      }
      musicPlaying = true;
      listenSession = true;
      syncMusicState();
      setFocus(current.title, "PLAYING");
      return;
    }
    stopMusic({ immediate: true, releaseSession: false });

    if (current.src) {
      const player = new Audio(current.src);
      player.preload = "auto";
      player.loop = musicLoop;
      player.volume = Math.min(1, Math.max(0, readPreferences().bgmVolume / 100 * .58));
      player.muted = musicMuted;
      if (startAt > 0) {
        try { player.currentTime = startAt; } catch {}
      }
      player.addEventListener("ended", () => {
        if (musicPlayer !== player || musicLoop) return;
        changeMusicSelection(nextMusicIndex(1), { animate: true });
      });
      musicPlayer = player;
      try {
        await player.play();
      } catch {
        if (musicPlayer === player) {
          musicPlayer = null;
          setFocus(current.title, "CLICK PLAY TO START");
        }
        player.pause();
        return;
      }
      if (musicPlayer !== player) return;
      musicPlaying = true;
      listenSession = true;
      syncMusicState();
      setFocus(current.title, "PLAYING");
      recordBlogActivity("musicTracks", current.title);
      return;
    }

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      setFocus(current.title, "AUDIO IS NOT SUPPORTED");
      return;
    }

    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextConstructor();
    }
    await audioContext.resume();

    const now = audioContext.currentTime;
    const master = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const volume = Math.max(.004, readPreferences().bgmVolume / 100 * .045);
    musicOutputVolume = volume;
    master.gain.setValueAtTime(.0001, now);
    master.gain.exponentialRampToValueAtTime(musicMuted ? .0001 : volume, now + .48);
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
    listenSession = true;
    syncMusicState();
    setFocus(current.title, "PLAYING");
    recordBlogActivity("musicTracks", current.title);
  }

  function applyMusicMute() {
    if (musicPlayer) musicPlayer.muted = musicMuted;
    if (!audioContext || !musicOutput) return;
    const now = audioContext.currentTime;
    const target = musicMuted ? .0001 : Math.max(.0001, musicOutputVolume);
    try {
      musicOutput.gain.cancelScheduledValues(now);
      musicOutput.gain.setTargetAtTime(target, now, .025);
    } catch {}
  }

  function initMusicWave() {
    window.cancelAnimationFrame(musicWaveFrame);
    musicWaveFrame = 0;
    const canvas = extraStage.querySelector("[data-music-wave]");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let previousTime = 0;
    const reduceMotion = preferencesReduceMotion();

    const draw = (time = 0) => {
      if (!canvas.isConnected) {
        musicWaveFrame = 0;
        return;
      }

      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      const targetWidth = Math.round(width * pixelRatio);
      const targetHeight = Math.round(height * pixelRatio);
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const elapsed = previousTime ? Math.min(48, time - previousTime) : 16;
      previousTime = time;
      const targetAmplitude = musicPlaying ? 1 : .3;
      const blend = reduceMotion ? 1 : 1 - Math.exp(-(elapsed / 1000) * 5.8);
      musicWaveAmplitude += (targetAmplitude - musicWaveAmplitude) * blend;
      musicWavePhase += (elapsed / 1000) * (musicPlaying ? 2.1 : .32);

      const color = getComputedStyle(canvas).color;
      const center = height / 2;
      for (let line = 0; line < 3; line += 1) {
        context.beginPath();
        const inset = Math.min(18, width * .045);
        for (let x = inset; x <= width - inset; x += 3) {
          const progress = (x - inset) / Math.max(1, width - inset * 2);
          const envelope = Math.sin(Math.PI * progress) ** .72;
          const primary = Math.sin(x * (.025 + line * .0028) + musicWavePhase * (1 + line * .16));
          const secondary = Math.sin(x * .009 - musicWavePhase * (1.35 - line * .12) + line * 1.9);
          const amplitude = (3.1 + line * 2.35) * musicWaveAmplitude * envelope;
          const y = center + (primary * .68 + secondary * .32) * amplitude;
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = color;
        context.globalAlpha = .62 - line * .16;
        context.lineWidth = line === 0 ? 1.25 : .8;
        context.stroke();
      }
      context.globalAlpha = 1;

      if (!reduceMotion) musicWaveFrame = window.requestAnimationFrame(draw);
    };

    draw();
  }

  function bindScrollRails() {
    all("[data-extra-scroll-rail]", extraStage).forEach((rail) => {
      const shell = rail.closest(".extra-scroll-shell");
      const viewport = shell?.querySelector("[data-extra-scroll]");
      const thumb = rail.querySelector("span");
      if (!viewport || !thumb) return;
      if (rail.dataset.scrollBound === "true") {
        viewport.dispatchEvent(new Event("scroll"));
        return;
      }
      rail.dataset.scrollBound = "true";

      const update = () => {
        const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        const railHeight = rail.getBoundingClientRect().height;
        const progress = maxScroll
          ? maxScroll - viewport.scrollTop <= 1
            ? 1
            : viewport.scrollTop / maxScroll
          : 0;
        thumb.style.height = "1px";
        thumb.style.transform = `translate3d(-50%, ${railHeight * progress}px, 0)`;
        rail.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
        rail.hidden = maxScroll < 1;
      };

      viewport.addEventListener("scroll", update, { passive: true });
      rail.addEventListener("keydown", (event) => {
        const commands = {
          ArrowUp: -52,
          ArrowDown: 52,
          PageUp: -viewport.clientHeight * .82,
          PageDown: viewport.clientHeight * .82,
          Home: -viewport.scrollHeight,
          End: viewport.scrollHeight,
        };
        if (!(event.key in commands)) return;
        event.preventDefault();
        viewport.scrollTop += commands[event.key];
      });
      rail.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const railRect = rail.getBoundingClientRect();
        rail.setPointerCapture?.(event.pointerId);

        const move = (moveEvent) => {
          const available = Math.max(1, railRect.height);
          const thumbTop = Math.max(0, Math.min(moveEvent.clientY - railRect.top, available));
          const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
          viewport.scrollTop = (thumbTop / available) * maxScroll;
        };
        const finish = () => {
          rail.removeEventListener("pointermove", move);
          rail.removeEventListener("pointerup", finish);
          rail.removeEventListener("pointercancel", finish);
        };
        rail.addEventListener("pointermove", move);
        rail.addEventListener("pointerup", finish);
        rail.addEventListener("pointercancel", finish);
        move(event);
      });

      window.requestAnimationFrame(update);
    });
  }

  function filteredBangumiItems() {
    return bangumiItems.filter((item) => {
      if (bangumiCommentsOnly && !hasBangumiComment(item)) return false;
      const categoryMatches = bangumiCategory === "all" || item.category === bangumiCategory;
      const statusMatches =
        bangumiStatus === "all"
        || (bangumiStatus === "active" && ["playing", "watching", "reading"].includes(item.status))
        || item.status === bangumiStatus;
      return categoryMatches && statusMatches;
    });
  }

  function filteredProjectItems() {
    return projectItems.filter((item) => {
      const categoryMatches = projectCategory === "all" || item.category === projectCategory;
      const tagMatches = projectTag === "all" || item.tags.includes(projectTag);
      return categoryMatches && tagMatches;
    });
  }

  function visibleProjectTags() {
    const used = new Set(projectItems.flatMap((item) => item.tags));
    return projectTagOrder.filter((tag) => used.has(tag));
  }

  function openProjectArticle(href, title) {
    if (!href) return;
    writeArticleContinue(href, title);
    if (preferencesReduceMotion() || !readPreferences().articleTransition) {
      window.location.assign(href);
      return;
    }
    const curtain = document.querySelector("#route-curtain");
    if (!(curtain instanceof HTMLElement)) {
      window.location.assign(href);
      return;
    }
    const label = curtain.querySelector("strong");
    if (label) label.textContent = "NOW LOADING";
    curtain.setAttribute("aria-hidden", "false");
    window.setTimeout(() => curtain.classList.add("is-covering"), 40);
    window.setTimeout(() => window.location.assign(href), 520);
  }

  function totalPages() {
    if (extraMode === "cg") return Math.max(1, Math.ceil(cgItems.length / CG_PAGE_SIZE));
    if (extraMode === "projects") {
      return Math.max(1, Math.ceil(filteredProjectItems().length / PROJECT_PAGE_SIZE));
    }
    if (extraMode === "bangumi") {
      return Math.max(1, Math.ceil(filteredBangumiItems().length / BANGUMI_PAGE_SIZE));
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
          eyebrow: "SCENE ARCHIVE",
          title: "CG GALLERY",
          summary: `COLLECTED <b>${collected}</b><i>/</i>${cgItems.length}`,
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
                aria-label="${escapeHtml(locked ? "Locked CG" : `Open CG ${index + 1}`)}"
                data-focus-title="${escapeHtml(locked ? "LOCKED" : item.title)}"
                data-focus-action="${locked ? "NOT YET REGISTERED" : "OPEN CG"}"
                ${item.art ? `style="${artStyle(item.art)}"` : ""}
              >
                <span class="extra-cg-art" aria-hidden="true"></span>
                ${locked ? '<span class="extra-cg-lock" aria-hidden="true">LOCKED</span>' : ""}
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
          eyebrow: "SOUND TEST",
          title: "MUSIC",
          summary: `${musicItems.length} TRACKS`,
        })}
        <section class="extra-music-now" style="${artStyle(current.cover)}">
          <button class="extra-music-cover" type="button" data-music-toggle aria-label="Play or pause" aria-pressed="${musicPlaying}">
            <img src="${escapeHtml(current.cover)}" alt="" referrerpolicy="no-referrer" data-music-cover>
          </button>
          <div class="extra-music-current">
            <small>NOW PLAYING</small>
            <h4>${escapeHtml(current.title)}</h4>
            <p><span data-music-current-artist>${escapeHtml(current.artist)}</span></p>
            <p class="extra-music-source">
              <button type="button" class="extra-music-source-mark" aria-expanded="false" aria-controls="extra-music-source-copy">SOURCE</button>
              <span class="extra-music-source-copy" id="extra-music-source-copy">
                音源来自网易云。本 blog 无任何版权。
                <a href="${escapeHtml(musicPlaylist.url)}" ${externalAttributes()}>打开歌单</a>
              </span>
            </p>
          </div>
          <div class="extra-music-wave-deck">
            <button class="extra-music-skip is-previous" type="button" data-music-step="-1" aria-label="Previous track">‹</button>
            <button class="extra-music-toggle" type="button" data-music-toggle aria-pressed="${musicPlaying}">
              <span class="extra-play-glyph" aria-hidden="true"><i class="is-play"></i><i class="is-pause"></i></span>
              <strong>${musicPlaying ? "PAUSE" : "PLAY"}</strong>
            </button>
            ${waveMarkup()}
            <button class="extra-music-loop" type="button" data-music-loop aria-pressed="${musicLoop}" aria-label="Repeat this track">LOOP</button>
            <button class="extra-music-shuffle" type="button" data-music-shuffle aria-pressed="${musicShuffle}" aria-label="Shuffle playlist">SHUFFLE</button>
            <button class="extra-music-skip is-next" type="button" data-music-step="1" aria-label="Next track">›</button>
          </div>
        </section>
        <div class="extra-track-browser extra-scroll-shell">
          <div class="extra-track-list" id="extra-track-scroll" data-extra-scroll tabindex="0" aria-label="Music tracks">
            ${musicItems.map((track, index) => `
              <button
                type="button"
                data-music-index="${index}"
                data-focus-title="${escapeHtml(track.title)}"
                data-focus-action="SELECT MUSIC"
                aria-pressed="${index === musicIndex}"
              >
                <span class="extra-track-cursor" aria-hidden="true">›</span>
                <span class="extra-track-copy">
                  <strong>${escapeHtml(track.title)}</strong>
                  <small>${escapeHtml(track.artist)}</small>
                </span>
              </button>
            `).join("")}
          </div>
          <div class="extra-scroll-rail" data-extra-scroll-rail role="scrollbar" aria-controls="extra-track-scroll" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span></span></div>
        </div>
      </div>
    `;
    syncMusicState();
    initMusicWave();
    extraStage.querySelector("[data-music-cover]")?.addEventListener("error", () => {
      extraStage.querySelector(".extra-music-cover")?.classList.add("is-missing");
    });
    bindMusicSource();
  }

  function bindMusicSource() {
    const source = extraStage.querySelector(".extra-music-source");
    const mark = extraStage.querySelector(".extra-music-source-mark");
    if (!source || !mark) return;
    const setOpen = (open) => {
      source.classList.toggle("is-open", open);
      mark.setAttribute("aria-expanded", String(open));
    };
    source.addEventListener("pointerenter", () => setOpen(true));
    source.addEventListener("pointerleave", () => setOpen(false));
    mark.addEventListener("focus", () => setOpen(true));
    source.addEventListener("focusout", (event) => {
      if (!source.contains(event.relatedTarget)) setOpen(false);
    });
    mark.addEventListener("click", () => setOpen(!source.classList.contains("is-open")));
  }

  function syncListenDock({ extraOpen } = {}) {
    const dock = document.querySelector("#listen-dock");
    if (!(dock instanceof HTMLElement)) return;
    const screenOpen = extraOpen ?? extraCanvas.closest("[data-screen]")?.getAttribute("aria-hidden") === "false";
    const hide = !listenSession || (screenOpen && extraMode === "music");
    const current = musicItems[musicIndex];
    dock.hidden = hide;
    dock.setAttribute("aria-hidden", String(hide));
    dock.classList.toggle("is-playing", musicPlaying);
    const title = dock.querySelector("[data-listen-title]");
    const artist = dock.querySelector("[data-listen-artist]");
    const cover = dock.querySelector("[data-listen-cover]");
    if (title) title.textContent = current.title;
    if (artist) artist.textContent = current.artist;
    if (cover instanceof HTMLImageElement && current.cover && cover.getAttribute("src") !== current.cover) {
      cover.onerror = () => cover.removeAttribute("src");
      cover.src = current.cover;
    }
    all("[data-listen-toggle]", dock).forEach((toggle) => {
      toggle.setAttribute("aria-pressed", String(musicPlaying));
      toggle.setAttribute("aria-label", musicPlaying ? "Pause playlist" : "Play playlist");
    });
    dock.querySelector("[data-listen-loop]")?.setAttribute("aria-pressed", String(musicLoop));
    dock.querySelector("[data-listen-shuffle]")?.setAttribute("aria-pressed", String(musicShuffle));
  }

  function projectCardsMarkup(items) {
    if (!items.length) return `<p class="extra-project-empty">${escapeHtml(projectRoomCopy().empty)}</p>`;
    return items.map((item) => {
      const links = projectLinks(item);
      const title = projectTitle(item);
      return `
        <article
          class="extra-project-record${links.length ? " has-links" : ""}"
          data-focus-title="${escapeHtml(title)}"
          data-focus-action="${links.length ? "OPEN PROJECT" : "PROJECT RECORD"}"
        >
          <div class="extra-project-art${item.art ? " has-art" : ""}"${item.art ? ` style="${artStyle(item.art)}"` : ""}>
            <span aria-hidden="true"></span>
            ${links.length ? `
              <nav aria-label="${escapeHtml(title)} links" data-link-count="${links.length}">
                ${links.map(([label, href, kind]) => `
                  <a href="${escapeHtml(href)}" ${kind === "internal" ? 'data-project-article="true"' : externalAttributes()}>${escapeHtml(label)}</a>
                `).join("")}
              </nav>
            ` : ""}
          </div>
          <div class="extra-project-copy">
            <strong>${escapeHtml(title)}</strong>
            <p>
              ${item.tags.map((tag) => `
                <button type="button" data-project-card-tag="${escapeHtml(tag)}" aria-pressed="${tag === projectTag}">
                  ${escapeHtml(projectTagText(tag))}
                </button>
              `).join("")}
            </p>
          </div>
        </article>
      `;
    }).join("");
  }

  function syncProjectFilters() {
    all("[data-project-category]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.projectCategory === projectCategory));
    });
    all("[data-project-tag]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.projectTag === projectTag));
    });
  }

  function paintProjectGrid({ animate = true } = {}) {
    const filteredItems = filteredProjectItems();
    extraPage = Math.max(0, Math.min(extraPage, Math.max(1, Math.ceil(filteredItems.length / PROJECT_PAGE_SIZE)) - 1));
    const start = extraPage * PROJECT_PAGE_SIZE;
    const items = filteredItems.slice(start, start + PROJECT_PAGE_SIZE);
    const grid = extraStage.querySelector(".extra-project-grid");
    if (!grid) return;
    const token = ++projectGridToken;

    const replace = () => {
      if (token !== projectGridToken) return;
      grid.innerHTML = projectCardsMarkup(items);
      const count = extraStage.querySelector("[data-project-count]");
      if (count) count.textContent = String(filteredItems.length);
      bindProjectCards();
      bindFocusNodes(grid);
      updatePageControls();
    };

    if (!animate || preferencesReduceMotion()) {
      replace();
      return;
    }

    const outgoing = grid.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: "translate3d(.6cqw,0,0)" },
      ],
      { duration: 110, easing: "ease-out", fill: "both" },
    );
    outgoing.finished
      .then(() => {
        outgoing.cancel();
        replace();
        if (token !== projectGridToken) return;
        grid.animate(
          [
            { opacity: 0, transform: "translate3d(-.6cqw,0,0)" },
            { opacity: 1, transform: "translate3d(0,0,0)" },
          ],
          { duration: 180, easing: "cubic-bezier(.22,1,.36,1)" },
        );
      })
      .catch(() => {
        outgoing.cancel();
        replace();
      });
  }

  function revealProjectTag(tag) {
    const rail = extraStage.querySelector("[data-project-tag-rail]");
    const button = rail?.querySelector(`[data-project-tag="${CSS.escape(tag)}"]`);
    if (!rail || !button) return;
    const left = button.offsetLeft;
    const right = left + button.offsetWidth;
    const viewLeft = rail.scrollLeft;
    const viewRight = viewLeft + rail.clientWidth;
    if (left < viewLeft + 8) rail.scrollLeft = Math.max(0, left - 12);
    else if (right > viewRight - 8) rail.scrollLeft = right - rail.clientWidth + 12;
  }

  function selectProjectTag(next) {
    if (!next || next === projectTag) return;
    projectTag = next;
    extraPage = 0;
    syncProjectFilters();
    paintProjectGrid();
    revealProjectTag(next);
  }

  function bindProjectTagRail() {
    const rail = extraStage.querySelector("[data-project-tag-rail]");
    if (!rail || rail.dataset.projectRailBound === "true") return;
    rail.dataset.projectRailBound = "true";
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;
    let suppressClick = null;

    const syncFade = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      rail.classList.toggle("has-overflow", max > 4);
      rail.classList.toggle("has-left-fade", rail.scrollLeft > 6);
      rail.classList.toggle("has-right-fade", max > 4 && rail.scrollLeft < max - 6);
    };

    const clearSuppress = () => {
      if (!suppressClick) return;
      rail.removeEventListener("click", suppressClick, true);
      suppressClick = null;
    };

    rail.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || rail.scrollWidth <= rail.clientWidth) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      dragged = false;
    });
    rail.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientX - startX;
      if (!dragged && Math.abs(distance) < 12) return;
      if (!dragged) {
        dragged = true;
        rail.classList.add("is-dragging");
        rail.setPointerCapture(pointerId);
      }
      rail.scrollLeft = startScroll - distance;
    });
    const endDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      rail.classList.remove("is-dragging");
      pointerId = null;
      if (!dragged) return;
      clearSuppress();
      suppressClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        clearSuppress();
      };
      rail.addEventListener("click", suppressClick, true);
      window.setTimeout(clearSuppress, 0);
      dragged = false;
    };
    rail.addEventListener("pointerup", endDrag);
    rail.addEventListener("pointercancel", endDrag);
    rail.addEventListener("wheel", (event) => {
      if (rail.scrollWidth <= rail.clientWidth) return;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      rail.scrollLeft += delta;
    }, { passive: false });
    rail.addEventListener("scroll", syncFade, { passive: true });
    window.requestAnimationFrame(syncFade);
  }

  function bindProjectCards() {
    all("[data-project-card-tag]", extraStage).forEach((button) => {
      if (button.dataset.projectBound === "true") return;
      button.dataset.projectBound = "true";
      button.addEventListener("click", () => selectProjectTag(button.dataset.projectCardTag));
    });
    all("[data-project-article]", extraStage).forEach((link) => {
      if (link.dataset.projectBound === "true") return;
      link.dataset.projectBound = "true";
      const href = link.getAttribute("href") || "";
      link.addEventListener("pointerenter", () => {
        const preferences = readPreferences();
        if (!href || !preferences.smartPreload || preferences.dataSaver) return;
        if (document.head.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
        const prefetch = document.createElement("link");
        prefetch.rel = "prefetch";
        prefetch.href = href;
        document.head.append(prefetch);
      }, { once: true });
      link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented
          || event.button !== 0
          || event.metaKey
          || event.ctrlKey
          || event.shiftKey
          || event.altKey
        ) return;
        event.preventDefault();
        const card = link.closest("[data-focus-title]");
        openProjectArticle(href, card?.dataset.focusTitle || "");
      });
    });
  }

  function renderProjects() {
    const filteredItems = filteredProjectItems();
    extraPage = Math.max(0, Math.min(extraPage, Math.max(1, Math.ceil(filteredItems.length / PROJECT_PAGE_SIZE)) - 1));
    const start = extraPage * PROJECT_PAGE_SIZE;
    const items = filteredItems.slice(start, start + PROJECT_PAGE_SIZE);
    const copy = projectRoomCopy();
    extraStage.innerHTML = `
      <div class="extra-room extra-project-room">
        ${roomHeading({
          eyebrow: "PROJECT ARCHIVE",
          title: "PROJECT",
          summary: `<b data-project-count>${filteredItems.length}</b> / ${projectItems.length}`,
          note: copy.note,
        })}
        <section class="extra-project-toolbar">
          <div class="extra-project-filter">
            <nav aria-label="Project category">
              <button type="button" data-project-category="all" aria-pressed="${projectCategory === "all"}">${copy.all}</button>
              ${projectCategories.map((entry) => `
                <button type="button" data-project-category="${entry.id}" aria-pressed="${projectCategory === entry.id}">
                  ${escapeHtml(projectText(entry.labels))}
                </button>
              `).join("")}
            </nav>
            <nav aria-label="Project tags" data-project-tag-rail>
              <button type="button" data-project-tag="all" aria-pressed="${projectTag === "all"}">${copy.all}</button>
              ${visibleProjectTags().map((tag) => `
                <button type="button" data-project-tag="${escapeHtml(tag)}" aria-pressed="${projectTag === tag}">
                  ${escapeHtml(projectTagText(tag))}
                </button>
              `).join("")}
            </nav>
          </div>
          <div class="extra-project-activity">
            <span><strong>CONTRIBUTION TIDE</strong><small>LAST 12 WEEKS</small></span>
            ${heatmapMarkup(externalActivity.github, "extra-project-heatmap")}
          </div>
        </section>
        <div class="extra-project-grid">
          ${projectCardsMarkup(items)}
        </div>
      </div>
    `;
  }

  function listedBangumiItems() {
    return filteredBangumiItems().map((item) => ({
      item,
      index: bangumiItems.indexOf(item),
    }));
  }

  function bangumiCardsMarkup(items) {
    if (!items.length) return '<p class="extra-bangumi-empty">NO RECORDS MATCH THIS FILTER.</p>';
    return items.map(({ item, index }, itemPosition) => `
      <button
        class="extra-bangumi-card"
        type="button"
        data-bangumi-index="${index}"
        data-focus-title="${escapeHtml(item.title)}"
        data-focus-action="SELECT RECORD"
        aria-pressed="${index === bangumiIndex}"
      >
        <span class="extra-bangumi-cover" aria-hidden="true"><img src="${escapeHtml(item.cover)}" alt="" loading="${itemPosition < 8 ? "eager" : "lazy"}" decoding="async" draggable="false"></span>
        <span class="extra-bangumi-copy">
          <strong>${escapeHtml(item.title)}</strong>
        </span>
      </button>
    `).join("");
  }

  function bangumiFocusMarkup(selected) {
    if (!selected) return "";
    return `
      <aside class="extra-bangumi-focus" data-bangumi-focus data-preview-index="${selected.index}">
        <span class="extra-bangumi-focus-art is-visible" data-bangumi-focus-art style="${artStyle(selected.item.cover)}" aria-hidden="true"></span>
        <span class="extra-bangumi-focus-art" data-bangumi-focus-art aria-hidden="true"></span>
        <div class="extra-bangumi-focus-copy">
          <h4 data-bangumi-focus-title>${escapeHtml(selected.item.title)}</h4>
          <p class="extra-bangumi-focus-note" data-bangumi-focus-note${selected.item.total ? "" : " hidden"}>${escapeHtml(selected.item.total ? `PROGRESS ${selected.item.progress} / ${selected.item.total}` : "")}</p>
          <div class="extra-bangumi-nvl extra-scroll-shell" data-bangumi-nvl>
            <div class="extra-bangumi-nvl-body" data-extra-scroll tabindex="0">
              <p data-bangumi-nvl-text>${escapeHtml(selected.item.comment || "")}</p>
            </div>
            <div class="extra-scroll-rail" data-extra-scroll-rail role="scrollbar" aria-controls="bangumi-nvl-scroll" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span></span></div>
          </div>
          <nav class="extra-bangumi-focus-actions">
            <a data-bangumi-focus-link href="${escapeHtml(selected.item.href)}" ${externalAttributes()}>
              <span>OPEN RECORD</span><i aria-hidden="true">↗</i>
            </a>
            <button type="button" data-bangumi-comment-open${selected.item.comment ? "" : " hidden"}>READ NOTE</button>
            <button type="button" data-bangumi-nvl-close>CLOSE</button>
          </nav>
        </div>
        <strong class="extra-bangumi-focus-ghost" data-bangumi-focus-state aria-hidden="true">${escapeHtml(selected.item.state)}</strong>
      </aside>
    `;
  }

  function syncBangumiFilters() {
    all("[data-bangumi-category]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.bangumiCategory === bangumiCategory));
    });
    all("[data-bangumi-status]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.bangumiStatus === bangumiStatus));
    });
    const commentFilter = extraStage.querySelector("[data-bangumi-comment-filter]");
    if (commentFilter) {
      commentFilter.setAttribute("aria-pressed", String(bangumiCommentsOnly));
      commentFilter.textContent = bangumiCommentsOnly ? "COMMENTS ONLY" : "ALL RECORDS";
      commentFilter.setAttribute(
        "aria-label",
        bangumiCommentsOnly ? "Show all Bangumi records" : "Show only records with comments",
      );
    }
  }

  function paintBangumiShelf({ animate = true } = {}) {
    const token = ++bangumiShelfToken;
    const items = listedBangumiItems();
    const selected = items.find((entry) => entry.index === bangumiIndex) ?? items[0] ?? null;
    if (selected) bangumiIndex = selected.index;
    bangumiFocusLayer = 0;
    bangumiFocusToken += 1;
    closeBangumiReader();

    const track = extraStage.querySelector(".extra-bangumi-track");
    const workspace = extraStage.querySelector(".extra-bangumi-workspace");
    const count = extraStage.querySelector("[data-bangumi-count]");
    if (!track || !workspace) return;

    const replace = () => {
      if (token !== bangumiShelfToken) return;
      track.innerHTML = bangumiCardsMarkup(items);
      const existingFocus = workspace.querySelector("[data-bangumi-focus]");
      const nextFocus = bangumiFocusMarkup(selected);
      if (existingFocus) {
        if (nextFocus) existingFocus.outerHTML = nextFocus;
        else existingFocus.remove();
      } else if (nextFocus) {
        workspace.insertAdjacentHTML("beforeend", nextFocus);
      }
      if (count) count.textContent = String(items.length);
      bindBangumiCards();
      bindFocusNodes(track);
      bindScrollRails();
      const viewport = extraStage.querySelector(".extra-bangumi-viewport");
      if (viewport) {
        viewport.scrollLeft = 0;
        syncBangumiEdgeFade(viewport);
      }
      updatePageControls();
      if (selected) setFocus(selected.item.title, "OPEN BANGUMI");
      else setFocus(...extraDefaults.bangumi);
    };

    if (!animate || preferencesReduceMotion()) {
      replace();
      return;
    }

    const viewport = extraStage.querySelector(".extra-bangumi-viewport");
    const outgoing = viewport?.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 110, easing: "ease", fill: "both" },
    );
    outgoing?.finished
      .then(() => {
        outgoing.cancel();
        replace();
        if (token !== bangumiShelfToken) return;
        extraStage.querySelector(".extra-bangumi-viewport")?.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 180, easing: "cubic-bezier(.22,1,.36,1)" },
        );
      })
      .catch(() => {
        outgoing?.cancel();
        replace();
      });
  }

  function renderBangumi() {
    bangumiFocusLayer = 0;
    bangumiFocusToken += 1;
    const items = listedBangumiItems();
    const selected = items.find((entry) => entry.index === bangumiIndex) ?? items[0] ?? null;
    if (selected) bangumiIndex = selected.index;
    const categories = [
      ["all", "ALL"],
      ["anime", "ANIME"],
      ["game", "GAMES"],
      ["book", "BOOKS"],
    ];
    const statuses = [
      ["all", "ALL"],
      ["active", "IN PROGRESS"],
      ["finished", "COMPLETED"],
      ["wishlist", "WISHLIST"],
    ];
    extraStage.innerHTML = `
      <div class="extra-room extra-bangumi-room">
        ${roomHeading({
          eyebrow: "BANGUMI RECORD",
          title: "BANGUMI",
          summary: `<b data-bangumi-count>${items.length}</b> RECORDS`,
          note: `SYNCED ${new Date(externalActivity.syncedAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Tokyo" })}`,
        })}
        <section class="extra-bangumi-toolbar">
          <div class="extra-bangumi-filters">
            <nav aria-label="Bangumi category">
              ${categories.map(([value, label]) => `
                <button type="button" data-bangumi-category="${value}" aria-pressed="${bangumiCategory === value}">
                  ${label}
                </button>
              `).join("")}
            </nav>
            <nav aria-label="Bangumi status">
              ${statuses.map(([value, label]) => `
                <button type="button" data-bangumi-status="${value}" aria-pressed="${bangumiStatus === value}">
                  ${label}
                </button>
              `).join("")}
              <button
                type="button"
                data-bangumi-comment-filter
                aria-pressed="${bangumiCommentsOnly}"
                aria-label="${bangumiCommentsOnly ? "Show all Bangumi records" : "Show only records with comments"}"
              >
                ${bangumiCommentsOnly ? "COMMENTS ONLY" : "ALL RECORDS"}
              </button>
            </nav>
          </div>
          <div class="extra-bangumi-activity">
            <span><strong>ACTIVITY</strong><small>LAST 12 WEEKS</small></span>
            ${heatmapMarkup(externalActivity.bangumi, "extra-bangumi-heatmap")}
          </div>
        </section>
        <section class="extra-bangumi-workspace">
          <div class="extra-bangumi-viewport" tabindex="0" aria-label="Horizontal Bangumi archive">
            <div class="extra-bangumi-track">
              ${bangumiCardsMarkup(items)}
            </div>
          </div>
          ${bangumiFocusMarkup(selected)}
        </section>
      </div>
    `;
  }

  function renderMovie() {
    extraStage.innerHTML = `
      <div class="extra-room extra-movie-room">
        ${roomHeading({
          eyebrow: "VIDEO ARCHIVE",
          title: "MOVIE",
          summary: "REAL RECORDS ONLY",
          note: "当前仅收录已有的公开视频列表",
        })}
        <div class="extra-movie-stage">
          ${movieItems.map((item) => `
            <a
              class="extra-movie-frame"
              data-focus-title="${escapeHtml(item.title)}"
              data-focus-action="OPEN PLAYLIST"
              href="${escapeHtml(item.href)}"
              ${externalAttributes()}
              style="${artStyle(item.art)}"
            >
              <span class="extra-movie-art" aria-hidden="true"></span>
              <span class="extra-movie-play" aria-hidden="true">▶</span>
              <span class="extra-movie-copy">
                <small>${escapeHtml(item.meta)}</small>
                <strong>${escapeHtml(item.title)}</strong>
              </span>
            </a>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderCharacter() {
    const character = characterItems[0];
    const expression = character.expressions[characterExpressionIndex] || character.expressions[0];
    extraStage.innerHTML = `
      <div class="extra-room extra-character-room">
        ${roomHeading({
          eyebrow: "A VOICE FROM THE LIGHTHOUSE",
          title: "CHARACTER",
          summary: "ALICE · LIGHTHOUSE NAVIGATOR",
        })}
        <section class="extra-character-stage" data-character-stage>
          <article class="extra-character-profile is-active" data-character-profile="0">
            <div class="extra-character-visual" data-character-portrait style="${artStyle(expression.art)}" aria-hidden="true">
              <span class="extra-character-art"></span>
            </div>
            <div class="extra-character-dossier">
              <p class="extra-character-file">THE LIGHTHOUSE NAVIGATOR</p>
              <h4>${escapeHtml(character.name)}<small>${escapeHtml(character.localizedName)}</small></h4>
              <p class="extra-character-role">${escapeHtml(character.role)}</p>
              <blockquote data-character-line>${escapeHtml(expression.line)}</blockquote>
              <p class="extra-character-description">${escapeHtml(character.description)}</p>
              <nav class="extra-character-expressions" aria-label="Alice expressions">
                ${character.expressions.map((item, index) => `
                  <button type="button" data-character-expression="${index}" aria-pressed="${index === characterExpressionIndex}">
                    ${escapeHtml(item.label)}
                  </button>
                `).join("")}
              </nav>
              <button class="extra-character-intro" type="button" data-character-scene="${escapeHtml(character.sceneId)}">
                <span>READ INTRODUCTION</span><small>OPEN IN GAME ↗</small>
              </button>
            </div>
          </article>
        </section>
      </div>
    `;
  }

  function renderAchievement() {
    const resolvedItems = resolveAchievements();
    const unlocked = resolvedItems.filter((item) => item.unlocked);
    const latest = [...unlocked]
      .sort((left, right) => Date.parse(left.unlockedAt) - Date.parse(right.unlockedAt))
      .at(-1);
    extraStage.innerHTML = `
      <div class="extra-room extra-achievement-room">
        ${roomHeading({
          eyebrow: "RECORD OF ARRIVAL",
          title: "ACHIEVEMENTS",
          summary: "TRACES LEFT BY READING",
          note: latest ? `LATEST · ${latest.name}` : "尚未取得记录",
        })}
        <div class="extra-achievement-browser extra-scroll-shell">
          <div class="extra-achievement-ledger" id="extra-achievement-scroll" data-extra-scroll aria-label="Achievement list" tabindex="0">
            ${resolvedItems.map((item) => `
              <article
                class="extra-achievement-row${item.unlocked ? " is-unlocked" : " is-locked"}"
                data-focus-title="${escapeHtml(item.name)}"
                data-focus-action="${item.unlocked ? "ACHIEVEMENT UNLOCKED" : "LOCKED ACHIEVEMENT"}"
              >
                <span class="extra-achievement-state" aria-label="${item.unlocked ? "已取得" : "未取得"}">${item.unlocked ? "✓" : "◇"}</span>
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <small><b>${escapeHtml(item.title)}</b>${escapeHtml(item.detail)}</small>
                </div>
                <em>${escapeHtml(item.unlocked ? "已取得" : "尚未取得")}</em>
              </article>
            `).join("")}
          </div>
          <div class="extra-scroll-rail" data-extra-scroll-rail role="scrollbar" aria-controls="extra-achievement-scroll" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span></span></div>
        </div>
      </div>
    `;
  }

  function openBangumiReader(item) {
    if (!item?.comment) return;
    const text = extraStage.querySelector("[data-bangumi-nvl-text]");
    if (text) text.textContent = item.comment;
    extraCanvas.classList.add("is-reading-note");
    window.requestAnimationFrame(() => bindScrollRails());
  }

  function closeBangumiReader() {
    extraCanvas.classList.remove("is-reading-note");
  }

  function bindFocusNodes(root = extraStage) {
    all("[data-focus-title]", root).forEach((node) => {
      if (node.dataset.extraFocusBound === "true") return;
      node.dataset.extraFocusBound = "true";
      const update = () => setFocus(node.dataset.focusTitle, node.dataset.focusAction);
      node.addEventListener("pointerenter", update);
      node.addEventListener("focus", update);
    });
  }

  function bindBangumiCards() {
    all("[data-bangumi-index]", extraStage).forEach((button) => {
      if (button.dataset.bangumiBound === "true") return;
      button.dataset.bangumiBound = "true";
      button.addEventListener("click", (event) => {
        selectBangumi(Number(button.dataset.bangumiIndex), { animate: event.detail > 0 });
      });
      button.addEventListener("pointerenter", () => {
        selectBangumi(Number(button.dataset.bangumiIndex), { animate: true });
      });
      button.addEventListener("focus", () => {
        selectBangumi(Number(button.dataset.bangumiIndex), { animate: false });
      });
    });
    extraStage.querySelector("[data-bangumi-comment-open]")?.addEventListener("click", () => {
      const item = bangumiItems[bangumiIndex];
      if (item?.comment) openBangumiReader(item);
    });
    extraStage.querySelector("[data-bangumi-nvl-close]")?.addEventListener("click", () => closeBangumiReader());
  }

  function syncBangumiEdgeFade(viewport) {
    viewport.classList.toggle("has-left-fade", viewport.scrollLeft > 6);
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
    if (!viewport || viewport.dataset.bangumiViewportBound === "true") return;
    viewport.dataset.bangumiViewportBound = "true";
    let pointerId = null;
    let pointerStart = 0;
    let scrollStart = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let dragged = false;
    let inertia = 0;

    const stopInertia = () => {
      if (inertia) cancelAnimationFrame(inertia);
      inertia = 0;
    };

    viewport.addEventListener("wheel", (event) => {
      if (viewport.scrollWidth <= viewport.clientWidth) return;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      stopInertia();
      viewport.scrollLeft += delta;
    }, { passive: false });
    viewport.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      changePage(event.key === "ArrowLeft" ? -1 : 1, { animate: false });
    });
    viewport.addEventListener("scroll", () => {
      syncBangumiPageFromScroll(viewport);
      syncBangumiEdgeFade(viewport);
    }, { passive: true });
    viewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || viewport.scrollWidth <= viewport.clientWidth) return;
      if (event.target.closest("a, [data-bangumi-comment-open]")) return;
      stopInertia();
      pointerId = event.pointerId;
      pointerStart = lastX = event.clientX;
      lastTime = event.timeStamp;
      scrollStart = viewport.scrollLeft;
      velocity = 0;
      dragged = false;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientX - pointerStart;
      const dt = Math.max(1, event.timeStamp - lastTime);
      velocity = (lastX - event.clientX) / dt * 16;
      lastX = event.clientX;
      lastTime = event.timeStamp;
      dragged ||= Math.abs(distance) > 4;
      viewport.scrollLeft = scrollStart - distance;
    });
    const stopDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      viewport.classList.remove("is-dragging");
      pointerId = null;
      if (Math.abs(velocity) < .35) return;
      const tick = () => {
        viewport.scrollLeft += velocity;
        velocity *= .92;
        if (Math.abs(velocity) < .18) {
          inertia = 0;
          return;
        }
        inertia = window.requestAnimationFrame(tick);
      };
      inertia = window.requestAnimationFrame(tick);
    };
    viewport.addEventListener("pointerup", stopDrag);
    viewport.addEventListener("pointercancel", stopDrag);
    viewport.addEventListener("click", (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);
    syncBangumiEdgeFade(viewport);
  }

  async function refreshCurrentMode(mutator, { animate = true, direction = 1 } = {}) {
    if (pageSliding) return;
    if (!animate || preferencesReduceMotion()) {
      mutator();
      renderMode();
      return;
    }

    pageSliding = true;
    let committed = false;
    const outgoingRoom = extraStage.firstElementChild;
    const outgoing = outgoingRoom?.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: `translate3d(${-direction * 10}px,0,0)` },
      ],
      { duration: 130, easing: "cubic-bezier(.25,1,.5,1)", fill: "both" },
    );
    try {
      await outgoing?.finished;
      mutator();
      committed = true;
      renderMode();
      const incomingRoom = extraStage.firstElementChild;
      const incoming = incomingRoom?.animate(
        [
          { opacity: 0, transform: `translate3d(${direction * 12}px,0,0)` },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        { duration: 240, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
      );
      await incoming?.finished;
      incoming?.cancel();
    } catch {
      if (!committed) mutator();
      renderMode();
    } finally {
      outgoing?.cancel();
      pageSliding = false;
    }
  }

  function showBangumiFocus(index, { animate = true, commit = false } = {}) {
    const item = bangumiItems[index];
    const focus = extraStage.querySelector("[data-bangumi-focus]");
    if (!item || !focus) return;
    if (commit) bangumiIndex = index;

    if (Number(focus.dataset.previewIndex) !== index) {
      const layers = all("[data-bangumi-focus-art]", focus);
      const currentLayer = layers.find((layer) => layer.classList.contains("is-visible")) ?? layers[bangumiFocusLayer];
      const nextLayer = layers.find((layer) => layer !== currentLayer);
      if (nextLayer) {
        const token = ++bangumiFocusToken;
        const instant = !animate || preferencesReduceMotion();
        if (instant) layers.forEach((layer) => { layer.style.transitionDuration = "0ms"; });
        nextLayer.style.setProperty("--extra-art", `url("${item.cover}")`);
        nextLayer.classList.remove("is-visible");
        void nextLayer.offsetWidth;
        currentLayer?.classList.remove("is-visible");
        nextLayer.classList.add("is-visible");
        bangumiFocusLayer = layers.indexOf(nextLayer);
        if (instant) {
          window.requestAnimationFrame(() => {
            if (token !== bangumiFocusToken) return;
            layers.forEach((layer) => { layer.style.transitionDuration = ""; });
          });
        }
      }

      required("[data-bangumi-focus-title]", focus).textContent = item.title;
      const note = required("[data-bangumi-focus-note]", focus);
      note.textContent = item.total ? `PROGRESS ${item.progress} / ${item.total}` : "";
      note.hidden = !note.textContent;
      required("[data-bangumi-focus-link]", focus).href = item.href;
      required("[data-bangumi-focus-state]", focus).textContent = item.state;
      const commentOpen = focus.querySelector("[data-bangumi-comment-open]");
      if (commentOpen) commentOpen.hidden = !item.comment;
      const nvlText = focus.querySelector("[data-bangumi-nvl-text]");
      if (nvlText) nvlText.textContent = item.comment || "";
      closeBangumiReader();
      focus.dataset.previewIndex = String(index);
    }

    if (commit) {
      all("[data-bangumi-index]", extraStage).forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.bangumiIndex) === index));
      });
      setFocus(item.title, "OPEN BANGUMI");
    }
  }

  function selectBangumi(index, { animate = true } = {}) {
    if (index === bangumiIndex) return;
    showBangumiFocus(index, { animate, commit: true });
  }

  function selectCharacterExpression(index) {
    const character = characterItems[0];
    const expression = character.expressions[index];
    if (!expression || index === characterExpressionIndex) return;
    characterExpressionIndex = index;
    const portrait = required("[data-character-portrait]", extraStage);
    portrait.style.setProperty("--extra-art", `url("${expression.art}")`);
    required("[data-character-line]", extraStage).textContent = expression.line;
    all("[data-character-expression]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.characterExpression) === index));
    });
    if (!preferencesReduceMotion()) {
      portrait.animate(
        [{ opacity: .7, transform: "translate3d(0,7px,0)" }, { opacity: 1, transform: "translate3d(0,0,0)" }],
        { duration: 230, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    setFocus(`${character.name} · ${expression.label}`, "EXPRESSION SELECTED");
  }

  function changeMusicSelection(index, { animate = true } = {}) {
    const next = (index + musicItems.length) % musicItems.length;
    if (next === musicIndex) return;
    const resume = musicPlaying;
    const keepSession = listenSession;
    stopMusic({ immediate: true, releaseSession: false });
    musicIndex = next;
    const current = musicItems[musicIndex];
    const room = extraStage.querySelector(".extra-music-room");
    const now = extraStage.querySelector(".extra-music-now");
    const copy = extraStage.querySelector(".extra-music-current");
    if (!room || !now || !copy) {
      listenSession = keepSession || resume;
      if (resume) startMusic();
      else syncListenDock();
      return;
    }

    room.dataset.musicTone = current.tone;
    now.style.setProperty("--extra-art", `url("${current.cover}")`);
    const cover = now.querySelector(".extra-music-cover");
    const coverImage = now.querySelector("[data-music-cover]");
    if (coverImage) {
      cover?.classList.remove("is-missing");
      coverImage.onerror = () => cover?.classList.add("is-missing");
      coverImage.src = current.cover;
    }
    required("h4", copy).textContent = current.title;
    required("[data-music-current-artist]", copy).textContent = current.artist;
    all("[data-music-index]", extraStage).forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.musicIndex) === musicIndex));
    });
    setFocus(current.title, "MUSIC SELECTED");
    if (animate && !preferencesReduceMotion()) {
      copy.animate(
        [
          { opacity: .35, transform: "translate3d(5px,0,0)" },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        { duration: 170, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    window.requestAnimationFrame(() => {
      const list = extraStage.querySelector(".extra-track-list");
      const selected = extraStage.querySelector(`[data-music-index="${musicIndex}"]`);
      if (list && selected) {
        const top = selected.offsetTop - Math.max(0, (list.clientHeight - selected.offsetHeight) / 2);
        list.scrollTop = Math.max(0, top);
      }
    });
    listenSession = keepSession || resume;
    if (resume) startMusic();
    else syncListenDock();
  }

  function bindStage() {
    bindFocusNodes();

    all("[data-cg-index]", extraStage).forEach((node) => {
      node.addEventListener("click", () => openCg(Number(node.dataset.cgIndex), node));
    });

    all("[data-music-index]", extraStage).forEach((node) => {
      node.addEventListener("click", (event) => {
        const index = Number(node.dataset.musicIndex);
        if (index === musicIndex) {
          toggleMusic();
          return;
        }
        changeMusicSelection(index, { animate: event.detail > 0 });
      });
    });

    all("[data-music-step]", extraStage).forEach((button) => {
      button.addEventListener("click", (event) => {
        changeMusicSelection(nextMusicIndex(Number(button.dataset.musicStep)), { animate: event.detail > 0 });
      });
    });

    extraStage.querySelector("[data-music-shuffle]")?.addEventListener("click", () => toggleMusicShuffle());
    extraStage.querySelector("[data-music-loop]")?.addEventListener("click", () => toggleMusicLoop());

    all("[data-music-toggle]", extraStage).forEach((toggle) => {
      toggle.addEventListener("click", () => toggleMusic());
    });

    all("[data-project-category]", extraStage).forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.projectCategory;
        if (next === projectCategory) return;
        projectCategory = next;
        extraPage = 0;
        syncProjectFilters();
        paintProjectGrid({ animate: true });
      });
    });
    all("[data-project-tag]", extraStage).forEach((button) => {
      button.addEventListener("click", () => selectProjectTag(button.dataset.projectTag));
    });
    bindProjectTagRail();
    bindProjectCards();

    all("[data-bangumi-category]", extraStage).forEach((button) => {
      button.addEventListener("click", (event) => {
        const nextCategory = button.dataset.bangumiCategory;
        if (nextCategory === bangumiCategory) return;
        bangumiCategory = nextCategory;
        extraPage = 0;
        syncBangumiFilters();
        paintBangumiShelf({ animate: event.detail > 0 });
      });
    });
    all("[data-bangumi-status]", extraStage).forEach((button) => {
      button.addEventListener("click", (event) => {
        const nextStatus = button.dataset.bangumiStatus;
        if (nextStatus === bangumiStatus) return;
        bangumiStatus = nextStatus;
        extraPage = 0;
        syncBangumiFilters();
        paintBangumiShelf({ animate: event.detail > 0 });
      });
    });
    extraStage.querySelector("[data-bangumi-comment-filter]")?.addEventListener("click", (event) => {
      bangumiCommentsOnly = !bangumiCommentsOnly;
      extraPage = 0;
      syncBangumiFilters();
      paintBangumiShelf({ animate: event.detail > 0 });
    });

    bindBangumiCards();

    all("[data-character-expression]", extraStage).forEach((button) => {
      button.addEventListener("click", () => selectCharacterExpression(Number(button.dataset.characterExpression)));
    });
    const characterIntro = extraStage.querySelector("[data-character-scene]");
    characterIntro?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("lonely-sea:story-enter", {
        detail: {
          gameSlug: "lonely-sea-chapter-one",
          sceneId: characterIntro.dataset.characterScene,
        },
      }));
    });

    bindBangumiViewport();
    bindScrollRails();
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
    if (extraMode === "character") renderCharacter();
    if (extraMode === "achievement") renderAchievement();
    bindStage();
    updatePageControls();
  }

  function commitMode(mode) {
    if (mode !== "bangumi") closeBangumiReader();
    extraMode = mode;
    extraPage = 0;
    extraCanvas.dataset.extraMode = mode;
    if (extraCanvas.closest("[data-screen]")?.getAttribute("aria-hidden") === "false") {
      recordBlogActivity("extraModes", mode);
    }
    extraModeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.extraMode === mode));
    });
    renderMode();
    setFocus(...extraDefaults[mode]);
    syncListenDock();
  }

  async function setMode(mode, { animate = true } = {}) {
    if (!extraDefaults[mode] || mode === extraMode) return;
    const token = ++transitionToken;
    stageTransition?.cancel();

    if (!animate || preferencesReduceMotion()) {
      commitMode(mode);
      return;
    }

    const outgoingRoom = extraStage.firstElementChild;
    stageTransition = outgoingRoom?.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: "translate3d(12px,0,0)" },
      ],
      { duration: 110, easing: "ease-out", fill: "both" },
    ) ?? null;
    try {
      await stageTransition?.finished;
    } catch {
      return;
    }
    if (token !== transitionToken) return;

    commitMode(mode);
    const incomingRoom = extraStage.firstElementChild;
    stageTransition = incomingRoom?.animate(
      [
        { opacity: 0, transform: "translate3d(14px,0,0)" },
        { opacity: 1, transform: "translate3d(0,0,0)" },
      ],
      { duration: 260, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
    ) ?? null;
    try {
      await stageTransition?.finished;
    } catch {}
    if (token === transitionToken) {
      stageTransition?.cancel();
      stageTransition = null;
    }
  }

  function openCg(index, origin = null, { direction = 0 } = {}) {
    const item = cgItems[index];
    if (!item?.unlocked) return;
    const wasOpen = cgViewer.getAttribute("aria-hidden") === "false";
    cgViewerAnimation?.cancel();
    cgViewerAnimation = null;
    cgIndex = index;
    recordBlogActivity("cgItems", String(index));
    cgViewerArt.style.setProperty("--cg-art", `url("${item.art}")`);
    cgViewerArt.classList.toggle("is-portrait", Boolean(item.portrait));
    const unlocked = cgItems.filter((entry) => entry.unlocked);
    const unlockedIndex = unlocked.indexOf(item);
    required("#cg-viewer-index").textContent =
      `CG ${String(unlockedIndex + 1).padStart(2, "0")} / ${String(unlocked.length).padStart(2, "0")}`;
    required("#cg-viewer-title").textContent = item.title;
    cgViewer.setAttribute("aria-hidden", "false");
    cgViewerClose.focus({ preventScroll: true });

    const originArt = origin?.querySelector(".extra-cg-art") ?? origin;
    cgOriginRect = originArt?.getBoundingClientRect?.() ?? null;
    if (preferencesReduceMotion()) return;

    const targetRect = cgViewerArt.getBoundingClientRect();
    let firstFrame = {
      opacity: .18,
      transform: `translate3d(${direction * 2.8}cqw,0,0) scale(.985)`,
    };
    if (cgOriginRect && targetRect.width && targetRect.height) {
      const originCenterX = cgOriginRect.left + cgOriginRect.width / 2;
      const originCenterY = cgOriginRect.top + cgOriginRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      firstFrame = {
        opacity: .32,
        transform: `translate3d(${originCenterX - targetCenterX}px,${originCenterY - targetCenterY}px,0) scale(${cgOriginRect.width / targetRect.width},${cgOriginRect.height / targetRect.height})`,
      };
    } else if (wasOpen) {
      firstFrame.opacity = .12;
    }

    cgViewerArt.style.transformOrigin = "center";
    cgViewerAnimation = cgViewerArt.animate(
      [
        firstFrame,
        { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
      ],
      { duration: cgOriginRect ? 430 : 260, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    cgViewerAnimation.finished
      .catch(() => {})
      .finally(() => {
        cgViewerAnimation = null;
      });
  }

  function moveCgViewer(direction) {
    let next = cgIndex;
    do {
      next = (next + direction + cgItems.length) % cgItems.length;
    } while (!cgItems[next].unlocked && next !== cgIndex);
    cgOriginRect = null;
    openCg(next, null, { direction });
  }

  function closeCg() {
    if (cgViewer.getAttribute("aria-hidden") === "true") return false;
    cgViewerAnimation?.cancel();
    cgViewerAnimation = null;
    if (preferencesReduceMotion() || !cgOriginRect) {
      cgViewer.setAttribute("aria-hidden", "true");
      cgOriginRect = null;
      return true;
    }

    const targetRect = cgViewerArt.getBoundingClientRect();
    const originCenterX = cgOriginRect.left + cgOriginRect.width / 2;
    const originCenterY = cgOriginRect.top + cgOriginRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    cgViewerAnimation = cgViewerArt.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
        {
          opacity: .1,
          transform: `translate3d(${originCenterX - targetCenterX}px,${originCenterY - targetCenterY}px,0) scale(${cgOriginRect.width / targetRect.width},${cgOriginRect.height / targetRect.height})`,
        },
      ],
      { duration: 280, easing: "cubic-bezier(.25,1,.5,1)" },
    );
    cgViewerAnimation.finished
      .catch(() => {})
      .finally(() => {
        cgViewer.setAttribute("aria-hidden", "true");
        cgViewerAnimation = null;
        cgOriginRect = null;
      });
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

  async function changePage(direction, { animate = true } = {}) {
    if (cgViewer.getAttribute("aria-hidden") === "false") {
      moveCgViewer(direction);
      return;
    }
    if (pageSliding) return;
    const next = Math.max(0, Math.min(extraPage + direction, totalPages() - 1));
    if (next === extraPage) return;
    if (extraMode === "bangumi") {
      extraPage = next;
      updatePageControls();
      scrollBangumiToPage(next);
      return;
    }

    if (!animate || preferencesReduceMotion()) {
      extraPage = next;
      renderMode();
      return;
    }

    pageSliding = true;
    const outgoingOffset = `${-direction * 6}cqw`;
    const incomingOffset = `${direction * 6}cqw`;
    const outgoingRoom = extraStage.firstElementChild;
    const outgoing = outgoingRoom?.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: `translate3d(${outgoingOffset},0,0)` },
      ],
      { duration: 150, easing: "cubic-bezier(.25,1,.5,1)", fill: "both" },
    );

    try {
      await outgoing?.finished;
      extraPage = next;
      renderMode();
      const incomingRoom = extraStage.firstElementChild;
      const incoming = incomingRoom?.animate(
        [
          { opacity: 0, transform: `translate3d(${incomingOffset},0,0)` },
          { opacity: 1, transform: "translate3d(0,0,0)" },
        ],
        { duration: 300, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
      );
      await incoming?.finished;
      incoming?.cancel();
    } catch {
      extraPage = next;
      renderMode();
    } finally {
      outgoing?.cancel();
      pageSliding = false;
    }
  }

  extraModeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      setMode(button.dataset.extraMode, { animate: event.detail > 0 });
    });
  });
  extraPageButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      changePage(Number(button.dataset.extraPageDirection), { animate: event.detail > 0 });
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && extraCanvas.classList.contains("is-reading-note")) {
      event.preventDefault();
      closeBangumiReader();
      return;
    }
    if (
      event.code === "Space"
      && extraMode === "music"
      && extraCanvas.closest("[data-screen]")?.getAttribute("aria-hidden") === "false"
      && !(event.target instanceof HTMLElement && event.target.closest("input, textarea, [contenteditable='true']"))
    ) {
      event.preventDefault();
      toggleMusic();
    }
  });
  all("[data-cg-direction]", cgViewer).forEach((button) => {
    button.addEventListener("click", () => moveCgViewer(Number(button.dataset.cgDirection)));
  });
  cgViewerClose.addEventListener("click", closeCg);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (musicPlaying) musicPlayer?.pause();
      return;
    }
    if (listenSession && musicPlaying) musicPlayer?.play()?.catch(() => {});
  });
  window.addEventListener("lonely-sea:audio-mute-change", (event) => {
    musicMuted = event.detail?.muted === true;
    applyMusicMute();
    syncMusicState();
  });
  window.addEventListener("lonely-sea:preferences-change", () => {
    if (extraMode !== "projects") return;
    renderProjects();
    bindStage();
    updatePageControls();
  });
  window.addEventListener("pagehide", () => persistListenSession());

  const listenDock = document.querySelector("#listen-dock");
  listenDock?.querySelectorAll("[data-listen-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => toggleMusic());
  });
  listenDock?.querySelector("[data-listen-prev]")?.addEventListener("click", () => {
    changeMusicSelection(nextMusicIndex(-1), { animate: false });
  });
  listenDock?.querySelector("[data-listen-next]")?.addEventListener("click", () => {
    changeMusicSelection(nextMusicIndex(1), { animate: false });
  });
  listenDock?.querySelector("[data-listen-loop]")?.addEventListener("click", () => toggleMusicLoop());
  listenDock?.querySelector("[data-listen-shuffle]")?.addEventListener("click", () => toggleMusicShuffle());
  listenDock?.querySelector("[data-listen-stop]")?.addEventListener("click", () => stopMusic());

  const savedListen = readListenSession();
  if (savedListen) {
    musicIndex = savedListen.index;
    musicLoop = savedListen.loop;
    musicShuffle = savedListen.shuffle;
    musicShuffleOrder = savedListen.shuffleOrder;
    listenSession = true;
  }

  commitMode("cg");

  if (savedListen) {
    syncListenDock({ extraOpen: false });
    if (savedListen.playing) startMusic({ startAt: savedListen.currentTime });
  }

  return {
    activate() {
      recordBlogActivity("extraModes", extraMode);
      if (extraMode === "achievement") renderMode();
      syncListenDock();
    },
    changePage,
    closeCg,
    deactivate() {
      transitionToken += 1;
      stageTransition?.cancel();
      stageTransition = null;
      window.cancelAnimationFrame(musicWaveFrame);
      musicWaveFrame = 0;
      cgViewerAnimation?.cancel();
      cgViewerAnimation = null;
      syncListenDock({ extraOpen: false });
    },
  };
}
