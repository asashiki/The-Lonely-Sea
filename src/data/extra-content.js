import { sceneArt } from "../scripts/experience/config.js";

export const cgItems = Object.freeze([
  { title: "灰霭之海", meta: "SCENE 01 / MIST", art: sceneArt.mist },
  { title: "晴日潮声", meta: "SCENE 02 / DAYLIGHT", art: sceneArt.day },
  { title: "无灯深夜", meta: "SCENE 03 / NIGHT", art: sceneArt.night },
  { title: "赤色梦境", meta: "SCENE 04 / CRIMSON", art: sceneArt.crimson },
  { title: "爱丽丝", meta: "CHARACTER / GUIDE", art: "/assets/lonely-sea/alice_chibi_transparent.png", portrait: true },
  {
    title: "2025 游戏记录",
    meta: "ARTICLE VISUAL / 2025",
    art: "https://picture-img.leqazwsxedc.workers.dev/Image_1769953951191_557.png",
  },
  {
    title: "2024 游戏记录",
    meta: "ARTICLE VISUAL / 2024",
    art: "https://picture-img.leqazwsxedc.workers.dev/game-2024image.png",
  },
  {
    title: "魔法使之夜",
    meta: "MEMORY / BANGUMI",
    art: "https://lain.bgm.tv/r/400/pic/cover/l/7d/3e/5418_VTRT4.jpg",
    portrait: true,
  },
]);

export const musicItems = Object.freeze([
  { number: "01", title: "Lonely Sea", length: "04:18", tone: "mist", note: "标题画面与灰霭场景的主题音轨预留位。" },
  { number: "02", title: "After the Rain", length: "03:46", tone: "day", note: "雨声结束后，晴日场景使用的轻快主题预留位。" },
  { number: "03", title: "Blue Hour", length: "05:02", tone: "night", note: "阅读深夜记录时使用的安静环境音预留位。" },
  { number: "04", title: "Crimson Sleep", length: "04:31", tone: "crimson", note: "赤夜路线的低频主题预留位。" },
  { number: "05", title: "Reading Loop", length: "∞", tone: "mist", note: "长文阅读时不中断的循环环境音预留位。" },
]);

export const characterItems = Object.freeze([
  {
    name: "爱丽丝",
    reading: "ALICE",
    role: "LIBRARIAN / SYSTEM GUIDE",
    text: "负责整理文章、项目与未写完的记忆，也是 START 与特殊页面之间的引导角色。",
    art: "/assets/lonely-sea/alice_chibi_transparent.png",
    unlocked: true,
  },
  { name: "晴日来客", reading: "DAYLIGHT ROUTE", role: "UNREGISTERED", text: "角色资料尚未写入。", art: sceneArt.day, unlocked: false },
  { name: "深夜来客", reading: "NIGHT ROUTE", role: "UNREGISTERED", text: "角色资料尚未写入。", art: sceneArt.night, unlocked: false },
  { name: "赤夜来客", reading: "CRIMSON ROUTE", role: "UNREGISTERED", text: "角色资料尚未写入。", art: sceneArt.crimson, unlocked: false },
]);

export const projectItems = Object.freeze([
  {
    title: "The Lonely Sea",
    state: "ACTIVE / SOURCE",
    description: "当前 Galgame Blog 的 Astro 实现与完整源码。",
    art: sceneArt.mist,
    href: "https://github.com/asashiki/The-Lonely-Sea",
  },
  {
    title: "Asashiki",
    state: "PERSONAL SITE",
    description: "浅仪式的个人入口与独立域名。",
    art: sceneArt.day,
    href: "https://asashiki.com",
  },
  {
    title: "GitHub Archive",
    state: "PROJECT INDEX",
    description: "完成、搁置与实验性项目的公开索引。",
    art: sceneArt.night,
    href: "https://github.com/asashiki",
  },
  {
    title: "Bangumi Record",
    state: "WATCH / PLAY DATA",
    description: "动画、游戏与收藏记录的外部资料页。",
    art: sceneArt.crimson,
    href: "https://bangumi.tv/user/asashiki",
  },
]);

export const bangumiItems = Object.freeze([
  {
    title: "魔法使之夜",
    type: "GAME / MEMORY",
    note: "在医院窗外的雨声里留下的个人记忆。",
    cover: "https://lain.bgm.tv/r/400/pic/cover/l/7d/3e/5418_VTRT4.jpg",
    href: "https://bangumi.tv/subject/5418",
  },
  {
    title: "恋狱～月狂病～重制版",
    type: "GAME / 2024",
    note: "旧作与重制之间，仍然延伸到海的另一边。",
    cover: "https://lain.bgm.tv/pic/cover/c/66/ed/410409_UT7gV.jpg",
    href: "https://bangumi.tv/subject/410409",
  },
  {
    title: "忍者龙剑传2 黑之章",
    type: "GAME / 2025",
    note: "在大电视上重新体验老派高速动作游戏。",
    cover: "https://lain.bgm.tv/r/400/pic/cover/l/11/38/534642_22MbM.jpg",
    href: "https://bangumi.tv/subject/534642",
  },
  {
    title: "金牌得主",
    type: "ANIME / 2025",
    note: "在被称为天才之前，先踏上那片薄冰。",
    cover: "https://lain.bgm.tv/r/400/pic/cover/l/ce/3c/430699_hsj90.jpg",
    href: "https://bangumi.tv/subject/430699",
  },
  {
    title: "卧龙：苍天陨落",
    type: "GAME / 2025",
    note: "三国背景、化解节奏与吕布留下的一夜苦战。",
    cover: "https://lain.bgm.tv/r/400/pic/cover/l/80/1d/366390_k96NH.jpg",
    href: "https://bangumi.tv/subject/366390",
  },
]);

export const developmentItems = Object.freeze([
  {
    date: "2026.07",
    title: "SPECIAL UI SYSTEM",
    state: "IN PROGRESS",
    description: "以 LOAD XIII 为基线，重构 START、EXTRA、OPTION、PAGE、404 与 EXIT。",
  },
  {
    date: "2026.07",
    title: "LOAD XIII",
    state: "VISUAL BASELINE",
    description: "文章、游戏记录、流程图、故事场景与月度日记完成统一读取系统。",
  },
  {
    date: "2026.07",
    title: "ASTRO MIGRATION",
    state: "FOUNDATION",
    description: "从单文件原型迁移到 Astro 内容集合与原生 CSS 架构。",
  },
  {
    date: "2025—2026",
    title: "CONTENT ARCHIVE",
    state: "MIGRATED",
    description: "保留年度动画、游戏与个人记录，并维持原有外部图床链接。",
  },
]);

export const extraDefaults = Object.freeze({
  cg: ["灰霭之海", "OPEN CG"],
  music: ["Lonely Sea", "SELECT SOUND TEST"],
  character: ["爱丽丝", "OPEN CHARACTER FILE"],
  projects: ["The Lonely Sea", "OPEN PROJECT"],
  bangumi: ["魔法使之夜", "OPEN BANGUMI"],
  development: ["SPECIAL UI SYSTEM", "READ DEVELOPMENT LOG"],
});
