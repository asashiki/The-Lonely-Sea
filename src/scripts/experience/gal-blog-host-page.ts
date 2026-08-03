import {
  consumeGalBlogLaunchIntent,
  createDefaultLaunchIntent,
} from "../../lib/gal-blog/launch-session";
import type { RegisteredGame } from "../../lib/gal-blog/release-registry";
import { GalBlogHost, type HostState } from "./gal-blog-host";

type PageConfig = {
  game: RegisteredGame;
  articles: Array<{ slug: string; path: string }>;
};

const root = document.querySelector<HTMLElement>("[data-gal-blog-host]");
const configNode = document.querySelector<HTMLScriptElement>("#gal-blog-host-config");

if (root && configNode) {
  const hostRoot = root;
  const iframe = hostRoot.querySelector<HTMLIFrameElement>("[data-game-frame]");
  const status = hostRoot.querySelector<HTMLElement>("[data-host-status]");
  const statusMessage = hostRoot.querySelector<HTMLElement>("[data-host-status-message]");
  const reload = hostRoot.querySelector<HTMLButtonElement>("[data-host-reload]");
  const fullscreen = hostRoot.querySelector<HTMLButtonElement>("[data-host-fullscreen]");

  function setState(state: HostState | "unavailable", message: string): void {
    hostRoot.dataset.hostState = state;
    if (status) status.hidden = state === "ready";
    if (statusMessage) statusMessage.textContent = message;
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
    const requestedReleaseId = intent.releaseId || config.game.currentReleaseId;
    const release = config.game.releases.find((item) => item.releaseId === requestedReleaseId);
    if (!release || !iframe) {
      const message = intent.releaseId
        ? "THIS SAVE REQUIRES AN UNAVAILABLE RELEASE"
        : "STUDIO PACKAGE NOT YET REGISTERED";
      setState("unavailable", message);
    } else {
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
        onStateChange: setState,
        onNavigate(path) {
          host.dispose();
          window.location.assign(path);
        },
      });
      reload?.addEventListener("click", () => host.reload());
      fullscreen?.addEventListener("click", () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void iframe.requestFullscreen();
      });
      window.addEventListener("pagehide", () => host.dispose(), { once: true });
      host.start();
    }
  } catch (error) {
    setState("error", error instanceof Error ? error.message : "GAME HOST INITIALIZATION FAILED");
  }
}
