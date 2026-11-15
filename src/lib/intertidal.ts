import { INTERTIDAL_PAIRS } from "../data/intertidal";
import { getPublishedPosts, postHref, postSlug, type Post } from "./posts";

type CuratedSource = (typeof INTERTIDAL_PAIRS)[number]["left"];

export type ResolvedSource = CuratedSource & {
  title: string;
  href: string;
  articleHref: string;
  published: string;
};

export interface ResolvedPair {
  id: string;
  title: string;
  left: ResolvedSource;
  right: ResolvedSource;
}

function normalizeText(value: string): string {
  return value
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-+*]\s+|\d+[.)]\s+)/gm, "")
    .replace(/(`+)([^]*?)\1/g, "$2")
    .replace(/(\*\*|__|~~)([^]*?)\1/g, "$2")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/\\([\\`*_{}\[\]()#+\-.!|>])/g, "$1")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function textFragment(quote: string): string {
  const opening = quote.match(/^[^。！？]+[。！？]?/u)?.[0] ?? quote;
  const excerpt = Array.from(opening).slice(0, 120).join("");
  return encodeURIComponent(excerpt).replace(
    /[-!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export async function getIntertidalPairs(posts?: Post[]): Promise<ResolvedPair[]> {
  const publishedPosts = (posts ?? await getPublishedPosts()).filter((post) => !post.data.draft);
  const postsBySlug = new Map(publishedPosts.map((post) => [postSlug(post), post]));
  const resolved: ResolvedPair[] = [];

  for (const pair of INTERTIDAL_PAIRS) {
    const resolve = (source: CuratedSource, side: "left" | "right"): ResolvedSource | null => {
      const post = postsBySlug.get(source.slug);
      const quote = normalizeText(source.quote);
      if (!post || !quote || !normalizeText(post.body ?? "").includes(quote)) return null;
      if (!Number.isFinite(post.data.published.valueOf())) return null;

      const articleHref = postHref(post);
      const query = new URLSearchParams({ intertidal: pair.id, side });
      return {
        ...source,
        title: post.data.title,
        articleHref,
        href: `${articleHref}?${query}#:~:text=${textFragment(quote)}`,
        published: post.data.published.toISOString().slice(0, 10),
      };
    };

    const left = resolve(pair.left, "left");
    const right = resolve(pair.right, "right");
    if (left && right) resolved.push({ id: pair.id, title: pair.title, left, right });
  }

  return resolved;
}

function letterCount(value: string): number {
  return value.match(/\p{Letter}/gu)?.length ?? 0;
}

function cleanParagraph(value: string): string {
  return normalizeText(value
    .replace(/!\[[^\]]*\](?:\([^)]*\)|\[[^\]]*\])/g, "")
    .replace(/!\[[^\]]*\]/g, "")
    .replace(/\[\^[^\]]+\]/g, ""));
}

function isTableDivider(line: string): boolean {
  if (!line.includes("|")) return false;
  return line.trim().replace(/^\||\|$/g, "").split("|")
    .every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
}

function articleParagraphs(body: string): { quote: string; section: string }[] {
  const lines = body
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<(script|style|pre)\b[^>]*>[^]*?<\/\1\s*>/gi, "")
    .split(/\r?\n/);
  const paragraphs: { quote: string; section: string }[] = [];
  let section = "正文";
  let pending: string[] = [];
  let fence = "";
  let table = false;
  const flush = () => {
    const quote = cleanParagraph(pending.join(" "));
    if (quote) paragraphs.push({ quote, section });
    pending = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.replace(/^\s{0,3}(?:>\s*)+/, "").trim();
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0]
        && fenceMatch[1].length >= fence.length && !fenceMatch[2].trim()) fence = "";
      continue;
    }
    if (fenceMatch) {
      flush();
      fence = fenceMatch[1];
      continue;
    }
    if (!line || /^(?: {4}|\t)/.test(raw)) {
      flush();
      table = false;
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+?)(?:\s+#+)?$/);
    const setextHeading = /^\s*(?:={3,}|-{3,})\s*$/.test(lines[index + 1] ?? "");
    if (heading || setextHeading) {
      flush();
      section = cleanParagraph(heading?.[1] ?? line) || "正文";
      table = false;
      if (setextHeading && !heading) index += 1;
      continue;
    }
    if (/^(?:(?:[-*_]\s*){3,}|\[[^\]]+\]:.*)$/.test(line)) {
      flush();
      continue;
    }
    if (isTableDivider(line)) {
      flush();
      table = true;
      continue;
    }

    const tableRow = line.includes("|")
      && (table || line.startsWith("|") || line.endsWith("|") || isTableDivider(lines[index + 1] ?? ""));
    if (tableRow) {
      flush();
      table = true;
      // A review may live inside a table; never join its neighbouring data cells.
      for (const cell of line.replace(/^\||\|$/g, "").split(/(?<!\\)\|/)) {
        const quote = cleanParagraph(cell);
        if (letterCount(quote) >= 25 && (/[，。！？；,!?;]/.test(quote) || quote.length >= 80)) {
          paragraphs.push({ quote, section });
        }
      }
      continue;
    }

    table = false;
    const clean = cleanParagraph(line);
    if (!clean) {
      flush();
      continue;
    }
    if (/^(?:[-+*]|\d+[.)])\s+/.test(line)) flush();
    pending.push(line);
  }
  flush();
  return paragraphs;
}

function splitParagraph(quote: string): string[] {
  const chunks: string[] = [];
  let characters = Array.from(quote);
  while (characters.length > 220) {
    // Leave enough room for a readable final fragment, preferring sentence ends.
    const limit = Math.min(220, characters.length - 80);
    let cut = 0;
    for (const boundary of [/[。！？]/u, /[，；、,.!?;]/u]) {
      for (let index = limit - 1; index >= 79; index -= 1) {
        if (boundary.test(characters[index])) {
          cut = index + 1;
          while (cut < limit && /[”’」』）)]/u.test(characters[cut])) cut += 1;
          break;
        }
      }
      if (cut) break;
    }
    if (!cut) cut = limit;
    chunks.push(characters.slice(0, cut).join("").trim());
    characters = characters.slice(cut);
  }
  if (characters.length) chunks.push(characters.join("").trim());
  return chunks;
}

function fragmentHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
}

export async function getIntertidalIndex(posts?: Post[]): Promise<ResolvedSource[]> {
  const publishedPosts = (posts ?? await getPublishedPosts()).filter((post) => !post.data.draft);
  const index: ResolvedSource[] = [];
  const seen = new Set(INTERTIDAL_PAIRS.flatMap((pair) => [pair.left.id, pair.right.id]));

  for (const post of publishedPosts) {
    if (!Number.isFinite(post.data.published.valueOf())) continue;
    const slug = postSlug(post);
    const articleHref = postHref(post);
    const published = post.data.published.toISOString().slice(0, 10);
    const year = post.data.title.match(/20\d{2}/)?.[0] ?? published.slice(0, 4);
    let count = 0;

    for (const paragraph of articleParagraphs(post.body ?? "")) {
      for (const quote of splitParagraph(paragraph.quote)) {
        if (letterCount(quote) < 25) continue;
        const id = `word-${fragmentHash(`${slug}\0${quote}`)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        index.push({
          id,
          slug,
          year,
          quote,
          section: paragraph.section,
          title: post.data.title,
          articleHref,
          href: `${articleHref}#:~:text=${textFragment(quote)}`,
          published,
        });
        count += 1;
        if (count >= 200) break;
      }
      if (count >= 200) break;
    }
  }

  return index;
}
