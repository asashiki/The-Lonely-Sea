import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => !data.draft);

  return posts.sort(
    (left, right) => right.data.published.valueOf() - left.data.published.valueOf(),
  );
}

export function postHref(post: Post): string {
  return `/posts/${post.id}/`;
}

export function formatPostDate(date: Date, locale = "zh-CN"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}
