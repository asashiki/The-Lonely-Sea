import { writeNvlContinue } from "../experience-continue";

export const NVL_SAVE_SCHEMA = "lonely-sea-nvl-save/v1" as const;
export const NVL_SAVE_CHANGE_EVENT = "lonely-sea:nvl-save-change";

const NVL_SAVE_STORAGE_KEY = "lonely-sea:nvl-saves:v1";
const MAX_NVL_SAVES = 12;

export interface NvlSaveRecordV1 {
  schema: typeof NVL_SAVE_SCHEMA;
  id: string;
  chapterId: string;
  monthId: string;
  title: string;
  chapterTitle: string;
  coverArt: string;
  stepIndex: number;
  lineIndex: number;
  pageId: string;
  pageNumber: number;
  totalPages: number;
  povName: string;
  timestamp: string;
  savedAt: string;
}

export type SaveNvlProgressInput = Omit<
  NvlSaveRecordV1,
  "schema" | "id" | "savedAt"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafeText(value: unknown, maxLength = 240): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isValidSave(value: unknown): value is NvlSaveRecordV1 {
  if (!isRecord(value) || value.schema !== NVL_SAVE_SCHEMA) return false;
  if (!isSafeText(value.id, 160) || !isSafeText(value.chapterId, 120) || !isSafeText(value.monthId, 24)) return false;
  if (!isSafeText(value.title) || !isSafeText(value.chapterTitle) || !isSafeText(value.coverArt, 520)) return false;
  if (!isNonNegativeInteger(value.stepIndex) || !isNonNegativeInteger(value.lineIndex)) return false;
  if (!isSafeText(value.pageId, 160) || !isNonNegativeInteger(value.pageNumber)) return false;
  if (!Number.isInteger(value.totalPages) || Number(value.totalPages) < 1) return false;
  if (!isSafeText(value.povName) || !isSafeText(value.timestamp)) return false;
  return typeof value.savedAt === "string" && !Number.isNaN(Date.parse(value.savedAt));
}

function readSaves(): NvlSaveRecordV1[] {
  try {
    const value = JSON.parse(localStorage.getItem(NVL_SAVE_STORAGE_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(isValidSave);
  } catch {
    return [];
  }
}

export function listNvlSaves(): NvlSaveRecordV1[] {
  return readSaves().sort((left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt));
}

export function getNvlSave(saveId: string): NvlSaveRecordV1 | null {
  return listNvlSaves().find((save) => save.id === saveId) ?? null;
}

export function saveNvlProgress(input: SaveNvlProgressInput): NvlSaveRecordV1 {
  const savedAt = new Date().toISOString();
  const save: NvlSaveRecordV1 = {
    ...input,
    schema: NVL_SAVE_SCHEMA,
    id: `nvl-${input.chapterId}`,
    savedAt,
  };

  if (!isValidSave(save)) throw new Error("NVL 存档数据无效");

  const next = readSaves().filter((item) => item.chapterId !== save.chapterId);
  next.unshift(save);
  localStorage.setItem(NVL_SAVE_STORAGE_KEY, JSON.stringify(next.slice(0, MAX_NVL_SAVES)));
  writeNvlContinue(save.id, save.savedAt);
  window.dispatchEvent(new CustomEvent(NVL_SAVE_CHANGE_EVENT, { detail: { save } }));
  return save;
}
