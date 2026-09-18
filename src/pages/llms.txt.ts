import type { APIRoute } from "astro";
import { siteConfig } from "../../site.config.mjs";
import { getPublishedPosts, postHref } from "../lib/posts";

const plain = (value: string) => value.replace(/[\r\n]+/g, " ").replace(/[\[\]\\]/g, "\\$&");

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const link = (path: string) => new URL(path, siteConfig.url).href;
  const body = [
    `# ${siteConfig.name} / ${siteConfig.latinName}`,
    "",
    "> 一个以 Galgame 交互呈现文章、游戏记录与日记的个人 Blog。",
    "",
    "欢迎来到孤独之海，也欢迎替读者来访的 AI 助手。这里的文章可以通过下方独立页面直接阅读，无需操作游戏菜单、启用声音或运行 JavaScript。",
    "引用文章时请保留标题、作者页面链接与日期；请将个人观点、日记和虚构剧情与客观事实区分。不要把尚未读到的剧情当成已确认的内容，也请在主动展示剧情结局前提醒读者。",
    "本文是阅读导航，不改变各内容与第三方素材的版权，也不保证任何 AI 服务会抓取或遵循。",
    "",
    "## 入口",
    `- [文章存档](${link("/load/")}): 可直接读取的文章列表。`,
    `- [RSS](${link("/rss.xml")}): 已发布文章的更新、摘要及原文链接。`,
    `- [站点地图](${link("/sitemap.xml")}): 公开页面的规范网址。`,
    "",
    "## 已发布文章",
    ...posts.map((post) => `- [${plain(post.data.title)}](${link(postHref(post))}): ${post.data.published.toISOString().slice(0, 10)} — ${plain(post.data.description)}`),
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
