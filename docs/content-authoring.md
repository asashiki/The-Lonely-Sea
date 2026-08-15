# 内容维护手册

## 新建文章

```powershell
pnpm post:new -- "文章标题" optional-slug
```

脚本会在 `src/content/posts/<年份>/<slug>/index.md` 创建 `draft: true` 的草稿，不会覆盖同名文章。封面和正文图片直接放进同一个目录，Frontmatter 使用相对路径，例如：

```yaml
cover: "./cover.jpg"
```

发布前补全 `description`、`tags`、`category`，并把 `draft` 改为 `false`。需要标记修订日期时增加 `updated: 2026-08-10`。

发布后，文章会自动进入 LOAD 的 ARTICLES；DIARY 会按 `published` 的年月生成真实月度归档，不需要再维护另一份演示数据。

## 更新外部数据

```powershell
pnpm sync:external
```

该命令会同步真实 Bangumi 收藏、Bangumi 活跃记录和 GitHub 活跃记录到 `src/data/generated/`。外部服务失败时不会清空上次成功快照；修复网络后重跑即可。

## 本地检查

```powershell
pnpm check
pnpm build
```

文章结构错误会在 `pnpm check` 阶段给出具体文件位置。
