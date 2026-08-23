export const PREFERENCES_STORAGE_KEY = "lonely-sea-preferences-v2";
export const PREFERENCES_CHANGE_EVENT = "lonely-sea:preferences-change";

export const defaultPreferences = Object.freeze({
  particleDensity: 72,
  sceneCrossfade: true,
  systemWeather: true,
  weatherLayer: "INSIDE",
  mobileLandscape: true,
  vignette: true,
  keyboardCursor: true,
  specialCursor: true,
  interfaceScale: 100,
  backgroundQuality: "HIGH",
  masterMuted: false,
  bgmEnabled: true,
  bgmVolume: 60,
  ambientVolume: 45,
  interfaceVolume: 70,
  voiceVolume: 80,
  language: "ZH-CN",
  textSize: 100,
  readingLineHeight: 180,
  autoSpeed: 6,
  subLabels: true,
  typeset: "BLOG",
  openingBehaviour: "ONCE",
  externalLinks: "NEW",
  articleTransition: true,
  smartPreload: true,
  dataSaver: false,
  reducedMotion: false,
  autoSavePosition: true,
});

const BOOLEAN_KEYS = Object.freeze([
  "sceneCrossfade",
  "systemWeather",
  "mobileLandscape",
  "vignette",
  "keyboardCursor",
  "specialCursor",
  "masterMuted",
  "bgmEnabled",
  "subLabels",
  "articleTransition",
  "smartPreload",
  "dataSaver",
  "reducedMotion",
  "autoSavePosition",
]);

const ENUM_VALUES = Object.freeze({
  backgroundQuality: ["HIGH", "BALANCED"],
  weatherLayer: ["INSIDE", "OVERLAY"],
  language: ["ZH-CN", "JA-JP", "EN-US"],
  typeset: ["BLOG", "NOVEL"],
  openingBehaviour: ["ALWAYS", "ONCE"],
  externalLinks: ["NEW", "CURRENT"],
});

function clampNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

export function normalizePreferences(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const normalized = {
    ...defaultPreferences,
    particleDensity: clampNumber(source.particleDensity, 0, 100, defaultPreferences.particleDensity),
    interfaceScale: clampNumber(source.interfaceScale, 80, 120, defaultPreferences.interfaceScale),
    bgmVolume: clampNumber(source.bgmVolume, 0, 100, defaultPreferences.bgmVolume),
    ambientVolume: clampNumber(source.ambientVolume, 0, 100, defaultPreferences.ambientVolume),
    interfaceVolume: clampNumber(source.interfaceVolume, 0, 100, defaultPreferences.interfaceVolume),
    voiceVolume: clampNumber(source.voiceVolume, 0, 100, defaultPreferences.voiceVolume),
    textSize: clampNumber(source.textSize, 80, 120, defaultPreferences.textSize),
    readingLineHeight: clampNumber(source.readingLineHeight, 150, 210, defaultPreferences.readingLineHeight),
    autoSpeed: clampNumber(source.autoSpeed, 1, 10, defaultPreferences.autoSpeed),
  };
  BOOLEAN_KEYS.forEach((key) => {
    normalized[key] = typeof source[key] === "boolean" ? source[key] : defaultPreferences[key];
  });
  if (source.masterMuted === undefined && typeof source.muteOnStart === "boolean") {
    normalized.masterMuted = source.muteOnStart;
  }
  Object.entries(ENUM_VALUES).forEach(([key, allowed]) => {
    normalized[key] = allowed.includes(source[key]) ? source[key] : defaultPreferences[key];
  });
  return normalized;
}

export function readPreferences() {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || "{}"));
  } catch {
    return { ...defaultPreferences };
  }
}

export function writePreferences(preferences) {
  const normalized = normalizePreferences(preferences);
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
  } catch {}
  return normalized;
}

export function applyPreferences(preferences, root = document.documentElement) {
  const normalized = normalizePreferences(preferences);
  root.classList.toggle("has-special-cursor", normalized.specialCursor);
  root.lang = normalized.language === "ZH-CN" ? "zh-CN" : normalized.language;
  root.dataset.sceneCrossfade = String(normalized.sceneCrossfade);
  root.dataset.systemWeather = String(normalized.systemWeather);
  root.dataset.weatherLayer = String(normalized.weatherLayer).toLocaleLowerCase("en-US");
  root.dataset.mobileLandscape = String(normalized.mobileLandscape);
  syncForcedLandscape(normalized, root);
  root.dataset.vignette = String(normalized.vignette);
  root.dataset.motion = normalized.reducedMotion ? "reduced" : "full";
  root.dataset.subLabels = String(normalized.subLabels);
  root.dataset.readingTypeset = String(normalized.typeset).toLocaleLowerCase("en-US");
  root.dataset.audioMuted = String(normalized.masterMuted);
  root.style.setProperty("--experience-ui-scale", String(normalized.interfaceScale / 100));
  root.style.setProperty("--reading-text-scale", String(normalized.textSize / 100));
  root.style.setProperty("--reading-line-height", String(normalized.readingLineHeight / 100));
  root.style.setProperty("--weather-density", String(normalized.particleDensity / 100));
  return normalized;
}

export function publishPreferences(preferences, root = document.documentElement) {
  const normalized = applyPreferences(writePreferences(preferences), root);
  window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGE_EVENT, {
    detail: { preferences: normalized },
  }));
  return normalized;
}

export function runtimePreferenceValue(key, preferences = readPreferences()) {
  const normalized = normalizePreferences(preferences);
  const values = {
    "audio.muted": normalized.masterMuted,
    "audio.bgm": normalized.masterMuted || !normalized.bgmEnabled ? 0 : normalized.bgmVolume,
    "audio.ambient": normalized.masterMuted ? 0 : normalized.ambientVolume,
    "audio.effects": normalized.masterMuted ? 0 : normalized.interfaceVolume,
    "audio.voice": normalized.masterMuted ? 0 : normalized.voiceVolume,
    "interface.scale": normalized.interfaceScale,
    "interface.cursor": normalized.specialCursor,
    "interface.language": normalized.language,
    "accessibility.reducedMotion": normalized.reducedMotion,
    "text.scale": normalized.textSize,
    "text.speed": normalized.autoSpeed,
  };
  return Object.hasOwn(values, key) ? values[key] : undefined;
}

export function projectRuntimePreferences(keys, preferences = readPreferences()) {
  return Object.fromEntries(keys.flatMap((key) => {
    const value = runtimePreferenceValue(key, preferences);
    return value === undefined ? [] : [[key, value]];
  }));
}

export function preferencesReduceMotion(preferences = readPreferences()) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || preferences.reducedMotion;
}

export function syncForcedLandscape(preferences = readPreferences(), root = document.documentElement) {
  const phonePortrait = window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches;
  const onSpecialPage = Boolean(document.body?.dataset?.route);
  const forced = preferences.mobileLandscape !== false && phonePortrait && onSpecialPage;
  root.dataset.forcedLandscape = String(forced);
  if (forced) {
    root.style.setProperty("--forced-stage-width", `${window.innerHeight}px`);
    root.style.setProperty("--forced-stage-height", `${window.innerWidth}px`);
  } else {
    root.style.removeProperty("--forced-stage-width");
    root.style.removeProperty("--forced-stage-height");
  }
  return forced;
}
