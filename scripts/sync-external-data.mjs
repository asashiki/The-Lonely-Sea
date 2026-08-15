import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BLOG_USER = "asashiki";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bangumiPath = resolve(root, "src/data/generated/bangumi.json");
const activityPath = resolve(root, "src/data/generated/activity.json");
const musicPath = resolve(root, "src/data/generated/music.json");
const NETEASE_PLAYLIST_ID = "18262393732";
const METING_PLAYLIST = `https://api.qijieya.cn/meting/?server=netease&type=playlist&id=${NETEASE_PLAYLIST_ID}`;
const headers = {
  Accept: "application/json",
  "User-Agent": "The-Lonely-Sea/1.0 (https://asashiki.com)",
};

async function fetchJson(url, timeoutMs = 12_000) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fetchCollections(subjectType) {
  const endpoint = new URL(`https://api.bgm.tv/v0/users/${BLOG_USER}/collections`);
  endpoint.searchParams.set("subject_type", String(subjectType));
  endpoint.searchParams.set("limit", "50");
  endpoint.searchParams.set("offset", "0");
  const first = await fetchJson(endpoint);
  if (!isRecord(first) || !Array.isArray(first.data) || !Number.isInteger(first.total)) {
    throw new Error(`Bangumi 收藏响应无效：type=${subjectType}`);
  }
  const offsets = [];
  for (let offset = 50; offset < first.total; offset += 50) offsets.push(offset);
  const rest = await Promise.all(offsets.map(async (offset) => {
    const pageEndpoint = new URL(endpoint);
    pageEndpoint.searchParams.set("offset", String(offset));
    const page = await fetchJson(pageEndpoint);
    if (!isRecord(page) || !Array.isArray(page.data)) throw new Error(`Bangumi 分页响应无效：offset=${offset}`);
    return page.data;
  }));
  return [first.data, ...rest].flat();
}

function collectionStatus(type, category) {
  if (type === 1) return { status: "wishlist", state: "WISHLIST" };
  if (type === 2) return { status: "finished", state: category === "anime" ? "WATCHED" : "PLAYED" };
  if (type === 3) return { status: category === "anime" ? "watching" : "playing", state: category === "anime" ? "WATCHING" : "PLAYING" };
  if (type === 4) return { status: "on-hold", state: "ON HOLD" };
  return { status: "dropped", state: "DROPPED" };
}

function mapCollection(item) {
  if (!isRecord(item) || !isRecord(item.subject) || !Number.isInteger(item.subject.id)) return null;
  const subject = item.subject;
  const category = Number(item.subject_type) === 2 ? "anime" : Number(item.subject_type) === 4 ? "game" : null;
  if (!category) return null;
  const status = collectionStatus(Number(item.type), category);
  const images = isRecord(subject.images) ? subject.images : {};
  const updatedAt = typeof item.updated_at === "string" ? item.updated_at : "";
  const subjectDate = typeof subject.date === "string" ? subject.date : "";
  return {
    id: subject.id,
    title: String(subject.name_cn || subject.name || `SUBJECT ${subject.id}`),
    originalTitle: String(subject.name || ""),
    category,
    ...status,
    year: (subjectDate || updatedAt).slice(0, 4) || "—",
    cover: String(images.common || images.medium || images.large || ""),
    href: `https://bgm.tv/subject/${subject.id}`,
    userScore: Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0,
    subjectScore: Number.isFinite(Number(subject.score)) ? Number(subject.score) : 0,
    rank: Number.isFinite(Number(subject.rank)) ? Number(subject.rank) : 0,
    progress: Number.isFinite(Number(item.ep_status)) ? Number(item.ep_status) : 0,
    total: Number.isFinite(Number(subject.eps)) ? Number(subject.eps) : 0,
    comment: typeof item.comment === "string" ? item.comment.trim() : "",
    summary: typeof subject.short_summary === "string" ? subject.short_summary.trim() : "",
    updatedAt,
  };
}

function mapMetingTrack(item, index) {
  if (!isRecord(item) || typeof item.name !== "string" || typeof item.url !== "string") return null;
  const metingId = Number(String(item.url).match(/[?&]id=(\d+)/)?.[1] || 0);
  if (!metingId) return null;
  return {
    title: item.name.trim(),
    artist: String(item.artist || "UNKNOWN").trim() || "UNKNOWN",
    sourceLabel: "NETEASE",
    tone: index % 2 === 0 ? "night" : "day",
    cover: typeof item.pic === "string" ? item.pic : "",
    src: item.url,
    provider: "meting",
    server: "netease",
    metingId,
  };
}

async function fetchNeteasePlaylist() {
  const payload = await fetchJson(METING_PLAYLIST, 20_000);
  if (!Array.isArray(payload)) throw new Error("网易云歌单响应无效");
  const items = payload.map(mapMetingTrack).filter(Boolean);
  if (!items.length) throw new Error("网易云歌单没有可用曲目");
  return items;
}

function utcDate(date) {
  return date.toISOString().slice(0, 10);
}

function trailingDates(days, end = new Date()) {
  const cursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(cursor);
    date.setUTCDate(cursor.getUTCDate() - (days - index - 1));
    return utcDate(date);
  });
}

function heatLevels(entries, days = 84) {
  const counts = new Map(entries.map((entry) => [String(entry.date), Math.max(0, Number(entry.count) || 0)]));
  const values = [...counts.values()].filter((count) => count > 0).sort((a, b) => a - b);
  const threshold = (ratio) => values[Math.min(values.length - 1, Math.floor(values.length * ratio))] ?? Infinity;
  const q1 = threshold(.25);
  const q2 = threshold(.5);
  const q3 = threshold(.75);
  return trailingDates(days).map((date) => {
    const count = counts.get(date) || 0;
    const level = count === 0 ? 0 : count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4;
    return { date, count, level };
  });
}

async function previous(path) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return null; }
}

async function writeSnapshot(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const syncedAt = new Date().toISOString();
  const [anime, games, timeline, community, github] = await Promise.all([
    fetchCollections(2),
    fetchCollections(4),
    fetchJson(`https://bgm.ry.mk/heatmap/timeline/${BLOG_USER}`),
    fetchJson(`https://bgm.ry.mk/heatmap/community/${BLOG_USER}`),
    fetchJson(`https://github-contributions-api.jogruber.de/v4/${BLOG_USER}?y=last`),
  ]);
  if (!Array.isArray(timeline) || !Array.isArray(community) || !isRecord(github) || !Array.isArray(github.contributions)) {
    throw new Error("活动数据响应无效");
  }
  const items = [...anime, ...games]
    .map(mapCollection)
    .filter(Boolean)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const bangumiCounts = new Map();
  [...timeline, ...community].forEach((entry) => {
    if (!isRecord(entry) || typeof entry.date !== "string") return;
    bangumiCounts.set(entry.date, (bangumiCounts.get(entry.date) || 0) + Math.max(0, Number(entry.count) || 0));
  });
  const bangumiActivity = heatLevels([...bangumiCounts].map(([date, count]) => ({ date, count })));
  const githubActivity = heatLevels(github.contributions);
  await writeSnapshot(bangumiPath, {
    schema: "lonely-sea-bangumi/v1",
    user: BLOG_USER,
    syncedAt,
    total: items.length,
    items,
  });
  await writeSnapshot(activityPath, {
    schema: "lonely-sea-activity/v1",
    syncedAt,
    bangumi: bangumiActivity,
    github: githubActivity,
  });
  let musicCount = 0;
  try {
    const musicItems = await fetchNeteasePlaylist();
    await writeSnapshot(musicPath, {
      schema: "lonely-sea-music/v1",
      playlistId: NETEASE_PLAYLIST_ID,
      playlistUrl: `https://music.163.com/playlist?id=${NETEASE_PLAYLIST_ID}`,
      syncedAt,
      total: musicItems.length,
      items: musicItems,
    });
    musicCount = musicItems.length;
  } catch (error) {
    const retained = Boolean(await previous(musicPath));
    console.error(`网易云歌单同步失败${retained ? "，已保留上次快照" : ""}：${error instanceof Error ? error.message : error}`);
    if (!retained) process.exitCode = 1;
  }
  console.log(`Bangumi ${items.length} 条；活动热力图各 ${bangumiActivity.length} 天；歌单 ${musicCount || "未更新"} 首；同步于 ${syncedAt}`);
}

main().catch(async (error) => {
  const retained = Boolean(await previous(bangumiPath)) && Boolean(await previous(activityPath));
  console.error(`外部数据同步失败${retained ? "，已保留上次快照" : ""}：${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
