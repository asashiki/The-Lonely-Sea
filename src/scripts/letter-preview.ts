import { readPreferences } from "./experience/preferences.js";

export function initLetterPreview(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-letter-dialog]");
  if (!dialog) return;
  const language = String(readPreferences().language);
  const copy = language === "EN-US"
    ? { room:"Correspondence", intro:"Subscribe, leave a note, or exchange a link.", observatory:"Observatory ↗", preview:"Preview letter", local:"Local preview", edit:"Keep writing", download:"Save as text", notice:"Previewing does not send your message.", title:"A note by the sea", friend:"Link request", draft:"Link request draft", empty:"Nothing written yet.", anonymous:"Anonymous visitor", unsent:"Local draft. Not sent." }
    : language === "JA-JP"
      ? { room:"海辺の便り", intro:"記事の購読、ひと言、リンクの交換。", observatory:"海の展望室 ↗", preview:"手紙をプレビュー", local:"ローカルプレビュー", edit:"続きを書く", download:"テキストで保存", notice:"プレビューでは送信されません。", title:"海辺に残す言葉", friend:"リンク申請", draft:"リンク申請の下書き", empty:"まだ何も書かれていません。", anonymous:"匿名の訪問者", unsent:"ローカルの下書き。未送信。" }
      : { room:"海边通信", intro:"订阅文章，留句话，或交换一个地址。", observatory:"观海室 ↗", preview:"预览信纸", local:"本机预览", edit:"继续写", download:"保存成文本", notice:"预览不会发送内容。", title:"留在海边的话", friend:"友链申请", draft:"友链申请草稿", empty:"还没有写下内容。", anonymous:"匿名访客", unsent:"本机草稿，未发送。" };
  const set = (selector:string,value:string) => { const element = root.querySelector(selector); if (element) element.textContent = value; };
  if (language !== "ZH-CN") {
    const page = root.closest("[data-communication-scene]");
    const heading = page?.querySelector(".communication-window h1");
    const intro = page?.querySelector(".communication-window > span");
    const link = page?.querySelector('.communication-room-nav a[href="/observatory/"]');
    if (heading) heading.textContent = copy.room;
    if (intro) intro.textContent = copy.intro;
    if (link) link.textContent = copy.observatory;
    if (language === "EN-US") page?.classList.add("communication-english");
  }
  root.querySelectorAll("[data-letter-preview]").forEach(element => { element.textContent = copy.preview; });
  set(".letter-preview header p span",copy.local);
  set("[data-letter-close]",copy.edit);
  set("[data-letter-download]",copy.download);
  set(".letter-preview footer p",copy.notice);
  let text = "";
  let opener: HTMLElement | null = null;
  root.querySelectorAll<HTMLButtonElement>("[data-letter-preview]").forEach(button => {
    button.addEventListener("click", () => {
      const form = button.closest("form");
      if (!form) return;
      const values = new FormData(form);
      const field = (name:string) => String(values.get(name) || "").trim();
      const friend = button.dataset.letterPreview === "friend";
      const title = friend ? field("title") || copy.friend : copy.title;
      const body = friend ? [field("url"),field("note")].filter(Boolean).join("\n\n") : field("message");
      const signature = friend ? copy.draft : field("author") || copy.anonymous;
      dialog.querySelector("[data-letter-title]")!.textContent = title;
      dialog.querySelector("[data-letter-body]")!.textContent = body || copy.empty;
      dialog.querySelector("[data-letter-signature]")!.textContent = signature;
      text = `To: Asashiki\n${title}\n\n${body}\n\n${signature}\n\n${copy.unsent}\n`;
      opener = button;
      dialog.showModal();
    });
  });
  dialog.querySelector("[data-letter-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener?.focus({preventScroll:true}));
  dialog.querySelector("[data-letter-download]")?.addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([text], {type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url; link.download = "lonely-sea-letter-draft.txt"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
