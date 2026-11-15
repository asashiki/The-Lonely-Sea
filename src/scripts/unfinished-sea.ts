type ThoughtPage = { id: string; text: string; at: string; kind: "first" | "later" | "turn" };
type Letter = { id: string; title: string; at: string; pages: ThoughtPage[]; x: number; y: number };
type Thread = { id: string; from: string; to: string; text: string; at: string };
type Draft = { parent: string; kind: ThoughtPage["kind"]; title: string; text: string };
type Sea = { version: 1; letters: Letter[]; threads: Thread[]; draft: Draft | null };

const KEY = "lonely-sea-unfinished-v1";
const map = document.querySelector<HTMLElement>("#sea-map")!;
const lettersElement = document.querySelector<HTMLElement>("#sea-letters")!;
const routesElement = document.querySelector<SVGSVGElement>("#sea-routes")!;
const emptyElement = document.querySelector<HTMLElement>("#sea-empty")!;
const status = document.querySelector<HTMLElement>("#sea-status")!;
const dialog = document.querySelector<HTMLDialogElement>("#sea-letter")!;
const content = document.querySelector<HTMLElement>("#sea-letter-content")!;
const importInput = document.querySelector<HTMLInputElement>("#sea-import-file")!;
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const escape = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const date = (value: string) => new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
const validDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const short = (value: string, limit = 32) => Array.from(value).slice(0, limit).join("");
const getLetter = (id: string) => sea.letters.find((item) => item.id === id);
const label = (kind: ThoughtPage["kind"]) => kind === "turn" ? "这次，我改变了主意" : kind === "later" ? "后来，我又想到" : "最初的念头";
const sample: Letter = {
  id: "example", title: "那些还没长大的念头，要放在哪里？", at: "", x: 50, y: 50,
  pages: [
    { id: "example-1", at: "", kind: "first", text: "如果一个博客也能保存那些还没有答案的问题，会是什么样子？\n\n先让一个念头有地方停靠。它可以只有半句话，也可以暂时没有标题。" },
    { id: "example-2", at: "", kind: "later", text: "后来想到：续写不必覆盖以前写下的东西。\n\n让新的一页留在旧的一页之后，就能看见这个想法是怎样慢慢长出来的。" },
    { id: "example-3", at: "", kind: "turn", text: "也可以说：这次，我反而不同意以前的自己。\n\n不急着删掉旧答案。把改变也留下来。" },
  ],
};

function parseSea(value: unknown): Sea {
  if (!value || typeof value !== "object" || (value as Sea).version !== 1 || !Array.isArray((value as Sea).letters)) throw new Error("这不是未竟之海的存档。");
  const data = value as Sea;
  const ids = new Set<string>();
  const letters: Letter[] = [];
  for (const item of data.letters.slice(0, 300)) {
    if (!item || typeof item.id !== "string" || item.id.length > 100 || ids.has(item.id) || !validDate(item.at) || !Array.isArray(item.pages)) continue;
    const pageIds = new Set<string>();
    const pages = item.pages.slice(0, 100).flatMap((page) => {
      if (!page || typeof page.id !== "string" || pageIds.has(page.id) || typeof page.text !== "string" || !page.text.trim() || !validDate(page.at)) return [];
      pageIds.add(page.id);
      return [{ id: page.id.slice(0, 100), text: page.text.slice(0, 16000), at: page.at, kind: (["first", "later", "turn"].includes(page.kind) ? page.kind : "later") as ThoughtPage["kind"] }];
    });
    if (!pages.length) continue;
    ids.add(item.id);
    letters.push({ id: item.id, title: typeof item.title === "string" ? short(item.title, 80) : short(pages[0].text), at: item.at, pages, x: Number.isFinite(item.x) ? Math.max(12, Math.min(88, item.x)) : 50, y: Number.isFinite(item.y) ? Math.max(12, Math.min(88, item.y)) : 50 });
  }
  const threads = (Array.isArray(data.threads) ? data.threads : []).slice(0, 1000).flatMap((thread) => {
    if (!thread || !ids.has(thread.from) || !ids.has(thread.to) || thread.from === thread.to || typeof thread.text !== "string" || !validDate(thread.at)) return [];
    return [{ id: typeof thread.id === "string" ? thread.id.slice(0, 100) : uid(), from: thread.from, to: thread.to, text: thread.text.slice(0, 1200), at: thread.at }];
  });
  const d = data.draft;
  const draft: Draft | null = d && typeof d.text === "string" && typeof d.title === "string" && (!d.parent || ids.has(d.parent))
    ? { parent: d.parent || "", title: d.title.slice(0, 80), text: d.text.slice(0, 16000), kind: d.kind === "turn" ? "turn" : d.parent ? "later" : "first" } : null;
  return { version: 1, letters, threads, draft };
}

let sea: Sea = { version: 1, letters: [], threads: [], draft: null };
let readableStorage = true;
try {
  const stored = localStorage.getItem(KEY);
  if (stored) sea = parseSea(JSON.parse(stored));
} catch {
  readableStorage = false;
  status.textContent = "这片海的本地存档暂时无法读取。原存档仍在；新的内容可以先下载带走。";
}
let active = "";
let pageIndex = 0;
let view = "read";
let exportIds: string[] = [];
let exportQuestion = "";
let connectionTarget = "";
let dragged = false;

function save(message = "已留在这片海里。") {
  const tell = (text: string) => { status.textContent = text; const feedback = content.querySelector<HTMLElement>("[data-draft-status]"); if (feedback) feedback.textContent = text; };
  if (!readableStorage) { tell("本地存档尚未恢复；这次的内容请先下载带走。"); return false; }
  try { localStorage.setItem(KEY, JSON.stringify(sea)); tell(message); return true; }
  catch { tell("浏览器没有保存成功，请用“带走整片海”下载这次的内容。"); return false; }
}

function path(from: Letter, to: Letter) {
  const bend = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${bend} ${from.y - 12}, ${bend} ${to.y + 12}, ${to.x} ${to.y}`;
}

function renderMap() {
  const count = sea.letters.length;
  map.style.minHeight = `${Math.max(580, Math.ceil(count / 6) * 280)}px`;
  emptyElement.hidden = count > 0;
  lettersElement.innerHTML = sea.letters.map((letter, index) => `<button type="button" class="sea-letter-btn" data-letter-id="${escape(letter.id)}" style="left:${letter.x}%;top:${letter.y}%" aria-pressed="${active === letter.id}" aria-label="打开：${escape(letter.title)}"><span class="sea-letter-index">${String(index + 1).padStart(2, "0")} / ${letter.pages.length > 1 ? "仍在生长" : "初念"}</span><strong>${escape(letter.title)}</strong><span class="sea-letter-date">${date(letter.at)}</span><span class="sea-letter-pages">${letter.pages.length > 1 ? `${letter.pages.length} 页 · 继续读` : "折起的一封信"}</span></button>`).join("");
  routesElement.setAttribute("viewBox", "0 0 100 100");
  routesElement.setAttribute("preserveAspectRatio", "none");
  routesElement.innerHTML = sea.threads.map((thread) => {
    const from = getLetter(thread.from); const to = getLetter(thread.to);
    return from && to ? `<path d="${path(from, to)}" fill="none" vector-effect="non-scaling-stroke" />` : "";
  }).join("");
  document.querySelectorAll<HTMLElement>("[data-sea-count]").forEach((node) => { node.textContent = `${count} 封信 · ${sea.threads.length} 条关联`; });
  const create = document.querySelector<HTMLElement>("[data-sea-new]");
  if (create) create.textContent = sea.draft ? "接着写草稿" : "写下一念";
}

const toolbar = (middle = "") => `<div class="letter-toolbar"><button type="button" data-letter-close>← 回到海面</button><span>${middle}</span><button type="button" data-letter-new>写下一念 ＋</button></div>`;
function reveal() { if (!dialog.open) dialog.showModal(); }

function reader(id: string, index = 0) {
  const letter = id === "example" ? sample : getLetter(id);
  if (!letter) return;
  active = id; view = "read"; pageIndex = Math.max(0, Math.min(index, letter.pages.length - 1));
  const page = letter.pages[pageIndex];
  const example = id === "example";
  const threads = sea.threads.filter((thread) => thread.from === id || thread.to === id);
  content.innerHTML = `${toolbar(example ? "使用示例 · 不会存进你的海" : "一封未完成的信")}
    <p class="letter-eyebrow">${escape(label(page.kind))} / ${String(pageIndex + 1).padStart(2, "0")}</p>
    <h2 class="letter-title">${escape(letter.title)}</h2>
    <p class="letter-date">${example ? "你可以跳过示例，直接写自己的第一封。" : date(page.at)}</p>
    <div class="letter-body">${escape(page.text)}</div>
    <nav class="letter-pagination" aria-label="信的页码"><button type="button" data-letter-prev ${pageIndex === 0 ? "disabled" : ""}>← 前一页</button><span>${pageIndex + 1} / ${letter.pages.length}</span><button type="button" data-letter-next ${pageIndex === letter.pages.length - 1 ? "disabled" : ""}>下一页 →</button></nav>
    ${threads.length ? `<section class="letter-connections"><p class="letter-eyebrow">它与这些念头相连</p>${threads.map((thread) => { const other = getLetter(thread.from === id ? thread.to : thread.from)!; return `<button class="letter-route-choice" type="button" data-letter-follow="${escape(other.id)}"><strong>${escape(other.title)} →</strong><span>${escape(thread.text || "一条由你牵起的关联")}</span></button>`; }).join("")}</section>` : ""}
    <div class="letter-actions">${example ? '<button type="button" class="is-primary" data-letter-new>写我自己的第一封</button>' : '<button type="button" class="is-primary" data-letter-continue>后来，我又想到</button><button type="button" data-letter-turn>我改变主意了</button><button type="button" data-letter-connect>它让我想到另一封</button><button type="button" data-letter-carry>带去下一次对话 ↗</button>'}</div>`;
  reveal(); dialog.scrollTop = 0; renderMap();
}

function compose(parent = "", kind: ThoughtPage["kind"] = "first") {
  if (sea.draft && !sea.draft.title.trim() && !sea.draft.text.trim()) sea.draft = null;
  if (!sea.draft) sea.draft = { parent, kind, title: "", text: "" };
  const draft = sea.draft;
  const letter = getLetter(draft.parent);
  view = "compose";
  content.innerHTML = `${toolbar("草稿 · 写下的内容会留在本机")}
    <p class="letter-eyebrow">${label(draft.kind)}</p><h2 class="letter-title">${letter ? escape(letter.title) : "还没想清楚，也可以写下来。"}</h2>
    <form class="letter-form" data-letter-form>
      ${letter ? "" : `<label class="letter-label" for="thought-title">给它一个名字 <small>可以留空，取第一句话</small></label><input class="letter-field" id="thought-title" name="title" maxlength="80" placeholder="这个念头还没有名字" value="${escape(draft.title)}">`}
      <label class="letter-label" for="thought-body">${draft.kind === "turn" ? "这次，哪里不一样了？" : letter ? "后来，你又想到了什么？" : "我一直想做，但还没想清楚的是……"}</label>
      <textarea class="letter-field" id="thought-body" name="text" rows="9" maxlength="16000" required placeholder="写半句话也可以。">${escape(draft.text)}</textarea>
      <p class="letter-caption">${letter ? "这一页会接在旧文字后面。以前的想法仍然保留。" : "无需分类，也不用决定什么时候完成。"}</p><p class="letter-caption" data-draft-status role="status"></p>
      <div class="letter-actions"><button class="is-primary" type="submit">折好，放回海面</button><button type="button" data-letter-close>先留着草稿</button></div>
    </form>`;
  reveal(); dialog.scrollTop = 0;
  content.querySelector<HTMLTextAreaElement>("#thought-body")?.focus({ preventScroll: true });
}

function connected(id: string) {
  const result: string[] = [];
  const queue = [id]; const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current) || !getLetter(current)) continue;
    visited.add(current); result.push(current);
    sea.threads.forEach((thread) => { if (thread.from === current) queue.push(thread.to); else if (thread.to === current) queue.push(thread.from); });
  }
  return result;
}

function markdown(ids: string[], question: string) {
  const quote = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").split("\n").map((line) => `> ${line}`).join("\n");
  const lines = ["# 未竟之海 · 给下一次对话", "", "以下是我尚未完成的想法。请保留其中的不确定和前后变化，不要把早期念头当作已确定的决定。", ""];
  ids.forEach((id, index) => {
    const letter = getLetter(id); if (!letter) return;
    lines.push(`## ${index + 1}. ${letter.title.replace(/[\r\n]/g, " ")}`, "");
    letter.pages.forEach((page) => lines.push(`### ${date(page.at)} · ${label(page.kind)}`, "", quote(page.text), ""));
  });
  const threads = sea.threads.filter((thread) => ids.includes(thread.from) && ids.includes(thread.to));
  if (threads.length) { lines.push("## 我写下的关联", ""); threads.forEach((thread) => lines.push(quote(`${getLetter(thread.from)?.title} → ${getLetter(thread.to)?.title}\n${thread.text || "尚未写下关联理由。"}`), "")); }
  lines.push("## 这次想请你一起推进的部分", "", quote(question.trim() || "请先帮我看见这些念头里值得继续追问的问题。不要急着替我写成一篇成品。"), "", "整理自《孤独之海》的未竟之海；内容由本浏览器中的使用者填写。", "");
  return lines.join("\n");
}

function carry(whole = false) {
  exportIds = whole ? connected(active) : [active];
  if (!exportIds.length || !getLetter(active)) return;
  view = "carry";
  content.innerHTML = `${toolbar("给下一次对话留一个开口")}
    <p class="letter-eyebrow">${exportIds.length > 1 ? "带走一条思路" : "带走这一封"}</p><h2 class="letter-title">下一步，一起想什么？</h2>
    <p class="letter-caption">${exportIds.map((id) => escape(getLetter(id)!.title)).join(" / ")}</p>
    <label class="letter-label" for="sea-question">这次想请 AI 帮我推进哪一步</label><textarea id="sea-question" class="letter-field" rows="3" maxlength="2000" placeholder="例如：找出这些想法之间的冲突，问我三个值得回答的问题。">${escape(exportQuestion)}</textarea>
    <details class="letter-export-preview" open><summary>将带走的全文 · 原文、续写和关联</summary><textarea class="letter-field" data-context-preview readonly rows="10" aria-label="待复制的上下文">${escape(markdown(exportIds, exportQuestion))}</textarea></details>
    <div class="letter-actions"><button type="button" class="is-primary" data-context-copy>复制给下一次对话</button><button type="button" data-context-download>下载 Markdown ↓</button>${!whole && connected(active).length > 1 ? '<button type="button" data-context-whole>把相连的念头一起带走</button>' : ""}<button type="button" data-letter-read>回到这封信</button></div>
    <p class="letter-caption" data-context-status role="status">可以交给 AI，也可以导入 Notion。示例不会混进来。</p>`;
  reveal(); dialog.scrollTop = 0;
}

function connect() {
  if (!getLetter(active)) return;
  view = "connect"; connectionTarget = "";
  const choices = sea.letters.filter((item) => item.id !== active);
  content.innerHTML = `${toolbar("用你自己的理由，牵起两个念头")}
    <p class="letter-eyebrow">${escape(getLetter(active)!.title)}</p><h2 class="letter-title">它让我想到另一封。</h2>
    ${choices.length ? `<form data-connection-form class="letter-form"><fieldset class="letter-route-picker"><legend>选一封想连起来的信</legend>${choices.map((item) => `<label class="letter-route-choice"><input type="radio" name="destination" value="${escape(item.id)}" required><span><strong>${escape(item.title)}</strong><small>${date(item.at)} · ${item.pages.length} 页</small></span></label>`).join("")}</fieldset><label class="letter-label" for="sea-connection">是什么把它们连起来？</label><textarea class="letter-field" id="sea-connection" name="reason" rows="3" maxlength="1200" placeholder="一个共同的问题，或者完全相反的答案……"></textarea><div class="letter-actions"><button class="is-primary" type="submit">牵起这条航线</button><button type="button" data-letter-read>回到这封信</button></div></form>` : '<p class="letter-body">海上还只有这一封。等另一个念头来到，再把它们连起来。</p><div class="letter-actions"><button type="button" class="is-primary" data-letter-new>写另一封</button><button type="button" data-letter-read>回到这封信</button></div>'}`;
  reveal(); dialog.scrollTop = 0;
}

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

document.addEventListener("click", (event) => {
  const button = (event.target as Element)?.closest<HTMLElement>("button"); if (!button) return;
  if (button.hasAttribute("data-sea-new") || button.hasAttribute("data-letter-new")) compose();
  else if (button.hasAttribute("data-sea-example")) reader("example", Number(button.dataset.seaExample) || 0);
  else if (button.hasAttribute("data-sea-drift")) {
    const choices = sea.letters.filter((letter) => letter.id !== active);
    const letter = choices[Math.floor(Math.random() * choices.length)] || sea.letters[0];
    if (letter) reader(letter.id); else reader("example");
  } else if (button.hasAttribute("data-sea-export")) {
    download(JSON.stringify(sea, null, 2), `未竟之海-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    status.textContent = "海里的信、续写、关联与草稿已准备下载。";
  } else if (button.hasAttribute("data-sea-import")) importInput.click();
  else if (button.dataset.letterId) { if (!dragged) reader(button.dataset.letterId); dragged = false; }
  else if (button.hasAttribute("data-letter-close")) dialog.close();
  else if (button.hasAttribute("data-letter-prev")) reader(active, pageIndex - 1);
  else if (button.hasAttribute("data-letter-next")) reader(active, pageIndex + 1);
  else if (button.hasAttribute("data-letter-read")) reader(active, pageIndex);
  else if (button.dataset.letterFollow) reader(button.dataset.letterFollow);
  else if (button.hasAttribute("data-letter-continue")) compose(active, "later");
  else if (button.hasAttribute("data-letter-turn")) compose(active, "turn");
  else if (button.hasAttribute("data-letter-connect")) connect();
  else if (button.hasAttribute("data-letter-carry")) { exportQuestion = ""; carry(); }
  else if (button.hasAttribute("data-context-whole")) carry(true);
  else if (button.hasAttribute("data-context-download")) download(markdown(exportIds, exportQuestion), "未竟之海-下一次对话.md", "text/markdown;charset=utf-8");
  else if (button.hasAttribute("data-context-copy")) {
    const preview = content.querySelector<HTMLTextAreaElement>("[data-context-preview]")!;
    const feedback = content.querySelector<HTMLElement>("[data-context-status]")!;
    navigator.clipboard.writeText(preview.value).then(() => { feedback.textContent = "已经复制，可以带去下一次对话了。"; }).catch(() => { preview.focus(); preview.select(); feedback.textContent = "请手动复制选中的内容。"; });
  }
});

content.addEventListener("input", (event) => {
  const field = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (view === "compose" && sea.draft) {
    if (field.name === "title") sea.draft.title = field.value;
    if (field.name === "text") sea.draft.text = field.value;
    save("草稿已留在本机，随时可以回来接着写。");
  } else if (view === "carry" && field.id === "sea-question") {
    exportQuestion = field.value;
    content.querySelector<HTMLTextAreaElement>("[data-context-preview]")!.value = markdown(exportIds, exportQuestion);
  } else if (view === "connect" && field.name === "destination") connectionTarget = field.value;
});

content.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  if (form.hasAttribute("data-letter-form") && sea.draft) {
    const draft = sea.draft; const fields = new FormData(form);
    draft.text = String(fields.get("text") || "").slice(0, 16000);
    if (fields.has("title")) draft.title = String(fields.get("title") || "").slice(0, 80);
    const text = draft.text.trim(); if (!text) return;
    const page: ThoughtPage = { id: uid(), text, kind: draft.kind, at: now() };
    let letter = getLetter(draft.parent);
    if (letter) { if (letter.pages.length >= 100) { status.textContent = "这封已有 100 页了，把后面的想法另写一封吧。"; return; } letter.pages.push(page); }
    else {
      if (sea.letters.length >= 300) { status.textContent = "这片海已有 300 封信，请先下载存档。"; return; }
      const positions = [[23, 25], [65, 18], [78, 62], [37, 68], [49, 42], [17, 80]];
      let pos = positions[sea.letters.length];
      if (!pos) {
        let space = -1;
        for (let attempt = 0; attempt < 80; attempt++) {
          const candidate = [15 + Math.random() * 70, 15 + Math.random() * 70];
          const nearest = Math.min(...sea.letters.map((item) => Math.hypot(candidate[0] - item.x, candidate[1] - item.y)));
          if (nearest > space) { pos = candidate; space = nearest; }
        }
      }
      letter = { id: uid(), title: draft.title.trim() || short(text.split("\n").find((line) => line.trim()) || text), pages: [page], at: page.at, x: pos[0], y: pos[1] };
      sea.letters.push(letter);
    }
    sea.draft = null; save(); reader(letter.id, letter.pages.length - 1);
  } else if (form.hasAttribute("data-connection-form")) {
    const fields = new FormData(form);
    const target = String(fields.get("destination") || connectionTarget);
    if (!getLetter(active) || !getLetter(target) || active === target) return;
    const text = String(fields.get("reason") || "").trim().slice(0, 1200);
    const existing = sea.threads.find((thread) => thread.from === active && thread.to === target);
    if (existing) existing.text = text;
    else sea.threads.push({ id: uid(), from: active, to: target, text, at: now() });
    save("两个念头之间，多了一条由你写下的航线。"); reader(active, pageIndex);
  }
});

dialog.addEventListener("close", () => { renderMap(); lettersElement.querySelector<HTMLButtonElement>(`[data-letter-id="${CSS.escape(active)}"]`)?.focus({ preventScroll: true }); });

lettersElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || matchMedia("(max-width: 700px)").matches) return;
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-letter-id]");
  const letter = button && getLetter(button.dataset.letterId!); if (!button || !letter) return;
  const initial = { x: event.clientX, y: event.clientY }; const bounds = map.getBoundingClientRect();
  const start = { x: letter.x, y: letter.y }; dragged = false;
  button.setPointerCapture(event.pointerId);
  const move = (next: PointerEvent) => {
    if (Math.hypot(next.clientX - initial.x, next.clientY - initial.y) < 6 && !dragged) return;
    dragged = true; next.preventDefault();
    letter.x = Math.max(12, Math.min(88, start.x + (next.clientX - initial.x) / bounds.width * 100));
    letter.y = Math.max(12, Math.min(88, start.y + (next.clientY - initial.y) / bounds.height * 100));
    button.style.left = `${letter.x}%`; button.style.top = `${letter.y}%`;
    routesElement.innerHTML = sea.threads.map((thread) => { const a = getLetter(thread.from); const b = getLetter(thread.to); return a && b ? `<path d="${path(a, b)}" fill="none" vector-effect="non-scaling-stroke" />` : ""; }).join("");
  };
  const end = () => { button.removeEventListener("pointermove", move); if (dragged) save("这封信停在了新的位置。"); };
  button.addEventListener("pointermove", move);
  button.addEventListener("pointerup", end, { once: true });
  button.addEventListener("pointercancel", end, { once: true });
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0]; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error("请选择小于 2 MB 的未竟之海存档。");
    const incoming = parseSea(JSON.parse(await file.text()));
    if (sea.letters.length + incoming.letters.filter((item) => !getLetter(item.id)).length > 300) throw new Error("合并后会超过 300 封信，请选择较小的存档。");
    let added = 0;
    incoming.letters.forEach((item) => {
      const existing = getLetter(item.id);
      if (!existing) { sea.letters.push(item); added++; }
      else { const ids = new Set(existing.pages.map((page) => page.id)); existing.pages.push(...item.pages.filter((page) => !ids.has(page.id)).slice(0, 100 - existing.pages.length)); }
    });
    incoming.threads.forEach((thread) => { if (!sea.threads.some((item) => item.id === thread.id)) sea.threads.push(thread); });
    if (!sea.draft && incoming.draft) sea.draft = incoming.draft;
    save(`已带回 ${added} 封新信，相同信件的续写也已合并。原有内容仍在。`); renderMap();
  } catch (error) { status.textContent = error instanceof Error ? error.message : "这份存档没有读懂，原来的海没有改变。"; }
  importInput.value = "";
});

renderMap();
export {};
