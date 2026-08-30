import {
  consumeGalBlogLaunchIntent,
  createDefaultLaunchIntent,
  createSaveLaunchUrl,
} from "../../lib/gal-blog/launch-session";
import { getGalBlogSave } from "../../lib/gal-blog/save-store";
import type { RegisteredGame } from "../../lib/gal-blog/release-registry";
import { GalBlogHost, type HostState } from "./gal-blog-host";
import { initLoadTracksXiiiConcept } from "./load-tracks-xiii.js";
import { initOptions } from "./options.js";
import { readPreferences, syncForcedLandscape } from "./preferences.js";
import { initAchievementSystem } from "../../lib/experience-achievements";
import { initBlogInteractionScene } from "../blog-interactions";

type PageConfig = {
  game: RegisteredGame;
  articles: Array<{ slug: string; path: string }>;
};

const root = document.querySelector<HTMLElement>("[data-gal-blog-host]");
const configNode = document.querySelector<HTMLScriptElement>("#gal-blog-host-config");

if (root && configNode) {
  initAchievementSystem();
  const hostRoot = root;
  const iframe = hostRoot.querySelector<HTMLIFrameElement>("[data-game-frame]");
  const status = hostRoot.querySelector<HTMLElement>("[data-host-status]");
  const statusMessage = hostRoot.querySelector<HTMLElement>("[data-host-status-message]");
  const errorReturn = hostRoot.querySelector<HTMLAnchorElement>("[data-host-error-return]");
  const commentDialog = document.querySelector<HTMLDialogElement>("[data-host-comment-dialog]");
  const commentScene = commentDialog?.querySelector<HTMLElement>("[data-blog-interaction]");
  const commentController = commentScene ? initBlogInteractionScene(commentScene) : null;
  const settingsScreen = document.querySelector<HTMLElement>(".option-screen");
  const settingsBack = settingsScreen?.querySelector<HTMLButtonElement>("[data-back]");
  const loadScreen = document.querySelector<HTMLElement>("[data-host-load]");
  const loadBack = loadScreen?.querySelector<HTMLButtonElement>("[data-back]");
  let resolveSettings: ((result: { status: "success" | "cancel" }) => void) | null = null;
  let resolveLoad: ((result: {
    status: "success" | "cancel" | "failure";
    slot?: number;
    navigateTo?: string;
    target?: { kind: "save-point"; id: string };
    state?: { variables: Record<string, string | number | boolean>; records: string[] };
    message?: string;
  }) => void) | null = null;
  let loadOperation: "save" | "load" = "load";
  let activeReleaseId = "";

  window.addEventListener("pagehide", () => commentController?.destroy(), { once: true });

  document.body.dataset.scene = "night";
  document.body.dataset.route = "game";
  const portraitMedia = window.matchMedia("(orientation: portrait)");
  const syncGameLandscape = () => syncForcedLandscape(readPreferences());
  syncGameLandscape();
  window.addEventListener("resize", syncGameLandscape, { passive: true });
  portraitMedia.addEventListener("change", syncGameLandscape);
  window.addEventListener("pagehide", () => {
    window.removeEventListener("resize", syncGameLandscape);
    portraitMedia.removeEventListener("change", syncGameLandscape);
  }, { once: true });
  const optionController = settingsScreen ? initOptions({
    onReplayOpening() {
      try { sessionStorage.removeItem("lonely-sea-opening-seen"); } catch {}
      window.location.assign("/");
    },
    onResetExperience() {
      try { localStorage.removeItem("lonely-sea-experience-v1"); } catch {}
    },
  }) : null;
  const systemReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const loadController = loadScreen ? initLoadTracksXiiiConcept({
    root: loadScreen,
    reduceMotion: {
      get matches() {
        return systemReduceMotion.matches || readPreferences().reducedMotion;
      },
    },
    initialPage: "game",
    initialGameFilter: "save",
    initialSaveOperation: "load",
    onBack() {
      closeLoad({ status: "cancel" });
    },
    onSaveSlot({ slot }: { slot: number }) {
      closeLoad({ status: "success", slot });
    },
  }) : null;

  function openCommentForm(
    input: Record<string, unknown>,
    gameSlug: string,
  ): Promise<{ status: "success" | "cancel" | "failure"; value?: string; message?: string }> {
    if (!commentDialog || !commentScene || !commentController || commentDialog.open) {
      return Promise.resolve({ status: "failure", message: "留言界面当前不可用" });
    }
    commentController.setContext(`game:${gameSlug}`, "game");
    commentController.setPrompt(
      typeof input.title === "string" ? input.title : "留下这段话",
      typeof input.prompt === "string" ? input.prompt : "输入会返回当前游戏，并保存在这台设备的本地记录中。",
      typeof input.placeholder === "string" ? input.placeholder : "",
    );
    const requestedMode = typeof input.scene === "string" ? input.scene : input.mode;
    const interactionMode = requestedMode === "friends"
      ? "friends"
      : requestedMode === "rss"
        ? "rss"
        : "comments";
    commentController.selectView(interactionMode);
    commentController.setIntent(input.mode === "compose" ? "compose" : "view");
    commentController.resetComposer();

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: { status: "success" | "cancel" | "failure"; value?: string; message?: string }) => {
        if (settled) return;
        settled = true;
        commentScene.removeEventListener("lonely-sea:comment-saved", saved);
        commentScene.removeEventListener("lonely-sea:friend-saved", friendSaved);
        commentScene.removeEventListener("lonely-sea:rss-copied", rssCopied);
        commentDialog.removeEventListener("cancel", cancel);
        cancelButtons.forEach((button) => button.removeEventListener("click", cancelClick));
        if (commentDialog.open) commentDialog.close(result.status);
        if (iframe) iframe.inert = false;
        resolve(result);
      };
      const saved = (event: Event) => {
        const value = (event as CustomEvent).detail?.comment?.message;
        finish({ status: "success", value: typeof value === "string" ? value : "" });
      };
      const friendSaved = (event: Event) => {
        const value = (event as CustomEvent).detail?.draft?.url;
        finish({ status: "success", value: typeof value === "string" ? value : "" });
      };
      const rssCopied = (event: Event) => {
        const value = (event as CustomEvent).detail?.url;
        finish({ status: "success", value: typeof value === "string" ? value : "" });
      };
      const cancel = (event: Event) => {
        event.preventDefault();
        finish({ status: "cancel" });
      };
      const cancelClick = () => finish({ status: "cancel" });
      const cancelButtons = [...commentScene.querySelectorAll<HTMLButtonElement>("[data-host-dialog-cancel]")];
      commentScene.addEventListener("lonely-sea:comment-saved", saved);
      commentScene.addEventListener("lonely-sea:friend-saved", friendSaved);
      commentScene.addEventListener("lonely-sea:rss-copied", rssCopied);
      commentDialog.addEventListener("cancel", cancel);
      cancelButtons.forEach((button) => button.addEventListener("click", cancelClick));
      if (iframe) iframe.inert = true;
      commentDialog.showModal();
      window.requestAnimationFrame(() => commentController.focusComposer());
    });
  }

  function closeSettings(status: "success" | "cancel" = "success"): void {
    if (!settingsScreen || settingsScreen.getAttribute("aria-hidden") === "true") return;
    settingsScreen.setAttribute("aria-hidden", "true");
    hostRoot.classList.remove("is-option-open");
    if (iframe) iframe.inert = false;
    optionController?.deactivate();
    const resolve = resolveSettings;
    resolveSettings = null;
    resolve?.({ status });
    iframe?.focus({ preventScroll: true });
  }

  function closeLoad(result: {
    status: "success" | "cancel" | "failure";
    slot?: number;
    navigateTo?: string;
    target?: { kind: "save-point"; id: string };
    state?: { variables: Record<string, string | number | boolean>; records: string[] };
    message?: string;
  } = { status: "cancel" }): void {
    if (!loadScreen || loadScreen.hidden) return;
    loadController?.deactivate();
    loadScreen.hidden = true;
    loadScreen.setAttribute("aria-hidden", "true");
    hostRoot.classList.remove("is-load-open");
    if (iframe) iframe.inert = false;
    const resolve = resolveLoad;
    resolveLoad = null;
    resolve?.(result);
    iframe?.focus({ preventScroll: true });
  }

  settingsBack?.addEventListener("click", (event) => {
    event.preventDefault();
    closeSettings("success");
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (loadScreen && !loadScreen.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeLoad({ status: "cancel" });
      return;
    }
    if (settingsScreen?.getAttribute("aria-hidden") !== "false") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeSettings("cancel");
  }, true);

  function openSettings(): Promise<{ status: "success" | "cancel" }> {
    if (!settingsScreen || !settingsBack || resolveSettings || resolveLoad) return Promise.resolve({ status: "cancel" });
    optionController?.activate();
    settingsBack.setAttribute("aria-label", "返回游戏");
    settingsBack.title = "返回游戏";
    settingsScreen.setAttribute("aria-hidden", "false");
    hostRoot.classList.add("is-option-open");
    if (iframe) iframe.inert = true;
    settingsBack.focus({ preventScroll: true });
    return new Promise((resolve) => {
      resolveSettings = resolve;
    });
  }

  function openLoad(input: Record<string, unknown>): Promise<{
    status: "success" | "cancel" | "failure";
    slot?: number;
    navigateTo?: string;
    target?: { kind: "save-point"; id: string };
    state?: { variables: Record<string, string | number | boolean>; records: string[] };
    message?: string;
  }> {
    if (!loadScreen || !loadBack || !loadController || resolveLoad || resolveSettings) {
      return Promise.resolve({ status: "failure", message: "SAVE DATA 当前不可用" });
    }
    loadOperation = input.operation === "save" ? "save" : "load";
    loadScreen.dataset.saveOperation = loadOperation;
    loadController.setSaveOperation(loadOperation);
    loadScreen.hidden = false;
    loadScreen.setAttribute("aria-hidden", "false");
    hostRoot.classList.add("is-load-open");
    if (iframe) iframe.inert = true;
    loadController.activate();
    loadBack.setAttribute("aria-label", "返回游戏");
    loadBack.title = "返回游戏";
    loadBack.focus({ preventScroll: true });
    return new Promise((resolve) => {
      resolveLoad = resolve;
    });
  }

  window.addEventListener("lonely-sea:save-select", (event) => {
    if (!resolveLoad || loadOperation !== "load") return;
    const saveId = (event as CustomEvent).detail?.saveId;
    const save = typeof saveId === "string" ? getGalBlogSave(saveId) : null;
    if (!save) {
      closeLoad({ status: "failure", message: "存档已经不存在" });
      return;
    }
    if (save.releaseId === activeReleaseId) {
      closeLoad({
        status: "success",
        target: save.target,
        state: { variables: save.variables, records: save.records },
      });
      return;
    }
    closeLoad({ status: "success", navigateTo: createSaveLaunchUrl(save) });
  });

  function setState(state: HostState | "unavailable", message: string): void {
    hostRoot.dataset.hostState = state;
    if (status) {
      status.hidden = false;
      status.inert = state === "ready";
      status.setAttribute("aria-hidden", String(state === "ready"));
    }
    if (statusMessage) statusMessage.textContent = message;
    if (iframe && (state === "error" || state === "unavailable")) iframe.hidden = true;
    if (errorReturn) errorReturn.hidden = state !== "error" && state !== "unavailable";
  }

  try {
    const config = JSON.parse(configNode.textContent || "{}") as PageConfig;
    const querySession = new URLSearchParams(window.location.search).get("session") || "";
    let intent = consumeGalBlogLaunchIntent(querySession, config.game.slug);
    if (!intent) {
      const generatedIntent = createDefaultLaunchIntent(config.game.slug);
      intent = consumeGalBlogLaunchIntent(generatedIntent.sessionId, config.game.slug) ?? generatedIntent;
      const url = new URL(window.location.href);
      url.searchParams.set("session", intent.sessionId);
      history.replaceState(null, "", url);
    }
    if (errorReturn) {
      errorReturn.href = intent.target.kind === "start"
        ? "/"
        : intent.target.kind === "scene"
          ? "/?screen=load&loadPage=game&loadFilter=story"
          : "/?screen=load&loadPage=game&loadFilter=save";
      errorReturn.textContent = intent.target.kind === "start" ? "RETURN TO TITLE" : "RETURN TO LOAD";
    }
    const requestedReleaseId = intent.releaseId || config.game.currentReleaseId;
    const release = config.game.releases.find((item) => item.releaseId === requestedReleaseId);
    if (!release || !iframe) {
      const message = intent.releaseId
        ? "THIS SAVE REQUIRES AN UNAVAILABLE RELEASE"
        : "STUDIO PACKAGE NOT YET REGISTERED";
      setState("unavailable", message);
    } else {
      activeReleaseId = release.releaseId;
      iframe.hidden = false;
      const host = new GalBlogHost({
        iframe,
        entryUrl: release.entryUrl,
        packageUrl: release.packageUrl,
        manifest: release.manifest,
        sessionId: intent.sessionId,
        target: intent.target,
        state: intent.state,
        articlePaths: new Map(config.articles.map((article) => [article.slug, article.path])),
        onOpenCommentForm: (input) => openCommentForm(input, config.game.slug),
        onOpenSettings: openSettings,
        onOpenLoad: openLoad,
        onStateChange(state, message) {
          setState(state, message);
        },
        onNavigate(path) {
          setState("loading", "LOADING NEXT SCENE");
          hostRoot.dataset.navigationPending = "true";
          host.dispose();
          window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.location.assign(path)));
        },
      });
      window.addEventListener("pagehide", () => {
        host.dispose();
      }, { once: true });
      host.start();
    }
  } catch (error) {
    setState("error", error instanceof Error ? error.message : "GAME HOST INITIALIZATION FAILED");
  }
}
