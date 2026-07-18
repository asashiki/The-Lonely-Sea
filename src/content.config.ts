import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.{md,mdx}",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      cover: image().optional(),
      tags: z.array(z.string()).default([]),
      category: z.string().optional(),
      draft: z.boolean().default(false),
      lang: z.string().optional(),
    }),
});

export const collections = { posts };
