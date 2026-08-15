export const GAL_BLOG_PROTOCOL = "gal-blog-bridge/v1" as const;
export const GAL_BLOG_CHANNEL = "gal-blog-game" as const;
export const GAL_BLOG_PACKAGE_SCHEMA = "gal-blog-game-package/v1" as const;
export const GAL_BLOG_SAVE_SCHEMA = "gal-blog-save/v1" as const;
export const GAL_BLOG_MESSAGE_MAX_BYTES = 64 * 1024;

export type GalBlogScalar = boolean | number | string;
export type GalBlogAction =
  | "return-menu"
  | "open-article"
  | "open-settings"
  | "open-load"
  | "open-comment-form"
  | "save-progress"
  | "get-runtime-data";
export type GalBlogSettingKey =
  | "audio.muted"
  | "audio.bgm"
  | "audio.ambient"
  | "audio.effects"
  | "audio.voice"
  | "text.scale"
  | "text.speed"
  | "accessibility.reducedMotion"
  | "interface.scale"
  | "interface.cursor"
  | "interface.language";
export type GalBlogResultStatus = "success" | "failure" | "cancel" | "unsupported";
export type GalBlogMessageType =
  | "hello"
  | "launch"
  | "ready"
  | "request"
  | "result"
  | "event"
  | "error";

export type GalBlogLaunchTarget =
  | { kind: "start"; id: string }
  | { kind: "scene"; id: string }
  | { kind: "save-point"; id: string };

export interface GalBlogEnvelopeV1 {
  protocol: typeof GAL_BLOG_PROTOCOL;
  channel: typeof GAL_BLOG_CHANNEL;
  source: "galgame" | "gal-blog";
  gameId: string;
  releaseId: string;
  sessionId: string;
  id?: string;
  replyTo?: string;
  type: GalBlogMessageType;
  payload?: unknown;
}

export interface GalBlogPackageManifestV1 {
  schema: typeof GAL_BLOG_PACKAGE_SCHEMA;
  game: {
    id: string;
    slug: string;
    title: string;
    gameVersion: string;
    releaseId: string;
    locale: string;
  };
  engine: {
    name: "WebGAL";
    version: string;
    bundled: true;
    entry: string;
  };
  launchTargets: {
    start: { kind: "start"; id: string; sceneId: string };
    scenes: Array<{
      kind: "scene";
      id: string;
      title: string;
      replayable: boolean;
      thumbnail?: string;
    }>;
    savePoints: Array<{
      kind: "save-point";
      id: string;
      title: string;
      sceneId: string;
      resumeMode: "scene-entry" | "authored-block";
      thumbnail?: string;
    }>;
  };
  publicRouteMap: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
  stateContract: {
    saveMode: "checkpoint-v1";
    launchVariables: string[];
    persistVariables: string[];
    records: string[];
  };
  settingsContract?: {
    schema: "gal-blog-settings/v1";
    accepts: GalBlogSettingKey[];
  };
  bridge: {
    protocol: typeof GAL_BLOG_PROTOCOL;
    channel: typeof GAL_BLOG_CHANNEL;
    allowedHostOrigins: string[];
    requiredActions: GalBlogAction[];
    optionalActions: GalBlogAction[];
  };
  theme?: {
    tokens?: string;
    webgalTemplate?: string;
  };
  integrity: string;
}

export interface GalBlogSaveRecordV1 {
  schema: typeof GAL_BLOG_SAVE_SCHEMA;
  id: string;
  slot: number;
  gameId: string;
  gameSlug: string;
  releaseId: string;
  target: { kind: "save-point"; id: string };
  mode?: "auto" | "manual";
  title: string;
  chapter?: string;
  scene?: string;
  thumbnail?: string;
  elapsedMs?: number;
  variables: Record<string, GalBlogScalar>;
  records: string[];
  savedAt: string;
}

export interface GalBlogLaunchIntentV1 {
  schema: "gal-blog-launch/v1";
  sessionId: string;
  gameSlug: string;
  releaseId?: string;
  target: GalBlogLaunchTarget;
  state?: {
    variables: Record<string, GalBlogScalar>;
    records: string[];
  };
  createdAt: string;
}

type EnvelopeExpectation = {
  source?: GalBlogEnvelopeV1["source"];
  gameId?: string;
  releaseId?: string;
  sessionId?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength = 160): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function serializedSize(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function parseGalBlogEnvelopeV1(
  value: unknown,
  expectation: EnvelopeExpectation = {},
): GalBlogEnvelopeV1 | null {
  if (!isObject(value) || serializedSize(value) > GAL_BLOG_MESSAGE_MAX_BYTES) return null;
  if (value.protocol !== GAL_BLOG_PROTOCOL || value.channel !== GAL_BLOG_CHANNEL) return null;
  if (value.source !== "galgame" && value.source !== "gal-blog") return null;
  if (!isNonEmptyString(value.gameId) || !isNonEmptyString(value.releaseId)) return null;
  if (!isNonEmptyString(value.sessionId, 240)) return null;
  if (!["hello", "launch", "ready", "request", "result", "event", "error"].includes(String(value.type))) {
    return null;
  }
  if (value.id !== undefined && !isNonEmptyString(value.id, 240)) return null;
  if (value.replyTo !== undefined && !isNonEmptyString(value.replyTo, 240)) return null;
  if (["hello", "launch", "request"].includes(String(value.type)) && !value.id) return null;
  if (value.type === "result" && !value.replyTo) return null;
  if (expectation.source && value.source !== expectation.source) return null;
  if (expectation.gameId && value.gameId !== expectation.gameId) return null;
  if (expectation.releaseId && value.releaseId !== expectation.releaseId) return null;
  if (expectation.sessionId && value.sessionId !== expectation.sessionId) return null;
  return value as unknown as GalBlogEnvelopeV1;
}

export function isGalBlogScalar(value: unknown): value is GalBlogScalar {
  return typeof value === "boolean"
    || typeof value === "string"
    || (typeof value === "number" && Number.isFinite(value));
}

export function isSafeIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
}

export function isSafeRelativePath(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 512) return false;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("/") || decoded.includes("\\")) return false;
    if (decoded.split("/").some((segment) => segment === "." || segment === "..")) return false;
    const url = new URL(value, "https://gal-blog.invalid/");
    return url.origin === "https://gal-blog.invalid" && !url.username && !url.password;
  } catch {
    return false;
  }
}
