export const READING_TRAIL_KEY = "lonely-sea:reading-trail:v1";
export type ReadingBookmark = { block: number; fraction: number; chapter: string; percent: number };
export type ReadingTrail = Record<string, { percent: number; updatedAt: number; bookmark?: ReadingBookmark }>;
export function readingPath(path: string): string {
  try { return new URL(path, "https://lonely-sea.invalid").pathname; } catch { return ""; }
}

export function readReadingTrail(): ReadingTrail {
  try {
    const value = JSON.parse(localStorage.getItem(READING_TRAIL_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([path, entry]: [string, any]) =>
      path.startsWith("/posts/") && entry && Number.isFinite(entry.percent)
      && entry.percent >= 0 && entry.percent <= 100 && Number.isFinite(entry.updatedAt)
    ).slice(-200)) as ReadingTrail;
  } catch { return {}; }
}

/** Store the furthest actual reading position; never infer completion from a click. */
export function writeReadingTrail(path: string, percent: number, bookmark?: ReadingBookmark): void {
  if (!path.startsWith("/posts/") || !Number.isFinite(percent)) return;
  path = readingPath(path);
  const trail = readReadingTrail();
  const previous = trail[path]?.percent || 0;
  trail[path] = { percent: Math.max(previous, Math.min(100, Math.max(0, Math.round(percent)))), updatedAt: Date.now(), ...(bookmark ? { bookmark } : {}) };
  try { localStorage.setItem(READING_TRAIL_KEY, JSON.stringify(Object.fromEntries(Object.entries(trail).sort((a, b) => b[1].updatedAt - a[1].updatedAt).slice(0, 200)))); } catch {}
}

/** Older trail entries remain readable; malformed bookmarks never drive scrolling. */
export function readReadingBookmark(path: string): ReadingBookmark | null {
  const mark = readReadingTrail()[readingPath(path)]?.bookmark;
  if (!mark || !Number.isInteger(mark.block) || mark.block < 0 || mark.block > 100000
    || !Number.isFinite(mark.fraction) || mark.fraction < 0 || mark.fraction > 1
    || !Number.isFinite(mark.percent) || mark.percent < 0 || mark.percent > 100
    || typeof mark.chapter !== "string") return null;
  return { ...mark, chapter: mark.chapter.slice(0, 160) };
}
