export const BLOG_ACTIVITY_STORAGE_KEY = "lonely-sea:blog-activity:v1";

const BUCKETS = [
  "articles",
  "scenes",
  "extraModes",
  "diaryMonths",
  "cgItems",
  "musicTracks",
  "articleCompletions",
] as const;

export type BlogActivityBucket = typeof BUCKETS[number];
export type BlogActivityState = {
  schema: "lonely-sea-blog-activity/v1";
} & Record<BlogActivityBucket, Record<string, string>>;

function emptyState(): BlogActivityState {
  return {
    schema: "lonely-sea-blog-activity/v1",
    articles: {},
    scenes: {},
    extraModes: {},
    diaryMonths: {},
    cgItems: {},
    musicTracks: {},
    articleCompletions: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBucket(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const entries: Array<[string, string]> = [];
  Object.entries(value).forEach(([key, date]) => {
    if (
      key.length > 0
      && key.length <= 180
      && typeof date === "string"
      && !Number.isNaN(Date.parse(date))
    ) entries.push([key, date]);
  });
  return Object.fromEntries(entries
    .sort(([, left], [, right]) => Date.parse(right) - Date.parse(left))
    .slice(0, 200));
}

export function readBlogActivity(): BlogActivityState {
  let source: unknown = null;
  try { source = JSON.parse(localStorage.getItem(BLOG_ACTIVITY_STORAGE_KEY) || "null"); } catch {}
  const state = emptyState();
  if (!isRecord(source) || source.schema !== state.schema) return state;
  BUCKETS.forEach((bucket) => { state[bucket] = normalizeBucket(source[bucket]); });
  return state;
}

export function recordBlogActivity(
  bucket: BlogActivityBucket,
  value: string,
  occurredAt = new Date().toISOString(),
): BlogActivityState {
  const normalizedValue = String(value || "").trim().slice(0, 180);
  if (!BUCKETS.includes(bucket) || !normalizedValue || Number.isNaN(Date.parse(occurredAt))) {
    return readBlogActivity();
  }
  const state = readBlogActivity();
  if (!state[bucket][normalizedValue]) state[bucket][normalizedValue] = occurredAt;
  state[bucket] = normalizeBucket(state[bucket]);
  try { localStorage.setItem(BLOG_ACTIVITY_STORAGE_KEY, JSON.stringify(state)); } catch {}
  window.dispatchEvent(new CustomEvent("lonely-sea:blog-activity-change", {
    detail: { bucket, value: normalizedValue, state },
  }));
  return state;
}
