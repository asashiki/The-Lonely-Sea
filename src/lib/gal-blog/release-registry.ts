import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

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

type IntegrityFile = {
  path: string;
  bytes: number;
  sha256: string;
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

export interface PublicStoryFlow {
  gameSlug: string;
  releaseId: string;
  title: string;
  nodes: Array<{
    id: string;
    sceneId: string;
    title: string;
    kind: string;
    replayable: boolean;
    thumbnail?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

const GAME_DEFINITIONS: GameDefinition[] = [
  {
    slug: "lonely-sea-chapter-one",
    title: "灯塔导览 · 序章",
    currentReleaseId: "0.3.0-4830749c",
    releases: [
      {
        releaseId: "0.3.0-4830749c",
        directory: "0.3.0-4830749c",
      },
    ],
  },
];

const SUPPORTED_ACTIONS = new Set<GalBlogAction>([
  "return-menu",
  "open-article",
  "open-settings",
  "open-load",
  "open-comment-form",
  "open-blog-scene",
  "open-external",
  "save-progress",
  "get-runtime-data",
]);
const SUPPORTED_SETTING_KEYS = new Set([
  "audio.muted",
  "audio.bgm",
  "audio.ambient",
  "audio.effects",
  "audio.voice",
  "audio.stopVoiceOnAdvance",
  "text.scale",
  "text.speed",
  "accessibility.reducedMotion",
  "interface.scale",
  "interface.cursor",
  "interface.language",
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
  if (!["WebGAL", "Gal Story Runtime"].includes(String(value.engine.name)) || value.engine.bundled !== true) {
    throw new Error("正式游戏包必须内置受支持的运行时");
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
    || !isSafeIdentifier(point.sceneId)
    || typeof point.resumeMode !== "string"
    || !["scene-entry", "authored-block"].includes(point.resumeMode)
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
  if (value.settingsContract !== undefined) {
    if (!isRecord(value.settingsContract)
      || value.settingsContract.schema !== "gal-blog-settings/v1"
      || !Array.isArray(value.settingsContract.accepts)
      || value.settingsContract.accepts.some((key) => typeof key !== "string" || !SUPPORTED_SETTING_KEYS.has(key))) {
      throw new Error("游戏清单设置契约无效");
    }
  }
  if (value.presentation !== undefined
    && (!isRecord(value.presentation)
      || (value.presentation.loaderArt !== undefined && !isSafeRelativePath(value.presentation.loaderArt)))) {
    throw new Error("游戏包展示资源无效");
  }
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

function listReleaseFiles(releaseRoot: string, directory = releaseRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`游戏包不得包含符号链接：${entry.name}`);
    if (entry.isDirectory()) return listReleaseFiles(releaseRoot, path);
    if (!entry.isFile()) throw new Error(`游戏包包含不支持的目录项：${entry.name}`);
    return relative(releaseRoot, path).split(sep).join("/");
  });
}

function parseIntegrity(value: unknown): IntegrityFile[] {
  if (!isRecord(value) || value.algorithm !== "SHA-256" || !Array.isArray(value.files)) {
    throw new Error("游戏包完整性清单无效");
  }
  const files = value.files;
  if (files.some((file) => !isRecord(file)
    || !isSafeRelativePath(file.path)
    || !Number.isSafeInteger(file.bytes)
    || Number(file.bytes) < 0
    || typeof file.sha256 !== "string"
    || !/^[a-f0-9]{64}$/.test(file.sha256))) {
    throw new Error("游戏包完整性文件记录无效");
  }
  const typedFiles = files as IntegrityFile[];
  if (new Set(typedFiles.map((file) => file.path)).size !== typedFiles.length) {
    throw new Error("游戏包完整性清单包含重复路径");
  }
  return typedFiles;
}

function verifyReleaseIntegrity(releaseRoot: string, manifest: GalBlogPackageManifestV1): void {
  const integrityPath = resolve(releaseRoot, manifest.integrity);
  if (!integrityPath.startsWith(`${releaseRoot}${sep}`)) throw new Error("完整性清单超出游戏包目录");
  const files = parseIntegrity(JSON.parse(readFileSync(integrityPath, "utf8")));
  const expectedPaths = new Set(files.map((file) => file.path));
  const actualPaths = listReleaseFiles(releaseRoot)
    .filter((path) => path !== manifest.integrity);
  if (actualPaths.length !== files.length
    || actualPaths.some((path) => !expectedPaths.has(path))) {
    throw new Error("游戏包文件集合与完整性清单不一致");
  }
  for (const file of files) {
    const contents = readFileSync(resolve(releaseRoot, file.path));
    if (contents.byteLength !== file.bytes) throw new Error(`游戏包文件大小不匹配：${file.path}`);
    const hash = createHash("sha256").update(contents).digest("hex");
    if (hash !== file.sha256) throw new Error(`游戏包文件哈希不匹配：${file.path}`);
  }
  if (!expectedPaths.has("gal-blog.embed.json") || !expectedPaths.has(manifest.engine.entry)) {
    throw new Error("游戏包完整性清单未覆盖清单或运行入口");
  }
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
  verifyReleaseIntegrity(releaseRoot, manifest);
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
      .filter((scene) => scene.replayable && scene.storyEntry === true)
      .map((scene) => ({
        gameSlug: game.slug,
        releaseId: release.releaseId,
        sceneId: scene.id,
        title: scene.title,
        thumbnail: scene.thumbnail ? `${release.packageUrl}/${scene.thumbnail}` : undefined,
      }));
  });
}

export function listPublicStoryFlows(): PublicStoryFlow[] {
  return listRegisteredGames().flatMap((game) => {
    const release = game.releases.find((item) => item.releaseId === game.currentReleaseId);
    if (!release) return [];
    const sceneTargets = new Map(release.manifest.launchTargets.scenes.map((scene) => [scene.id, scene]));
    const nodes = release.manifest.publicRouteMap.nodes.flatMap((value) => {
      if (!isRecord(value)
        || !isSafeIdentifier(value.id)
        || !isSafeIdentifier(value.sceneId)
        || typeof value.title !== "string"
        || typeof value.kind !== "string") return [];
      const target = sceneTargets.get(value.sceneId);
      return [{
        id: value.id,
        sceneId: value.sceneId,
        title: value.title.slice(0, 120),
        kind: value.kind.slice(0, 80),
        replayable: value.kind === "start" || Boolean(target?.replayable),
        thumbnail: target?.thumbnail ? `${release.packageUrl}/${target.thumbnail}` : undefined,
      }];
    });
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = release.manifest.publicRouteMap.edges.flatMap((value) => {
      if (!isRecord(value)
        || !isSafeIdentifier(value.id)
        || !isSafeIdentifier(value.source)
        || !isSafeIdentifier(value.target)
        || !nodeIds.has(value.source)
        || !nodeIds.has(value.target)) return [];
      return [{
        id: value.id,
        source: value.source,
        target: value.target,
        label: typeof value.label === "string" ? value.label.slice(0, 120) : undefined,
      }];
    });
    return nodes.length ? [{
      gameSlug: game.slug,
      releaseId: release.releaseId,
      title: game.title,
      nodes,
      edges,
    }] : [];
  });
}
