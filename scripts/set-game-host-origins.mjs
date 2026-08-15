import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

import { siteConfig } from "../site.config.mjs";

const gamesRoot = resolve(process.cwd(), "public", "games");
const gameRoot = resolve(gamesRoot, "lonely-sea-chapter-one");
const releaseArgument = process.argv[2];
const publicReleases = releaseArgument
  ? []
  : (await readdir(gameRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

if (!releaseArgument && publicReleases.length !== 1) {
  throw new Error(`无法自动确定当前游戏包：public 中发现 ${publicReleases.length} 个版本`);
}

const releaseRoot = resolve(
  process.cwd(),
  releaseArgument ?? `public/games/lonely-sea-chapter-one/${publicReleases[0]}`,
);

if (!releaseRoot.startsWith(`${gamesRoot}${sep}`)) {
  throw new Error("游戏包目录必须位于 public/games 内");
}

const origins = [
  "http://127.0.0.1:4321",
  "http://localhost:4321",
  new URL(siteConfig.url).origin,
];
const compactOrigins = JSON.stringify(origins);

const manifestPath = resolve(releaseRoot, "gal-blog.embed.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.bridge.allowedHostOrigins = origins;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

for (const filename of ["boot.js", "gal-blog-bridge.js", "gal-blog-runtime.js", "index.html"]) {
  const path = resolve(releaseRoot, filename);
  const source = await readFile(path, "utf8");
  const updated = source.replace(/"origins":\[[^\]]*\]/, `"origins":${compactOrigins}`);
  if (updated === source) throw new Error(`${filename} 内没有找到 origins 配置`);
  await writeFile(path, updated);
}

const readmePath = resolve(releaseRoot, "README.md");
const readme = await readFile(readmePath, "utf8");
const hostLine = `允许宿主：${origins.join("、")}。`;
await writeFile(readmePath, readme.replace(/允许宿主：.*。/, hostLine));

const integrityPath = resolve(releaseRoot, manifest.integrity);
const integrity = JSON.parse(await readFile(integrityPath, "utf8"));
for (const file of integrity.files) {
  const path = resolve(releaseRoot, file.path);
  if (!path.startsWith(`${releaseRoot}${sep}`)) throw new Error(`完整性路径越界：${file.path}`);
  const contents = await readFile(path);
  file.bytes = (await stat(path)).size;
  file.sha256 = createHash("sha256").update(contents).digest("hex");
}
await writeFile(integrityPath, `${JSON.stringify(integrity, null, 2)}\n`);

console.log(`已更新 ${relative(process.cwd(), releaseRoot)} 的宿主来源：${origins.join(", ")}`);
