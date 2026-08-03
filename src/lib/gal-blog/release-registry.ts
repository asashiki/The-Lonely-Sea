import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

import {
  GAL_BLOG_CHANNEL,
  GAL_BLOG_PACKAGE_SCHEMA,
  GAL_BLOG_PROTOCOL,
  isSafeIdentifier,
  isSafeRelativePath,
  type GalBlogAction,
  type GalBlogPackageManifestV1,
} from "./contracts";

type ReleaseDefinition = {
  releaseId: string;
  directory: string;
};

type GameDefinition = {
  slug: string;
  title: string;
  currentReleaseId: string | null;
  releases: ReleaseDefinition[];
};

export interface RegisteredGameRelease {
  releaseId: string;
  packageUrl: string;
  entryUrl: string;
  manifest: GalBlogPackageManifestV1;
}

export interface RegisteredGame {
  slug: string;
  title: string;
  currentReleaseId: string | null;
  releases: RegisteredGameRelease[];
}

const GAME_DEFINITIONS: GameDefinition[] = [
  {
    slug: "alice-tea-room",
    title: "爱丽丝茶室",
    currentReleaseId: null,
    releases: [],
  },
];

const SUPPORTED_ACTIONS = new Set<GalBlogAction>([
  "return-menu",
  "open-article",
  "open-comment-form",
  "save-progress",
  "get-runtime-data",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !value) throw new Error(`游戏清单字段无效：${field}`);
}

function assertStringArray(value: unknown, field: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`游戏清单字段无效：${field}`);
  }
}

function parseManifest(value: unknown, expectedSlug: string, expectedReleaseId: string): GalBlogPackageManifestV1 {
  if (!isRecord(value) || value.schema !== GAL_BLOG_PACKAGE_SCHEMA) throw new Error("游戏清单 schema 不是 v1");
  if (!isRecord(value.game) || !isRecord(value.engine) || !isRecord(value.launchTargets)) {
    throw new Error("游戏清单缺少 game、engine 或 launchTargets");
  }
  if (!isRecord(value.stateContract) || !isRecord(value.bridge)) {
    throw new Error("游戏清单缺少 stateContract 或 bridge");
  }
  assertString(value.game.id, "game.id");
  assertString(value.game.slug, "game.slug");
  assertString(value.game.releaseId, "game.releaseId");
  assertString(value.game.title, "game.title");
  assertString(value.game.gameVersion, "game.gameVersion");
  assertString(value.game.locale, "game.locale");
  if (value.game.slug !== expectedSlug || value.game.releaseId !== expectedReleaseId) {
    throw new Error("游戏清单与发布目录不一致");
  }
  if (value.engine.name !== "WebGAL" || value.engine.bundled !== true) {
    throw new Error("正式游戏包必须内置 WebGAL 运行时");
  }
  assertString(value.engine.version, "engine.version");
  if (!isSafeRelativePath(value.engine.entry)) throw new Error("engine.entry 不是安全相对路径");
  if (!isRecord(value.launchTargets.start) || !Array.isArray(value.launchTargets.scenes)
    || !Array.isArray(value.launchTargets.savePoints)) {
    throw new Error("游戏清单启动目标无效");
  }
  if (!isSafeIdentifier(value.launchTargets.start.id) || value.launchTargets.start.kind !== "start") {
    throw new Error("游戏清单 start 目标无效");
  }
  const scenes = value.launchTargets.scenes;
  const savePoints = value.launchTargets.savePoints;
  if (scenes.some((scene) => !isRecord(scene) || scene.kind !== "scene"
    || !isSafeIdentifier(scene.id) || typeof scene.title !== "string"
    || typeof scene.replayable !== "boolean"
    || (scene.thumbnail !== undefined && !isSafeRelativePath(scene.thumbnail)))) {
    throw new Error("游戏清单场景入口无效");
  }
  if (savePoints.some((point) => !isRecord(point) || point.kind !== "save-point"
    || !isSafeIdentifier(point.id) || typeof point.title !== "string"
    || !isSafeIdentifier(point.sceneId) || point.resumeMode !== "scene-entry"
    || (point.thumbnail !== undefined && !isSafeRelativePath(point.thumbnail)))) {
    throw new Error("游戏清单检查点入口无效");
  }
  const targetIds = [value.launchTargets.start.id, ...scenes.map((scene) => scene.id), ...savePoints.map((point) => point.id)];
  if (new Set(targetIds).size !== targetIds.length) throw new Error("游戏清单启动目标 ID 重复");
  if (!isRecord(value.publicRouteMap) || !Array.isArray(value.publicRouteMap.nodes)
    || !Array.isArray(value.publicRouteMap.edges)) {
    throw new Error("游戏清单公开路线无效");
  }
  assertStringArray(value.stateContract.launchVariables, "stateContract.launchVariables");
  assertStringArray(value.stateContract.persistVariables, "stateContract.persistVariables");
  assertStringArray(value.stateContract.records, "stateContract.records");
  if (value.stateContract.saveMode !== "checkpoint-v1") throw new Error("Blog 首版只接受 checkpoint-v1");
  const stateIds = [
    ...value.stateContract.launchVariables,
    ...value.stateContract.persistVariables,
    ...value.stateContract.records,
  ];
  if (stateIds.some((id) => !isSafeIdentifier(id))) throw new Error("游戏清单状态白名单包含无效 ID");
  if (value.bridge.protocol !== GAL_BLOG_PROTOCOL || value.bridge.channel !== GAL_BLOG_CHANNEL) {
    throw new Error("游戏包 Bridge 协议不兼容");
  }
  assertStringArray(value.bridge.allowedHostOrigins, "bridge.allowedHostOrigins");
  if (!value.bridge.allowedHostOrigins.length || value.bridge.allowedHostOrigins.includes("*")) {
    throw new Error("正式游戏包必须声明精确宿主 origin");
  }
  if (value.bridge.allowedHostOrigins.some((origin) => {
    try {
      const url = new URL(origin);
      return !["http:", "https:"].includes(url.protocol) || url.origin !== origin;
    } catch {
      return true;
    }
  })) throw new Error("游戏包宿主 origin 格式无效");
  if (!Array.isArray(value.bridge.requiredActions) || !Array.isArray(value.bridge.optionalActions)) {
    throw new Error("游戏包 Bridge 动作声明无效");
  }
  const actions = [...value.bridge.requiredActions, ...value.bridge.optionalActions];
  if (actions.some((action) => !SUPPORTED_ACTIONS.has(action as GalBlogAction))) {
    throw new Error("游戏包声明了 Blog v1 未知动作");
  }
  assertString(value.integrity, "integrity");
  if (!isSafeRelativePath(value.integrity)) throw new Error("integrity 不是安全相对路径");
  return value as unknown as GalBlogPackageManifestV1;
}

function readRelease(game: GameDefinition, release: ReleaseDefinition): RegisteredGameRelease {
  if (!isSafeIdentifier(game.slug) || !isSafeIdentifier(release.releaseId)
    || !isSafeIdentifier(release.directory)) {
    throw new Error("游戏版本登记包含不安全 ID");
  }
  const publicRoot = resolve(process.cwd(), "public");
  const gameRoot = resolve(publicRoot, "games", game.slug);
  const releaseRoot = resolve(gameRoot, release.directory);
  if (!releaseRoot.startsWith(`${gameRoot}${sep}`)) throw new Error("游戏包目录超出对应游戏目录");
  const manifestPath = resolve(releaseRoot, "gal-blog.embed.json");
  const manifest = parseManifest(JSON.parse(readFileSync(manifestPath, "utf8")), game.slug, release.releaseId);
  const packageUrl = `/games/${game.slug}/${release.directory}`;
  return {
    releaseId: release.releaseId,
    packageUrl,
    entryUrl: `${packageUrl}/${manifest.engine.entry}`,
    manifest,
  };
}

export function listRegisteredGames(): RegisteredGame[] {
  return GAME_DEFINITIONS.map((game) => ({
    slug: game.slug,
    title: game.title,
    currentReleaseId: game.currentReleaseId,
    releases: game.releases.map((release) => readRelease(game, release)),
  }));
}

export function listPublicStoryScenes(): Array<{
  gameSlug: string;
  releaseId: string;
  sceneId: string;
  title: string;
  thumbnail?: string;
}> {
  return listRegisteredGames().flatMap((game) => {
    const release = game.releases.find((item) => item.releaseId === game.currentReleaseId);
    if (!release) return [];
    return release.manifest.launchTargets.scenes
      .filter((scene) => scene.replayable)
      .map((scene) => ({
        gameSlug: game.slug,
        releaseId: release.releaseId,
        sceneId: scene.id,
        title: scene.title,
        thumbnail: scene.thumbnail ? `${release.packageUrl}/${scene.thumbnail}` : undefined,
      }));
  });
}
