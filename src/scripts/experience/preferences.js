export const PREFERENCES_STORAGE_KEY = "lonely-sea-preferences-v2";

export const defaultPreferences = Object.freeze({
  particleDensity: 72,
  sceneCrossfade: true,
  vignette: true,
  keyboardCursor: true,
  specialCursor: true,
  interfaceScale: 100,
  backgroundQuality: "HIGH",
  bgmVolume: 60,
  ambientVolume: 45,
  interfaceVolume: 70,
  voiceVolume: 80,
  muteOnStart: false,
  language: "ZH-CN",
  textSize: 100,
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

function clampNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

export function normalizePreferences(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return {
    ...defaultPreferences,
    ...source,
    particleDensity: clampNumber(source.particleDensity, 0, 100, defaultPreferences.particleDensity),
    interfaceScale: clampNumber(source.interfaceScale, 80, 120, defaultPreferences.interfaceScale),
    bgmVolume: clampNumber(source.bgmVolume, 0, 100, defaultPreferences.bgmVolume),
    ambientVolume: clampNumber(source.ambientVolume, 0, 100, defaultPreferences.ambientVolume),
    interfaceVolume: clampNumber(source.interfaceVolume, 0, 100, defaultPreferences.interfaceVolume),
    voiceVolume: clampNumber(source.voiceVolume, 0, 100, defaultPreferences.voiceVolume),
    textSize: clampNumber(source.textSize, 80, 120, defaultPreferences.textSize),
    autoSpeed: clampNumber(source.autoSpeed, 1, 10, defaultPreferences.autoSpeed),
  };
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
  root.dataset.sceneCrossfade = String(normalized.sceneCrossfade);
  root.dataset.vignette = String(normalized.vignette);
  root.dataset.motion = normalized.reducedMotion ? "reduced" : "full";
  root.dataset.subLabels = String(normalized.subLabels);
  root.dataset.readingTypeset = String(normalized.typeset).toLocaleLowerCase("en-US");
  root.style.setProperty("--experience-ui-scale", String(normalized.interfaceScale / 100));
  root.style.setProperty("--reading-text-scale", String(normalized.textSize / 100));
  root.style.setProperty("--weather-density", String(normalized.particleDensity / 100));
  return normalized;
}

export function preferencesReduceMotion(preferences = readPreferences()) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || preferences.reducedMotion;
}
