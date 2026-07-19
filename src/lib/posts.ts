import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => !data.draft);

  return posts.sort(
    (left, right) => right.data.published.valueOf() - left.data.published.valueOf(),
  );
}

export function postSlug(post: Post): string {
  return post.data.slug ?? post.id;
}

export function postHref(post: Post): string {
  return `/posts/${postSlug(post)}/`;
}

export function normalizePostLocale(locale?: string): string {
  return locale?.trim() || "zh-CN";
}

export function formatPostDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(normalizePostLocale(locale), {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}
