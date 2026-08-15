import { sceneArt } from "../scripts/experience/config.js";
import activitySnapshot from "./generated/activity.json";
import bangumiSnapshot from "./generated/bangumi.json";

const generatedCgItems = Array.from({ length: 20 }, (_, index) => ({
  title: "SCENE MEMORY",
  art: `/assets/cg/generated/scene-${String(index + 1).padStart(2, "0")}.webp`,
  unlocked: true,
}));

const lockedCgItems = Array.from({ length: 7 }, () => ({
  title: "LOCKED",
  unlocked: false,
}));

export const cgItems = Object.freeze([...generatedCgItems, ...lockedCgItems]);

export const musicItems = Object.freeze([
  {
    title: "星が瞬くこんな夜に",
    artist: "supercell",
    sourceLabel: "NETEASE",
    tone: "night",
    cover: "https://api.qijieya.cn/meting/?server=netease&type=pic&id=109951166200380956",
    src: "https://api.qijieya.cn/meting/?server=netease&type=url&id=825522",
    provider: "meting",
    server: "netease",
    metingId: 825522,
    note: "收录于 2025 游戏随想录。",
  },
  {
    title: "カプセル",
    artist: "aiko",
    sourceLabel: "NETEASE",
    tone: "day",
    cover: "https://api.qijieya.cn/meting/?server=netease&type=pic&id=109951170632955978",
    src: "https://api.qijieya.cn/meting/?server=netease&type=url&id=2686870666",
    provider: "meting",
    server: "netease",
    metingId: 2686870666,
    note: "收录于 2025 动画摄入日志。",
  },
]);

export const projectItems = Object.freeze([
  {
    title: "mcp-switch",
    description: "把本地与远程 MCP 服务汇总到同一个 OAuth 入口。",
    tags: ["TYPESCRIPT", "MCP"],
    mark: "MCP / SWITCH",
    href: "https://github.com/asashiki/mcp-switch",
  },
  {
    title: "music-mcp",
    description: "带检索、歌单与同步歌词的对话内音乐播放器。",
    tags: ["TYPESCRIPT", "MCP"],
    mark: "MUSIC / MCP",
    href: "https://github.com/asashiki/music-mcp",
  },
  {
    title: "X2Video",
    description: "把 X 内容转为视频的多 Agent 协作项目。",
    tags: ["PYTHON", "AGENT"],
    mark: "X → VIDEO",
    href: "https://github.com/asashiki/X2Video",
  },
  {
    title: "rhythm-game",
    description: "公开运行的节奏游戏实验。",
    tags: ["TYPESCRIPT", "GAME"],
    mark: "RHYTHM",
    href: "https://hana.714.fyi/",
    source: "https://github.com/asashiki/rhythm-game",
  },
  {
    title: "asagi-grave",
    description: "记录 vibe coding 与 AI 网页气味的项目墓地。",
    tags: ["JAVASCRIPT", "SITE"],
    mark: "GRAVE",
    href: "https://rip.714.fyi",
    source: "https://github.com/asashiki/asagi-grave",
  },
  {
    title: "asashiki-design",
    description: "浅仪式的配色、主视觉与界面规范。",
    tags: ["JAVASCRIPT", "DESIGN"],
    mark: "ASASHIKI / DESIGN",
    href: "https://github.com/asashiki/asashiki-design",
  },
]);

export const bangumiItems = Object.freeze(bangumiSnapshot.items);
export const externalActivity = Object.freeze({
  bangumi: Object.freeze(activitySnapshot.bangumi),
  github: Object.freeze(activitySnapshot.github),
  syncedAt: activitySnapshot.syncedAt,
});

export const movieItems = Object.freeze([
  {
    title: "CODING RECORDS",
    meta: "YOUTUBE PLAYLIST",
    art: sceneArt.night,
    href: "https://youtube.com/playlist?list=PLmVWZWmYfprlU3UfP3oEar5W2cnO3WW4L",
  },
]);

export const characterItems = Object.freeze([
  {
    id: "alice",
    name: "Alice",
    localizedName: "アリス",
    role: "SYSTEM NAVIGATOR / LIGHTHOUSE LIBRARIAN",
    code: "NAV-01",
    status: "ONLINE",
    age: "14",
    height: "146 CM",
    description: "驻守在孤灯塔内的系统向导。她负责把访客带往文章、记录与故事入口，也会认真纠正主人随手写下的设定。",
    sceneId: "scene_alice_about",
    art: "/assets/lonely-sea/characters/alice/idle.png",
    expressions: Object.freeze([
      {
        id: "welcome",
        label: "WELCOME",
        art: "/assets/lonely-sea/characters/alice/welcome.png",
        line: "お帰りなさいませ、ご主人様。",
      },
      {
        id: "idle",
        label: "IDLE",
        art: "/assets/lonely-sea/characters/alice/idle.png",
        line: "……何か御用ですか。ここで静かに待っています。",
      },
      {
        id: "thinking",
        label: "THINKING",
        art: "/assets/lonely-sea/characters/alice/thinking.png",
        line: "この王冠。私も、よく分からないんです。",
      },
      {
        id: "laugh",
        label: "LAUGH",
        art: "/assets/lonely-sea/characters/alice/laugh.png",
        line: "ふふ、少しだけ楽しくなってきました。",
      },
    ]),
  },
]);

export const achievementItems = Object.freeze([
  { id: "first-landfall", title: "FIRST LANDFALL", name: "初次登陆", detail: "阅读第一篇文章。" },
  { id: "first-checkpoint", title: "FIRST CHECKPOINT", name: "留下航标", detail: "在游戏中写入第一份检查点存档。" },
  { id: "returning-reader", title: "RETURNING READER", name: "再访之人", detail: "阅读三篇不同的文章。" },
  { id: "four-tides", title: "FOUR TIDES", name: "四潮巡礼", detail: "看过灰霭、晴昼、暗夜与赤夜。" },
  { id: "monthly-archive", title: "MONTHLY ARCHIVE", name: "月之记录", detail: "打开一个真实月份的日记。" },
  { id: "memory-keeper", title: "MEMORY KEEPER", name: "拾忆者", detail: "查看五张不同的 CG。" },
  { id: "after-the-silence", title: "AFTER THE SILENCE", name: "静默之后", detail: "播放一首鉴赏室音乐。" },
  { id: "bangumi-record", title: "BANGUMI RECORD", name: "收藏见证", detail: "访问同步后的 BANGUMI 记录。" },
  { id: "archive-walker", title: "ARCHIVE WALKER", name: "鉴赏室漫游者", detail: "访问 EXTRA 的全部房间。" },
]);

export const extraDefaults = Object.freeze({
  cg: ["SCENE ARCHIVE", "OPEN CG"],
  music: ["星が瞬くこんな夜に", "SELECT MUSIC"],
  projects: ["mcp-switch", "OPEN PROJECT"],
  bangumi: ["BANGUMI RECORD", "OPEN RECORD"],
  movie: ["CODING RECORDS", "OPEN PLAYLIST"],
  character: ["Alice", "MEET CHARACTER"],
  achievement: ["FIRST LANDFALL", "ACHIEVEMENT"],
});
