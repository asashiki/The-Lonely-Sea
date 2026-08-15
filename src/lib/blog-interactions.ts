export const BLOG_INTERACTION_STORAGE_KEY = "lonely-sea:blog-interactions:v2";

const LEGACY_INTERACTION_STORAGE_KEY = "lonely-sea:local-interactions:v1";
const INTERACTION_EVENT = "lonely-sea:blog-interactions-change";
const MAX_COMMENTS = 80;
const MAX_FRIEND_DRAFTS = 40;

export type LocalBlogComment = {
  id: string;
  contextKey: string;
  author: string;
  message: string;
  source: "article" | "game";
  createdAt: string;
};

export type LocalFriendDraft = {
  id: string;
  title: string;
  url: string;
  note: string;
  createdAt: string;
};

export type BlogInteractionState = {
  schema: "lonely-sea-blog-interactions/v2";
  comments: LocalBlogComment[];
  friendDrafts: LocalFriendDraft[];
};

const EMPTY_STATE: BlogInteractionState = {
  schema: "lonely-sea-blog-interactions/v2",
  comments: [],
  friendDrafts: [],
};

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function cleanText(value: unknown, maximum: number): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maximum)
    : "";
}

function validDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function safeContext(value: unknown): string {
  const context = cleanText(value, 180);
  return /^[a-z]+:[a-zA-Z0-9/_.,:%+-]+$/.test(context) ? context : "article:/";
}

function safeHttpUrl(value: unknown): string | null {
  const candidate = cleanText(value, 500);
  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function id(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function normalizeComment(value: unknown): LocalBlogComment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const message = cleanText(record.message, 1000);
  const createdAt = validDate(record.createdAt);
  if (!message || !createdAt) return null;
  return {
    id: cleanText(record.id, 120) || id("comment"),
    contextKey: safeContext(record.contextKey),
    author: cleanText(record.author, 40) || "匿名访客",
    message,
    source: record.source === "game" ? "game" : "article",
    createdAt,
  };
}

function normalizeFriendDraft(value: unknown): LocalFriendDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const title = cleanText(record.title, 80);
  const url = safeHttpUrl(record.url);
  const createdAt = validDate(record.createdAt);
  if (!title || !url || !createdAt) return null;
  return {
    id: cleanText(record.id, 120) || id("friend"),
    title,
    url,
    note: cleanText(record.note, 280),
    createdAt,
  };
}

function parseState(value: string | null): BlogInteractionState {
  if (!value) return { ...EMPTY_STATE, comments: [], friendDrafts: [] };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const comments = Array.isArray(parsed.comments)
      ? parsed.comments.map(normalizeComment).filter((item): item is LocalBlogComment => Boolean(item)).slice(-MAX_COMMENTS)
      : [];
    const friendDrafts = Array.isArray(parsed.friendDrafts)
      ? parsed.friendDrafts.map(normalizeFriendDraft).filter((item): item is LocalFriendDraft => Boolean(item)).slice(-MAX_FRIEND_DRAFTS)
      : [];
    return { ...EMPTY_STATE, comments, friendDrafts };
  } catch {
    return { ...EMPTY_STATE, comments: [], friendDrafts: [] };
  }
}

function migrateLegacy(state: BlogInteractionState, target: Storage): BlogInteractionState {
  if (state.comments.length > 0) return state;
  try {
    const parsed = JSON.parse(target.getItem(LEGACY_INTERACTION_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return state;
    const comments = parsed.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      return normalizeComment({
        id: record.id,
        contextKey: `game:${cleanText(record.gameSlug, 120) || "unknown"}`,
        author: record.author,
        message: record.message,
        source: "game",
        createdAt: record.createdAt,
      });
    }).filter((item): item is LocalBlogComment => Boolean(item));
    if (comments.length === 0) return state;
    return { ...state, comments: comments.slice(-MAX_COMMENTS) };
  } catch {
    return state;
  }
}

function writeState(state: BlogInteractionState): void {
  const target = storage();
  if (!target) throw new Error("当前浏览器无法保存本机记录");
  target.setItem(BLOG_INTERACTION_STORAGE_KEY, JSON.stringify(state));
  globalThis.dispatchEvent?.(new CustomEvent(INTERACTION_EVENT, { detail: state }));
}

export function readBlogInteractions(): BlogInteractionState {
  const target = storage();
  if (!target) return { ...EMPTY_STATE, comments: [], friendDrafts: [] };
  const parsed = parseState(target.getItem(BLOG_INTERACTION_STORAGE_KEY));
  const migrated = migrateLegacy(parsed, target);
  if (migrated !== parsed) {
    try { target.setItem(BLOG_INTERACTION_STORAGE_KEY, JSON.stringify(migrated)); } catch {}
  }
  return migrated;
}

export function listLocalComments(contextKey?: string): LocalBlogComment[] {
  const comments = readBlogInteractions().comments;
  return contextKey ? comments.filter((item) => item.contextKey === safeContext(contextKey)) : comments;
}

export function addLocalComment(input: {
  contextKey: string;
  author?: string;
  message: string;
  source: "article" | "game";
}): LocalBlogComment {
  const message = cleanText(input.message, 1000);
  if (!message) throw new Error("请输入留言内容");
  const state = readBlogInteractions();
  const comment: LocalBlogComment = {
    id: id("comment"),
    contextKey: safeContext(input.contextKey),
    author: cleanText(input.author, 40) || "匿名访客",
    message,
    source: input.source === "game" ? "game" : "article",
    createdAt: new Date().toISOString(),
  };
  state.comments = [...state.comments, comment].slice(-MAX_COMMENTS);
  writeState(state);
  return comment;
}

export function listLocalFriendDrafts(): LocalFriendDraft[] {
  return readBlogInteractions().friendDrafts;
}

export function addLocalFriendDraft(input: {
  title: string;
  url: string;
  note?: string;
}): LocalFriendDraft {
  const title = cleanText(input.title, 80);
  const url = safeHttpUrl(input.url);
  if (!title) throw new Error("请输入站点名称");
  if (!url) throw new Error("请输入完整的 http 或 https 地址");
  const state = readBlogInteractions();
  const draft: LocalFriendDraft = {
    id: id("friend"),
    title,
    url,
    note: cleanText(input.note, 280),
    createdAt: new Date().toISOString(),
  };
  state.friendDrafts = [...state.friendDrafts, draft].slice(-MAX_FRIEND_DRAFTS);
  writeState(state);
  return draft;
}

export function subscribeBlogInteractions(listener: (state: BlogInteractionState) => void): () => void {
  const localListener = (event: Event) => listener((event as CustomEvent<BlogInteractionState>).detail ?? readBlogInteractions());
  const storageListener = (event: StorageEvent) => {
    if (event.key === BLOG_INTERACTION_STORAGE_KEY) listener(readBlogInteractions());
  };
  globalThis.addEventListener?.(INTERACTION_EVENT, localListener);
  globalThis.addEventListener?.("storage", storageListener as EventListener);
  return () => {
    globalThis.removeEventListener?.(INTERACTION_EVENT, localListener);
    globalThis.removeEventListener?.("storage", storageListener as EventListener);
  };
}
