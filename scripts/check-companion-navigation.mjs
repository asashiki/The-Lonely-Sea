import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { JSDOM } from "jsdom";

// DOM regression for the real reader, save store, and shell event handlers.
// Rendering/audio are stubbed; this is not a visual browser acceptance test.
const baseUrl = process.env.COMPANION_TEST_URL || "http://127.0.0.1:4323/";
const response = await fetch(baseUrl);
assert.ok(response.ok, `Preview unavailable: ${response.status} ${baseUrl}`);
// jsdom cannot parse several modern CSS rules; layout is outside this test.
const markup = (await response.text()).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
const read = (path) => readFileSync(path, "utf8");
const compile = (path) => ts.transpileModule(read(path), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace(/import[\s\S]*?from\s+["'][^"']+["'];?/g, "").replace(/\bexport\s+/g, "");
const shell = ts.createSourceFile("experience.js", read("src/scripts/experience.js"), ts.ScriptTarget.Latest, true);
const eventNames = new Set(["lonely-sea:nvl-system", "lonely-sea:nvl-system-return", "lonely-sea:nvl-playing"]);
const shellHandlers = shell.statements.filter((statement) => {
  if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) return false;
  const call = statement.expression;
  return call.expression.getText(shell) === "window.addEventListener"
    && ts.isStringLiteral(call.arguments[0]) && eventNames.has(call.arguments[0].text);
});
assert.equal(shellHandlers.length, 3, "test must exercise all NVL shell event handlers");

function setup(language = "ZH-CN") {
  const dom = new JSDOM(markup, { url: baseUrl, runScripts: "outside-only" });
  const w = dom.window;
  w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  w.requestAnimationFrame = (callback) => w.setTimeout(callback, 0);
  w.cancelAnimationFrame = (timer) => w.clearTimeout(timer);
  w.Audio = class {
    constructor(src) { this.src = src; }
    getAttribute(name) { return name === "src" ? this.src : null; }
    play() { return Promise.resolve(); }
    pause() {}
  };
  w.__language = language;
  w.__events = [];
  w.__operations = [];
  w.__option = null;
  w.__loadPage = null;
  w.document.body.dataset.route = "extra";
  const trigger = w.document.createElement("button");
  trigger.id = "navigation-test-memory";
  trigger.textContent = "Read authored memory";
  w.document.querySelector(".stage").append(trigger);
  trigger.focus();
  w.eval(`
    function readPreferences() { return { language: window.__language, reducedMotion: true, autoSpeed: 5 }; }
    function effectiveAudioVolume() { return 0; }
    function createAprilArt() { return () => {}; }
    function createJuneArt() { return () => {}; }
    function aprilTextBeat() { return false; }
    window.writeNvlContinue = (() => { ${compile("src/lib/experience-continue.ts")} return writeNvlContinue; })();
    window.saveNvlProgress = (() => { ${compile("src/lib/nvl/save-store.ts")} return saveNvlProgress; })();
    const loadScreen = {
      setSaveOperation(...args) { window.__operations.push(args); },
      showPage(value) { window.__loadPage = value; },
    };
    const extraScreen = { restoreCharacterFocus() { document.getElementById("navigation-test-memory").focus(); } };
    const optionScreen = { activate(value) { window.__option = value; } };
    const experienceAudio = { setTitleActive() {} };
    const gameShell = { hidden: true };
    let nvlActive = false;
    function navigateTo(route) { document.body.dataset.route = route; }
    ${shellHandlers.map((statement) => statement.getText(shell)).join("\n")}
    ${compile("src/scripts/experience/nvl-engine.js")}
    initNvlEngine();
  `);
  for (const name of eventNames) w.addEventListener(name, (event) => {
    w.__events.push({ name, detail: JSON.parse(JSON.stringify(event.detail || {})) });
  });
  const chapters = JSON.parse(w.document.getElementById("nvl-chapters-data").textContent)[language];
  const q = (selector) => w.document.querySelector(selector);
  const dispatch = (detail) => w.dispatchEvent(new w.CustomEvent("lonely-sea:open-nvl", { detail }));
  const close = () => q("#nvl-btn-close").click();
  const modalOpen = () => q("#nvl-theater-modal").getAttribute("aria-hidden") === "false";
  const waitForPage = async () => {
    for (let i = 0; i < 100 && q("#nvl-theater-modal").dataset.nvlTransition !== "false"; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(q("#nvl-theater-modal").dataset.nvlTransition, "false", "reader reached an authored page");
  };
  const storage = () => JSON.stringify(Object.entries(w.localStorage).sort(([a], [b]) => a.localeCompare(b)));
  return { w, q, chapters, dispatch, close, modalOpen, waitForPage, storage, destroy: () => w.close() };
}

const saveKey = "lonely-sea:nvl-saves:v1";
for (const language of ["ZH-CN", "JA-JP", "EN-US"]) {
  const t = setup(language);
  try {
    const chapter = t.chapters["2026-04"];
    const authored = chapter.scenario.find((step) => step.type === "page" && step.lines.length > 1);
    const stepIndex = chapter.scenario.indexOf(authored);
    const target = { monthId: chapter.monthId, pageId: authored.pageId, lineIndex: 1, returnTo: "character" };
    const existingSave = {
      slot: 3, chapterId: chapter.id, monthId: chapter.monthId, title: chapter.subtitle || chapter.title,
      chapterTitle: chapter.title, coverArt: chapter.coverArt, stepIndex, lineIndex: 1,
      pageId: authored.pageId, pageNumber: 1, totalPages: 10, povName: "Existing reader", timestamp: "2026-04",
    };
    t.w.saveNvlProgress(existingSave);
    const before = t.storage();
    for (const invalid of [
      { ...target, monthId: "unknown" },
      { ...target, monthId: "2026-08" },
      { ...target, monthId: "constructor" },
      { ...target, pageId: "unknown-page" },
      { ...target, pageId: undefined },
      ...[-1, 0.5, null, "1", authored.lines.length].map((lineIndex) => ({ ...target, lineIndex })),
    ]) {
      t.dispatch(invalid);
      assert.equal(t.modalOpen(), false, "invalid/unpublished anchor must not open reader");
      assert.equal(t.w.document.body.dataset.route, "extra");
      assert.equal(t.w.__events.length, 0, "invalid anchor emits no route or playing intent");
      assert.equal(t.storage(), before, "invalid anchor does not write progress");
    }

    t.dispatch(target);
    await t.waitForPage();
    assert.equal(t.q("#nvl-text-flow .nvl-line:last-child").textContent, authored.lines[1].text);
    assert.equal(t.q("#nvl-progress [aria-current=step]").title, authored.pageId);
    assert.equal(t.storage(), before, "public anchor never overwrites a save or Continue");
    const textBeforeInvalid = t.q("#nvl-text-flow").textContent;
    t.dispatch({ ...target, monthId: "2026-08" });
    assert.equal(t.q("#nvl-text-flow").textContent, textBeforeInvalid, "invalid opening preserves active reader");
    t.close();
    assert.equal(t.w.document.body.dataset.route, "extra", "CHARACTER opening returns to EXTRA");
    assert.equal(t.w.document.activeElement.id, "navigation-test-memory", "memory focus restored");
    assert.equal(t.w.__events.at(-1).detail.returnTo, "character");
    assert.equal(t.storage(), before);

    // Suspending into either system page resumes the same memory and return target.
    for (const system of ["option", "load", "save"]) {
      t.dispatch(target);
      await t.waitForPage();
      t.q(`#nvl-btn-${system}`).click();
      assert.equal(t.modalOpen(), false);
      assert.equal(t.w.document.body.dataset.route, system === "option" ? "option" : "load");
      if (system === "option") assert.equal(t.w.__option.panel, "text");
      if (system === "save") {
        t.w.dispatchEvent(new t.w.CustomEvent("lonely-sea:nvl-save-slot", { detail: { slot: 4 } }));
        const saved = JSON.parse(t.w.localStorage.getItem(saveKey));
        assert.equal(saved.find((entry) => entry.slot === 4).lineIndex, 2, "explicit SAVE keeps normal cursor semantics");
        assert.ok(saved.find((entry) => entry.slot === 3), "another slot is preserved");
      } else {
        t.w.dispatchEvent(new t.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      }
      assert.equal(t.modalOpen(), true, "system back resumes reader");
      assert.equal(t.w.document.body.dataset.route, "extra", "memory is again the underlying page");
      assert.equal(t.q("#nvl-text-flow .nvl-line:last-child").textContent, authored.lines[1].text);
      t.close();
      assert.equal(t.w.document.body.dataset.route, "extra");
      assert.equal(t.w.document.activeElement.id, "navigation-test-memory");
    }

    // Loading an existing save is independent of the previous memory session.
    const saved = JSON.parse(t.w.localStorage.getItem(saveKey)).find((entry) => entry.slot === 3);
    const beforeSavedReading = t.storage();
    t.dispatch({ monthId: chapter.monthId, resume: saved });
    await t.waitForPage();
    assert.equal(t.q("#nvl-text-flow .nvl-line:last-child").textContent, authored.lines[0].text);
    t.q("#nvl-btn-option").click();
    t.w.dispatchEvent(new t.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    assert.equal(t.w.document.body.dataset.route, "load", "ordinary system return remains LOAD");
    t.close();
    assert.equal(t.w.document.body.dataset.route, "load", "ordinary NVL returns to LOAD");
    assert.equal(t.w.__loadPage, "diary");
    assert.equal(t.w.__events.at(-1).detail.returnTo, undefined, "CHARACTER return is not sticky");
    assert.equal(t.storage(), beforeSavedReading);
  } finally {
    t.destroy();
  }
}

console.log("Companion navigation passed: 3 languages; invalid/private anchors, exact lines, preserved saves/focus, OPTION/LOAD/SAVE return, normal diary return.");
