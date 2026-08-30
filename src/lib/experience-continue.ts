export const CONTINUE_STORAGE_KEY = "lonely-sea:continue:v1";

type ArticleContinue = {
  path: string;
  title?: string;
  updatedAt: string;
};

type GameContinue = {
  saveId: string;
  updatedAt: string;
};

type NvlContinue = {
  saveId: string;
  updatedAt: string;
};

type ContinueState = {
  schema: "lonely-sea-continue/v1";
  article?: ArticleContinue;
  game?: GameContinue;
  nvl?: NvlContinue;
};

type SaveLike = {
  id: string;
  savedAt: string;
};

export type ContinueTarget =
  | ({ kind: "article" } & ArticleContinue)
  | ({ kind: "game" } & GameContinue)
  | ({ kind: "nvl" } & NvlContinue);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function safeLocalPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, "https://lonely-sea.invalid");
    if (url.origin !== "https://lonely-sea.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function readState(): ContinueState {
  let value: unknown = null;
  try { value = JSON.parse(localStorage.getItem(CONTINUE_STORAGE_KEY) || "null"); } catch {}
  const state: ContinueState = { schema: "lonely-sea-continue/v1" };
  if (!isRecord(value) || value.schema !== state.schema) return state;

  if (isRecord(value.article)) {
    const path = safeLocalPath(value.article.path);
    if (path && validDate(value.article.updatedAt)) {
      state.article = {
        path,
        updatedAt: value.article.updatedAt,
        ...(typeof value.article.title === "string" ? { title: value.article.title.slice(0, 120) } : {}),
      };
    }
  }
  if (isRecord(value.game)
    && typeof value.game.saveId === "string"
    && value.game.saveId.length <= 180
    && validDate(value.game.updatedAt)) {
    state.game = { saveId: value.game.saveId, updatedAt: value.game.updatedAt };
  }
  if (isRecord(value.nvl)
    && typeof value.nvl.saveId === "string"
    && value.nvl.saveId.length <= 180
    && validDate(value.nvl.updatedAt)) {
    state.nvl = { saveId: value.nvl.saveId, updatedAt: value.nvl.updatedAt };
  }
  return state;
}

function writeState(state: ContinueState): void {
  try { localStorage.setItem(CONTINUE_STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function writeArticleContinue(path: string, title = ""): void {
  const safePath = safeLocalPath(path);
  if (!safePath) return;
  const state = readState();
  state.article = {
    path: safePath,
    ...(title.trim() ? { title: title.trim().slice(0, 120) } : {}),
    updatedAt: new Date().toISOString(),
  };
  writeState(state);
}

export function writeGameContinue(saveId: string, updatedAt = new Date().toISOString()): void {
  if (!saveId || saveId.length > 180 || !validDate(updatedAt)) return;
  const state = readState();
  state.game = { saveId, updatedAt };
  writeState(state);
}

export function writeNvlContinue(saveId: string, updatedAt = new Date().toISOString()): void {
  if (!saveId || saveId.length > 180 || !validDate(updatedAt)) return;
  const state = readState();
  state.nvl = { saveId, updatedAt };
  writeState(state);
}

export function resolveContinueTarget(
  saves: readonly SaveLike[],
  nvlSaves: readonly SaveLike[] = [],
): ContinueTarget | null {
  const state = readState();
  const candidates: ContinueTarget[] = [];
  if (state.article) candidates.push({ kind: "article", ...state.article });
  const storedGameExists = Boolean(state.game && saves.some((save) => save.id === state.game?.saveId));
  if (state.game && storedGameExists) {
    candidates.push({ kind: "game", ...state.game });
  }
  const storedNvlExists = Boolean(state.nvl && nvlSaves.some((save) => save.id === state.nvl?.saveId));
  if (state.nvl && storedNvlExists) {
    candidates.push({ kind: "nvl", ...state.nvl });
  }

  if (!storedGameExists && saves.length) {
    const latest = [...saves].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))[0];
    if (latest) candidates.push({ kind: "game", saveId: latest.id, updatedAt: latest.savedAt });
  }
  if (!storedNvlExists && nvlSaves.length) {
    const latest = [...nvlSaves].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))[0];
    if (latest) candidates.push({ kind: "nvl", saveId: latest.id, updatedAt: latest.savedAt });
  }
  return candidates.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null;
}
