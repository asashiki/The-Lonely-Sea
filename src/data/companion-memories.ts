/**
 * Editorial pointers into the chapters already published by the NVL reader.
 * Never import a draft here: callers supply the reader's public runtime data.
 */
export type CompanionLanguage = "ZH-CN" | "JA-JP" | "EN-US";
export type CompanionId = "anna" | "claude" | "alice";
type Localized<T> = Record<CompanionLanguage, T>;

export interface CompanionCopy {
  name: string;
  role: string;
  description: string;
}

export interface Companion {
  id: CompanionId;
  art: string;
  memoryIds: readonly string[];
  copy: Localized<CompanionCopy>;
}

export interface CompanionMemoryCopy {
  title: string;
  detail: string;
}

interface MemoryAnchor {
  pageId: string;
  lineIndices: readonly number[];
  voice: "self" | "companion";
}

export interface CompanionMemory {
  id: string;
  companionId: CompanionId;
  monthId: string;
  chapterId: string;
  anchors: readonly MemoryAnchor[];
  copy: Localized<CompanionMemoryCopy>;
}

export const COMPANIONS: readonly Companion[] = [
  {
    id: "anna",
    art: "/assets/nvl/2026-04/staging-v2/calm.png",
    memoryIds: ["anna-origin"],
    copy: {
      "ZH-CN": { name: "安娜", role: "虚拟侦探事务所", description: "四月的日记里，侦探事务所从终端中的一个想法开始。" },
      "JA-JP": { name: "アンナ", role: "バーチャル探偵事務所", description: "四月の日記。探偵事務所は、ターミナルに浮かんだ一つのアイデアから始まる。" },
      "EN-US": { name: "Anna", role: "Virtual Detective Agency", description: "In the April diary, the detective agency begins with an idea at a terminal." },
    },
  },
  {
    id: "claude",
    art: "/assets/nvl/2026-06/claude-v1/listen.webp",
    memoryIds: ["claude-presentation"],
    copy: {
      "ZH-CN": { name: "Claude", role: "六月的同行者", description: "六月的日记保留了一次协作：一份带上答辩讲台的演示文稿。" },
      "JA-JP": { name: "Claude", role: "六月の伴走者", description: "六月の日記に残る共同作業。卒業研究の発表で使われた、一つのプレゼンテーション。" },
      "EN-US": { name: "Claude", role: "A companion in June", description: "The June diary records a collaboration: a presentation brought to a thesis defense." },
    },
  },
  {
    id: "alice",
    art: "/assets/lonely-sea/characters/alice/idle.png",
    memoryIds: [],
    copy: {
      "ZH-CN": { name: "爱丽丝", role: "灯塔向导", description: "驻守在孤独之海的灯塔里，负责把来访者带往文章、记录与故事的入口。" },
      "JA-JP": { name: "アリス", role: "灯台の案内役", description: "孤独の海の灯台に暮らし、訪れた人を文章や記録、物語の入口へ案内している。" },
      "EN-US": { name: "Alice", role: "Lighthouse Guide", description: "She watches over the lighthouse and guides visitors to essays, records, and stories across the Lonely Sea." },
    },
  },
];

export const COMPANION_MEMORIES: readonly CompanionMemory[] = [
  {
    id: "anna-origin",
    companionId: "anna",
    monthId: "2026-04",
    chapterId: "ch1",
    anchors: [{ pageId: "ch1_self_p04", lineIndices: [3, 5], voice: "self" }],
    copy: {
      "ZH-CN": { title: "亲手搭起一个世界", detail: "从终端开始的想法" },
      "JA-JP": { title: "自分の手で世界を組み立てる", detail: "ターミナルから始まったアイデア" },
      "EN-US": { title: "A world built by hand", detail: "An idea that began at a terminal" },
    },
  },
  {
    id: "claude-presentation",
    companionId: "claude",
    monthId: "2026-06",
    chapterId: "ch2",
    anchors: [{ pageId: "ch2_self_p03", lineIndices: [5, 6], voice: "self" }],
    copy: {
      "ZH-CN": { title: "一起完成的那份演示", detail: "答辩前的一次协作" },
      "JA-JP": { title: "一緒に仕上げたプレゼンテーション", detail: "卒業研究の発表を前にした共同作業" },
      "EN-US": { title: "The presentation we made together", detail: "A collaboration before the defense" },
    },
  },
];

export function normalizeCompanionLanguage(language: unknown): CompanionLanguage {
  const normalized = typeof language === "string" ? language.trim().replaceAll("_", "-").toUpperCase() : "";
  return normalized === "JA-JP" || normalized === "EN-US" ? normalized : "ZH-CN";
}

export function getCompanionCopy(companion: Companion | CompanionId, language: unknown): CompanionCopy {
  const item = typeof companion === "string" ? COMPANIONS.find((entry) => entry.id === companion) : companion;
  if (!item) throw new TypeError("Unknown companion");
  return item.copy[normalizeCompanionLanguage(language)];
}

export function getCompanionMemoryCopy(memory: CompanionMemory | string, language: unknown): CompanionMemoryCopy {
  const item = typeof memory === "string" ? COMPANION_MEMORIES.find((entry) => entry.id === memory) : memory;
  if (!item) throw new TypeError("Unknown companion memory");
  return item.copy[normalizeCompanionLanguage(language)];
}

export interface ResolvedCompanionExcerpt {
  pageId: string;
  lineIndices: number[];
  texts: string[];
  text: string;
  voice: "self" | "companion";
  stepIndex: number;
  /** Zero-based authored target; the reader converts this to a visible count. */
  lineIndex: number;
}

export interface ResolvedCompanionMemory extends CompanionMemoryCopy {
  id: string;
  companionId: CompanionId;
  monthId: string;
  chapterId: string;
  chapterTitle: string;
  resolvedLanguage: CompanionLanguage;
  excerpts: ResolvedCompanionExcerpt[];
  sourceKind: "literary-diary";
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function own(value: unknown, key: string): unknown {
  return record(value) && Object.hasOwn(value, key) ? value[key] : undefined;
}

function validSourceText(value: unknown, limit = 4000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= limit
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
}

function resolveInLanguage(memory: CompanionMemory, runtimeChapters: unknown, language: CompanionLanguage): ResolvedCompanionMemory | null {
  const chapter = own(own(runtimeChapters, language), memory.monthId);
  if (!record(chapter) || chapter.id !== memory.chapterId || chapter.monthId !== memory.monthId
    || chapter.companion !== memory.companionId || !Array.isArray(chapter.scenario)
    || chapter.scenario.length > 1000) return null;

  const scenario = chapter.scenario;
  const excerpts: ResolvedCompanionExcerpt[] = [];
  for (const anchor of memory.anchors) {
    const matches = scenario.flatMap((step, index) => record(step) && step.type === "page" && step.pageId === anchor.pageId ? [index] : []);
    if (matches.length !== 1) return null;
    const stepIndex = matches[0]!;
    const page = scenario[stepIndex] as Record<string, unknown>;
    if (!Array.isArray(page.lines)) return null;
    const scene = scenario.slice(0, stepIndex).findLast((step) => record(step) && step.type === "scene_init");
    if (!record(scene) || scene.pov !== (anchor.voice === "self" ? "self" : memory.companionId)) return null;
    const texts: string[] = [];
    for (const lineIndex of anchor.lineIndices) {
      if (!Number.isInteger(lineIndex) || lineIndex < 0) return null;
      const line = page.lines[lineIndex];
      if (!record(line) || !validSourceText(line.text)) return null;
      texts.push(line.text);
    }
    if (!texts.length) return null;
    excerpts.push({
      pageId: anchor.pageId,
      lineIndices: [...anchor.lineIndices],
      texts,
      text: texts.join("\n\n"),
      voice: anchor.voice,
      stepIndex,
      lineIndex: Math.max(...anchor.lineIndices),
    });
  }
  return {
    id: memory.id,
    companionId: memory.companionId,
    monthId: memory.monthId,
    chapterId: memory.chapterId,
    chapterTitle: validSourceText(chapter.title, 240) ? chapter.title : memory.copy[language].title,
    ...memory.copy[language],
    resolvedLanguage: language,
    excerpts,
    sourceKind: "literary-diary",
  };
}

/** Unknown/unpublished IDs and incomplete sources have no invented substitute. */
export function resolveCompanionMemory(memoryId: unknown, runtimeChapters: unknown, language: unknown = "ZH-CN"): ResolvedCompanionMemory | null {
  if (typeof memoryId !== "string") return null;
  const memory = COMPANION_MEMORIES.find((entry) => entry.id === memoryId);
  if (!memory) return null;
  const preferred = normalizeCompanionLanguage(language);
  return resolveInLanguage(memory, runtimeChapters, preferred)
    ?? (preferred !== "ZH-CN" ? resolveInLanguage(memory, runtimeChapters, "ZH-CN") : null);
}

export function companionMemorySourceUrl(memoryId: string, siteUrl: string): string {
  if (!COMPANION_MEMORIES.some((memory) => memory.id === memoryId)) throw new TypeError("Unknown companion memory");
  const canonical = new URL(siteUrl);
  if (!["https:", "http:"].includes(canonical.protocol) || canonical.username || canonical.password) throw new TypeError("Invalid canonical site URL");
  const source = new URL("/", canonical);
  source.searchParams.set("screen", "extra");
  source.searchParams.set("extraMode", "character");
  source.searchParams.set("memory", memoryId);
  return source.href;
}

function markdownText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replace(/[\\`*_{}\[\]()#+!|]/gu, "\\$&");
}

function plainUserNote(value: unknown): string {
  if (typeof value !== "string") return "";
  return Array.from(value.replace(/\r\n?/gu, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/gu, ""))
    .slice(0, 2000).join("").trim();
}

const EXPORT_COPY = {
  "ZH-CN": { companion: "同行者", chapter: "来源章节", kind: "来源：已公开的文学化日记剧本节选，非原始聊天记录。", author: "作者视角", response: "同行者视角", position: "原文位置", lines: "行", source: "打开出处", note: "使用者补充（并非原文）", omission: "〔中间原文略〕" },
  "JA-JP": { companion: "伴走者", chapter: "出典の章", kind: "出典：公開済みの日記脚本の抜粋。文学的な表現を含み、元のチャット記録ではありません。", author: "作者の視点", response: "伴走者の視点", position: "原文の位置", lines: "行", source: "出典を開く", note: "利用者の追記（原文ではありません）", omission: "〔中略〕" },
  "EN-US": { companion: "Companion", chapter: "Source chapter", kind: "Source: excerpts from a published literary diary script, not original chat logs.", author: "Author's viewpoint", response: "Companion's viewpoint", position: "Source position", lines: "lines", source: "Open source", note: "User note (not part of the original)", omission: "[Intervening text omitted]" },
} satisfies Localized<Record<string, string>>;

export function createCompanionMemoryMarkdown(memory: ResolvedCompanionMemory, options: { siteUrl: string; userNote?: unknown }): string {
  const source = companionMemorySourceUrl(memory.id, options.siteUrl);
  const copy = EXPORT_COPY[memory.resolvedLanguage];
  const companion = getCompanionCopy(memory.companionId, memory.resolvedLanguage);
  const lines = [
    `# ${markdownText(memory.title)}`,
    "",
    `${copy.companion}: ${markdownText(companion.name)}`,
    `${copy.chapter}: ${markdownText(memory.chapterTitle)} (${memory.monthId})`,
    "",
    copy.kind,
    "",
  ];
  for (const excerpt of memory.excerpts) {
    lines.push(`## ${excerpt.voice === "self" ? copy.author : copy.response}`, "");
    excerpt.texts.forEach((text, index) => {
      if (index > 0 && excerpt.lineIndices[index]! > excerpt.lineIndices[index - 1]! + 1) lines.push(`> ${copy.omission}`, ">");
      lines.push(...markdownText(text).split("\n").map((line) => `> ${line}`), ">");
    });
    lines.push(`${copy.position}: \`${excerpt.pageId}\`, ${copy.lines} ${excerpt.lineIndices.map((index) => index + 1).join(", ")}`, "");
  }
  lines.push(`[${copy.source}](${source})`);
  const note = plainUserNote(options.userNote);
  if (note) lines.push("", `## ${copy.note}`, "", ...markdownText(note).split("\n").map((line) => `> ${line}`));
  return `${lines.join("\n")}\n`;
}
