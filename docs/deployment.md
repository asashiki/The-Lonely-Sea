# 将当前版本上线到 asashiki.com

当前版本来自 `codex/latest-nvl-20260910` 分支（本机 4323 预览）。不要误选旧 main 分支或 Downloads 中的旧副本。

## 推荐：GitHub → Cloudflare Pages

1. Cloudflare 控制台 → Workers & Pages → Create application → Pages → Import an existing Git repository。
2. 选择 `asashiki/The-Lonely-Sea`。新项目可命名 `the-lonely-sea`；若名称已占用，选另一个未占用名称。
3. 配置如下：

| 设置 | 值 |
| --- | --- |
| Production branch | `codex/latest-nvl-20260910` |
| Framework preset | Astro |
| Root directory | 留空（仓库根目录） |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| NODE_VERSION | `24.14.1` |
| PNPM_VERSION | `11.9.0` |
| SITE_URL | `https://asashiki.com` |
| GAME_HOST_ORIGINS | `https://实际项目名.pages.dev` |

环境变量在生产和预览环境都设置。项目中已有 wrangler.jsonc；无需 Worker、数据库或服务端适配器。Cloudflare 的 CF_PAGES_URL 会自动加入游戏宿主白名单；GAME_HOST_ORIGINS 补充稳定的 pages.dev 地址。多个额外域名用逗号分隔。

4. Save and Deploy。先打开生成的 pages.dev 地址，检查首页、START、声音、LOAD、文章、六月 NVL。临时地址的存档不会自动转移到 asashiki.com，因为浏览器按域名隔离本地存储。
5. 预览通过后，在新项目 → Custom domains → Set up a custom domain，添加 `asashiki.com`。
6. 若域名已经绑定旧 Pages 项目，先记录旧项目名和 DNS 目标，再从旧项目解除这个自定义域名，并立即在新项目添加。保留旧项目，不删除。
7. 若旧站使用 Workers 自定义域名或 Route，解除旧站对这个域名的绑定/路由，再按新 Pages 的提示调整 DNS。只处理网站对应记录，不动邮件 MX/TXT 或其他子域。
8. 不能只手改 CNAME：必须在 Pages 添加 Custom domain 并等到 Active。根域名需要该域名的 DNS zone 位于同一 Cloudflare 账户。
9. 如果也使用 www，添加 `www.asashiki.com`，再在域名 Redirect Rules 设置 www → https://asashiki.com，并保留路径和查询参数。
10. 清理 asashiki.com 的旧站缓存，检查既有 Cache Rules 不要给 HTML 强制长期缓存。正式 HTTPS 地址再检查 START → 存档 → 返回 → LOAD，以及文章链接和手机横屏。

原有文章 URL 如与新站不一致，需要按真实对应关系补 301；没有对应内容的页面保留 404，不要把所有旧地址都跳首页。

## 已处理的发布内容

- 最新带配音游戏包与已登记的兼容版本纳入 Git，避免云端构建缺文件。
- `pnpm build` 自动检查类型、构建静态页面、整理 dist。
- dist 只包含登记的三个游戏版本；未登记的旧开发包仅从构建产物排除，本地原件保留。
- 生产/预览游戏白名单在构建产物内生成，同步完整性哈希，不修改本地源游戏包。
- 对可变文件使用重新验证缓存；Astro 哈希资源长期缓存。
- 检查 Pages 免费方案的 20,000 文件与单文件 25 MiB 限制。

不再使用旧的 `pnpm game:origins` 作为发布步骤，该脚本针对早期游戏包格式。正常发布只运行 `pnpm build`。

## 后续更新

修改文章或项目数据后，提交并推送同一生产分支，Cloudflare 自动部署。以后整理到 main 时，再同时改 Pages 的 Production branch，避免部署旧代码。

项目展示数据在 `src/data/extra-content.js`，网址以 GitHub About / Website 中的真实项目主页为依据。不是所有填了网址的仓库都等于独立网页：指向 GitHub 本身或合作汇总页的链接不作为独立应用入口。

## 本地构建和手动发布备选

```powershell
Set-Location 'C:\Users\Hey\.codex\worktrees\70e5\The-Lonely-Sea'
$env:SITE_URL = 'https://asashiki.com'
$env:GAME_HOST_ORIGINS = 'https://实际项目名.pages.dev'
pnpm install --frozen-lockfile
pnpm build
pnpm exec wrangler login
pnpm exec wrangler pages deploy dist --project-name 实际项目名 --branch codex/latest-nvl-20260910
```

先创建并核对目标 Pages 项目再执行最后一行，branch 应与目标生产分支一致。首次建站优先用上面的 Git 接入，避免后续手工上传；直接上传型项目不能直接切换为 Git 集成。

## 回退

保留旧项目及其原 DNS 目标。如新站需要回退，将自定义域名绑定回旧项目并恢复原 DNS/路由。新站自身后续更新失败，可在 Pages Deployments 中回滚之前成功的生产部署。

## 官方资料

- [Astro on Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
