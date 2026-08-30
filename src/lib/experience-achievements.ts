import { achievementItems, extraDefaults } from "../data/extra-content.js";
import { readBlogActivity } from "./blog-activity";
import { GAL_BLOG_SAVE_CHANGE_EVENT, listGalBlogSaves } from "./gal-blog/save-store";

export const ACHIEVEMENT_STORAGE_KEY = "lonely-sea:achievements:v1";
export const ACHIEVEMENT_UNLOCK_EVENT = "lonely-sea:achievement-unlock";

type AchievementState = {
  schema: "lonely-sea-achievements/v1";
  unlocked: Record<string, string>;
};

export type ResolvedAchievement = (typeof achievementItems)[number] & {
  unlocked: boolean;
  unlockedAt: string;
  date: string;
};

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function readState(): AchievementState {
  const fallback: AchievementState = { schema: "lonely-sea-achievements/v1", unlocked: {} };
  let value: unknown = null;
  try { value = JSON.parse(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY) || "null"); } catch {}
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const source = value as Record<string, unknown>;
  if (source.schema !== fallback.schema || !source.unlocked || typeof source.unlocked !== "object") return fallback;
  return {
    ...fallback,
    unlocked: Object.fromEntries(Object.entries(source.unlocked as Record<string, unknown>)
      .filter((entry): entry is [string, string] => (
        achievementItems.some((item) => item.id === entry[0]) && validDate(entry[1])
      ))),
  };
}

function writeState(state: AchievementState): void {
  try { localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function thresholdDate(values: string[], threshold: number): string {
  const dates = values.filter(validDate).sort((left, right) => Date.parse(left) - Date.parse(right));
  return dates.length >= threshold ? dates[threshold - 1] : "";
}

function requiredValuesDate(record: Record<string, string>, values: string[]): string {
  const dates = values.map((value) => record[value]).filter(validDate);
  if (dates.length !== values.length) return "";
  return dates.sort((left, right) => Date.parse(left) - Date.parse(right)).at(-1) || "";
}

function formatDate(value: string): string {
  if (!validDate(value)) return "";
  return new Date(value).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }).replaceAll("-", ".");
}

function derivedUnlockDates(): Record<string, string> {
  const activity = readBlogActivity();
  const saves = listGalBlogSaves();
  const manualSaves = saves.filter((save) => save.mode === "manual");
  return {
    "first-landfall": thresholdDate(Object.values(activity.articles), 1),
    "first-checkpoint": thresholdDate(manualSaves.map((save) => save.savedAt), 1),
    "returning-reader": thresholdDate(Object.values(activity.articles), 3),
    "four-tides": requiredValuesDate(activity.scenes, ["mist", "day", "night", "crimson"]),
    "monthly-archive": thresholdDate(Object.values(activity.diaryMonths), 1),
    "memory-keeper": thresholdDate(Object.values(activity.cgItems), 5),
    "after-the-silence": thresholdDate(Object.values(activity.musicTracks), 1),
    "bangumi-record": activity.extraModes.bangumi || "",
    "archive-walker": requiredValuesDate(activity.extraModes, Object.keys(extraDefaults)),
    "heart-to-heart": thresholdDate(Object.values(activity.articleCompletions), 1),
  };
}

function reconcile(): { resolved: ResolvedAchievement[]; newlyUnlocked: ResolvedAchievement[] } {
  let hadStoredState = false;
  try { hadStoredState = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY) !== null; } catch {}
  const state = readState();
  const before = new Set(Object.keys(state.unlocked));
  const derived = derivedUnlockDates();
  achievementItems.forEach((item) => {
    if (!state.unlocked[item.id] && validDate(derived[item.id])) state.unlocked[item.id] = derived[item.id];
  });
  if (hadStoredState || Object.keys(state.unlocked).length > 0) writeState(state);
  const resolved = achievementItems.map((item) => {
    const unlockedAt = state.unlocked[item.id] || "";
    return { ...item, unlocked: Boolean(unlockedAt), unlockedAt, date: formatDate(unlockedAt) };
  });
  return {
    resolved,
    newlyUnlocked: resolved.filter((item) => item.unlocked && !before.has(item.id)),
  };
}

export function resolveAchievements(): ResolvedAchievement[] {
  return reconcile().resolved;
}

function ensureToast(): HTMLElement {
  const existing = document.querySelector<HTMLElement>("[data-achievement-toast]");
  if (existing) return existing;
  const toast = document.createElement("aside");
  toast.className = "achievement-toast";
  toast.dataset.achievementToast = "";
  toast.setAttribute("aria-live", "polite");
  toast.setAttribute("aria-atomic", "true");
  toast.hidden = true;
  toast.innerHTML = `
    <span class="achievement-toast__seal" aria-hidden="true">◆</span>
    <p><small>ACHIEVEMENT UNLOCKED</small><strong data-achievement-toast-name></strong><em data-achievement-toast-title></em></p>
  `;
  document.body.append(toast);
  return toast;
}

export function initAchievementSystem(): { refresh: () => void; dispose: () => void } {
  const toast = ensureToast();
  const name = toast.querySelector<HTMLElement>("[data-achievement-toast-name]");
  const title = toast.querySelector<HTMLElement>("[data-achievement-toast-title]");
  const queue: ResolvedAchievement[] = [];
  let timer = 0;
  let active = false;

  // The first pass adopts achievements earned in an earlier page without replaying old popups.
  reconcile();

  function showNext(): void {
    if (active || !queue.length) return;
    const item = queue.shift();
    if (!item) return;
    active = true;
    if (name) name.textContent = item.name;
    if (title) title.textContent = item.title;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_UNLOCK_EVENT, { detail: { achievement: item } }));
    timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      timer = window.setTimeout(() => {
        toast.hidden = true;
        active = false;
        showNext();
      }, 260);
    }, 3_600);
  }

  function refresh(): void {
    const { newlyUnlocked } = reconcile();
    queue.push(...newlyUnlocked);
    showNext();
  }

  const activityListener = () => refresh();
  const saveListener = () => refresh();
  window.addEventListener("lonely-sea:blog-activity-change", activityListener);
  window.addEventListener(GAL_BLOG_SAVE_CHANGE_EVENT, saveListener);

  return {
    refresh,
    dispose() {
      window.clearTimeout(timer);
      window.removeEventListener("lonely-sea:blog-activity-change", activityListener);
      window.removeEventListener(GAL_BLOG_SAVE_CHANGE_EVENT, saveListener);
      toast.remove();
    },
  };
}
