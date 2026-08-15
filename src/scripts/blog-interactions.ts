import {
  addLocalComment,
  addLocalFriendDraft,
  listLocalComments,
  listLocalFriendDrafts,
  subscribeBlogInteractions,
  type LocalBlogComment,
  type LocalFriendDraft,
} from "../lib/blog-interactions";

type InteractionController = {
  destroy: () => void;
  focusComposer: () => void;
  resetComposer: () => void;
  selectView: (view: "comments" | "friends") => void;
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
      commentText.textContent = "还没有本机留言。可以从这里留下第一句话。";
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
    commentPosition.textContent = `${commentIndex + 1} / ${comments.length}`;
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

  function renderFriend(): void {
    if (!friendTitle || !friendNote || !friendUrl || !friendPosition || !previousFriend || !nextFriend) return;
    friendDrafts = listLocalFriendDrafts();
    if (friendDrafts.length === 0) {
      friendIndex = -1;
      friendTitle.textContent = "潮汐记录";
      friendNote.textContent = "这里还没有已公开的友链数据。你可以先保存一封本机申请草稿。";
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
    friendNote.textContent = draft.note || "这是一封保存在本机、尚未发送的友链申请草稿。";
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

  function selectView(view: string): void {
    viewButtons.forEach((button) => button.setAttribute("aria-selected", String(button.dataset.blogView === view)));
    panels.forEach((panel) => {
      const selected = panel.dataset.blogPanel === view;
      panel.hidden = !selected;
      panel.setAttribute("aria-hidden", String(!selected));
    });
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
      commentFeedback.textContent = source === "game" ? "这句话已交还给故事。" : "已写入这台浏览器。";
      root.dispatchEvent(new CustomEvent("lonely-sea:comment-saved", {
        bubbles: true,
        detail: { comment },
      }));
    } catch (error) {
      commentFeedback.textContent = error instanceof Error ? error.message : "无法保存这句话";
      commentMessage.focus();
    }
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
      friendFeedback.textContent = "草稿已写入这台浏览器；尚未发送。";
      root.dispatchEvent(new CustomEvent("lonely-sea:friend-saved", {
        bubbles: true,
        detail: { draft },
      }));
    } catch (error) {
      friendFeedback.textContent = error instanceof Error ? error.message : "无法保存友链草稿";
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    const activePanel = panels.find((panel) => !panel.hidden)?.dataset.blogPanel;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      activePanel === "friends" ? moveFriend(-1) : moveComment(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      activePanel === "friends" ? moveFriend(1) : moveComment(1);
    }
  };

  const previousCommentClick = () => moveComment(-1);
  const nextCommentClick = () => moveComment(1);
  const previousFriendClick = () => moveFriend(-1);
  const nextFriendClick = () => moveFriend(1);
  previousComment.addEventListener("click", previousCommentClick);
  nextComment.addEventListener("click", nextCommentClick);
  previousFriend?.addEventListener("click", previousFriendClick);
  nextFriend?.addEventListener("click", nextFriendClick);
  commentForm.addEventListener("submit", onCommentSubmit);
  friendForm?.addEventListener("submit", onFriendSubmit);
  root.addEventListener("keydown", onKeydown);
  viewButtons.forEach((button) => button.addEventListener("click", () => selectView(button.dataset.blogView || "comments")));
  const unsubscribe = subscribeBlogInteractions(render);
  render();

  return {
    destroy() {
      unsubscribe();
      previousComment.removeEventListener("click", previousCommentClick);
      nextComment.removeEventListener("click", nextCommentClick);
      previousFriend?.removeEventListener("click", previousFriendClick);
      nextFriend?.removeEventListener("click", nextFriendClick);
      commentForm.removeEventListener("submit", onCommentSubmit);
      friendForm?.removeEventListener("submit", onFriendSubmit);
      root.removeEventListener("keydown", onKeydown);
    },
    focusComposer() {
      const activePanel = panels.find((panel) => !panel.hidden)?.dataset.blogPanel;
      if (activePanel === "friends" && friendForm) {
        formField(friendForm, "title").focus({ preventScroll: true });
      } else {
        commentMessage.focus({ preventScroll: true });
      }
    },
    resetComposer() {
      commentMessage.value = "";
      commentFeedback.textContent = "";
      if (friendFeedback) friendFeedback.textContent = "";
    },
    selectView(view) {
      selectView(view);
    },
    setContext(nextContext, nextSource = source) {
      contextKey = nextContext;
      source = nextSource;
      root.dataset.contextKey = nextContext;
      root.dataset.source = nextSource;
      commentIndex = -1;
      renderComment();
    },
    setPrompt(title, prompt, placeholder = "") {
      sceneTitle.textContent = title.slice(0, 80) || "访客对话";
      scenePrompt.textContent = prompt.slice(0, 240) || "这句话只会保存在当前浏览器。";
      commentMessage.placeholder = placeholder.slice(0, 120) || "写下想留在这段场景里的话";
    },
  };
}
