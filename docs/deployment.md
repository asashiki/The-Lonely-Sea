# 上线方式

本站采用 Astro 静态构建，发布到 Cloudflare Pages。项目名与域名不是构建前置条件：当前名称只需在 `site.config.mjs` 修改一次；正式域名通过 `SITE_URL` 注入。

## Cloudflare Pages

- Production branch：最终确认后再选择（建议 `main`）
- Build command：`pnpm build`
- Build output directory：`dist`
- Environment variable：`SITE_URL=https://你的正式域名`
- Node.js：`22.12` 或更高
- pnpm：`11` 或更高

连接 GitHub 后，每次推送会生成预览部署；正式分支才更新生产站点。暂不需要为这个纯静态站引入 Worker、数据库或服务端。

## 发布前

1. 修改 `site.config.mjs` 中的站名、英文名与默认域名。
2. 运行 `pnpm game:origins`，把正式域名写入当前游戏包并更新完整性清单。
3. 运行 `pnpm build`。
4. 确认文章封面均由站长最终选择。

`public/games` 只保留当前正式游戏版本；旧开发版本已移到 `.local/game-release-archive`，不会进入部署产物。
