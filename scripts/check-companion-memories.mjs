import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import ts from "typescript";
import {
  COMPANIONS,
  COMPANION_MEMORIES,
  companionMemorySourceUrl,
  createCompanionMemoryMarkdown,
  getCompanionCopy,
  getCompanionMemoryCopy,
  resolveCompanionMemory,
} from "../src/data/companion-memories.ts";

const root = new URL("../", import.meta.url);
const publishedModuleUrl = new URL("src/data/nvl-chapters.ts", root);
const publishedSource = await readFile(publishedModuleUrl, "utf8");
const helperSource = await readFile(new URL("src/data/companion-memories.ts", root), "utf8");
assert.doesNotMatch(helperSource, /\bimport\b[\s\S]*?from\s*["'][^"']*content-drafts/u,
  "Companion helpers must consume the runtime map, never import draft files");

// Load only JSON explicitly imported by the public runtime module. This checks
// current published content without scanning or loading the draft directory.
let executable = ts.transpileModule(publishedSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
}).outputText;
const jsonImports = [...executable.matchAll(/import (\w+) from ["']([^"']+\.json)["'];/gu)];
assert.ok(jsonImports.length > 0, "The runtime publication module must declare its sources");
for (const [statement, binding, relative] of jsonImports) {
  assert.match(relative, /\/2026-(04|06)\.(zh-CN|ja-JP|en-US)\.json$/u,
    "Only the currently published April and June sources may be loaded");
  const json = JSON.parse(await readFile(new URL(relative, publishedModuleUrl), "utf8"));
  executable = executable.replace(statement, `const ${binding} = ${JSON.stringify(json)};`);
}
assert.doesNotMatch(executable, /^import\s/gmu, "Unexpected runtime dependency: update the bounded source loader");
const { NVL_CHAPTERS_BY_LANGUAGE: runtime } = await import(`data:text/javascript;base64,${Buffer.from(executable).toString("base64")}`);
const languages = ["ZH-CN", "JA-JP", "EN-US"];
for (const language of languages) {
  assert.deepEqual(Object.keys(runtime[language]).sort(), ["2026-04", "2026-06"]);
}

for (const companion of COMPANIONS) {
  await access(new URL(`public${companion.art}`, root));
  for (const language of languages) assert.ok(getCompanionCopy(companion.id, language).name);
}
assert.deepEqual(COMPANIONS.find((companion) => companion.id === "alice").memoryIds, [],
  "A public character profile does not authorize an unpublished diary");

for (const memory of COMPANION_MEMORIES) {
  for (const language of languages) {
    const resolved = resolveCompanionMemory(memory.id, runtime, language);
    assert.ok(resolved, `${memory.id} must resolve in ${language}`);
    assert.equal(resolved.sourceKind, "literary-diary");
    assert.equal(resolved.resolvedLanguage, language);
    assert.equal(resolved.title, getCompanionMemoryCopy(memory.id, language).title);
    for (const excerpt of resolved.excerpts) {
      const sourcePage = runtime[language][memory.monthId].scenario[excerpt.stepIndex];
      assert.equal(sourcePage.pageId, excerpt.pageId);
      assert.deepEqual(excerpt.texts, excerpt.lineIndices.map((index) => sourcePage.lines[index].text),
        "Every excerpt must remain an exact quote from its authored source");
      assert.equal(excerpt.lineIndex, Math.max(...excerpt.lineIndices), "Navigation targets are zero-based authored indices");
    }
  }
}

for (const invalidId of ["", "anna-origin ", "__proto__", "constructor", "alice-diary", "2026-08", null, {}, 1]) {
  assert.equal(resolveCompanionMemory(invalidId, runtime), null, "Unknown IDs must not fall through to a story");
}
for (const invalidData of [null, [], "{}", {}, Object.create(runtime)]) {
  assert.equal(resolveCompanionMemory("anna-origin", invalidData), null);
}
assert.equal(resolveCompanionMemory("anna-origin", runtime, "en_us").resolvedLanguage, "EN-US");
assert.equal(resolveCompanionMemory("anna-origin", runtime, "unknown").resolvedLanguage, "ZH-CN");
const chineseOnly = { "ZH-CN": runtime["ZH-CN"] };
assert.equal(resolveCompanionMemory("anna-origin", chineseOnly, "JA-JP").resolvedLanguage, "ZH-CN");

function mutatedApril(mutate) {
  const copy = structuredClone(runtime);
  const chapter = copy["ZH-CN"]["2026-04"];
  const page = chapter.scenario.find((step) => step.pageId === "ch1_self_p04");
  mutate(chapter, page);
  return copy;
}
const invalidAnchors = [
  mutatedApril((chapter) => { chapter.id = "another-chapter"; }),
  mutatedApril((chapter) => { chapter.monthId = "2026-08"; }),
  mutatedApril((chapter) => { chapter.companion = "alice"; }),
  mutatedApril((_chapter, page) => { page.pageId = "missing-page"; }),
  mutatedApril((chapter, page) => { chapter.scenario.push(structuredClone(page)); }),
  mutatedApril((_chapter, page) => { page.lines = page.lines.slice(0, 4); }),
  mutatedApril((_chapter, page) => { page.lines[3].text = ""; }),
  mutatedApril((_chapter, page) => { page.lines[3].text = "bad\u0000text"; }),
  mutatedApril((_chapter, page) => { page.lines[3].text = "x".repeat(4001); }),
  mutatedApril((chapter) => {
    const index = chapter.scenario.findIndex((step) => step.pageId === "ch1_self_p04");
    chapter.scenario.splice(index, 0, { type: "scene_init", pov: "anna" });
  }),
];
for (const invalid of invalidAnchors) assert.equal(resolveCompanionMemory("anna-origin", invalid), null,
  "Broken or ambiguous provenance must suppress the excerpt");

const brokenTranslation = structuredClone(runtime);
delete brokenTranslation["JA-JP"]["2026-04"];
assert.equal(resolveCompanionMemory("anna-origin", brokenTranslation, "JA-JP").resolvedLanguage, "ZH-CN");
const injected = structuredClone(runtime);
injected["ZH-CN"]["2026-08"] = { title: "UNPUBLISHED_SENTINEL", scenario: [{ text: "UNPUBLISHED_SENTINEL" }] };
const anna = resolveCompanionMemory("anna-origin", injected, "ZH-CN");
const markdown = createCompanionMemoryMarkdown(anna, {
  siteUrl: "https://asashiki.com/old-path?obsolete=yes#old",
  userNote: "我的笔记\u0000\n<script>alert(1)</script>\n# Not a heading",
});
assert.match(markdown, /文学化日记剧本节选/u);
assert.match(markdown, /非原始聊天记录/u);
assert.match(markdown, /ch1_self_p04/u);
assert.match(markdown, /行 4, 6/u);
assert.match(markdown, /中间原文略/u, "Non-consecutive lines must not pretend to be consecutive");
assert.match(markdown, /使用者补充（并非原文）/u);
assert.match(markdown, /&lt;script&gt;/u);
assert.match(markdown, /> \\# Not a heading/u);
assert.doesNotMatch(markdown, /\u0000|UNPUBLISHED_SENTINEL|2026-08|<script>|obsolete|old-path/u);
for (const text of anna.excerpts[0].texts) assert.ok(markdown.includes(text), "Export retains the selected original text");
const source = new URL(companionMemorySourceUrl("anna-origin", "https://asashiki.com"));
assert.equal(source.origin, "https://asashiki.com");
assert.equal(source.pathname, "/");
assert.equal(source.searchParams.get("screen"), "extra");
assert.equal(source.searchParams.get("extraMode"), "character");
assert.equal(source.searchParams.get("memory"), "anna-origin");
for (const invalidUrl of ["javascript:alert(1)", "data:text/html,bad", "https://name:password@example.com", "not a URL"]) {
  assert.throws(() => companionMemorySourceUrl("anna-origin", invalidUrl));
}
assert.throws(() => companionMemorySourceUrl("unknown", "https://asashiki.com"));
const bounded = createCompanionMemoryMarkdown(anna, { siteUrl: "https://asashiki.com", userNote: "界".repeat(2500) });
assert.equal((bounded.split("## 使用者补充（并非原文）")[1].match(/界/gu) || []).length, 2000,
  "User note is capped at 2000 code points");
const noNote = createCompanionMemoryMarkdown(anna, { siteUrl: "https://asashiki.com", userNote: { text: "not a note" } });
assert.doesNotMatch(noNote, /使用者补充/u);
const english = createCompanionMemoryMarkdown(resolveCompanionMemory("claude-presentation", runtime, "EN-US"), { siteUrl: "https://asashiki.com" });
assert.match(english, /not original chat logs/u);
assert.match(english, /ch2_self_p03/u);

console.log("Companion memories: published-source integrity, all locales, anchor validation, privacy boundary, assets, source URLs and contextual export passed.");
