import type { APIRoute } from "astro";
import { siteConfig } from "../../site.config.mjs";
import { getPublishedPosts, postHref } from "../lib/posts";

const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const entries = [
    ...["/", "/load/", "/connect/"].map((path) => ({ path, modified: undefined as Date | undefined })),
    ...posts.map((post) => ({ path: postHref(post), modified: post.data.updated ?? post.data.published })),
  ];
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    entries.map(({ path, modified }) => `<url><loc>${xml(new URL(path, siteConfig.url).href)}</loc>${modified ? `<lastmod>${modified.toISOString()}</lastmod>` : ""}</url>`).join("") +
    "</urlset>";
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
