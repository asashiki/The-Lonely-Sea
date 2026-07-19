import { getImage } from "astro:assets";
import { formatPostDate, getPublishedPosts, postHref } from "./posts";

export interface ExperienceRecord {
  archiveCategory: string;
  coverUrl: string;
  date: string;
  dateLabel: string;
  excerpt: string;
  label: string;
  minutes: string;
  number: string;
  scene: string;
  title: string;
  url: string;
}

const fallbackScenes = ["mist", "day", "night", "crimson"];

function archiveCategory(tags: string[]): string {
  if (tags.includes("anime")) return "anime";
  if (tags.includes("project")) return "project";
  if (tags.includes("note")) return "note";
  return "essay";
}

function recordLabel(tags: string[], category?: string): string {
  if (tags.includes("anime")) return "ANIME";
  if (tags.includes("game")) return "GAME";
  return category?.toLocaleUpperCase("zh-CN") || "ESSAY";
}

export async function getExperienceRecords(): Promise<ExperienceRecord[]> {
  const posts = await getPublishedPosts();

  return Promise.all(posts.map(async (post, index) => {
    const tags = post.data.tags.map((tag) => tag.toLocaleLowerCase("en-US"));
    const scene = fallbackScenes[index % fallbackScenes.length] ?? "mist";
    const cover = post.data.cover
      ? await getImage({
          src: post.data.cover,
          width: 960,
          height: 540,
          format: "webp",
          quality: 84,
        })
      : undefined;

    return {
      archiveCategory: archiveCategory(tags),
      coverUrl: cover?.src ?? `/assets/lonely-sea/${scene}.png`,
      date: post.data.published.toISOString().slice(0, 10).replaceAll("-", "."),
      dateLabel: formatPostDate(post.data.published, post.data.lang),
      excerpt: post.data.description,
      label: recordLabel(tags, post.data.category),
      minutes: String(Math.min(18, 5 + index)).padStart(2, "0"),
      number: String(index + 1).padStart(2, "0"),
      scene,
      title: post.data.title,
      url: postHref(post),
    };
  }));
}
