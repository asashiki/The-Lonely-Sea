import { readFile, writeFile, readdir, rm, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { siteConfig } from '../site.config.mjs';

// Prepare only build output; keep local source packages and old saves intact.
const dist = resolve('dist');
const root = resolve(dist, 'games/lonely-sea-chapter-one');
const registry = await readFile('src/lib/gal-blog/release-registry.ts', 'utf8');
const releases = [...registry.matchAll(/directory:\s*"([^"]+)"/g)].map(match => match[1]);
if (!releases.length) throw new Error('没有登记的游戏版本');
const origins = [...new Set([
  new URL(siteConfig.url).origin,
  'https://www.asashiki.com',
  ...[4321, 4322, 4323].flatMap(port => [`http://localhost:${port}`, `http://127.0.0.1:${port}`]),
  ...[process.env.CF_PAGES_URL, ...(process.env.GAME_HOST_ORIGINS || '').split(',')]
    .filter(Boolean).map(value => new URL(value.trim()).origin),
])];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || releases.includes(entry.name)) continue;
  const target = resolve(root, entry.name);
  if (!target.startsWith(root + sep) || !root.startsWith(dist + sep)) throw new Error('输出路径越界');
  await rm(target, { recursive: true });
}
for (const release of releases) {
  const directory = resolve(root, release);
  if (!directory.startsWith(root + sep)) throw new Error('版本路径越界');
  for (const name of ['gal-blog.embed.json', 'manifest.json']) {
    const path = resolve(directory, name);
    const manifest = JSON.parse(await readFile(path, 'utf8'));
    manifest.bridge.allowedHostOrigins = origins;
    await writeFile(path, JSON.stringify(manifest, null, 2) + '\n');
  }
  const htmlPath = resolve(directory, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  if (!/"allowedHostOrigins":\[[^\]]*\]/.test(html)) throw new Error(`${release}: 缺少宿主配置`);
  await writeFile(htmlPath, html.replace(/"allowedHostOrigins":\[[^\]]*\]/g, `"allowedHostOrigins":${JSON.stringify(origins)}`));
  const integrityPath = resolve(directory, 'integrity.json');
  const integrity = JSON.parse(await readFile(integrityPath, 'utf8'));
  for (const entry of integrity.files) {
    const path = resolve(directory, entry.path);
    if (!path.startsWith(directory + sep)) throw new Error('完整性路径越界');
    const bytes = await readFile(path);
    entry.bytes = bytes.length;
    entry.sha256 = createHash('sha256').update(bytes).digest('hex');
  }
  await writeFile(integrityPath, JSON.stringify(integrity, null, 2) + '\n');
}
let files = 0, bytes = 0;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else {
      const size = (await stat(path)).size;
      if (size > 25 * 1024 * 1024) throw new Error(`超过 Pages 单文件限制：${path}`);
      files++; bytes += size;
    }
  }
}
await inspect(dist);
if (files > 20000) throw new Error('超过 Pages 免费方案文件数量限制');
console.log(`Pages 就绪：${files} 文件，${(bytes / 1024 / 1024).toFixed(1)} MiB；保留 ${releases.length} 个登记游戏版本。`);
