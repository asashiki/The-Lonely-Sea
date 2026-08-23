import {
  addLocalComment,
  addLocalFriendDraft,
  listLocalComments,
  listLocalFriendDrafts,
  subscribeBlogInteractions,
  type LocalBlogComment,
  type LocalFriendDraft,
} from "../lib/blog-interactions";

export type BlogInteractionView = "comments" | "friends" | "rss";

type InteractionController = {
  destroy: () => void;
  focusComposer: () => void;
  resetComposer: () => void;
  selectView: (view: BlogInteractionView) => void;
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

function publicIssueUrl(root: HTMLElement, title: string, body: string): string {
  const fallback = "https://github.com/asashiki/The-Lonely-Sea/issues/new";
  const url = new URL(root.dataset.publicIssueUrl || fallback);
  url.searchParams.set("title", title.slice(0, 120));
  url.searchParams.set("body", body.slice(0, 6000));
  return url.href;
}

function openPublicIssue(url: string): void {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
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
  const sceneTitle = required<HTMLElement>(root, "[data-blog-scene-title]");
  const scenePrompt = required<HTMLElement>(root, "[data-blog-prompt]");
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-blog-view]")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-blog-panel]")];
  const sourceValue = root.dataset.source === "game" ? "game" : "article";
  let source: "article" | "game" = sourceValue;
  let contextKey = root.dataset.contextKey || "article:/";
  let commentIndex = -1;
  let friendIndex = -1;
  let comments: LocalBlogComment[] = [];
  let friendDrafts: LocalFriendDraft[] = [];

  function renderComment(): void {
    comments = listLocalComments(contextKey);
    if (comments.length === 0) {
      commentIndex = -1;
      commentSpeaker.textContent = "潮汐记录";
      commentText.textContent = "这台浏览器里还没有留言草稿。";
      commentTime.textContent = "";
      commentTime.removeAttribute("datetime");
      commentPosition.textContent = "0 / 0";
      previousComment.disabled = true;
      nextComment.disabled = true;
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
      friendTitle.textContent = "友链申请草稿";
      friendNote.textContent = "可以先在本机写好站点信息，再决定是否公开提交。";
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
    friendNote.textContent = draft.note || "这是一封保存在本机、尚未公开提交的友链申请。";
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
    viewButtons.forEach((candidate) => candidate.setAttribute("aria-selected", String(candidate === button)));
    panels.forEach((panel) => {
      const selected = panel.dataset.blogPanel === view;
      panel.hidden = !selected;
      panel.setAttribute("aria-hidden", String(!selected));
    });
    root.dataset.activeView = view;
    if (button?.dataset.viewTitle) sceneTitle.textContent = button.dataset.viewTitle;
    if (button?.dataset.viewPrompt) scenePrompt.textContent = button.dataset.viewPrompt;
    root.dispatchEvent(new CustomEvent("lonely-sea:interaction-view-change", {
      bubbles: true,
      detail: { view },
    }));
  }

  function onCommentSubmit(event: SubmitEvent): void {
    event.preventDefault();
    commentFeedback.textContent = "";
    try {
      const comment = addLocalComment({
        contextKey,
        author: commentAuthor.value,
        message: commentMessage.value,
        source,
      });
      commentMessage.value = "";
      commentIndex = Number.MAX_SAFE_INTEGER;
      renderComment();
      commentFeedback.textContent = "已保存到这台浏览器。";
      root.dispatchEvent(new CustomEvent("lonely-sea:comment-saved", {
        bubbles: true,
        detail: { comment },
      }));
    } catch (error) {
      commentFeedback.textContent = error instanceof Error ? error.message : "无法保存这句话";
      commentMessage.focus();
    }
  }

  function onCommentPublish(): void {
    const message = commentMessage.value.trim();
    if (!message) {
      commentFeedback.textContent = "请先写下留言内容";
      commentMessage.focus();
      return;
    }
    const author = commentAuthor.value.trim() || "匿名访客";
    const body = [
      message,
      "",
      `— ${author}`,
      `来自：${window.location.href}`,
    ].join("\n");
    openPublicIssue(publicIssueUrl(root, `[访客留言] ${author}`, body));
    commentFeedback.textContent = "已打开公开留言确认页；只有在 GitHub 提交后才会公开。";
  }

  function onFriendSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (!friendForm || !friendFeedback) return;
    friendFeedback.textContent = "";
    try {
      const title = formField(friendForm, "title").value;
      const url = formField(friendForm, "url").value;
      const note = formField(friendForm, "note").value;
      const draft = addLocalFriendDraft({ title, url, note });
      friendForm.reset();
      friendIndex = Number.MAX_SAFE_INTEGER;
      renderFriend();
      friendFeedback.textContent = "草稿已保存到这台浏览器；尚未公开提交。";
      root.dispatchEvent(new CustomEvent("lonely-sea:friend-saved", {
        bubbles: true,
        detail: { draft },
      }));
    } catch (error) {
      friendFeedback.textContent = error instanceof Error ? error.message : "无法保存友链草稿";
    }
  }

  function onFriendPublish(): void {
    if (!friendForm || !friendFeedback) return;
    const title = formField(friendForm, "title").value.trim();
    const rawUrl = formField(friendForm, "url").value.trim();
    const note = formField(friendForm, "note").value.trim();
    let url: URL;
    try {
      url = new URL(rawUrl);
      if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
      friendFeedback.textContent = "请输入完整的 http 或 https 地址";
      formField(friendForm, "url").focus();
      return;
    }
    if (!title) {
      friendFeedback.textContent = "请输入站点名称";
      formField(friendForm, "title").focus();
      return;
    }
    const body = [
      `站点名称：${title}`,
      `站点地址：${url.href}`,
      note ? `站点介绍：${note}` : "站点介绍：未填写",
      "",
      "请在审核后将真实信息加入友链数据。",
    ].join("\n");
    openPublicIssue(publicIssueUrl(root, `[友链申请] ${title}`, body));
    friendFeedback.textContent = "已打开友链申请确认页；只有在 GitHub 提交后才会送达。";
  }

  async function onRssCopy(): Promise<void> {
    if (!rssInput || !rssFeedback) return;
    try {
      const copied = await copyText(rssInput.value, rssInput);
      rssFeedback.textContent = copied ? "订阅地址已复制。" : "地址已选中，请按 Ctrl+C 复制。";
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
  const commentPublish = root.querySelector<HTMLButtonElement>("[data-blog-comment-publish]");
  const friendPublish = root.querySelector<HTMLButtonElement>("[data-blog-friend-publish]");
  const viewHandlers = viewButtons.map((button) => {
    const handler = () => selectView((button.dataset.blogView || "comments") as BlogInteractionView);
    button.addEventListener("click", handler);
    return { button, handler };
  });

  previousComment.addEventListener("click", previousCommentClick);
  nextComment.addEventListener("click", nextCommentClick);
  previousFriend?.addEventListener("click", previousFriendClick);
  nextFriend?.addEventListener("click", nextFriendClick);
  commentForm.addEventListener("submit", onCommentSubmit);
  commentPublish?.addEventListener("click", onCommentPublish);
  friendForm?.addEventListener("submit", onFriendSubmit);
  friendPublish?.addEventListener("click", onFriendPublish);
  rssCopy?.addEventListener("click", onRssCopy);
  root.addEventListener("keydown", onKeydown);
  const unsubscribe = subscribeBlogInteractions(render);
  render();
  selectView((root.dataset.activeView || "comments") as BlogInteractionView);

  return {
    destroy() {
      unsubscribe();
      previousComment.removeEventListener("click", previousCommentClick);
      nextComment.removeEventListener("click", nextCommentClick);
      previousFriend?.removeEventListener("click", previousFriendClick);
      nextFriend?.removeEventListener("click", nextFriendClick);
      commentForm.removeEventListener("submit", onCommentSubmit);
      commentPublish?.removeEventListener("click", onCommentPublish);
      friendForm?.removeEventListener("submit", onFriendSubmit);
      friendPublish?.removeEventListener("click", onFriendPublish);
      rssCopy?.removeEventListener("click", onRssCopy);
      root.removeEventListener("keydown", onKeydown);
      viewHandlers.forEach(({ button, handler }) => button.removeEventListener("click", handler));
    },
    focusComposer() {
      const activePanel = panels.find((panel) => !panel.hidden)?.dataset.blogPanel;
      if (activePanel === "friends" && friendForm) {
        formField(friendForm, "title").focus({ preventScroll: true });
      } else if (activePanel === "rss" && rssCopy) {
        rssCopy.focus({ preventScroll: true });
      } else {
        commentMessage.focus({ preventScroll: true });
      }
    },
    resetComposer() {
      commentMessage.value = "";
      commentFeedback.textContent = "";
      if (friendFeedback) friendFeedback.textContent = "";
      if (rssFeedback) rssFeedback.textContent = "复制后粘贴到任意 RSS 阅读器即可。";
    },
    selectView,
    setContext(nextContext, nextSource = source) {
      contextKey = nextContext;
      source = nextSource;
      root.dataset.contextKey = nextContext;
      root.dataset.source = nextSource;
      commentIndex = -1;
      renderComment();
    },
    setPrompt(title, nextPrompt, placeholder = "") {
      sceneTitle.textContent = title.slice(0, 80) || "访客留言";
      scenePrompt.textContent = nextPrompt.slice(0, 240) || "这里可以留下想说的话。";
      commentMessage.placeholder = placeholder.slice(0, 120) || "写下想留在这片海里的话";
    },
  };
}
