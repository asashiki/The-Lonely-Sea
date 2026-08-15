import { publishPreferences, readPreferences } from "./preferences.js";

const AUDIO_MUTE_STORAGE_KEY = "lonely-sea-audio-muted";
const AUDIO_CONTROLLER_KEY = "__lonelySeaAudioController";
const BGM_TRACKS = Object.freeze([
  "/assets/lonely-sea/quiet-tide.mp3",
  "/assets/lonely-sea/tidal-drift.mp3",
]);

const POINTER_TARGETS = [
  "button",
  "a[href]",
  "summary",
  "[role='button']",
  "[role='tab']",
  "[role='radio']",
  "input[type='checkbox']",
  "input[type='radio']",
  "input[type='range']",
  "select",
].join(",");

const FOCUS_TARGETS = [
  POINTER_TARGETS,
  "input:not([type='hidden'])",
  "textarea",
].join(",");

const CUE_ALIASES = Object.freeze({
  cancel: "back",
  change: "toggleOn",
  choose: "select",
  close: "close",
  enter: "confirm",
  error: "error",
  focus: "select",
  hover: "hover",
  navigate: "confirm",
  next: "page",
  previous: "page",
  save: "success",
  switch: "toggleOn",
  toggle: "toggleOn",
});

// Short, glassy notes with a dry tactile layer: bright enough to read as a
// Galgame interface, but deliberately quieter and shorter than dialogue/BGM.
const UI_CUES = Object.freeze({
  hover: {
    cooldown: 46,
    level: 0.54,
    tones: [
      { frequency: 1760, endFrequency: 1814, duration: 0.052, gain: 0.42 },
      { frequency: 2637, delay: 0.012, duration: 0.074, gain: 0.18 },
    ],
    noise: { duration: 0.012, gain: 0.07, frequency: 6100 },
  },
  select: {
    cooldown: 34,
    level: 0.66,
    tones: [
      { frequency: 1568, endFrequency: 1628, duration: 0.064, gain: 0.46 },
      { frequency: 2349, delay: 0.015, duration: 0.092, gain: 0.22 },
    ],
    noise: { duration: 0.015, gain: 0.075, frequency: 5200 },
  },
  press: {
    cooldown: 22,
    level: 0.3,
    tones: [
      { type: "triangle", frequency: 760, endFrequency: 680, duration: 0.03, gain: 0.16 },
    ],
    noise: { duration: 0.014, gain: 0.16, frequency: 3900 },
  },
  confirm: {
    cooldown: 28,
    level: 0.7,
    tones: [
      { frequency: 1460, endFrequency: 1385, duration: 0.07, gain: 0.31 },
      { frequency: 2920, endFrequency: 2770, duration: 0.095, gain: 0.085 },
    ],
    noise: { duration: 0.015, gain: 0.11, frequency: 5100 },
  },
  start: {
    cooldown: 120,
    level: 0.78,
    tones: [
      { type: "triangle", frequency: 980, endFrequency: 1040, duration: 0.105, gain: 0.25 },
      { frequency: 1960, endFrequency: 2080, duration: 0.14, gain: 0.13 },
    ],
    noise: { duration: 0.022, gain: 0.1, frequency: 4600 },
  },
  back: {
    cooldown: 34,
    level: 0.62,
    tones: [
      { type: "triangle", frequency: 1180, endFrequency: 920, duration: 0.09, gain: 0.28 },
      { frequency: 2360, endFrequency: 1840, duration: 0.075, gain: 0.065 },
    ],
    noise: { duration: 0.022, gain: 0.1, frequency: 3000 },
  },
  close: {
    cooldown: 34,
    level: 0.56,
    tones: [
      { type: "triangle", frequency: 1040, endFrequency: 810, duration: 0.075, gain: 0.24 },
    ],
    noise: { duration: 0.025, gain: 0.13, frequency: 2700 },
  },
  open: {
    cooldown: 52,
    level: 0.66,
    tones: [
      { type: "triangle", frequency: 920, endFrequency: 1160, duration: 0.095, gain: 0.22 },
      { frequency: 1840, endFrequency: 2320, duration: 0.12, gain: 0.09 },
    ],
    noise: { duration: 0.035, gain: 0.09, frequency: 4200 },
  },
  page: {
    cooldown: 42,
    level: 0.57,
    tones: [
      { frequency: 1240, endFrequency: 1300, duration: 0.075, gain: 0.23 },
    ],
    noise: { duration: 0.06, gain: 0.13, frequency: 2500, q: 0.72 },
  },
  toggleOn: {
    cooldown: 28,
    level: 0.58,
    tones: [
      { frequency: 1540, endFrequency: 1700, duration: 0.075, gain: 0.27 },
    ],
    noise: { duration: 0.018, gain: 0.12, frequency: 4400 },
  },
  toggleOff: {
    cooldown: 28,
    level: 0.54,
    tones: [
      { frequency: 1420, endFrequency: 1180, duration: 0.075, gain: 0.25 },
    ],
    noise: { duration: 0.02, gain: 0.11, frequency: 3500 },
  },
  tick: {
    cooldown: 36,
    level: 0.42,
    tones: [
      { frequency: 1865, endFrequency: 1905, duration: 0.034, gain: 0.28 },
    ],
    noise: { duration: 0.01, gain: 0.07, frequency: 5800 },
  },
  success: {
    cooldown: 80,
    level: 0.72,
    tones: [
      { frequency: 1320, endFrequency: 1360, duration: 0.13, gain: 0.27 },
      { frequency: 1980, endFrequency: 2040, delay: 0.028, duration: 0.17, gain: 0.16 },
    ],
    noise: { duration: 0.025, gain: 0.07, frequency: 5900 },
  },
  achievement: {
    cooldown: 500,
    level: 1,
    tones: [
      { type: "triangle", frequency: 523, duration: 0.22, gain: 0.24 },
      { frequency: 784, delay: 0.04, duration: 0.3, gain: 0.32 },
      { frequency: 1047, delay: 0.08, duration: 0.36, gain: 0.38 },
      { frequency: 1319, delay: 0.13, duration: 0.38, gain: 0.3 },
      { frequency: 1568, delay: 0.18, duration: 0.4, gain: 0.24 },
      { frequency: 3136, delay: 0.22, duration: 0.28, gain: 0.09 },
    ],
    noise: { delay: 0.12, duration: 0.07, gain: 0.08, frequency: 6700 },
  },
  error: {
    cooldown: 100,
    level: 0.72,
    tones: [
      { type: "triangle", frequency: 659, endFrequency: 622, duration: 0.12, gain: 0.32 },
      { type: "triangle", frequency: 466, endFrequency: 440, delay: 0.04, duration: 0.17, gain: 0.26 },
    ],
    noise: { duration: 0.04, gain: 0.08, frequency: 1900 },
  },
});

function clampVolume(value) {
  return Math.min(1, Math.max(0, Number(value) / 100));
}

function readMuted(preferences) {
  try {
    const stored = localStorage.getItem(AUDIO_MUTE_STORAGE_KEY);
    if (stored !== null) return stored === "true";
  } catch {}
  return preferences.masterMuted === true;
}

function interactiveTarget(eventTarget, selector = POINTER_TARGETS) {
  if (!(eventTarget instanceof Element)) return null;
  const target = eventTarget.closest(selector);
  if (!target || target.matches(":disabled") || target.getAttribute("aria-disabled") === "true") return null;
  if (target.closest("[inert], [aria-hidden='true']")) return null;
  if (target.closest("[data-ui-sound='none']")) return null;
  return target;
}

function pointerPan(event) {
  if (!(event instanceof PointerEvent) || window.innerWidth <= 0) return 0;
  return Math.max(-0.34, Math.min(0.34, (event.clientX / window.innerWidth - 0.5) * 0.68));
}

function explicitCue(target) {
  const owner = target.closest("[data-ui-sound]");
  const value = owner?.dataset.uiSound;
  if (!value || value === "none") return "";
  return UI_CUES[value] ? value : CUE_ALIASES[value] || "";
}

function clickCue(target) {
  const explicit = explicitCue(target);
  if (explicit) return explicit;
  if (target.matches("[data-command='START'], [data-command='CONTINUE']")) return "start";
  if (target.matches("[data-command='LOAD'], [data-command='EXTRA'], [data-command='OPTION'], [data-command='EXIT']")) return "open";
  if (target.matches(".system-back, [data-back], .archive-back, [data-xiii-story-cancel], [data-host-dialog-cancel], [data-exit-modal-answer='no']")) return "back";
  if (target.matches("[data-close-exit], [data-xiii-diary-reader-close], .cg-viewer-close, form[method='dialog'] button")) return "close";
  if (target.matches("[data-xiii-page-direction], [data-extra-page-direction], [data-cg-direction], [data-blog-previous], [data-blog-next], [data-blog-friend-previous], [data-blog-friend-next]")) return "page";
  if (target.matches("[role='tab'], [data-option-primary], [data-option-secondary], [data-extra-mode], [data-blog-view]")) return "page";
  if (target.matches("input[type='checkbox'], input[type='radio'], [role='radio'], [aria-pressed]")) {
    const selected = target.matches(":checked")
      || target.getAttribute("aria-checked") === "true"
      || target.getAttribute("aria-pressed") === "true";
    return selected ? "toggleOn" : "toggleOff";
  }
  if (target instanceof HTMLAnchorElement && target.hash && target.origin === window.location.origin) return "page";
  if (target.matches(".record-card__link, [data-xiii-article-card], [data-xiii-story-entry], [data-xiii-diary-entry]")) return "open";
  return "confirm";
}

export function initExperienceAudio() {
  const existing = window[AUDIO_CONTROLLER_KEY];
  if (existing) return existing;

  let preferences = readPreferences();
  let muted = readMuted(preferences);
  let bgmEnabled = preferences.bgmEnabled !== false;
  if (preferences.masterMuted !== muted) {
    preferences = publishPreferences({ ...preferences, masterMuted: muted });
  }
  try { localStorage.removeItem(AUDIO_MUTE_STORAGE_KEY); } catch {}

  let titleActive = false;
  let trackIndex = 0;
  let bgm = null;
  let cueContext = null;
  let cueInput = null;
  let cueMaster = null;
  let noiseBuffer = null;
  let hoveredTarget = null;
  let lastPointerDownAt = -Infinity;
  let lastManualCueAt = -Infinity;
  let semanticCueSerial = 0;
  const cueTimes = new Map();
  document.documentElement.dataset.audioMuted = String(muted);

  function ensureBgm() {
    if (bgm) return bgm;
    bgm = new Audio(BGM_TRACKS[trackIndex]);
    bgm.preload = "auto";
    bgm.loop = false;
    bgm.muted = muted || !bgmEnabled;
    bgm.addEventListener("ended", () => {
      if (!titleActive) return;
      trackIndex = (trackIndex + 1) % BGM_TRACKS.length;
      bgm.src = BGM_TRACKS[trackIndex];
      bgm.muted = muted || !bgmEnabled;
      bgm.load();
      startBgm();
    });
    bgm.addEventListener("error", () => {
      if (!titleActive || BGM_TRACKS.length < 2) return;
      trackIndex = (trackIndex + 1) % BGM_TRACKS.length;
      bgm.src = BGM_TRACKS[trackIndex];
      bgm.muted = muted || !bgmEnabled;
      bgm.load();
      startBgm();
    });
    return bgm;
  }

  function setBgmVolume() {
    if (!bgm) return;
    bgm.volume = Math.pow(clampVolume(preferences.bgmVolume), 1.18);
    bgm.muted = muted || !bgmEnabled;
  }

  function startBgm() {
    if (!titleActive || document.hidden) return;
    const player = ensureBgm();
    setBgmVolume();
    if (!player.paused) return;
    player.play()?.catch(() => {
      // Autoplay may wait for the first trusted pointer/key gesture.
    });
  }

  function stopBgm() {
    bgm?.pause();
  }

  function updateCueVolume() {
    if (!cueContext || !cueMaster) return;
    const volume = muted ? 0 : Math.pow(clampVolume(preferences.interfaceVolume), 1.24) * 0.34;
    cueMaster.gain.cancelScheduledValues(cueContext.currentTime);
    cueMaster.gain.setTargetAtTime(volume, cueContext.currentTime, 0.012);
  }

  function buildNoiseBuffer(context) {
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate, sampleRate);
    const channel = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < channel.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.18 + white * 0.82;
      channel[index] = previous;
    }
    return buffer;
  }

  function buildAirImpulse(context) {
    const length = Math.floor(context.sampleRate * 0.17);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
      const data = impulse.getChannelData(channelIndex);
      for (let index = 0; index < length; index += 1) {
        const decay = Math.pow(1 - index / length, 3.8);
        data[index] = (Math.random() * 2 - 1) * decay;
      }
    }
    return impulse;
  }

  function ensureCueContext() {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return null;
    if (cueContext && cueContext.state !== "closed") return cueContext;

    cueContext = new AudioContextConstructor({ latencyHint: "interactive" });
    cueInput = cueContext.createGain();
    cueMaster = cueContext.createGain();
    const highpass = cueContext.createBiquadFilter();
    const lowpass = cueContext.createBiquadFilter();
    const compressor = cueContext.createDynamicsCompressor();
    const air = cueContext.createConvolver();
    const airGain = cueContext.createGain();
    highpass.type = "highpass";
    highpass.frequency.value = 260;
    highpass.Q.value = 0.54;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 9200;
    lowpass.Q.value = 0.35;
    compressor.threshold.value = -22;
    compressor.knee.value = 16;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.16;
    air.buffer = buildAirImpulse(cueContext);
    airGain.gain.value = 0.055;
    cueInput.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    lowpass.connect(air);
    air.connect(airGain);
    airGain.connect(compressor);
    compressor.connect(cueMaster);
    cueMaster.connect(cueContext.destination);
    noiseBuffer = buildNoiseBuffer(cueContext);
    updateCueVolume();
    return cueContext;
  }

  function connectWithPan(source, context, pan) {
    if (typeof context.createStereoPanner !== "function") {
      source.connect(cueInput);
      return null;
    }
    const panner = context.createStereoPanner();
    panner.pan.value = Math.max(-0.7, Math.min(0.7, Number(pan) || 0));
    source.connect(panner);
    panner.connect(cueInput);
    return panner;
  }

  function playTone(context, tone, level, pan) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const start = context.currentTime + 0.006 + (tone.delay || 0);
    const end = start + tone.duration;
    const attack = Math.min(tone.attack || 0.006, tone.duration * 0.28);
    oscillator.type = tone.type || "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency || tone.frequency * 0.997, end);
    oscillator.detune.value = (Math.random() - 0.5) * 5;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, tone.gain * level), start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    const panner = connectWithPan(envelope, context, pan);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      envelope.disconnect();
      panner?.disconnect();
    }, { once: true });
  }

  function playNoise(context, noise, level, pan) {
    if (!noiseBuffer) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const start = context.currentTime + 0.006 + (noise.delay || 0);
    const end = start + noise.duration;
    source.buffer = noiseBuffer;
    source.playbackRate.value = 0.94 + Math.random() * 0.12;
    filter.type = "bandpass";
    filter.frequency.value = noise.frequency || 4200;
    filter.Q.value = noise.q || 1.15;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, noise.gain * level), start + Math.min(0.004, noise.duration * 0.25));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(filter);
    filter.connect(envelope);
    const panner = connectWithPan(envelope, context, pan);
    source.start(start, Math.random() * 0.72, noise.duration + 0.01);
    source.stop(end + 0.015);
    source.addEventListener("ended", () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
      panner?.disconnect();
    }, { once: true });
  }

  function normalizeCue(cue) {
    if (UI_CUES[cue]) return cue;
    return CUE_ALIASES[cue] || "confirm";
  }

  function playUiCue(requestedCue = "confirm", detail = {}) {
    if (muted || preferences.interfaceVolume <= 0) return false;
    const cue = normalizeCue(requestedCue);
    const design = UI_CUES[cue] || UI_CUES.confirm;
    const now = performance.now();
    const lastTime = cueTimes.get(cue) || -Infinity;
    if (!detail.force && now - lastTime < design.cooldown) return false;
    if (!cueContext && !detail.unlock) return false;
    const context = ensureCueContext();
    if (!context || !cueInput || context.state === "closed") return false;
    if (context.state !== "running") {
      if (!detail.unlock) return false;
      const requestedAt = performance.now();
      context.resume().then(() => {
        if (performance.now() - requestedAt > 180) return;
        playUiCue(cue, { ...detail, force: true, unlock: false });
      }).catch(() => {});
      return false;
    }
    cueTimes.set(cue, now);
    const direction = Number(detail.direction) || 0;
    const pan = Number.isFinite(Number(detail.pan)) ? Number(detail.pan) : direction * 0.14;
    design.tones.forEach((tone) => playTone(context, tone, design.level, pan));
    if (design.noise) playNoise(context, design.noise, design.level, pan);
    return true;
  }

  function markAndPlay(cue, detail = {}) {
    semanticCueSerial += 1;
    return playUiCue(cue, detail);
  }

  function handlePointerOver(event) {
    if (event.pointerType === "touch") return;
    const target = interactiveTarget(event.target);
    if (!target || target === hoveredTarget || target.contains(event.relatedTarget)) return;
    hoveredTarget = target;
    playUiCue("hover", { pan: pointerPan(event) });
  }

  function handlePointerOut(event) {
    if (!hoveredTarget) return;
    const target = interactiveTarget(event.target);
    if (target !== hoveredTarget || target.contains(event.relatedTarget)) return;
    hoveredTarget = null;
  }

  function handlePointerDown(event) {
    const target = interactiveTarget(event.target);
    startBgm();
    if (!target) return;
    lastPointerDownAt = performance.now();
    markAndPlay("press", { pan: pointerPan(event), unlock: true });
  }

  function handleFocusIn(event) {
    const target = interactiveTarget(event.target, FOCUS_TARGETS);
    if (!target || performance.now() - lastPointerDownAt < 140) return;
    markAndPlay("select");
  }

  function handleClick(event) {
    const target = interactiveTarget(event.target);
    if (!target) return;
    startBgm();
    if (performance.now() - lastManualCueAt < 26) return;
    markAndPlay(clickCue(target), { pan: pointerPan(event), unlock: true });
  }

  function handleInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "range") return;
    markAndPlay("tick");
  }

  function handleChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    markAndPlay("page");
  }

  function handleInvalid() {
    markAndPlay("error");
  }

  function handleKeydown(event) {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const context = ensureCueContext();
    if (context?.state === "suspended") context.resume().catch(() => {});
    startBgm();
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
    const fallbackCue = event.key === "Escape"
      ? "back"
      : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
        ? "select"
        : "";
    if (!fallbackCue) return;
    const serial = semanticCueSerial;
    queueMicrotask(() => {
      if (!event.defaultPrevented || semanticCueSerial !== serial) return;
      markAndPlay(fallbackCue, { unlock: true });
    });
  }

  function handleManualCue(event) {
    const detail = event.detail || {};
    lastManualCueAt = performance.now();
    markAndPlay(detail.cue || "confirm", detail);
  }

  function handleSuccessCue() {
    lastManualCueAt = performance.now();
    markAndPlay("success");
  }

  function handlePreferences(event) {
    const wasMuted = muted;
    const wasBgmEnabled = bgmEnabled;
    const nextPreferences = event.detail?.preferences || readPreferences();
    const nextMuted = nextPreferences.masterMuted === true;
    if (!wasMuted && nextMuted) markAndPlay("toggleOff", { force: true });
    preferences = nextPreferences;
    muted = nextMuted;
    bgmEnabled = preferences.bgmEnabled !== false;
    document.documentElement.dataset.audioMuted = String(muted);
    updateCueVolume();
    setBgmVolume();
    if (wasMuted && !muted) markAndPlay("toggleOn", { force: true });
    if (wasMuted !== muted) {
      lastManualCueAt = performance.now();
      window.dispatchEvent(new CustomEvent("lonely-sea:audio-mute-change", {
        detail: { muted },
      }));
    }
    if (wasBgmEnabled !== bgmEnabled) {
      window.dispatchEvent(new CustomEvent("lonely-sea:bgm-state-change", {
        detail: { enabled: bgmEnabled },
      }));
    }
  }

  function setMuted(nextMuted) {
    preferences = publishPreferences({ ...preferences, masterMuted: Boolean(nextMuted) });
  }

  function setBgmEnabled(nextEnabled) {
    const next = Boolean(nextEnabled);
    preferences = publishPreferences({ ...preferences, bgmEnabled: next });
    if (next) startBgm();
  }

  document.addEventListener("pointerover", handlePointerOver, true);
  document.addEventListener("pointerout", handlePointerOut, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("focusin", handleFocusIn, true);
  // Capture the activation before route handlers make the current menu inert
  // or hide it. Waiting for bubbling drops the confirm cue on title commands.
  document.addEventListener("click", handleClick, true);
  document.addEventListener("input", handleInput, true);
  document.addEventListener("change", handleChange, true);
  document.addEventListener("invalid", handleInvalid, true);
  document.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("lonely-sea:comment-saved", handleSuccessCue);
  document.addEventListener("lonely-sea:friend-saved", handleSuccessCue);
  window.addEventListener("lonely-sea:ui-cue", handleManualCue);
  window.addEventListener("lonely-sea:achievement-unlock", () => markAndPlay("achievement"));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopBgm();
    else startBgm();
  });
  window.addEventListener("lonely-sea:preferences-change", handlePreferences);
  window.addEventListener("pagehide", stopBgm);

  const controller = {
    isMuted() {
      return muted;
    },
    isBgmEnabled() {
      return bgmEnabled;
    },
    setMuted,
    setBgmEnabled,
    setTitleActive(active) {
      titleActive = active;
      if (active) startBgm();
      else stopBgm();
    },
    playUiCue,
  };
  window[AUDIO_CONTROLLER_KEY] = controller;
  return controller;
}
