import {
  GAL_BLOG_SAVE_SCHEMA,
  isGalBlogScalar,
  isSafeIdentifier,
  type GalBlogPackageManifestV1,
  type GalBlogSaveRecordV1,
  type GalBlogScalar,
} from "./contracts";
import { writeGameContinue } from "../experience-continue";

export const GAL_BLOG_SAVE_CHANGE_EVENT = "lonely-sea:gal-blog-save-change";
const SAVE_STORAGE_KEY = "lonely-sea:gal-blog-saves:v1";
const MAX_SAVE_SLOTS = 24;

export type SaveProgressInput = {
  target: { kind: "save-point"; id: string };
  mode?: "auto" | "manual";
  slot?: number;
  title?: string;
  chapter?: string;
  scene?: string;
  thumbnail?: string;
  elapsedMs?: number;
  variables?: Record<string, unknown>;
  records?: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function validThumbnail(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 56 * 1024) return false;
  if (/^data:image\/webp;base64,[a-zA-Z0-9+/]+=*$/.test(value)) return true;
  return value.startsWith("/games/") && !value.includes("\\") && !value.includes("..");
}

function validStoredSave(value: unknown): value is GalBlogSaveRecordV1 {
  if (!isRecord(value) || value.schema !== GAL_BLOG_SAVE_SCHEMA) return false;
  if (!isSafeIdentifier(value.id) || !isSafeIdentifier(value.gameId) || !isSafeIdentifier(value.releaseId)) return false;
  if (!isSafeIdentifier(value.gameSlug)) return false;
  if (!Number.isInteger(value.slot) || Number(value.slot) < 1 || Number(value.slot) > MAX_SAVE_SLOTS) return false;
  if (!isRecord(value.target) || value.target.kind !== "save-point" || !isSafeIdentifier(value.target.id)) return false;
  if (value.mode !== undefined && value.mode !== "auto" && value.mode !== "manual") return false;
  if (typeof value.title !== "string" || !isRecord(value.variables) || !Array.isArray(value.records)) return false;
  if (value.thumbnail !== undefined && !validThumbnail(value.thumbnail)) return false;
  if (Object.values(value.variables).some((item) => !isGalBlogScalar(item))) return false;
  if (value.records.some((item) => typeof item !== "string")) return false;
  return !Number.isNaN(Date.parse(String(value.savedAt)));
}

export function listGalBlogSaves(): GalBlogSaveRecordV1[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(validStoredSave)
      .filter((save) => save.gameSlug !== "lonely-sea-guide")
      .sort((a, b) => a.slot - b.slot || Number(a.mode === "auto") - Number(b.mode === "auto"));
  } catch {
    return [];
  }
}

export function listGalBlogManualSaves(): GalBlogSaveRecordV1[] {
  return listGalBlogSaves().filter((save) => save.mode !== "auto");
}

export function getGalBlogSave(saveId: string): GalBlogSaveRecordV1 | null {
  return listGalBlogSaves().find((save) => save.id === saveId) ?? null;
}

function nextSlot(saves: GalBlogSaveRecordV1[]): number {
  const manualSaves = saves.filter((save) => save.mode !== "auto");
  for (let slot = 1; slot <= MAX_SAVE_SLOTS; slot += 1) {
    if (!manualSaves.some((save) => save.slot === slot)) return slot;
  }
  return [...manualSaves].sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt))[0]?.slot ?? 1;
}

function createId(): string {
  return `save-${globalThis.crypto.randomUUID()}`;
}

export function saveGalBlogProgress(
  manifest: GalBlogPackageManifestV1,
  input: SaveProgressInput,
  packageUrl = "",
): GalBlogSaveRecordV1 {
  if (!isRecord(input) || !isRecord(input.target) || input.target.kind !== "save-point") {
    throw new Error("存档请求缺少检查点目标");
  }
  const target = manifest.launchTargets.savePoints.find((item) => item.id === input.target.id);
  if (!target) throw new Error("存档点不在游戏清单白名单中");
  const variables = Object.create(null) as Record<string, GalBlogScalar>;
  const inputVariables = isRecord(input.variables) ? input.variables : {};
  for (const key of manifest.stateContract.persistVariables) {
    const value = inputVariables[key];
    if (value !== undefined) {
      if (!isGalBlogScalar(value)) throw new Error(`存档变量类型无效：${key}`);
      variables[key] = value;
    }
  }
  if (Object.keys(inputVariables).some((key) => !manifest.stateContract.persistVariables.includes(key))) {
    throw new Error("存档请求包含未声明变量");
  }
  const records = Array.isArray(input.records) ? input.records : [];
  if (records.some((item) => typeof item !== "string" || !manifest.stateContract.records.includes(item))) {
    throw new Error("存档请求包含未声明记录");
  }
  const saves = listGalBlogSaves();
  const requestedSlot = Number(input.slot);
  const mode = input.mode === "auto" ? "auto" : "manual";
  const existingAutoSave = mode === "auto"
    ? saves.find((item) => item.mode === "auto" && item.gameId === manifest.game.id)
    : undefined;
  const slot = existingAutoSave?.slot
    ?? (Number.isInteger(requestedSlot) && requestedSlot >= 1 && requestedSlot <= MAX_SAVE_SLOTS
      ? requestedSlot
      : nextSlot(saves));
  const previous = mode === "auto"
    ? existingAutoSave
    : saves.find((save) => save.mode !== "auto" && save.slot === slot);
  const savedAt = new Date().toISOString();
  const save: GalBlogSaveRecordV1 = {
    schema: GAL_BLOG_SAVE_SCHEMA,
    id: previous?.id ?? createId(),
    slot,
    gameId: manifest.game.id,
    gameSlug: manifest.game.slug,
    releaseId: manifest.game.releaseId,
    target: { kind: "save-point", id: target.id },
    mode,
    title: text(input.title, 100) ?? target.title,
    chapter: text(input.chapter, 80),
    scene: text(input.scene, 80),
    thumbnail: validThumbnail(input.thumbnail)
      ? input.thumbnail
      : target.thumbnail
        ? `${packageUrl.replace(/\/$/, "")}/${target.thumbnail}`
        : undefined,
    elapsedMs: Number.isFinite(input.elapsedMs) && Number(input.elapsedMs) >= 0
      ? Math.round(Number(input.elapsedMs))
      : undefined,
    variables,
    records: records as string[],
    savedAt,
  };
  const next = saves.filter((item) => (
    mode === "auto"
      ? !(item.mode === "auto" && item.gameId === manifest.game.id)
      : !(item.mode !== "auto" && item.slot === slot)
  ));
  next.push(save);
  next.sort((a, b) => a.slot - b.slot);
  localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(next));
  writeGameContinue(save.id, save.savedAt);
  window.dispatchEvent(new CustomEvent(GAL_BLOG_SAVE_CHANGE_EVENT, { detail: { save } }));
  return save;
}
