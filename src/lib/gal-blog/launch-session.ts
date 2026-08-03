import type {
  GalBlogLaunchIntentV1,
  GalBlogLaunchTarget,
  GalBlogSaveRecordV1,
  GalBlogScalar,
} from "./contracts";

const LAUNCH_STORAGE_PREFIX = "lonely-sea:gal-blog-launch:";
const LAUNCH_MAX_AGE_MS = 15 * 60 * 1000;

function randomId(): string {
  if (!globalThis.crypto?.randomUUID) throw new Error("当前浏览器无法创建安全的游戏会话");
  return globalThis.crypto.randomUUID();
}

function storageKey(sessionId: string): string {
  return `${LAUNCH_STORAGE_PREFIX}${sessionId}`;
}

export function createGalBlogLaunchIntent(input: {
  gameSlug: string;
  releaseId?: string;
  target: GalBlogLaunchTarget;
  state?: { variables: Record<string, GalBlogScalar>; records: string[] };
}): GalBlogLaunchIntentV1 {
  const intent: GalBlogLaunchIntentV1 = {
    schema: "gal-blog-launch/v1",
    sessionId: randomId(),
    gameSlug: input.gameSlug,
    releaseId: input.releaseId,
    target: input.target,
    state: input.state,
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(storageKey(intent.sessionId), JSON.stringify(intent));
  return intent;
}

export function createGalBlogLaunchUrl(intent: GalBlogLaunchIntentV1): string {
  const url = new URL(`/start/stories/${encodeURIComponent(intent.gameSlug)}/`, window.location.origin);
  url.searchParams.set("session", intent.sessionId);
  return `${url.pathname}${url.search}`;
}

export function createSaveLaunchUrl(save: GalBlogSaveRecordV1): string {
  return createGalBlogLaunchUrl(createGalBlogLaunchIntent({
    gameSlug: save.gameSlug,
    releaseId: save.releaseId,
    target: save.target,
    state: { variables: save.variables, records: save.records },
  }));
}

export function consumeGalBlogLaunchIntent(
  sessionId: string,
  expectedSlug: string,
): GalBlogLaunchIntentV1 | null {
  if (!sessionId) return null;
  const key = storageKey(sessionId);
  const raw = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<GalBlogLaunchIntentV1>;
    if (value.schema !== "gal-blog-launch/v1" || value.sessionId !== sessionId) return null;
    if (value.gameSlug !== expectedSlug || !value.target || typeof value.target !== "object") return null;
    const age = Date.now() - Date.parse(String(value.createdAt));
    if (!Number.isFinite(age) || age < 0 || age > LAUNCH_MAX_AGE_MS) return null;
    return value as GalBlogLaunchIntentV1;
  } catch {
    return null;
  }
}

export function createDefaultLaunchIntent(gameSlug: string): GalBlogLaunchIntentV1 {
  return createGalBlogLaunchIntent({
    gameSlug,
    target: { kind: "start", id: "start" },
  });
}
