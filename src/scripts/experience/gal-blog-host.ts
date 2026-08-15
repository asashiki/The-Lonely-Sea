import {
  GAL_BLOG_CHANNEL,
  GAL_BLOG_PROTOCOL,
  parseGalBlogEnvelopeV1,
  type GalBlogAction,
  type GalBlogEnvelopeV1,
  type GalBlogLaunchTarget,
  type GalBlogPackageManifestV1,
  type GalBlogScalar,
} from "../../lib/gal-blog/contracts";
import { saveGalBlogProgress, type SaveProgressInput } from "../../lib/gal-blog/save-store";
import {
  projectRuntimePreferences,
  readPreferences,
  runtimePreferenceValue,
} from "./preferences.js";

const IMPLEMENTED_REQUIRED_ACTIONS = new Set<GalBlogAction>([
  "return-menu",
  "open-article",
  "open-settings",
  "open-load",
  "open-comment-form",
  "save-progress",
  "get-runtime-data",
]);
const HANDSHAKE_TIMEOUT_MS = 20_000;

type HostState = "loading" | "waiting" | "ready" | "error";

type HostOptions = {
  iframe: HTMLIFrameElement;
  entryUrl: string;
  packageUrl: string;
  manifest: GalBlogPackageManifestV1;
  sessionId: string;
  target: GalBlogLaunchTarget;
  state?: { variables: Record<string, GalBlogScalar>; records: string[] };
  articlePaths: ReadonlyMap<string, string>;
  onOpenCommentForm: (input: Record<string, unknown>) => Promise<{
    status: "success" | "cancel" | "failure";
    value?: string;
    message?: string;
  }>;
  onOpenSettings: () => Promise<{ status: "success" | "cancel" }>;
  onOpenLoad: (input: Record<string, unknown>) => Promise<{
    status: "success" | "cancel" | "failure";
    slot?: number;
    navigateTo?: string;
    message?: string;
  }>;
  onStateChange: (state: HostState, message: string) => void;
  onNavigate: (path: string) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function targetExists(manifest: GalBlogPackageManifestV1, target: GalBlogLaunchTarget): boolean {
  if (target.kind === "start") return target.id === manifest.launchTargets.start.id;
  if (target.kind === "scene") return manifest.launchTargets.scenes.some((item) => item.id === target.id);
  return manifest.launchTargets.savePoints.some((item) => item.id === target.id);
}

function returnPath(target: GalBlogLaunchTarget, input: Record<string, unknown>): string {
  if (input.screen === "title") return "/";
  const defaultFilter = target.kind === "scene" ? "story" : "save";
  const loadPage = ["articles", "game", "diary"].includes(String(input.loadPage))
    ? String(input.loadPage)
    : "game";
  const loadFilter = ["save", "flow", "story"].includes(String(input.loadFilter))
    ? String(input.loadFilter)
    : defaultFilter;
  const params = new URLSearchParams({ screen: "load", loadPage });
  if (loadPage === "game") params.set("loadFilter", loadFilter);
  return `/?${params.toString()}`;
}

function validateLaunchState(
  manifest: GalBlogPackageManifestV1,
  state: HostOptions["state"],
): HostOptions["state"] {
  if (!state) return undefined;
  const variables = Object.create(null) as Record<string, GalBlogScalar>;
  const allowedVariables = new Set([
    ...manifest.stateContract.launchVariables,
    ...manifest.stateContract.persistVariables,
  ]);
  for (const [key, value] of Object.entries(state.variables)) {
    if (!allowedVariables.has(key)) {
      throw new Error(`启动状态包含未声明变量：${key}`);
    }
    variables[key] = value;
  }
  if (state.records.some((record) => !manifest.stateContract.records.includes(record))) {
    throw new Error("启动状态包含未声明记录");
  }
  return { variables, records: [...state.records] };
}

function makeResult(
  request: GalBlogEnvelopeV1,
  payload: Record<string, unknown>,
): GalBlogEnvelopeV1 {
  return {
    protocol: GAL_BLOG_PROTOCOL,
    channel: GAL_BLOG_CHANNEL,
    source: "gal-blog",
    gameId: request.gameId,
    releaseId: request.releaseId,
    sessionId: request.sessionId,
    replyTo: request.id,
    type: "result",
    payload,
  };
}

export class GalBlogHost {
  private readonly gameOrigin: string;
  private readonly launchState: HostOptions["state"];
  private readonly resultCache = new Map<string, GalBlogEnvelopeV1>();
  private handshakeTimer = 0;
  private sequence = 0;
  private launchSent = false;
  private gameReady = false;
  private disposed = false;
  private listener = (event: MessageEvent) => void this.receive(event);
  private preferencesListener = (event: Event) => {
    const preferences = (event as CustomEvent).detail?.preferences ?? readPreferences();
    this.sendSettings(preferences);
  };

  constructor(private readonly options: HostOptions) {
    this.gameOrigin = new URL(options.entryUrl, window.location.href).origin;
    if (!targetExists(options.manifest, options.target)) throw new Error("启动目标不在游戏清单中");
    this.launchState = validateLaunchState(options.manifest, options.state);
  }

  start(): void {
    window.addEventListener("message", this.listener);
    window.addEventListener("lonely-sea:preferences-change", this.preferencesListener);
    this.options.onStateChange("loading", "LOADING GAME PACKAGE");
    this.handshakeTimer = window.setTimeout(() => {
      this.fail("故事暂时没有回应，请返回后重新进入。");
    }, HANDSHAKE_TIMEOUT_MS);
    const url = new URL(this.options.entryUrl, window.location.href);
    url.searchParams.set("session", this.options.sessionId);
    this.options.iframe.src = url.href;
  }

  reload(): void {
    if (this.disposed) return;
    this.launchSent = false;
    this.gameReady = false;
    this.resultCache.clear();
    window.clearTimeout(this.handshakeTimer);
    this.handshakeTimer = window.setTimeout(() => this.fail("故事暂时没有回应，请返回后重新进入。"), HANDSHAKE_TIMEOUT_MS);
    this.options.onStateChange("loading", "RELOADING GAME PACKAGE");
    this.options.iframe.src = this.options.iframe.src;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.clearTimeout(this.handshakeTimer);
    window.removeEventListener("message", this.listener);
    window.removeEventListener("lonely-sea:preferences-change", this.preferencesListener);
    this.resultCache.clear();
    this.options.iframe.src = "about:blank";
  }

  private fail(message: string): void {
    window.clearTimeout(this.handshakeTimer);
    this.options.onStateChange("error", message);
  }

  private send(message: GalBlogEnvelopeV1): void {
    this.options.iframe.contentWindow?.postMessage(message, this.gameOrigin);
  }

  private sendLaunch(request: GalBlogEnvelopeV1): void {
    const missing = this.options.manifest.bridge.requiredActions
      .filter((action) => !IMPLEMENTED_REQUIRED_ACTIONS.has(action));
    if (missing.length) {
      this.send(makeResult(request, {
        status: "failure",
        code: "REQUIRED_ACTION_UNAVAILABLE",
        actions: missing,
      }));
      this.fail(`Blog 尚未实现游戏必需动作：${missing.join("、")}`);
      return;
    }
    const launch: GalBlogEnvelopeV1 = {
      protocol: GAL_BLOG_PROTOCOL,
      channel: GAL_BLOG_CHANNEL,
      source: "gal-blog",
      gameId: request.gameId,
      releaseId: request.releaseId,
      sessionId: request.sessionId,
      id: `host-${++this.sequence}`,
      type: "launch",
      payload: {
        target: this.options.target,
        state: this.launchState ?? { variables: {}, records: [] },
        ...(this.options.manifest.settingsContract ? {
          settings: projectRuntimePreferences(
            this.options.manifest.settingsContract.accepts,
            readPreferences(),
          ),
        } : {}),
      },
    };
    this.launchSent = true;
    this.options.onStateChange("waiting", "WAITING FOR WEBGAL");
    this.send(launch);
  }

  private sendSettings(preferences = readPreferences()): void {
    const contract = this.options.manifest.settingsContract;
    if (!this.gameReady || !contract) return;
    this.send({
      protocol: GAL_BLOG_PROTOCOL,
      channel: GAL_BLOG_CHANNEL,
      source: "gal-blog",
      gameId: this.options.manifest.game.id,
      releaseId: this.options.manifest.game.releaseId,
      sessionId: this.options.sessionId,
      type: "event",
      payload: {
        name: "settings-change",
        schema: contract.schema,
        settings: projectRuntimePreferences(contract.accepts, preferences),
      },
    });
  }

  private async receive(event: MessageEvent): Promise<void> {
    if (this.disposed || event.origin !== this.gameOrigin) return;
    if (event.source !== this.options.iframe.contentWindow) return;
    const message = parseGalBlogEnvelopeV1(event.data, {
      source: "galgame",
      gameId: this.options.manifest.game.id,
      releaseId: this.options.manifest.game.releaseId,
      sessionId: this.options.sessionId,
    });
    if (!message) return;
    if (message.type === "hello" && !this.launchSent) {
      this.sendLaunch(message);
      return;
    }
    if (message.type === "ready" && this.launchSent) {
      window.clearTimeout(this.handshakeTimer);
      this.gameReady = true;
      this.options.onStateChange("ready", "GAME READY");
      return;
    }
    if (message.type !== "request" || !message.id) return;
    const cached = this.resultCache.get(message.id);
    if (cached) {
      this.send(cached);
      return;
    }
    const result = await this.dispatch(message);
    this.resultCache.set(message.id, result);
    if (this.resultCache.size > 100) this.resultCache.delete(this.resultCache.keys().next().value ?? "");
    this.send(result);
    const payload = result.payload as Record<string, unknown>;
    if (payload.navigateTo && typeof payload.navigateTo === "string") {
      window.setTimeout(() => this.options.onNavigate(String(payload.navigateTo)), 80);
    }
  }

  private async dispatch(request: GalBlogEnvelopeV1): Promise<GalBlogEnvelopeV1> {
    if (!this.launchSent || !isRecord(request.payload)) {
      return makeResult(request, { status: "failure", code: "INVALID_REQUEST" });
    }
    const action = request.payload.action;
    const input = isRecord(request.payload.input) ? request.payload.input : {};
    if (action === "return-menu") {
      return makeResult(request, {
        status: "success",
        navigateTo: returnPath(this.options.target, input),
      });
    }
    if (action === "open-article") {
      const slug = typeof input.slug === "string" ? input.slug : "";
      const path = this.options.articlePaths.get(slug);
      return path
        ? makeResult(request, { status: "success", slug, navigateTo: path })
        : makeResult(request, { status: "failure", code: "ARTICLE_NOT_FOUND" });
    }
    if (action === "open-settings") {
      return makeResult(request, await this.options.onOpenSettings());
    }
    if (action === "open-load") {
      const result = await this.options.onOpenLoad(input);
      if (input.operation !== "save" || result.status !== "success") {
        return makeResult(request, result);
      }
      const snapshot = isRecord(input.snapshot) ? input.snapshot : null;
      if (!snapshot || !Number.isInteger(result.slot)) {
        return makeResult(request, { status: "failure", code: "INVALID_SAVE_SELECTION" });
      }
      try {
        const save = saveGalBlogProgress(
          this.options.manifest,
          { ...snapshot, mode: "manual", slot: result.slot } as unknown as SaveProgressInput,
          this.options.packageUrl,
        );
        return makeResult(request, { status: "success", saveId: save.id, savedAt: save.savedAt });
      } catch (error) {
        return makeResult(request, {
          status: "failure",
          code: "SAVE_REJECTED",
          message: error instanceof Error ? error.message : "存档失败",
        });
      }
    }
    if (action === "open-comment-form") {
      return makeResult(request, await this.options.onOpenCommentForm(input));
    }
    if (action === "save-progress") {
      try {
        const save = saveGalBlogProgress(
          this.options.manifest,
          input as unknown as SaveProgressInput,
          this.options.packageUrl,
        );
        return makeResult(request, { status: "success", saveId: save.id, savedAt: save.savedAt });
      } catch (error) {
        return makeResult(request, {
          status: "failure",
          code: "SAVE_REJECTED",
          message: error instanceof Error ? error.message : "存档失败",
        });
      }
    }
    if (action === "get-runtime-data") {
      const key = typeof input.key === "string" ? input.key : "";
      const value = runtimePreferenceValue(key);
      return value === undefined
        ? makeResult(request, { status: "unsupported", action, key })
        : makeResult(request, { status: "success", value });
    }
    return makeResult(request, { status: "unsupported", action: String(action ?? "") });
  }
}

export type { HostState };
