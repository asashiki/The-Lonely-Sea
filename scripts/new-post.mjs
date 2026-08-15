import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsRoot = resolve(root, "src/content/posts");
const [titleInput, slugInput] = process.argv.slice(2);

if (!titleInput?.trim()) {
  console.error('用法：pnpm post:new -- "文章标题" [slug]');
  process.exit(1);
}

function toSlug(value) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^\.+|\.+$/g, "")
    .replace(/^-+|-+$/g, "");
}

const title = titleInput.trim();
const slug = toSlug(slugInput || title);
if (!slug || slug === "." || slug === "..") {
  console.error("无法生成安全的 slug，请手动提供第二个参数。");
  process.exit(1);
}

const published = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
const year = published.slice(0, 4);
const postDirectory = resolve(postsRoot, year, slug);
if (!postDirectory.startsWith(`${postsRoot}${sep}`)) {
  console.error("目标路径超出文章目录，已停止。");
  process.exit(1);
}

const postPath = resolve(postDirectory, "index.md");
const frontmatter = `---
title: ${JSON.stringify(title)}
slug: ${JSON.stringify(slug)}
published: ${published}
description: "TODO：一句话说明这篇文章"
tags: []
category: "随笔"
draft: true
lang: "zh-CN"
---

# ${title}

从这里开始写。
`;

await mkdir(postDirectory, { recursive: true });
try {
  await writeFile(postPath, frontmatter, { encoding: "utf8", flag: "wx" });
  console.log(`已创建草稿：${postPath}`);
} catch (error) {
  if (error?.code === "EEXIST") {
    console.error(`文章已存在，未覆盖：${postPath}`);
    process.exit(1);
  }
  throw error;
}
