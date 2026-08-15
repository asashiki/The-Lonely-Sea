import { sceneArt } from "../scripts/experience/config.js";
import activitySnapshot from "./generated/activity.json";
import bangumiSnapshot from "./generated/bangumi.json";
import musicSnapshot from "./generated/music.json";

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

export const musicItems = Object.freeze([...musicSnapshot.items].reverse());

export const musicPlaylist = Object.freeze({
  id: musicSnapshot.playlistId,
  url: musicSnapshot.playlistUrl || `https://music.163.com/playlist?id=${musicSnapshot.playlistId}`,
});

export const projectCategories = Object.freeze([
  { id: "main", labels: Object.freeze({ "ZH-CN": "主项目", "EN-US": "MAIN", "JA-JP": "主軸" }) },
  { id: "tool", labels: Object.freeze({ "ZH-CN": "小工具", "EN-US": "TOOLS", "JA-JP": "小物" }) },
  { id: "web", labels: Object.freeze({ "ZH-CN": "Web", "EN-US": "WEB", "JA-JP": "Web" }) },
  { id: "docs", labels: Object.freeze({ "ZH-CN": "文档", "EN-US": "DOCS", "JA-JP": "資料" }) },
]);

export const projectTagOrder = Object.freeze([
  "Python", "Java", "Kotlin", "TypeScript", "WebGAL", "Docker", "Playwright",
  "Galgame", "MCP", "DevOps", "AIGC", "i18n", "Game",
  "进行中", "维护中", "已归档", "想法",
]);

export const projectTagLabels = Object.freeze({
  进行中: Object.freeze({ "ZH-CN": "进行中", "EN-US": "WIP", "JA-JP": "進行中" }),
  维护中: Object.freeze({ "ZH-CN": "维护中", "EN-US": "MAINTAINED", "JA-JP": "維持中" }),
  已归档: Object.freeze({ "ZH-CN": "已归档", "EN-US": "ARCHIVED", "JA-JP": "アーカイブ" }),
  想法: Object.freeze({ "ZH-CN": "想法", "EN-US": "IDEA", "JA-JP": "構想" }),
});

function copy(zh, en, ja) {
  return Object.freeze({ "ZH-CN": zh, "EN-US": en, "JA-JP": ja });
}

// PROJECT 条目只改这里。
// category: main | tool | web | docs
// tags: 多对多属性。github / href / note 有值才出按钮；note 为站内文章路径。
export const projectItems = Object.freeze([
  {
    title: "The-Lonely-Sea",
    mark: "LONELY / SEA",
    category: "main",
    tags: Object.freeze(["WebGAL", "Galgame", "i18n", "进行中"]),
    art: "/assets/cg/generated/scene-17.webp",
    description: copy(
      "视觉小说式的个人站点：文章、存档与 Extra 收在同一片海里。",
      "A visual-novel-shaped personal site: essays, saves, and Extra in one sea.",
      "ビジュアルノベル型の個人サイト。文章・セーブ・Extra を同じ海に収める。",
    ),
    github: "https://github.com/asashiki/The-Lonely-Sea",
    note: "/posts/2026/the-lonely-sea/",
  },
  {
    title: "MCP Switch",
    mark: "MCP / SWITCH",
    category: "main",
    tags: Object.freeze(["MCP", "TypeScript", "Docker", "进行中"]),
    art: "/assets/cg/generated/scene-13.webp",
    description: copy(
      "自托管 MCP 聚合网关：本地 stdio 与远程 HTTP 挂到同一扇 OAuth 门后。",
      "Self-hosted MCP gateway: local stdio and remote HTTP behind one OAuth door.",
      "自前ホストの MCP 集約。ローカル stdio とリモート HTTP を一つの OAuth にまとめる。",
    ),
    github: "https://github.com/asashiki/mcp-switch",
    href: "https://show.asashiki.com/console/",
    note: "/posts/2026/mcp-switch/",
  },
  {
    title: copy("日付きのない日墓", "Dateless Grave", "日付きのない日墓"),
    mark: "DATELESS / GRAVE",
    category: "web",
    tags: Object.freeze(["Game", "维护中"]),
    art: "/assets/cg/generated/scene-19.webp",
    description: copy(
      "没有日期的墓碑页，按形态就是一个独立网页。",
      "A dateless grave page: a standalone web piece.",
      "日付のない墓。独立したウェブ作品。",
    ),
    href: "https://bpm.asashiki.com/",
  },
  {
    title: copy("MCP工具合集", "MCP Showcase", "MCP 展示集"),
    mark: "MCP / SHOW",
    category: "main",
    tags: Object.freeze(["MCP", "维护中"]),
    art: "/assets/cg/generated/scene-08.webp",
    description: copy(
      "浅仪式 MCP 与小工具的在线展示集合。",
      "A live showcase of Asashiki MCP tools and small utilities.",
      "浅儀式の MCP と小物を並べた展示ページ。",
    ),
    href: "https://show.asashiki.com/",
  },
  {
    title: "device-timeline-mcp",
    mark: "TIMELINE / MCP",
    category: "main",
    tags: Object.freeze(["MCP", "Kotlin", "i18n", "进行中"]),
    art: "/assets/cg/generated/scene-01.webp",
    description: copy(
      "Android / iOS / Windows / macOS 实时时间线上传，并给 Agent 留 MCP 入口。",
      "Live timelines from Android, iOS, Windows, and macOS, with an MCP door for agents.",
      "Android / iOS / Windows / macOS のタイムラインを上げ、Agent 向けの MCP 口を残す。",
    ),
    github: "https://github.com/asashiki/device-timeline-mcp",
  },
  {
    title: "oblivion-haven",
    mark: "OBLIVION / HAVEN",
    category: "docs",
    tags: Object.freeze(["想法", "TypeScript"]),
    art: "/assets/cg/generated/scene-20.webp",
    description: copy(
      "遗忘港湾：一份还在堆起来的资料与备忘。",
      "Oblivion Haven: notes and materials still being gathered.",
      "忘却の港。まだ積み上げている資料と覚え書き。",
    ),
    github: "https://github.com/asashiki/oblivion-haven",
  },
  {
    title: "X2Video",
    mark: "X → VIDEO",
    category: "tool",
    tags: Object.freeze(["Python", "AIGC", "进行中"]),
    art: "/assets/cg/generated/scene-04.webp",
    description: copy(
      "把 X 内容转成视频的多 Agent 协作实验。",
      "A multi-agent experiment that turns X posts into video.",
      "X の内容を動画にする、複数 Agent の実験。",
    ),
    github: "https://github.com/asashiki/X2Video",
  },
  {
    title: "Xmarks",
    mark: "X / MARKS",
    category: "tool",
    tags: Object.freeze(["维护中"]),
    art: "/assets/cg/generated/scene-11.webp",
    description: copy(
      "导出 X 书签，当前文件夹或全部，没有付费墙。",
      "Export X bookmarks, one folder or all, without a paywall.",
      "X のブックマークを書き出す。フォルダ単位でも全部でも、課金壁なし。",
    ),
    github: "https://github.com/asashiki/xmarks",
  },
  {
    title: copy("死了没？", "Still Up?", "死んでる？"),
    mark: "BPM / ALIVE",
    category: "web",
    tags: Object.freeze(["维护中"]),
    art: "/assets/cg/generated/scene-06.webp",
    description: copy(
      "给 bpm.asashiki.com 用的只读健康看板，语气不太正经。",
      "A darkly comic readonly health board for bpm.asashiki.com.",
      "bpm.asashiki.com の読み取り専用ヘルス看板。口調は真面目じゃない。",
    ),
    href: "https://bpm.asashiki.com/",
  },
  {
    title: "rhythm-game",
    mark: "RHYTHM",
    category: "web",
    tags: Object.freeze(["Game", "TypeScript", "维护中"]),
    art: "/assets/cg/generated/scene-02.webp",
    description: copy(
      "公开跑着的节奏游戏实验。",
      "A public rhythm-game experiment.",
      "公開して走らせているリズムゲームの実験。",
    ),
    href: "https://github.com/asashiki/rhythm-game",
  },
  {
    title: "asashiki-design",
    mark: "ASASHIKI / DESIGN",
    category: "docs",
    tags: Object.freeze(["维护中"]),
    art: "/assets/cg/generated/scene-15.webp",
    description: copy(
      "浅仪式设计系统：樱羽主视觉、四季配色、面向 AI / Agent 的视觉规范。",
      "Asashiki design system: sakura key visual, seasonal palette, rules for AI and agents.",
      "浅儀式のデザインシステム。桜羽の主視覚、四季の配色、AI / Agent 向けの決まり。",
    ),
    href: "https://github.com/asashiki/asashiki-design",
  },
  {
    title: "vibegame",
    mark: "VIBE / GAME",
    category: "docs",
    tags: Object.freeze(["AIGC", "Game", "想法"]),
    art: "/assets/cg/generated/scene-10.webp",
    description: copy(
      "用 AI 做游戏的文档与个人想法整理。",
      "Notes and ideas on making games with AI.",
      "AI でゲームを作るための資料と個人メモ。",
    ),
    href: "https://github.com/asashiki/vibe-game",
  },
  {
    title: "sticker-mcp",
    mark: "STICKER / MCP",
    category: "tool",
    tags: Object.freeze(["MCP", "TypeScript", "维护中"]),
    art: "/assets/cg/generated/scene-18.webp",
    description: copy(
      "让 AI 在对话里发表情包：内联组件和网页管理后台。",
      "Let the AI send stickers in chat, with an inline widget and a web admin.",
      "会話のなかで AI がスタンプを送る。インライン部品と管理ページつき。",
    ),
    github: "https://github.com/asashiki/sticker-mcp",
    href: "https://show.asashiki.com/projects/sticker-mcp",
  },
  {
    title: "voice-send-mcp",
    mark: "VOICE / MCP",
    category: "tool",
    tags: Object.freeze(["MCP", "TypeScript", "维护中"]),
    art: "/assets/cg/generated/scene-03.webp",
    description: copy(
      "对话内语音气泡，MiniMax / OpenAI / ElevenLabs / Edge 可切换。",
      "In-chat voice bubbles with MiniMax, OpenAI, ElevenLabs, or Edge.",
      "会話内の音声バブル。MiniMax / OpenAI / ElevenLabs / Edge を切り替えられる。",
    ),
    github: "https://github.com/asashiki/voice-send-mcp",
  },
  {
    title: "music-mcp",
    mark: "MUSIC / MCP",
    category: "tool",
    tags: Object.freeze(["MCP", "TypeScript", "维护中"]),
    art: "/assets/cg/generated/scene-12.webp",
    description: copy(
      "对话内音乐播放器：检索、歌单、同步歌词。",
      "An in-chat music player with search, playlists, and synced lyrics.",
      "会話内の音楽プレイヤー。検索・プレイリスト・同期歌詞。",
    ),
    github: "https://github.com/asashiki/music-mcp",
  },
  {
    title: "reel-rando-mcp",
    mark: "REEL / RANDO",
    category: "tool",
    tags: Object.freeze(["MCP", "TypeScript", "维护中"]),
    art: "/assets/cg/generated/scene-16.webp",
    description: copy(
      "把选项变成对话里的老虎机、转盘或抽卡。",
      "Turn choices into a slot machine, wheel, or card draw in chat.",
      "選択肢を会話のなかのスロット・ルーレット・抽選にする。",
    ),
    github: "https://github.com/asashiki/reel-rando-mcp",
  },
  {
    title: "nico-danmaku-api",
    mark: "DANMAKU",
    category: "tool",
    tags: Object.freeze(["Python", "已归档"]),
    art: "/assets/cg/generated/scene-07.webp",
    description: copy(
      "给播放器弹幕源加一条链接，就能看 niconico 弹幕。",
      "Add one URL to a player danmaku source and get niconico comments.",
      "プレイヤーの弾幕源に一本リンクを足すと、niconico の弾幕が見られる。",
    ),
    github: "https://github.com/asashiki/nico-danmaku-api",
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
