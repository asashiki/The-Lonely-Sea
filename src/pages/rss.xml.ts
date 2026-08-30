import type { APIRoute } from "astro";

import { getPublishedPosts, postHref } from "../lib/posts";
import { siteConfig } from "../../site.config.mjs";

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL("http://localhost:4321");
  const posts = await getPublishedPosts();
  const items = posts.map((post) => {
    const href = new URL(postHref(post), origin).href;
    return [
      "<item>",
      `<title>${xml(post.data.title)}</title>`,
      `<link>${xml(href)}</link>`,
      `<guid isPermaLink="true">${xml(href)}</guid>`,
      `<pubDate>${post.data.published.toUTCString()}</pubDate>`,
      `<description>${xml(post.data.description)}</description>`,
      "</item>",
    ].join("");
  }).join("");
  const feedUrl = new URL("/rss.xml", origin).href;
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    `<title>${xml(siteConfig.name)}</title>`,
    `<link>${xml(origin.href)}</link>`,
    "<description>浅仪式的文章、游戏记录与个人档案。</description>",
    `<language>${xml(siteConfig.locale)}</language>`,
    `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${xml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    items,
    "</channel></rss>",
  ].join("");
  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
