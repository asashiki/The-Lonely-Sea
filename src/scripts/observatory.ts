import type { ExperienceRecord } from "../lib/experience-records";
import { readReadingTrail, readingPath } from "../lib/reading-trail";
import { readPreferences } from "./experience/preferences.js";
import { initExperienceAudio } from "./experience/audio.js";

const root = document.querySelector<HTMLElement>("[data-observatory]");
if (root) initObservatory(root);

function initObservatory(root: HTMLElement) {
  const records: ExperienceRecord[] = JSON.parse(root.dataset.records || "[]");
  const preferences = readPreferences();
  const language: string = String(preferences.language);
  const reducedMotion = preferences.reducedMotion || !preferences.sceneCrossfade || matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.dataset.motion = reducedMotion ? "reduced" : "full";
  const audio = initExperienceAudio();
  audio.setTitleActive(true);
  const dictionaries = {
    "ZH-CN": { home:"回到标题", letter:"海边通信", quiet:"只看海", room:"观海室", read:"打开这一页", focus:"转动望远镜", hint:"转动刻度，或用 ← → 寻找一篇文章。", unread:"选一篇未读", index:"观测目录", return:"回到书页", close:"关闭", search:"寻找文章", placeholder:"标题、分类或关键词", empty:"没有找到这篇文章，试试其他词。", fresh:"尚未阅读", finished:"已读完", allRead:"这里的文章都读过了，重新选一篇看看。", previous:"上一篇", next:"下一篇", time:(n:number) => `约 ${n} 分钟`, progress:(n:number) => `读到 ${n}%` },
    "EN-US": { home:"Back to title", letter:"Correspondence", quiet:"Just the sea", room:"Observatory", read:"Open this page", focus:"Turn the telescope", hint:"Turn the dial, or use ← → to find an article.", unread:"Find an unread page", index:"Reading index", return:"Return to the pages", close:"Close", search:"Find an article", placeholder:"Title, category or keyword", empty:"No article found. Try another word.", fresh:"Unread", finished:"Finished", allRead:"You have read every article here. Revisit a page.", previous:"Previous article", next:"Next article", time:(n:number) => `About ${n} min`, progress:(n:number) => `${n}% read` },
    "JA-JP": { home:"タイトルへ", letter:"海辺の便り", quiet:"海を眺める", room:"海の展望室", read:"このページを開く", focus:"望遠鏡を回す", hint:"目盛り、または ← → で記事を選べます。", unread:"未読の記事を選ぶ", index:"記事目録", return:"ページに戻る", close:"閉じる", search:"記事を探す", placeholder:"タイトル・分類・キーワード", empty:"記事が見つかりません。別の言葉で検索してください。", fresh:"未読", finished:"読了", allRead:"すべての記事を読みました。もう一度読み返してみませんか。", previous:"前の記事", next:"次の記事", time:(n:number) => `約 ${n} 分`, progress:(n:number) => `${n}% まで` },
  };
  const copy = dictionaries[language as keyof typeof dictionaries] || dictionaries["ZH-CN"];
  document.documentElement.lang = language === "EN-US" ? "en" : language === "JA-JP" ? "ja" : "zh-CN";
  root.querySelectorAll<HTMLElement>("[data-copy]").forEach(node => {
    const value = copy[node.dataset.copy as keyof typeof copy];
    if (typeof value === "string") node.textContent = value;
  });
  const input = root.querySelector<HTMLInputElement>("#observatory-focus");
  const search = root.querySelector<HTMLInputElement>("[data-index-search]")!;
  search.placeholder = copy.placeholder;
  const dialog = root.querySelector<HTMLDialogElement>("[data-index]")!;
  const indexButton = root.querySelector<HTMLButtonElement>("[data-index-open]")!;
  const quietButton = root.querySelector<HTMLButtonElement>("[data-quiet]")!;
  const bgmButton = root.querySelector<HTMLButtonElement>("[data-observatory-bgm]")!;
  const syncBgm = () => {
    const enabled = audio.isBgmEnabled() && !audio.isMuted();
    bgmButton.setAttribute("aria-pressed", String(enabled));
    bgmButton.textContent = `BGM ${enabled ? "ON" : "OFF"}`;
    bgmButton.setAttribute("aria-label", language === "EN-US" ? "Background music" : language === "JA-JP" ? "BGM" : "背景音乐");
  };
  bgmButton.addEventListener("click", () => {
    const enabled = audio.isBgmEnabled() && !audio.isMuted();
    if (!enabled) audio.setMuted(false);
    audio.setBgmEnabled(!enabled); syncBgm();
  });
  syncBgm();
  window.addEventListener("lonely-sea:preferences-change", syncBgm);
  const quietReturn = root.querySelector<HTMLButtonElement>("[data-quiet-return]")!;
  const image = root.querySelector<HTMLImageElement>("[data-record-image]");
  const lens = root.querySelector<HTMLElement>(".observatory-lens");
  const status = root.querySelector<HTMLElement>("[data-observatory-status]")!;
  const turners = [...root.querySelectorAll<HTMLButtonElement>("[data-turn]")];
  const entries = [...root.querySelectorAll<HTMLElement>("[data-index-entry]")];
  let current = 0;
  let imageRequest = 0;
  let focusAnimation: Animation | null = null;
  let quiet = false;
  const text = (selector:string, value:string) => { const node = root.querySelector(selector); if (node) node.textContent = value; };
  const trailLabel = (path:string) => {
    const entry = readReadingTrail()[readingPath(path)];
    return !entry || entry.percent === 0 ? copy.fresh : entry.percent >= 100 ? copy.finished : copy.progress(entry.percent);
  };

  function select(index:number, remember = true) {
    if (!records.length) return;
    current = Math.min(records.length - 1, Math.max(0, index));
    const record = records[current];
    text("[data-record-number]", String(current + 1).padStart(2,"0"));
    text("[data-page-current]", String(current + 1).padStart(2,"0"));
    text("[data-record-label]", record.label);
    text("[data-record-date]", record.date);
    text("[data-record-title]", record.title);
    text("[data-record-description]", record.excerpt);
    text("[data-record-time]", copy.time(record.readingMinutes));
    text("[data-record-progress]", trailLabel(record.url));
    const url = `${record.url}?from=observatory`;
    root.querySelectorAll<HTMLAnchorElement>("[data-open-record]").forEach(link => { link.href = url; link.setAttribute("aria-label", `${copy.read}: ${record.title}`); });
    if (input) { input.value = String(current); input.setAttribute("aria-valuetext", record.title); }
    turners.forEach(button => {
      const direction = Number(button.dataset.turn);
      button.disabled = direction < 0 ? current === 0 : current === records.length - 1;
      button.setAttribute("aria-label", direction < 0 ? copy.previous : copy.next);
    });
    entries.forEach((entry,i) => {
      const link = entry.querySelector("a")!;
      if (i === current) link.setAttribute("aria-current","true"); else link.removeAttribute("aria-current");
      entry.querySelector("[data-index-progress]")!.textContent = trailLabel(records[i].url);
    });
    status.textContent = "";
    if (remember) {
      try { sessionStorage.setItem("lonely-sea:observatory-selection", record.url); } catch {}
      const destination = new URL(location.href);
      destination.searchParams.set("record", record.url);
      history.replaceState(history.state, "", destination);
    }
    const token = ++imageRequest;
    focusAnimation?.cancel();
    if (image && image.getAttribute("src") !== record.coverUrl) {
      lens?.classList.add("is-focusing");
      const next = new Image();
      next.src = record.coverUrl;
      const show = () => {
        if (token !== imageRequest) return;
        image.src = record.coverUrl; image.alt = record.title;
        lens?.classList.remove("is-focusing");
        if (!reducedMotion) focusAnimation = image.animate([{opacity:.35,transform:"scale(1.045)"},{opacity:1,transform:"scale(1)"}], {duration:480,easing:"cubic-bezier(.22,.7,.25,1)"});
      };
      // Resolve both decode success and failure; a failed cover never blocks reading.
      void next.decode().then(show, () => {
        if (token !== imageRequest) return;
        image.src = "/assets/lonely-sea/mist.webp"; image.alt = "";
        lens?.classList.remove("is-focusing");
      });
      if (!preferences.dataSaver && preferences.smartPreload && records[current + 1]) {
        const preload = new Image(); preload.src = records[current + 1].coverUrl;
      }
    } else lens?.classList.remove("is-focusing");
  }

  turners.forEach(button => button.addEventListener("click", () => select(current + Number(button.dataset.turn))));
  input?.addEventListener("input", () => select(Number(input.value)));
  let pointerStart: { x:number; y:number } | null = null;
  lens?.addEventListener("pointerdown", event => { if (event.pointerType !== "mouse") pointerStart = { x:event.clientX,y:event.clientY }; });
  let suppressClick = false;
  lens?.addEventListener("pointerup", event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { suppressClick = true; select(current + (dx < 0 ? 1 : -1)); }
  });
  lens?.addEventListener("pointercancel", () => { pointerStart = null; });
  lens?.addEventListener("click", event => { if (suppressClick) { event.preventDefault(); suppressClick = false; } });

  indexButton.addEventListener("click", () => { dialog.showModal(); search.focus(); });
  root.querySelector("[data-index-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => indexButton.focus({preventScroll:true}));
  search.addEventListener("input", () => {
    const needle = search.value.trim().toLocaleLowerCase();
    let count = 0;
    entries.forEach((entry,i) => {
      entry.hidden = !`${records[i].title} ${records[i].label} ${records[i].excerpt}`.toLocaleLowerCase().includes(needle);
      if (!entry.hidden) count++;
    });
    root.querySelector<HTMLElement>("[data-search-empty]")!.hidden = count !== 0;
  });
  root.querySelectorAll<HTMLAnchorElement>("[data-select-record]").forEach(link => link.addEventListener("click", event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); select(Number(link.dataset.selectRecord)); dialog.close();
  }));
  root.querySelector("[data-unread]")?.addEventListener("click", () => {
    const trail = readReadingTrail();
    const candidates = records.map((record,index) => ({record,index})).filter(({record}) => !trail[readingPath(record.url)] || trail[readingPath(record.url)].percent === 0);
    if (!candidates.length) { status.textContent = copy.allRead; return; }
    const alternatives = candidates.filter(({index}) => index !== current);
    const pool = alternatives.length ? alternatives : candidates;
    select(pool[Math.floor(Math.random() * pool.length)].index);
  });
  function setQuiet(value:boolean) {
    quiet = value;
    root.classList.toggle("is-quiet",quiet);
    root.querySelectorAll<HTMLElement>("[data-reading-ui]").forEach(node => { node.inert = quiet; });
    quietButton.setAttribute("aria-pressed",String(quiet));
    quietReturn.hidden = !quiet;
    status.textContent = "";
    (quiet ? quietReturn : quietButton).focus({preventScroll:true});
  }
  quietButton.addEventListener("click", () => setQuiet(!quiet));
  quietReturn.addEventListener("click", () => setQuiet(false));
  document.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || dialog.open) return;
    if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable=true]")) return;
    if (event.key === "Escape" && quiet) { event.preventDefault(); setQuiet(false); return; }
    if (quiet) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); select(current + (event.key === "ArrowLeft" ? -1 : 1)); }
  });
  let saved = new URLSearchParams(location.search).get("record");
  if (!saved) { try { saved = sessionStorage.getItem("lonely-sea:observatory-selection"); } catch {} }
  select(Math.max(0,records.findIndex(record => saved && readingPath(record.url) === readingPath(saved))),false);
  window.addEventListener("pageshow", () => { select(current,false); audio.setTitleActive(true); });
}
