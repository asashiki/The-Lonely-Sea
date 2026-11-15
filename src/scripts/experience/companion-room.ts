import {
  COMPANIONS,
  resolveCompanionMemory,
  getCompanionCopy,
  createCompanionMemoryMarkdown,
  companionMemorySourceUrl,
} from "../../data/companion-memories";

const NOTE_KEY = "lonely-sea-companion-notes-v1";
const copy = {
  "ZH-CN": {
    title: "同行记忆", cast: "同行者", record: "日记剧本节选", author: "作者的视角",
    read: "从这一页读起", carry: "带给下一次对话", source: "复制这一页的链接",
    chapter: "来自", back: "回到这段记忆", next: "给下一次对话的一页",
    note: "还有什么想一起带走？", placeholder: "例如：我想继续聊聊，怎样把这些工具变成长期陪伴。",
    hint: "附言仅保存在此浏览器。复制或下载后，可交给 AI，或收进 Notion。",
    copy: "复制上下文", download: "下载 Markdown", preview: "查看要带走的内容",
    saved: "附言已留在此浏览器", failed: "浏览器未能保存附言，离开前请复制或下载。",
    copied: "上下文已复制", linkCopied: "链接已复制", manual: "已选中文本，请手动复制。",
    downloaded: "已准备下载", view: "这一页", unavailable: "这段作品暂时无法读取。", omitted: "〔中间原文略〕",
    alice: "她在灯塔等你，带你走向下一份记录。", shelf: "CHARACTER / SHARED PAGES",
  },
  "JA-JP": {
    title: "ともに歩いた記憶", cast: "同行者", record: "日記シナリオより", author: "作者の視点",
    read: "このページから読む", carry: "次の対話へ持っていく", source: "このページのリンクをコピー",
    chapter: "出典", back: "記憶に戻る", next: "次の対話に渡す一ページ",
    note: "一緒に残したいことは？", placeholder: "この記録から、次に話したいことを書き留める。",
    hint: "メモはこのブラウザに保存されます。コピーやダウンロード後、AI や Notion へ渡せます。",
    copy: "文脈をコピー", download: "Markdown を保存", preview: "持ち出す内容を見る",
    saved: "メモをこのブラウザに保存しました", failed: "保存できません。離れる前にコピーしてください。",
    copied: "文脈をコピーしました", linkCopied: "リンクをコピーしました", manual: "選択したテキストをコピーしてください。",
    downloaded: "ダウンロードを準備しました", view: "この一ページ", unavailable: "この作品は現在読み込めません。", omitted: "〔中略〕",
    alice: "灯台で待ちながら、次の記録へ案内してくれる。", shelf: "CHARACTER / SHARED PAGES",
  },
  "EN-US": {
    title: "Shared memories", cast: "Companions", record: "From a diary script", author: "The author's perspective",
    read: "Read from this page", carry: "Carry into another conversation", source: "Copy a link to this page",
    chapter: "From", back: "Back to the memory", next: "A page for the next conversation",
    note: "What would you like to carry with it?", placeholder: "Leave a thought you would like to explore next.",
    hint: "Your note stays in this browser. Copy or download it to take into an AI conversation or Notion.",
    copy: "Copy context", download: "Download Markdown", preview: "Review what you will take",
    saved: "Note saved in this browser", failed: "Your browser could not save the note. Copy or download it before leaving.",
    copied: "Context copied", linkCopied: "Link copied", manual: "Text selected. Please copy it manually.",
    downloaded: "Download prepared", view: "ONE SHARED PAGE", unavailable: "This work is not available right now.", omitted: "[Intervening text omitted]",
    alice: "Waiting at the lighthouse, she guides you to the next record.", shelf: "CHARACTER / SHARED PAGES",
  },
};

function escape(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function createCompanionRoom(stage: HTMLElement, language: () => string, onSelect: (name: string, role: string) => void) {
  let selected = "alice";
  let carrying = false;
  let notes: Record<string, string> = {};
  let storageAvailable = true;
  let runtimeChapters: unknown = {};
  try { runtimeChapters = JSON.parse(document.getElementById("nvl-chapters-data")?.textContent || "{}"); } catch { /* A missing source never becomes invented text. */ }
  try {
    const stored = JSON.parse(localStorage.getItem(NOTE_KEY) || "{}");
    for (const id of ["anna-origin", "claude-presentation"]) {
      if (typeof stored?.[id] === "string") notes[id] = stored[id].slice(0, 2000);
    }
  } catch { storageAvailable = false; }

  const locale = () => language() in copy ? language() as keyof typeof copy : "ZH-CN";
  const words = () => copy[locale()];
  const companion = () => COMPANIONS.find((item) => item.id === selected) || COMPANIONS[2];
  const memory = () => resolveCompanionMemory(companion().memoryIds[0] || "", runtimeChapters, locale());
  const siteUrl = () => ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    ? location.origin
    : document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || location.origin;
  const markdown = () => {
    const record = memory();
    return record ? createCompanionMemoryMarkdown(record, { siteUrl: siteUrl(), userNote: notes[record.id] || "" }) : "";
  };

  function announce(message: string) {
    const status = stage.querySelector<HTMLElement>("[data-companion-status]");
    if (status) status.textContent = message;
  }

  function updateUrl() {
    const record = memory();
    const url = new URL(location.href);
    url.searchParams.set("screen", "extra");
    url.searchParams.set("extraMode", "character");
    if (record) url.searchParams.set("memory", record.id);
    else url.searchParams.delete("memory");
    history.replaceState(history.state, "", url);
  }

  function render() {
    const c = companion();
    const text = words();
    const description = getCompanionCopy(c.id, locale());
    const record = memory();
    stage.innerHTML = `
      <div class="extra-room companion-room" data-companion-room data-companion="${escape(c.id)}" data-carrying="${carrying}">
        <header class="companion-heading">
          <h3>${text.title}</h3><span>${text.shelf}</span>
        </header>
        <nav class="companion-cast" aria-label="${text.cast}">
          ${COMPANIONS.map((item) => `<button type="button" data-companion-select="${item.id}" aria-pressed="${item.id === selected}">${escape(getCompanionCopy(item.id, locale()).name)}</button>`).join("")}
        </nav>
        <div class="companion-portrait" aria-hidden="true">
          <span class="companion-portrait-number">${record ? record.monthId.slice(5) : "00"}</span>
          <img src="${escape(c.art)}" alt="" draggable="false" decoding="async" />
          <span class="companion-portrait-caption">${escape(c.id.toUpperCase())}<small>${record ? escape(record.monthId.replace("-", " / ")) : "THE LIGHTHOUSE"}</small></span>
        </div>
        <article class="companion-copy" aria-label="${escape(description.name)}">
        ${carrying && record ? `
          <button class="companion-return" type="button" data-companion-back>← ${text.back}</button>
          <h4 class="companion-carry-title">${text.next}</h4>
          <p class="companion-carry-source">${escape(description.name)} · ${escape(record.title)}</p>
          <label class="companion-note-label" for="companion-note">${text.note}</label>
          <textarea id="companion-note" class="companion-note" data-companion-note maxlength="2000" rows="3" placeholder="${text.placeholder}">${escape(notes[record.id] || "")}</textarea>
          <p class="companion-note-hint">${text.hint}</p>
          <details class="companion-preview"><summary>${text.preview}</summary><textarea readonly aria-label="${text.preview}" data-companion-export rows="6">${escape(markdown())}</textarea></details>
          <div class="companion-actions"><button type="button" class="companion-action-primary" data-companion-copy>${text.copy}</button><button type="button" data-companion-download>${text.download} ↓</button></div>
        ` : `
          <p class="companion-role">${escape(description.role)}</p>
          <h4 class="companion-name">${escape(description.name)}</h4>
          ${record ? `
            <p class="companion-memory-meta">${escape(record.monthId.replace("-", "."))} <span>${text.record} · ${text.author}</span></p>
            <blockquote class="companion-excerpt">${record.excerpts.map((excerpt) => excerpt.texts.map((line, index) => `${index > 0 && excerpt.lineIndices[index]! > excerpt.lineIndices[index - 1]! + 1 ? `<small class="companion-omission">${text.omitted}</small>` : ""}<p>${escape(line)}</p>`).join("")).join("")}</blockquote>
            <p class="companion-source">${text.chapter}《${escape(record.chapterTitle)}》</p>
            <div class="companion-actions"><button type="button" class="companion-action-primary" data-companion-read>${text.read} →</button><button type="button" data-companion-carry>${text.carry}</button></div>
            <button class="companion-link" type="button" data-companion-link>${text.source} ↗</button>
          ` : `<p class="companion-introduction">${escape(description.description)}</p><p class="companion-alice-note">${c.id === "alice" ? text.alice : text.unavailable}</p>`}
        `}
          <p class="companion-status" data-companion-status role="status" aria-live="polite"></p>
        </article>
      </div>`;
    onSelect(description.name, description.role);
  }

  async function copyText(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      announce(success);
    } catch {
      let field = stage.querySelector<HTMLTextAreaElement>("[data-companion-export], .companion-copy-fallback");
      if (!field) {
        field = document.createElement("textarea");
        field.className = "companion-copy-fallback";
        field.readOnly = true;
        field.setAttribute("aria-label", words().preview);
        stage.querySelector(".companion-copy")?.append(field);
      }
      const details = field.closest("details");
      if (details) details.open = true;
      field.value = text;
      field.focus();
      field.select();
      announce(words().manual);
    }
  }

  stage.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button") : null;
    if (!target || !target.closest("[data-companion-room]")) return;
    if (target.dataset.companionSelect) {
      const next = COMPANIONS.find((item) => item.id === target.dataset.companionSelect);
      if (!next || next.id === selected) return;
      selected = next.id;
      carrying = false;
      render();
      updateUrl();
      stage.querySelector<HTMLButtonElement>(`[data-companion-select="${next.id}"]`)?.focus({ preventScroll: true });
      return;
    }
    const record = memory();
    if (!record) return;
    if (target.hasAttribute("data-companion-read")) {
      const excerpt = record.excerpts[0];
      window.dispatchEvent(new CustomEvent("lonely-sea:open-nvl", { detail: {
        monthId: record.monthId, pageId: excerpt.pageId, lineIndex: excerpt.lineIndex, returnTo: "character",
      } }));
    } else if (target.hasAttribute("data-companion-carry")) {
      carrying = true;
      render();
      stage.querySelector<HTMLTextAreaElement>("[data-companion-note]")?.focus({ preventScroll: true });
      if (!storageAvailable) announce(words().failed);
    } else if (target.hasAttribute("data-companion-back")) {
      carrying = false;
      render();
      stage.querySelector<HTMLButtonElement>("[data-companion-carry]")?.focus({ preventScroll: true });
    } else if (target.hasAttribute("data-companion-copy")) {
      void copyText(markdown(), words().copied);
    } else if (target.hasAttribute("data-companion-link")) {
      void copyText(companionMemorySourceUrl(record.id, siteUrl()), words().linkCopied);
    } else if (target.hasAttribute("data-companion-download")) {
      const objectUrl = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `lonely-sea-${record.id}.md`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      announce(words().downloaded);
    }
  });

  stage.addEventListener("input", (event) => {
    if (!(event.target instanceof HTMLTextAreaElement) || !event.target.matches("[data-companion-note]")) return;
    const record = memory();
    if (!record) return;
    notes[record.id] = event.target.value.slice(0, 2000);
    const preview = stage.querySelector<HTMLTextAreaElement>("[data-companion-export]");
    if (preview) preview.value = markdown();
    try {
      localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
      storageAvailable = true;
      announce(words().saved);
    } catch { storageAvailable = false; announce(words().failed); }
  });

  stage.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !carrying || !stage.querySelector("[data-companion-room]")) return;
    event.preventDefault();
    event.stopPropagation();
    carrying = false;
    render();
    stage.querySelector<HTMLButtonElement>("[data-companion-carry]")?.focus({ preventScroll: true });
  }, true);

  window.addEventListener("lonely-sea:before-site-data-clear", () => { notes = {}; });

  return {
    render,
    updateUrl,
    selectMemory(id: string) {
      const found = COMPANIONS.find((item) => item.memoryIds.some((memoryId) => memoryId === id));
      selected = found?.id || "alice";
      carrying = false;
    },
    restoreFocus() { stage.querySelector<HTMLButtonElement>("[data-companion-read]")?.focus({ preventScroll: true }); },
  };
}
