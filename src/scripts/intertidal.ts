import type { ResolvedPair, ResolvedSource } from "../lib/intertidal";

type Side = "left" | "right";
const root = document.querySelector<HTMLElement>("#intertidal")!;
const status = root.querySelector<HTMLElement>("[data-tide-status]")!;
const divider = root.querySelector<HTMLButtonElement>("[data-tide-divider]")!;
const spread = root.querySelector<HTMLElement>("[data-tide-spread]")!;
const pairs = JSON.parse(document.getElementById("intertidal-data")?.textContent || "[]") as ResolvedPair[];
const lexicon = JSON.parse(document.getElementById("intertidal-index")?.textContent || "[]") as ResolvedSource[];
const curatedSources = [...new Map(pairs.flatMap((pair) => [pair.left, pair.right]).map((source) => [source.id, source])).values()];
const sources = [...curatedSources, ...lexicon];
const STORAGE = "lonely-sea-intertidal-v1";
const sourceById = (id: string | null) => sources.find((source) => source.id === id);
const normalize = (value: string) => value.replace(/\s+/gu, "");
const pane = (side: Side) => root.querySelector<HTMLElement>(`[data-tide-side="${side}"]`)!;
const opposite = (side: Side): Side => side === "left" ? "right" : "left";
const cache = new Map<string, Promise<string>>();
const versions: Record<Side, number> = { left: 0, right: 0 };
const pinned: Record<Side, boolean> = { left: false, right: false };
const expanded: Record<Side, boolean> = { left: false, right: false };
let current: Record<Side, ResolvedSource>;
let pairIndex = 0;
let balance = 50;

function remember() {
  try { localStorage.setItem(STORAGE, JSON.stringify({ left: current.left.id, right: current.right.id, pinned, balance })); }
  catch { /* The reading experience remains available without local storage. */ }
}

function updateLocation() {
  const exact = pairs.find((pair) => pair.left.id === current.left.id && pair.right.id === current.right.id);
  const url = new URL(location.href);
  url.search = "";
  if (exact) url.searchParams.set("pair", exact.id);
  else { url.searchParams.set("left", current.left.id); url.searchParams.set("right", current.right.id); }
  history.replaceState(history.state, "", url);
}

function renderSide(side: Side, reset = true) {
  const page = pane(side); const source = current[side];
  page.querySelector<HTMLElement>("[data-source-year]")!.textContent = source.year;
  page.querySelector<HTMLElement>("[data-source-quote]")!.textContent = source.quote;
  page.querySelector<HTMLElement>("[data-source-section]")!.textContent = source.section;
  page.querySelector<HTMLElement>("[data-source-date]")!.textContent = `发表于 ${source.published}`;
  const link = page.querySelector<HTMLAnchorElement>("[data-source-title]")!;
  link.href = source.href; link.textContent = source.title;
  const pin = page.querySelector<HTMLButtonElement>("[data-tide-pin]")!;
  pin.setAttribute("aria-pressed", String(pinned[side]));
  pin.textContent = pinned[side] ? "已留住 · 松开" : "留住这一页";
  if (reset) {
    versions[side]++; expanded[side] = false;
    page.classList.remove("is-expanded");
    page.querySelector<HTMLElement>("[data-source-original]")!.replaceChildren();
    page.querySelector<HTMLElement>("[data-source-original]")!.hidden = true;
    page.querySelector<HTMLElement>("[data-source-quote]")!.hidden = false;
    page.querySelector<HTMLElement>("[data-source-scroll]")!.scrollTop = 0;
    const expand = page.querySelector<HTMLButtonElement>("[data-tide-expand]")!;
    expand.textContent = "在这里展开原文"; expand.disabled = false; expand.setAttribute("aria-expanded", "false");
  }
}

function renderHeading() {
  const index = pairs.findIndex((pair) => pair.left.id === current.left.id && pair.right.id === current.right.id);
  root.querySelector<HTMLElement>("[data-tide-title]")!.textContent = index >= 0 ? pairs[index].title : "页与页之间";
  root.querySelector<HTMLElement>("[data-tide-number]")!.textContent = index >= 0 ? String(index + 1).padStart(2, "0") : "∞";
  root.querySelectorAll<HTMLElement>("[data-tide-pair]").forEach((button) => {
    if (index >= 0 && button.dataset.tidePair === pairs[index].id) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.title = `${index >= 0 ? pairs[index].title : "页与页之间"} · 潮间带 · 孤独之海`;
  updateLocation(); remember();
}

function choosePair(index: number) {
  if (pinned.left && pinned.right) { status.textContent = "两页都已留住。松开其中一页，就能继续翻。"; return; }
  pairIndex = (index + pairs.length) % pairs.length;
  const pair = pairs[pairIndex];
  (["left", "right"] as Side[]).forEach((side) => {
    if (pinned[side]) return;
    let source = pair[side];
    if (pinned[opposite(side)] && source.id === current[opposite(side)].id) source = pair[opposite(side)];
    if (source.id !== current[side].id) { current[side] = source; renderSide(side); }
  });
  renderHeading();
  status.textContent = pinned.left || pinned.right ? "留住的那一页还在，另一页已经翻开。" : "两段原文，换一个角度重读。";
}

function turnSide(side: Side) {
  if (pinned[side]) { status.textContent = "这一页已留住。先松开它，或翻动另一侧。"; return; }
  const index = curatedSources.findIndex((source) => source.id === current[side].id);
  for (let step = 1; step <= curatedSources.length; step++) {
    const next = curatedSources[(index + step) % curatedSources.length];
    if (next.id === current[opposite(side)].id || next.id === current[side].id) continue;
    current[side] = next; renderSide(side); renderHeading();
    status.textContent = `翻到了《${next.title}》中的另一段原文。`;
    break;
  }
}

function setBalance(value: number) {
  balance = Math.max(30, Math.min(70, value));
  root.style.setProperty("--tide", `${balance}%`);
  divider.setAttribute("aria-valuenow", String(Math.round(balance)));
}

function sourceDocument(source: ResolvedSource) {
  const path = `/reading-fragments/${source.slug}/`;
  let pending = cache.get(path);
  if (!pending) {
    pending = fetch(path, { credentials: "same-origin" }).then(async (response) => {
      if (!response.ok) throw new Error("原文暂时没有读到。");
      return response.text();
    }).catch((error) => { cache.delete(path); throw error; });
    cache.set(path, pending);
  }
  return pending;
}

async function expandOriginal(side: Side) {
  const page = pane(side);
  const button = page.querySelector<HTMLButtonElement>("[data-tide-expand]")!;
  const original = page.querySelector<HTMLElement>("[data-source-original]")!;
  const quote = page.querySelector<HTMLElement>("[data-source-quote]")!;
  const scroller = page.querySelector<HTMLElement>("[data-source-scroll]")!;
  if (expanded[side]) {
    expanded[side] = false; original.hidden = true; quote.hidden = false;
    button.textContent = "在这里展开原文"; button.setAttribute("aria-expanded", "false");
    page.classList.remove("is-expanded"); scroller.scrollTop = 0;
    return;
  }
  const token = ++versions[side];
  const source = current[side];
  button.disabled = true; button.textContent = "正在翻到原文…";
  try {
    if (!original.childElementCount) {
      const html = await sourceDocument(source);
      if (versions[side] !== token || current[side].id !== source.id) return;
      const documentSource = new DOMParser().parseFromString(html, "text/html");
      const prose = documentSource.querySelector(".prose");
      if (!prose) throw new Error("原文暂时没有读到。");
      prose.querySelectorAll("script,style,form").forEach((element) => element.remove());
      const idMap = new Map<string, string>();
      prose.querySelectorAll<HTMLElement>("[id]").forEach((element, index) => { const id = `tidal-${side}-${index}`; idMap.set(element.id, id); element.id = id; });
      prose.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
        const href = link.getAttribute("href") || "";
        if (href.startsWith("#")) {
          let originalId = href.slice(1); try { originalId = decodeURIComponent(originalId); } catch { /* Preserve a malformed source anchor as ordinary text navigation. */ }
          if (idMap.has(originalId)) link.href = `#${idMap.get(originalId)}`;
          else link.href = `${source.articleHref}${href}`;
        } else {
          const url = new URL(href, new URL(source.articleHref, location.origin));
          if (["http:", "https:", "mailto:"].includes(url.protocol)) link.href = url.href;
          else link.removeAttribute("href");
          if (url.origin !== location.origin && ["http:", "https:"].includes(url.protocol)) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
        }
      });
      original.replaceChildren(...Array.from(prose.childNodes).map((node) => document.importNode(node, true)));
    }
    if (versions[side] !== token) return;
    expanded[side] = true; original.hidden = false; quote.hidden = true;
    page.classList.add("is-expanded"); button.textContent = "收起原文，回到这句话"; button.setAttribute("aria-expanded", "true");
    const needle = normalize(source.quote);
    const candidates = [...original.querySelectorAll<HTMLElement>("p,td,li,blockquote")].filter((element) => normalize(element.textContent || "").includes(needle));
    const focus = candidates.sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0))[0];
    if (focus) {
      let enclosing = focus.closest("details");
      while (enclosing) { enclosing.open = true; enclosing = enclosing.parentElement?.closest("details") || null; }
      focus.classList.add("tide-original-focus");
      requestAnimationFrame(() => { if (versions[side] === token) scroller.scrollTop = focus.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 18; });
    } else scroller.scrollTop = 0;
    status.textContent = "原文就在这一侧。另一页可以保持，也可以同时展开。";
  } catch {
    if (versions[side] === token) { button.textContent = "再试着展开原文"; status.textContent = "原文暂时没有读到，也可以点击文章标题直接打开。"; }
  } finally { if (versions[side] === token) button.disabled = false; }
}

if (pairs.length) {
  current = { left: pairs[0].left, right: pairs[0].right };
  const query = new URLSearchParams(location.search);
  const requested = pairs.findIndex((pair) => pair.id === query.get("pair"));
  const requestedLeft = sourceById(query.get("left")); const requestedRight = sourceById(query.get("right"));
  if (requested >= 0) { pairIndex = requested; current = { left: pairs[requested].left, right: pairs[requested].right }; }
  else if (requestedLeft && requestedRight) current = { left: requestedLeft, right: requestedRight };
  else if (!query.has("pair") && !query.has("left") && !query.has("right")) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
      const left = sourceById(saved?.left); const right = sourceById(saved?.right);
      if (left && right) { current = { left, right }; pinned.left = saved.pinned?.left === true; pinned.right = saved.pinned?.right === true; if (typeof saved.balance === "number" && Number.isFinite(saved.balance)) setBalance(saved.balance); }
    } catch { /* Start from the first published pair when local state is unavailable. */ }
  }
  const matchedIndex = pairs.findIndex((pair) => pair.left.id === current.left.id && pair.right.id === current.right.id);
  if (matchedIndex >= 0) pairIndex = matchedIndex;
  renderSide("left"); renderSide("right"); renderHeading();

  root.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button"); if (!button) return;
    const side = (button.dataset.tidePin || button.dataset.tideNext || button.dataset.tideExpand) as Side;
    if (button.hasAttribute("data-tide-pin")) { pinned[side] = !pinned[side]; renderSide(side, false); remember(); status.textContent = pinned[side] ? "这一页留住了。可以去另一侧寻找它的回声。" : "这一页又可以随潮翻动了。"; }
    else if (button.hasAttribute("data-tide-next")) turnSide(side);
    else if (button.hasAttribute("data-tide-expand")) void expandOriginal(side);
    else if (button.dataset.tidePair) choosePair(pairs.findIndex((pair) => pair.id === button.dataset.tidePair));
    else if (button.hasAttribute("data-tide-previous")) choosePair(pairIndex - 1);
    else if (button.hasAttribute("data-tide-following")) choosePair(pairIndex + 1);
    else if (button.hasAttribute("data-tide-random")) choosePair(pairIndex + 1 + Math.floor(Math.random() * Math.max(1, pairs.length - 1)));
    else if (button.hasAttribute("data-tide-swap")) {
      [current.left, current.right] = [current.right, current.left];
      [pinned.left, pinned.right] = [pinned.right, pinned.left];
      setBalance(100 - balance); renderSide("left"); renderSide("right"); renderHeading();
      status.textContent = "两页交换了位置。";
    } else if (button.hasAttribute("data-tide-share")) {
      navigator.clipboard.writeText(location.href).then(() => { status.textContent = "链接已复制。打开它，会遇到同样的两段原文。"; }).catch(() => {
        let input = root.querySelector<HTMLInputElement>("[data-tide-share-fallback]");
        if (!input) { input = document.createElement("input"); input.setAttribute("data-tide-share-fallback", ""); input.setAttribute("aria-label", "这次相遇的链接"); input.readOnly = true; root.querySelector(".tidal-footer")!.append(input); }
        input.value = location.href; input.focus(); input.select(); status.textContent = "链接已选中，可以手动复制。";
      });
    } else if (button.hasAttribute("data-tide-search")) {
      if (searchTerm) renderSearch();
      searchDialog.showModal(); searchInput.focus();
    }
  });

  divider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault(); divider.setPointerCapture(event.pointerId); root.classList.add("is-dragging");
    const move = (pointer: PointerEvent) => { const rect = spread.getBoundingClientRect(); setBalance((pointer.clientX - rect.left) / rect.width * 100); };
    const end = () => { divider.removeEventListener("pointermove", move); root.classList.remove("is-dragging"); remember(); };
    divider.addEventListener("pointermove", move);
    divider.addEventListener("pointerup", end, { once: true });
    divider.addEventListener("pointercancel", end, { once: true });
  });
  divider.addEventListener("keydown", (event) => {
    const changes: Record<string, number> = { ArrowLeft: balance - 5, ArrowRight: balance + 5, Home: 30, End: 70 };
    if (event.key in changes) { event.preventDefault(); event.stopPropagation(); setBalance(changes[event.key]); remember(); }
  });
  document.addEventListener("keydown", (event) => {
    if (searchDialog.open || event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey || window.getSelection()?.toString() || (event.target as Element)?.matches("input,textarea,[contenteditable]") || (event.target as Element)?.closest(".tidal-original")) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); choosePair(pairIndex + (event.key === "ArrowRight" ? 1 : -1)); }
    if (event.key === "Escape") (["left", "right"] as Side[]).forEach((side) => { if (expanded[side]) void expandOriginal(side); });
  });
  let start: { x: number; y: number } | null = null;
  spread.addEventListener("touchstart", (event) => {
    if ((event.target as Element).closest("button,a,.tidal-original") || event.touches.length !== 1) { start = null; return; }
    start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  spread.addEventListener("touchend", (event) => {
    if (!start || !event.changedTouches.length || window.getSelection()?.toString()) return;
    const dx = event.changedTouches[0].clientX - start.x; const dy = event.changedTouches[0].clientY - start.y; start = null;
    if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.8) choosePair(pairIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });
} else {
  root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => { button.disabled = true; });
  status.textContent = "暂时没有可对读的公开原文。可以先回到文章里。";
}

const searchDialog = document.querySelector<HTMLDialogElement>("#tidal-concordance")!;
const searchInput = document.querySelector<HTMLInputElement>("#tidal-search-input")!;
const searchResults = document.querySelector<HTMLElement>("#tidal-search-results")!;
const searchStatus = document.querySelector<HTMLElement>("#tidal-search-status")!;
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
let matches: ResolvedSource[] = [];
let searchTerm = "";
let shown = 24;

function highlight(text: string) {
  if (!searchTerm) return escape(text);
  const lower = text.toLocaleLowerCase(); const term = searchTerm.toLocaleLowerCase();
  let start = 0; let at = lower.indexOf(term); let result = "";
  while (at >= 0) { result += escape(text.slice(start, at)) + `<mark>${escape(text.slice(at, at + term.length))}</mark>`; start = at + term.length; at = lower.indexOf(term, start); }
  return result + escape(text.slice(start));
}

function renderSearch() {
  searchResults.innerHTML = matches.slice(0, shown).map((source) => `<article class="concordance-hit"><header><strong>${escape(source.year)}</strong><span>${escape(source.title)} · ${escape(source.section)}</span></header><p class="concordance-quote">${highlight(source.quote)}</p><footer><button type="button" data-concordance-place="${escape(source.id)}" data-side="left" ${pinned.left ? 'disabled title="左页已留住"' : ""}>放在左页</button><button type="button" data-concordance-place="${escape(source.id)}" data-side="right" ${pinned.right ? 'disabled title="右页已留住"' : ""}>放在右页</button><a href="${escape(source.href)}">去原文 ↗</a></footer></article>`).join("") + (shown < matches.length ? '<button type="button" class="concordance-more" data-concordance-more>再往前找一些 ↓</button>' : "");
}

function search() {
  searchTerm = searchInput.value.trim().slice(0, 80); shown = 24;
  if (!searchTerm) { searchResults.replaceChildren(); searchStatus.textContent = "写下一个词，也可以选下面的一条线索。"; return; }
  const term = searchTerm.toLocaleLowerCase();
  matches = lexicon.filter((source) => source.quote.toLocaleLowerCase().includes(term)).sort((a, b) => a.year.localeCompare(b.year) || a.published.localeCompare(b.published));
  const articles = new Set(matches.map((source) => source.slug)).size;
  searchStatus.textContent = matches.length ? `「${searchTerm}」经过了 ${articles} 篇文章、${matches.length} 段文字。${pinned.left && pinned.right ? "两页都已留住，可以先回去松开一侧。" : "挑一句，把它放到正在读的另一页旁边。"}` : `公开文章里暂时没有找到「${searchTerm}」。换个词，继续往前找。`;
  renderSearch();
}

document.querySelector<HTMLFormElement>("#tidal-search-form")!.addEventListener("submit", (event) => { event.preventDefault(); search(); });
searchDialog.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("button"); if (!button) return;
  if (button.hasAttribute("data-concordance-close")) searchDialog.close();
  else if (button.dataset.concordanceTerm) { searchInput.value = button.dataset.concordanceTerm; search(); }
  else if (button.hasAttribute("data-concordance-more")) { shown += 24; renderSearch(); }
  else if (button.dataset.concordancePlace) {
    const source = sourceById(button.dataset.concordancePlace); const side = button.dataset.side as Side;
    if (!source || !["left", "right"].includes(side) || pinned[side]) return;
    current[side] = source; renderSide(side); renderHeading(); searchDialog.close();
    pane(side).querySelector<HTMLButtonElement>("[data-tide-expand]")!.focus({ preventScroll: true });
    status.textContent = `「${searchTerm}」带来了一页新的原文。`;
  }
});
searchDialog.addEventListener("close", () => { if (!root.contains(document.activeElement)) root.querySelector<HTMLButtonElement>("[data-tide-search]")?.focus({ preventScroll: true }); });
