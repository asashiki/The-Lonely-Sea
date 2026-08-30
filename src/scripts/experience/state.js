export const EXPERIENCE_STORAGE_KEY = "lonely-sea-experience-v1";
export const EXPERIENCE_CHANGE_EVENT = "lonely-sea:experience-preference-change";

const EXPERIENCE_SESSION_KEY = "lonely-sea:experience-session:v1";
const SCENES = Object.freeze(["mist", "day", "night", "crimson"]);
const WEATHER = Object.freeze(["clear", "snow", "rain"]);

function readRawExperience() {
  try {
    const value = JSON.parse(localStorage.getItem(EXPERIENCE_STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function sceneForCurrentTime(date = new Date()) {
  const localTime = date.getTime() - date.getTimezoneOffset() * 60_000;
  return SCENES[Math.floor(localTime / (8 * 60 * 60 * 1_000)) % SCENES.length];
}

export function readExperienceState() {
  const source = readRawExperience();
  return {
    scene: SCENES.includes(source.scene) ? source.scene : "mist",
    weather: WEATHER.includes(source.weather) ? source.weather : "clear",
  };
}

export function writeExperienceState(next, { emit = true } = {}) {
  const normalized = {
    scene: SCENES.includes(next?.scene) ? next.scene : "mist",
    weather: WEATHER.includes(next?.weather) ? next.weather : "clear",
  };
  try { localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(normalized)); } catch {}
  if (emit) window.dispatchEvent(new CustomEvent(EXPERIENCE_CHANGE_EVENT, { detail: normalized }));
  return normalized;
}

export function resolveExperienceState(preferences, random = Math.random, { persist = true } = {}) {
  const source = readRawExperience();
  let freshSession = true;
  try {
    freshSession = sessionStorage.getItem(EXPERIENCE_SESSION_KEY) !== "1";
    sessionStorage.setItem(EXPERIENCE_SESSION_KEY, "1");
  } catch {}

  const scene = preferences?.automaticTheme && freshSession
    ? sceneForCurrentTime()
    : SCENES.includes(source.scene)
      ? source.scene
      : preferences?.automaticTheme
        ? sceneForCurrentTime()
        : "mist";
  const weather = WEATHER.includes(source.weather)
    ? source.weather
    : WEATHER[Math.min(WEATHER.length - 1, Math.floor(random() * WEATHER.length))];
  const resolved = { scene, weather };
  return persist ? writeExperienceState(resolved, { emit: false }) : resolved;
}
