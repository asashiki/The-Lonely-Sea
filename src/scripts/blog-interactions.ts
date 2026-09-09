import {
  addLocalComment,
  addLocalFriendDraft,
  listLocalComments,
  listLocalFriendDrafts,
  subscribeBlogInteractions,
  type LocalBlogComment,
  type LocalFriendDraft,
} from "../lib/blog-interactions";
import { readPreferences } from "./experience/preferences.js";

export type BlogInteractionView = "comments" | "friends" | "rss";

const INTERACTION_COPY: Record<string, Record<string, string>> = {
  "EN-US": {
    "访客留言": "Guestbook", "这里可以留下想说的话。": "Leave whatever you would like to say here.",
    "接收新文章": "New articles", "留下一句话": "Leave a message", "交换友链": "Link exchange",
    "选择一篇文章": "Choose an article", "暂无公开文章。": "No public articles yet.",
    "RSS 地址": "RSS address", "复制订阅地址": "Copy feed address", "返回剧情": "Return to story",
    "上一句": "Previous", "下一句": "Next", "上一封": "Previous", "下一封": "Next",
    "你想留下什么？": "What would you like to leave here?", "称呼": "Name", "留言": "Message",
    "留下留言": "Leave message", "查看留言": "Read messages", "继续留言": "Write another",
    "已经相连的站点": "Connected sites", "暂无公开友链。": "No public links yet.",
    "写一封交换友链的来信？": "Send a link-exchange letter?",
    "站点名称": "Site name", "站点地址": "Site address", "发送申请": "Send request", "查看友链": "View links",
    "给灯塔留下一句话": "Leave a message for the lighthouse", "写完后由爱丽丝收进灯塔的访客簿。": "Alice will place it in the lighthouse guestbook.",
    "灯塔访客簿": "Lighthouse guestbook", "这里收着这台设备留下的话。": "Messages saved on this device are kept here.",
    "海上航标": "Beacons at sea", "这些是已经与灯塔互相照见的站点。": "These sites already exchange light with the lighthouse.",
    "写一封航标来信": "Write a beacon letter", "写下站名、地址和一两句介绍，我会替您收好。": "Add the site name, address, and a short introduction. I will keep it safe.",
    "潮汐订阅": "Tide feed", "选择文章会在新标签页打开；当前剧情会留在这里。": "Articles open in a new tab while the story remains here.",
    "匿名访客": "Anonymous visitor", "写下想留在这片海里的话": "Write what you want to leave by this sea",
    "你的站点名称": "Your site name", "订阅地址已复制。": "Feed address copied.",
    "友链申请草稿": "Link request draft", "可以先在本机写好站点信息，再决定是否公开提交。": "Save the site details on this device before deciding whether to publish them.",
    "这是一封保存在本机、尚未公开提交的友链申请。": "This link request is stored on this device and has not been published.",
    "已经送进灯塔的访客簿。": "Added to the lighthouse guestbook.", "已经收进这台浏览器的访客簿。": "Saved to this browser's guestbook.",
    "航标来信已经送达。": "Beacon letter delivered.", "航标来信已经保存在这台浏览器。": "Beacon letter saved in this browser.",
    "地址已选中，请按 Ctrl+C 复制。": "Address selected. Press Ctrl+C to copy.",
  },
  "JA-JP": {
    "访客留言": "ゲストメッセージ", "这里可以留下想说的话。": "ここに伝えたい言葉を残せます。",
    "接收新文章": "新着記事", "留下一句话": "メッセージを残す", "交换友链": "リンク交換",
    "选择一篇文章": "記事を選ぶ", "暂无公开文章。": "公開記事はまだありません。",
    "RSS 地址": "RSS アドレス", "复制订阅地址": "購読アドレスをコピー", "返回剧情": "物語へ戻る",
    "上一句": "前へ", "下一句": "次へ", "上一封": "前へ", "下一封": "次へ",
    "你想留下什么？": "何を残しますか？", "称呼": "お名前", "留言": "メッセージ",
    "留下留言": "メッセージを残す", "查看留言": "メッセージを見る", "继续留言": "もう一度書く",
    "已经相连的站点": "つながっているサイト", "暂无公开友链。": "公開リンクはまだありません。",
    "写一封交换友链的来信？": "リンク交換の手紙を書きますか？", "站点名称": "サイト名",
    "站点地址": "サイト URL", "发送申请": "送信", "查看友链": "リンクを見る",
    "给灯塔留下一句话": "灯台へひと言", "写完后由爱丽丝收进灯塔的访客簿。": "書き終えたら、アリスが灯台のゲストブックへ収めます。",
    "灯塔访客簿": "灯台のゲストブック", "这里收着这台设备留下的话。": "この端末に残した言葉を収めています。",
    "海上航标": "海の航標", "这些是已经与灯塔互相照见的站点。": "灯台と光を交わしているサイトです。",
    "写一封航标来信": "航標の手紙を書く", "写下站名、地址和一两句介绍，我会替您收好。": "サイト名と URL、短い紹介を書いてください。大切に預かります。",
    "潮汐订阅": "潮汐の購読", "选择文章会在新标签页打开；当前剧情会留在这里。": "記事は新しいタブで開き、物語はここに残ります。",
    "匿名访客": "匿名の訪問者", "写下想留在这片海里的话": "この海に残したい言葉を書く",
    "你的站点名称": "サイト名", "订阅地址已复制。": "購読アドレスをコピーしました。",
    "友链申请草稿": "リンク申請の下書き", "可以先在本机写好站点信息，再决定是否公开提交。": "サイト情報をこの端末に保存してから、公開するか決められます。",
    "这是一封保存在本机、尚未公开提交的友链申请。": "この端末に保存され、まだ公開されていないリンク申請です。",
    "已经送进灯塔的访客簿。": "灯台のゲストブックへ届けました。", "已经收进这台浏览器的访客簿。": "このブラウザのゲストブックへ保存しました。",
    "航标来信已经送达。": "航標の手紙を届けました。", "航标来信已经保存在这台浏览器。": "航標の手紙をこのブラウザへ保存しました。",
    "地址已选中，请按 Ctrl+C 复制。": "アドレスを選択しました。Ctrl+C でコピーしてください。",
  },
};

function interactionCopy(source: string): string {
  return INTERACTION_COPY[String(readPreferences().language)]?.[source] || source;
}

type InteractionController = {
  destroy: () => void;
  focusComposer: () => void;
  resetComposer: () => void;
  selectView: (view: BlogInteractionView) => void;
  setIntent: (intent: "view" | "compose") => void;
  setContext: (contextKey: string, source?: "article" | "game") => void;
  setPrompt: (title: string, prompt: string, placeholder?: string) => void;
};

function required<T extends Element>(root: ParentNode, selector: string): T {
  const value = root.querySelector<T>(selector);
  if (!value) throw new Error(`Blog interaction 缺少 ${selector}`);
  return value;
}

function formatLocalTime(value: string): string {
  try {
    return new Intl.DateTimeFormat(document.documentElement.lang || "zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 16).replace("T", " ");
  }
}

function formField(form: HTMLFormElement, name: string): HTMLInputElement | HTMLTextAreaElement {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
    throw new Error(`Blog interaction 缺少字段 ${name}`);
  }
  return field;
}

async function deliver(root: HTMLElement, payload: Record<string, unknown>): Promise<boolean> {
  const endpoint = root.dataset.messageEndpoint?.trim();
  if (!endpoint) return false;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function copyText(value: string, input?: HTMLInputElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {}
  if (!input) throw new Error("当前浏览器不允许自动复制，请手动选择地址");
  input.focus({ preventScroll: true });
  input.select();
  return false;
}

export function initBlogInteractionScene(root: HTMLElement): InteractionController {
  const commentForm = required<HTMLFormElement>(root, "[data-blog-comment-form]");
  const commentAuthor = formField(commentForm, "author") as HTMLInputElement;
  const commentMessage = formField(commentForm, "message") as HTMLTextAreaElement;
  const commentFeedback = required<HTMLElement>(root, "[data-blog-comment-feedback]");
  const commentSpeaker = required<HTMLElement>(root, "[data-blog-comment-author]");
  const commentText = required<HTMLElement>(root, "[data-blog-comment-message]");
  const commentTime = required<HTMLTimeElement>(root, "[data-blog-comment-time]");
  const commentPosition = required<HTMLElement>(root, "[data-blog-comment-position]");
  const previousComment = required<HTMLButtonElement>(root, "[data-blog-previous]");
  const nextComment = required<HTMLButtonElement>(root, "[data-blog-next]");
  const commentList = root.querySelector<HTMLOListElement>("[data-blog-comment-list]");
  const sceneTitle = required<HTMLElement>(root, "[data-blog-scene-title]");
  const scenePrompt = required<HTMLElement>(root, "[data-blog-prompt]");
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-blog-view]")];
  const commentIntentButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-comment-intent]")];
  const friendIntentButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-friend-intent]")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-blog-panel]")];
  const sourceValue = root.dataset.source === "game" ? "game" : "article";
  let source: "article" | "game" = sourceValue;
  let contextKey = root.dataset.contextKey || "article:/";
  let commentIndex = -1;
  let friendIndex = -1;
  let comments: LocalBlogComment[] = [];
  let friendDrafts: LocalFriendDraft[] = [];
  let promptWasSetByStory = false;
  let storyTitleSource = "";
  let storyPromptSource = "";
  let storyPlaceholderSource = "";
  const copyNodes = [...root.querySelectorAll<HTMLElement>([
    "[data-blog-view] span",
    ".blog-rss-feed h3",
    ".blog-rss-subscribe label > span",
    "[data-rss-copy]",
    "[data-host-dialog-cancel]",
    ".blog-dialogue-stepper button",
    ".blog-scene-question",
    ".blog-dialogue-composer label > span",
    ".blog-dialogue-actions button",
    ".blog-published-friends h3",
    ".blog-scene-empty",
  ].join(","))];
  copyNodes.forEach((node) => {
    node.dataset.blogCopySource = node.textContent?.trim() || "";
  });
  const placeholderFields = [...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[placeholder], textarea[placeholder]")];
  placeholderFields.forEach((field) => {
    field.dataset.blogPlaceholderSource = field.placeholder;
  });

  function translatedControl(source: string): string {
    const leading = source.startsWith("‹") ? "‹ " : "";
    const trailing = source.endsWith("›") ? " ›" : "";
    const core = source.replace(/^‹\s*/, "").replace(/\s*›$/, "");
    return `${leading}${interactionCopy(core)}${trailing}`;
  }

  function applyInterfaceLanguage(): void {
    copyNodes.forEach((node) => {
      node.textContent = translatedControl(node.dataset.blogCopySource || "");
    });
    placeholderFields.forEach((field) => {
      field.placeholder = interactionCopy(field.dataset.blogPlaceholderSource || "");
    });
    if (promptWasSetByStory) {
      sceneTitle.textContent = interactionCopy(storyTitleSource).slice(0, 80) || interactionCopy("访客留言");
      scenePrompt.textContent = interactionCopy(storyPromptSource).slice(0, 240) || interactionCopy("这里可以留下想说的话。");
      commentMessage.placeholder = interactionCopy(storyPlaceholderSource || "写下想留在这片海里的话").slice(0, 120);
    }
    render();
  }

  function renderCommentList(): void {
    if (!commentList) return;
    const fragment = document.createDocumentFragment();
    comments.forEach((comment, index) => {
      const item = document.createElement("li");
      const speaker = document.createElement("strong");
      const message = document.createElement("p");
      const time = document.createElement("time");
      item.classList.toggle("is-current", index === commentIndex);
      speaker.textContent = comment.author;
      message.textContent = comment.message;
      time.dateTime = comment.createdAt;
      time.textContent = formatLocalTime(comment.createdAt);
      item.append(speaker, message, time);
      fragment.append(item);
    });
    commentList.replaceChildren(fragment);
    commentList.hidden = comments.length === 0;
  }

  function renderComment(): void {
    comments = listLocalComments(contextKey);
    if (comments.length === 0) {
      commentIndex = -1;
      const language = String(readPreferences().language);
      commentSpeaker.textContent = language === "JA-JP" ? "アリス" : language === "EN-US" ? "Alice" : "爱丽丝";
      commentText.textContent = language === "JA-JP"
        ? "ここには、訪れた人の言葉が残ります。最初の一言を聞かせてください。"
        : language === "EN-US"
          ? "Messages from visitors remain here. I would love to hear the first one from you."
          : "来访者写下的话会留在这里。第一句话，就等您来写了。";
      commentTime.textContent = "";
      commentTime.removeAttribute("datetime");
      commentPosition.textContent = "1 / 1";
      previousComment.disabled = true;
      nextComment.disabled = true;
      renderCommentList();
      return;
    }
    if (commentIndex < 0 || commentIndex >= comments.length) commentIndex = comments.length - 1;
    const comment = comments[commentIndex];
    if (!comment) return;
    commentSpeaker.textContent = comment.author;
    commentText.textContent = comment.message;
    commentTime.dateTime = comment.createdAt;
    commentTime.textContent = formatLocalTime(comment.createdAt);
    commentPosition.textContent = `${commentIndex + 1} / ${comments.length} · 本机`;
    previousComment.disabled = comments.length < 2;
    nextComment.disabled = comments.length < 2;
    renderCommentList();
  }

  const friendTitle = root.querySelector<HTMLElement>("[data-blog-friend-title]");
  const friendNote = root.querySelector<HTMLElement>("[data-blog-friend-note]");
  const friendUrl = root.querySelector<HTMLAnchorElement>("[data-blog-friend-url]");
  const friendPosition = root.querySelector<HTMLElement>("[data-blog-friend-position]");
  const previousFriend = root.querySelector<HTMLButtonElement>("[data-blog-friend-previous]");
  const nextFriend = root.querySelector<HTMLButtonElement>("[data-blog-friend-next]");
  const friendForm = root.querySelector<HTMLFormElement>("[data-blog-friend-form]");
  const friendFeedback = root.querySelector<HTMLElement>("[data-blog-friend-feedback]");
  const rssInput = root.querySelector<HTMLInputElement>("[data-rss-url]");
  const rssCopy = root.querySelector<HTMLButtonElement>("[data-rss-copy]");
  const rssFeedback = root.querySelector<HTMLElement>("[data-rss-feedback]");

  function renderFriend(): void {
    if (!friendTitle || !friendNote || !friendUrl || !friendPosition || !previousFriend || !nextFriend) return;
    friendDrafts = listLocalFriendDrafts();
    if (friendDrafts.length === 0) {
      friendIndex = -1;
      friendTitle.textContent = interactionCopy("友链申请草稿");
      friendNote.textContent = interactionCopy("可以先在本机写好站点信息，再决定是否公开提交。");
      friendUrl.hidden = true;
      friendUrl.removeAttribute("href");
      friendPosition.textContent = "0 / 0";
      previousFriend.disabled = true;
      nextFriend.disabled = true;
      return;
    }
    if (friendIndex < 0 || friendIndex >= friendDrafts.length) friendIndex = friendDrafts.length - 1;
    const draft = friendDrafts[friendIndex];
    if (!draft) return;
    friendTitle.textContent = draft.title;
    friendNote.textContent = draft.note || interactionCopy("这是一封保存在本机、尚未公开提交的友链申请。");
    friendUrl.href = draft.url;
    friendUrl.hidden = false;
    friendPosition.textContent = `${friendIndex + 1} / ${friendDrafts.length} · 本机草稿`;
    previousFriend.disabled = friendDrafts.length < 2;
    nextFriend.disabled = friendDrafts.length < 2;
  }

  function render(): void {
    renderComment();
    renderFriend();
  }

  function setIntent(intent: "view" | "compose"): void {
    root.dataset.interactionIntent = intent;
    render();
  }

  function moveComment(offset: number): void {
    if (comments.length < 2) return;
    commentIndex = (commentIndex + offset + comments.length) % comments.length;
    renderComment();
  }

  function moveFriend(offset: number): void {
    if (friendDrafts.length < 2) return;
    friendIndex = (friendIndex + offset + friendDrafts.length) % friendDrafts.length;
    renderFriend();
  }

  function selectView(view: BlogInteractionView): void {
    const button = viewButtons.find((candidate) => candidate.dataset.blogView === view);
    if (!panels.some((panel) => panel.dataset.blogPanel === view)) return;
    viewButtons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.dataset.blogPanel === view;
      panel.hidden = !selected;
      panel.setAttribute("aria-hidden", String(!selected));
    });
    root.dataset.activeView = view;
    if (!promptWasSetByStory) {
      if (button?.dataset.viewTitle) sceneTitle.textContent = interactionCopy(button.dataset.viewTitle);
      if (button?.dataset.viewPrompt) scenePrompt.textContent = interactionCopy(button.dataset.viewPrompt);
    }
    root.dispatchEvent(new CustomEvent("lonely-sea:interaction-view-change", {
      bubbles: true,
      detail: { view },
    }));
  }

  async function onCommentSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    commentFeedback.textContent = "";
    try {
      const comment = addLocalComment({
        contextKey,
        author: commentAuthor.value,
        message: commentMessage.value,
        source,
      });
      const delivered = await deliver(root, {
        kind: "comment",
        contextKey,
        author: comment.author,
        message: comment.message,
        source,
        createdAt: comment.createdAt,
      });
      commentMessage.value = "";
      commentIndex = Number.MAX_SAFE_INTEGER;
      renderComment();
      commentFeedback.textContent = interactionCopy(delivered ? "已经送进灯塔的访客簿。" : "已经收进这台浏览器的访客簿。");
      root.dispatchEvent(new CustomEvent("lonely-sea:comment-saved", {
        bubbles: true,
        detail: { comment },
      }));
    } catch (error) {
      commentFeedback.textContent = error instanceof Error ? error.message : "无法保存这句话";
      commentMessage.focus();
    }
  }

  async function onFriendSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!friendForm || !friendFeedback) return;
    friendFeedback.textContent = "";
    try {
      const title = formField(friendForm, "title").value;
      const url = formField(friendForm, "url").value;
      const noteField = friendForm.elements.namedItem("note");
      const note = noteField instanceof HTMLTextAreaElement ? noteField.value : "";
      const draft = addLocalFriendDraft({ title, url, note });
      const delivered = await deliver(root, {
        kind: "friend",
        title: draft.title,
        url: draft.url,
        note: draft.note,
        createdAt: draft.createdAt,
      });
      friendForm.reset();
      friendIndex = Number.MAX_SAFE_INTEGER;
      renderFriend();
      friendFeedback.textContent = interactionCopy(delivered ? "航标来信已经送达。" : "航标来信已经保存在这台浏览器。");
      root.dispatchEvent(new CustomEvent("lonely-sea:friend-saved", {
        bubbles: true,
        detail: { draft },
      }));
    } catch (error) {
      friendFeedback.textContent = error instanceof Error ? error.message : "无法保存友链草稿";
    }
  }

  async function onRssCopy(): Promise<void> {
    if (!rssInput || !rssFeedback) return;
    try {
      const copied = await copyText(rssInput.value, rssInput);
      rssFeedback.textContent = interactionCopy(copied ? "订阅地址已复制。" : "地址已选中，请按 Ctrl+C 复制。");
      if (copied) {
        root.dispatchEvent(new CustomEvent("lonely-sea:rss-copied", {
          bubbles: true,
          detail: { url: rssInput.value },
        }));
      }
    } catch (error) {
      rssFeedback.textContent = error instanceof Error ? error.message : "无法复制订阅地址";
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    const viewButton = target instanceof HTMLButtonElement && target.dataset.blogView ? target : null;
    if (viewButton && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      const index = Math.max(0, viewButtons.indexOf(viewButton));
      const offset = event.key === "ArrowLeft" ? -1 : 1;
      const next = viewButtons[(index + offset + viewButtons.length) % viewButtons.length];
      const view = next?.dataset.blogView as BlogInteractionView | undefined;
      if (view) {
        selectView(view);
        next.focus({ preventScroll: true });
      }
      return;
    }
    const activePanel = panels.find((panel) => !panel.hidden)?.dataset.blogPanel;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      activePanel === "friends" ? moveFriend(-1) : activePanel === "comments" && moveComment(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      activePanel === "friends" ? moveFriend(1) : activePanel === "comments" && moveComment(1);
    }
  };

  const previousCommentClick = () => moveComment(-1);
  const nextCommentClick = () => moveComment(1);
  const previousFriendClick = () => moveFriend(-1);
  const nextFriendClick = () => moveFriend(1);
  const viewHandlers = viewButtons.map((button) => {
    const handler = () => selectView((button.dataset.blogView || "comments") as BlogInteractionView);
    button.addEventListener("click", handler);
    return { button, handler };
  });
  const commentIntentHandlers = commentIntentButtons.map((button) => {
    const handler = () => setIntent(button.dataset.commentIntent === "view" ? "view" : "compose");
    button.addEventListener("click", handler);
    return { button, handler };
  });
  const friendIntentHandlers = friendIntentButtons.map((button) => {
    const handler = () => setIntent(button.dataset.friendIntent === "compose" ? "compose" : "view");
    button.addEventListener("click", handler);
    return { button, handler };
  });

  previousComment.addEventListener("click", previousCommentClick);
  nextComment.addEventListener("click", nextCommentClick);
  previousFriend?.addEventListener("click", previousFriendClick);
  nextFriend?.addEventListener("click", nextFriendClick);
  commentForm.addEventListener("submit", onCommentSubmit);
  friendForm?.addEventListener("submit", onFriendSubmit);
  rssCopy?.addEventListener("click", onRssCopy);
  root.addEventListener("keydown", onKeydown);
  const unsubscribe = subscribeBlogInteractions(render);
  render();
  selectView((root.dataset.activeView || "comments") as BlogInteractionView);
  applyInterfaceLanguage();
  const handleLanguageChange = () => applyInterfaceLanguage();
  window.addEventListener("lonely-sea:preferences-change", handleLanguageChange);

  return {
    destroy() {
      unsubscribe();
      previousComment.removeEventListener("click", previousCommentClick);
      nextComment.removeEventListener("click", nextCommentClick);
      previousFriend?.removeEventListener("click", previousFriendClick);
      nextFriend?.removeEventListener("click", nextFriendClick);
      commentForm.removeEventListener("submit", onCommentSubmit);
      friendForm?.removeEventListener("submit", onFriendSubmit);
      rssCopy?.removeEventListener("click", onRssCopy);
      root.removeEventListener("keydown", onKeydown);
      window.removeEventListener("lonely-sea:preferences-change", handleLanguageChange);
      viewHandlers.forEach(({ button, handler }) => button.removeEventListener("click", handler));
      commentIntentHandlers.forEach(({ button, handler }) => button.removeEventListener("click", handler));
      friendIntentHandlers.forEach(({ button, handler }) => button.removeEventListener("click", handler));
    },
    focusComposer() {
      const activePanel = panels.find((panel) => !panel.hidden)?.dataset.blogPanel;
      if (activePanel === "friends" && root.dataset.interactionIntent === "view") {
        root.querySelector<HTMLButtonElement>("[data-friend-intent='compose']")?.focus({ preventScroll: true });
      } else if (activePanel === "friends" && friendForm) {
        formField(friendForm, "title").focus({ preventScroll: true });
      } else if (activePanel === "rss" && rssCopy) {
        rssCopy.focus({ preventScroll: true });
      } else if (root.dataset.interactionIntent === "view") {
        previousComment.focus({ preventScroll: true });
      } else {
        commentMessage.focus({ preventScroll: true });
      }
    },
    resetComposer() {
      commentAuthor.value = "";
      commentMessage.value = "";
      commentFeedback.textContent = "";
      friendForm?.reset();
      if (friendFeedback) friendFeedback.textContent = "";
      if (rssFeedback) rssFeedback.textContent = "";
    },
    selectView,
    setIntent,
    setContext(nextContext, nextSource = source) {
      contextKey = nextContext;
      source = nextSource;
      promptWasSetByStory = false;
      root.dataset.contextKey = nextContext;
      root.dataset.source = nextSource;
      commentIndex = -1;
      renderComment();
    },
    setPrompt(title, nextPrompt, placeholder = "") {
      promptWasSetByStory = true;
      storyTitleSource = title;
      storyPromptSource = nextPrompt;
      storyPlaceholderSource = placeholder;
      sceneTitle.textContent = interactionCopy(title).slice(0, 80) || interactionCopy("访客留言");
      scenePrompt.textContent = interactionCopy(nextPrompt).slice(0, 240) || interactionCopy("这里可以留下想说的话。");
      commentMessage.placeholder = interactionCopy(placeholder || "写下想留在这片海里的话").slice(0, 120);
    },
  };
}
