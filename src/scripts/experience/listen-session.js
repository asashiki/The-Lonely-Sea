import { musicItems } from "../../data/extra-content.js";
import { readPreferences } from "./preferences.js";

export const LISTEN_SESSION_KEY = "lonely-sea-listen-session-v1";
const LISTEN_CONTROLLER_KEY = "__lonelySeaListenController";

function clampIndex(value) {
  const index = Number(value);
  if (!Number.isInteger(index) || musicItems.length === 0) return 0;
  return ((index % musicItems.length) + musicItems.length) % musicItems.length;
}

export function readListenSession() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(LISTEN_SESSION_KEY) || "null");
    if (!parsed || typeof parsed !== "object" || parsed.active !== true) return null;
    return {
      active: true,
      playing: parsed.playing === true,
      index: clampIndex(parsed.index),
      loop: parsed.loop === true,
      shuffle: parsed.shuffle === true,
      shuffleOrder: Array.isArray(parsed.shuffleOrder) ? parsed.shuffleOrder.filter((item) => Number.isInteger(item)) : [],
      currentTime: Math.max(0, Number(parsed.currentTime) || 0),
    };
  } catch {
    return null;
  }
}

export function writeListenSession(state) {
  if (!state?.active) {
    clearListenSession();
    return null;
  }
  const next = {
    active: true,
    playing: state.playing === true,
    index: clampIndex(state.index),
    loop: state.loop === true,
    shuffle: state.shuffle === true,
    shuffleOrder: Array.isArray(state.shuffleOrder) ? state.shuffleOrder : [],
    currentTime: Math.max(0, Number(state.currentTime) || 0),
  };
  try { sessionStorage.setItem(LISTEN_SESSION_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function clearListenSession() {
  try { sessionStorage.removeItem(LISTEN_SESSION_KEY); } catch {}
  return null;
}

function rebuildShuffle(index) {
  const order = musicItems.map((_, itemIndex) => itemIndex);
  for (let cursor = order.length - 1; cursor > 0; cursor -= 1) {
    const swap = Math.floor(Math.random() * (cursor + 1));
    [order[cursor], order[swap]] = [order[swap], order[cursor]];
  }
  const current = order.indexOf(index);
  if (current > 0) {
    order.splice(current, 1);
    order.unshift(index);
  }
  return order;
}

function nextIndex(state, step) {
  if (!state.shuffle) return clampIndex(state.index + step);
  const order = state.shuffleOrder.length === musicItems.length ? state.shuffleOrder : rebuildShuffle(state.index);
  const at = order.indexOf(state.index);
  return order[(at + step + order.length) % order.length];
}

function paintDock(dock, state) {
  if (!(dock instanceof HTMLElement)) return;
  const current = musicItems[state.index] || musicItems[0];
  dock.hidden = !state.active;
  dock.setAttribute("aria-hidden", String(!state.active));
  if (!state.active) {
    dock.classList.remove("is-expanded");
    dock.querySelector("[data-listen-expand]")?.setAttribute("aria-expanded", "false");
  }
  dock.classList.toggle("is-playing", state.playing);
  dock.style.setProperty("--listen-progress", "0");
  const title = dock.querySelector("[data-listen-title]");
  const artist = dock.querySelector("[data-listen-artist]");
  const cover = dock.querySelector("[data-listen-cover]");
  if (title) title.textContent = current?.title || "";
  if (artist) artist.textContent = current?.artist || "";
  if (cover instanceof HTMLImageElement && current?.cover && cover.getAttribute("src") !== current.cover) {
    cover.onerror = () => cover.removeAttribute("src");
    cover.src = current.cover;
  }
  dock.querySelectorAll("[data-listen-toggle]").forEach((toggle) => {
    toggle.setAttribute("aria-pressed", String(state.playing));
    toggle.setAttribute("aria-label", state.playing ? "Pause playlist" : "Play playlist");
  });
  dock.querySelector("[data-listen-loop]")?.setAttribute("aria-pressed", String(state.loop));
  dock.querySelector("[data-listen-shuffle]")?.setAttribute("aria-pressed", String(state.shuffle));
}

export function initArticleListen() {
  const existing = window[LISTEN_CONTROLLER_KEY];
  if (existing) return existing;

  const dock = document.querySelector("#listen-dock");
  const saved = readListenSession();
  let state = saved || {
    active: false,
    playing: false,
    index: 0,
    loop: false,
    shuffle: false,
    shuffleOrder: [],
    currentTime: 0,
  };
  let player = null;
  let muted = document.documentElement.dataset.audioMuted === "true";

  function persist() {
    if (!state.active) {
      clearListenSession();
      return;
    }
    writeListenSession({
      ...state,
      currentTime: player?.currentTime || state.currentTime || 0,
    });
  }

  function holdBgm(active) {
    window.dispatchEvent(new CustomEvent("lonely-sea:listen-hold", { detail: { active } }));
  }

  function sync() {
    persist();
    paintDock(dock, state);
    holdBgm(state.active);
  }

  function setVolume() {
    if (!player) return;
    player.volume = Math.min(1, Math.max(0, readPreferences().bgmVolume / 100 * .58));
    player.muted = muted;
  }

  async function playAt(index, startAt = 0) {
    const current = musicItems[clampIndex(index)];
    if (!current?.src) return false;
    player?.pause();
    const nextPlayer = new Audio(current.src);
    nextPlayer.preload = "auto";
    nextPlayer.loop = state.loop;
    player = nextPlayer;
    setVolume();
    if (startAt > 0) {
      try { nextPlayer.currentTime = startAt; } catch {}
    }
    nextPlayer.addEventListener("ended", () => {
      if (player !== nextPlayer || state.loop) return;
      playAt(nextIndex(state, 1));
    });
    nextPlayer.addEventListener("timeupdate", () => {
      if (player !== nextPlayer || !state.active) return;
      state.currentTime = nextPlayer.currentTime || 0;
      const progress = nextPlayer.duration > 0 ? nextPlayer.currentTime / nextPlayer.duration : 0;
      dock?.style.setProperty("--listen-progress", String(Math.min(1, Math.max(0, progress))));
    });
    try {
      await nextPlayer.play();
    } catch {
      if (player === nextPlayer) {
        state.playing = false;
        sync();
      }
      return false;
    }
    state.active = true;
    state.playing = true;
    state.index = clampIndex(index);
    state.currentTime = startAt;
    if (state.shuffle && state.shuffleOrder.length !== musicItems.length) {
      state.shuffleOrder = rebuildShuffle(state.index);
    }
    sync();
    return true;
  }

  async function toggle() {
    if (state.playing && player && !player.paused) {
      player.pause();
      state.playing = false;
      state.currentTime = player.currentTime || 0;
      sync();
      return;
    }
    if (player && player.src) {
      try {
        await player.play();
        state.playing = true;
        state.active = true;
        sync();
        return;
      } catch {}
    }
    await playAt(state.index, state.currentTime);
  }

  function stop() {
    player?.pause();
    player = null;
    state = {
      ...state,
      active: false,
      playing: false,
      currentTime: 0,
    };
    clearListenSession();
    paintDock(dock, state);
    holdBgm(false);
  }

  async function step(direction) {
    if (!state.active) return;
    state.currentTime = 0;
    state.index = nextIndex(state, direction);
    if (state.playing) await playAt(state.index);
    else sync();
  }

  function toggleLoop() {
    if (!state.active) return;
    state.loop = !state.loop;
    if (player) player.loop = state.loop;
    sync();
  }

  function toggleShuffle() {
    if (!state.active) return;
    state.shuffle = !state.shuffle;
    state.shuffleOrder = state.shuffle ? rebuildShuffle(state.index) : [];
    sync();
  }

  dock?.querySelectorAll("[data-listen-toggle]").forEach((toggleButton) => {
    toggleButton.addEventListener("click", () => toggle());
  });
  dock?.querySelector("[data-listen-expand]")?.addEventListener("click", (event) => {
    const expanded = dock.classList.toggle("is-expanded");
    event.currentTarget.setAttribute("aria-expanded", String(expanded));
    event.currentTarget.setAttribute("aria-label", expanded ? "收起音乐控制" : "展开音乐控制");
  });
  dock?.querySelector("[data-listen-prev]")?.addEventListener("click", () => step(-1));
  dock?.querySelector("[data-listen-next]")?.addEventListener("click", () => step(1));
  dock?.querySelector("[data-listen-loop]")?.addEventListener("click", () => toggleLoop());
  dock?.querySelector("[data-listen-shuffle]")?.addEventListener("click", () => toggleShuffle());
  dock?.querySelector("[data-listen-stop]")?.addEventListener("click", () => stop());

  window.addEventListener("lonely-sea:audio-mute-change", (event) => {
    muted = event.detail?.muted === true;
    setVolume();
  });
  window.addEventListener("lonely-sea:preferences-change", setVolume);
  window.addEventListener("lonely-sea:before-site-data-clear", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      persist();
      player?.pause();
      return;
    }
    if (state.active && state.playing) player?.play()?.catch(() => {});
  });
  window.addEventListener("pagehide", persist);
  document.addEventListener("pointerdown", (event) => {
    if (!dock?.classList.contains("is-expanded") || dock.contains(event.target)) return;
    dock.classList.remove("is-expanded");
    dock.querySelector("[data-listen-expand]")?.setAttribute("aria-expanded", "false");
  });

  paintDock(dock, state);
  if (state.active) holdBgm(true);
  if (state.active && state.playing) {
    playAt(state.index, state.currentTime).catch(() => {});
  }

  const controller = {
    isHolding() {
      return state.active;
    },
    isPlaying() {
      return state.playing;
    },
    stop,
  };
  window[LISTEN_CONTROLLER_KEY] = controller;
  return controller;
}
