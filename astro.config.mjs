import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { siteConfig } from "./site.config.mjs";
import {
  satteriImageAttributes,
  satteriImageLinkPreviews,
} from "./src/lib/satteri-image-attributes.mjs";

export default defineConfig({
  site: siteConfig.url,
  output: "static",
  trailingSlash: "always",
  markdown: {
    processor: satteri({
      hastPlugins: [satteriImageAttributes(), satteriImageLinkPreviews()],
    }),
  },
});
