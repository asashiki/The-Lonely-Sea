import type { APIRoute } from "astro";
import { siteConfig } from "../../site.config.mjs";

export const GET: APIRoute = () => new Response([
  "User-agent: *",
  "Allow: /",
  "Disallow: /reading-fragments/",
  `Sitemap: ${new URL("/sitemap.xml", siteConfig.url).href}`,
  "",
].join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
