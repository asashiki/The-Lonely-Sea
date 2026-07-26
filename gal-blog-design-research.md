# gal-blog：Galgame 化博客研究与搭建建议

> 调研日期：2026-07-18  
> 调研原则：仓库结论来自固定 commit 的 README/源码；框架与交互结论来自官方文档。文中所有“Galgame → Blog”映射均是**设计推论**，不是行业标准。

## 一句话结论

建议把 gal-blog 做成“**Galgame 标题界面与收藏系统 + 正常、耐读、可检索的博客内核**”，不要把整站做成一场必须点击对白才能浏览的游戏。

- 技术底座继续选 Astro，但建立新工程，不把 Fuwari/Asashiki 整包换皮。
- 迁移 Asashiki 的文章、项目、Bangumi、时间线、热力图等“内容资产”；按新信息架构重写展示层。
- 标题页负责氛围与角色感；文章页回归清晰的长文阅读；`EXTRA` 承载 CG、项目、追番、回想与 Music Room。
- `CONTINUE`、`LOAD`、`OPTION` 必须真有状态和功能，不能只是装饰按钮。

## 1. 调研范围与证据快照

仓库事实固定在以下快照，避免以后上游变化导致报告不可复核：

| 项目 | 快照 | 核对重点 |
|---|---|---|
| [asashiki/asashiki](https://github.com/asashiki/asashiki/tree/98559e3f39bce2fc87580813922661c541b0c87a) | `98559e3f39bce2fc87580813922661c541b0c87a` | 当前线上博客的页面、数据源、迁移隐患 |
| [saicaca/fuwari](https://github.com/saicaca/fuwari/tree/6d39b0dec41282e7852e23e032998a5789abee28) | `6d39b0dec41282e7852e23e032998a5789abee28` | 原主题的博客能力与技术边界 |
| [joyehuang/blog](https://github.com/joyehuang/blog/tree/9a7c87bc6d7c490ed35b646563c90c9002bb5f5e) | `9a7c87bc6d7c490ed35b646563c90c9002bb5f5e` | 多内容集合、个人站页面组织、交互岛 |

本仓库目前是若干 HTML 视觉原型和图片素材，没有 `package.json`、`src/` 或正式应用骨架。因此，现在正适合先确定信息架构和内容模型，再收敛原型，而不是继续在单文件 HTML 上追加正式功能。

## 2. 什么让一个网站“像 Galgame”

### 2.1 可确认的视觉小说界面惯例

这些不是对所有 Galgame 的概括，而是 Ren'Py 这一主流开源视觉小说引擎明确提供的默认惯例：

- `main_menu` 是游戏开始时首先显示的界面，官方示例包含 Start、Load、Preferences、Help、Quit；游戏内导航通常复用 Return、Preferences、Save、Load、Main Menu、Quit。[Ren'Py：Special Screen Names](https://www.renpy.org/doc/html/screen_special.html#main-menu)
- Save/Load 使用分页槽位和截图；Preferences 是独立设置界面。[Ren'Py：Save / Load / Preferences](https://www.renpy.org/doc/html/screen_special.html#save)
- Ren'Py 将“场景图片”与“屏幕 UI”分开：背景、立绘属于叙事画面，菜单、对白框和按钮属于 screen UI。[Ren'Py：Screens and Screen Language](https://www.renpy.org/doc/html/screens.html)
- Gallery 由缩略图按钮、图片组和解锁条件组成；官方还把 Music Room 和 Replay 归在同一套 Extras 能力中。[Ren'Py：Image Gallery, Music Room, and Replay Actions](https://www.renpy.org/doc/html/rooms.html)
- Dialogue History 会保存已经显示过的对白并允许重新查看；Persistent Data 则保存不依附于单个存档点的长期状态，例如 CG 解锁标记。[Ren'Py：Dialogue History](https://www.renpy.org/doc/html/history.html)、[Persistent Data](https://www.renpy.org/doc/html/persistent.html)

### 2.2 对 gal-blog 的设计推论

真正的“Galgame 感”不应只靠日文字体、花边按钮和立绘。它至少需要三层同时成立：

1. **舞台层**：首屏有背景、角色、标题、前后景深和清楚的纵向菜单。
2. **状态层**：Continue、Load、Option、Extra 会依据阅读状态发生变化。
3. **内容层**：进入文章后仍然是可靠的网页——可复制、可搜索、可直接链接、可由搜索引擎和 RSS 访问。

因此，标题界面可以像游戏，但内容不能被“游戏流程”锁死。所有文章、项目和 CG 都应有稳定 URL；所谓“解锁”只改变徽章、排序或演出，不阻止直接访问。

## 3. 三个博客项目能借鉴什么

### 3.1 Fuwari：保留博客基本功，不保留整套外观

Fuwari 是 Astro + Tailwind 的静态博客模板，已经提供亮暗主题、主题色与 banner、响应式、Pagefind 搜索、Markdown 扩展、目录和 RSS。[Fuwari README](https://github.com/saicaca/fuwari/blob/6d39b0dec41282e7852e23e032998a5789abee28/README.md#-features) 它的文章 frontmatter 已包含封面、标签、分类、草稿与语言字段。[Fuwari Frontmatter](https://github.com/saicaca/fuwari/blob/6d39b0dec41282e7852e23e032998a5789abee28/README.md#-frontmatter-of-posts)

建议继承：

- Markdown 写作、文章列表、标签/分类、目录、RSS、站内搜索的成熟思路。
- Astro 静态生成与少量 Svelte 交互组件的分工。
- 文章前后篇、阅读时间、代码块、图片查看等长文能力。

不建议继承：

- Fuwari 的卡片侧栏、banner 和导航视觉，因为这会让 gal-blog 最终仍像“套了 Galgame 皮肤的 Fuwari”。
- 只有 `posts` 的单集合模型；CG、项目、时间线、回想不应继续硬编码在页面文件中。
- 为整站导航继续叠加 Swup 生命周期。新项目可以优先用浏览器原生页面导航或 Astro 自带的 View Transitions。

### 3.2 Asashiki：迁移的是个人资产与功能，不是旧布局

当前公共仓库已经远超基础 Fuwari：有 `about`、`status`、`capsule`、`bangumi`、`explore`、`friends` 页面，也有 GitHub 与 Bangumi 热力图组件。[页面目录](https://github.com/asashiki/asashiki/tree/98559e3f39bce2fc87580813922661c541b0c87a/src/pages)、[组件目录](https://github.com/asashiki/asashiki/tree/98559e3f39bce2fc87580813922661c541b0c87a/src/components) `explore` 已经按 AI Tools、Vibe Web、Agent、Others 分组项目，并区分 Live、Repo、Planned。[explore.astro](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/src/pages/explore.astro)

这些应当迁移：

- `src/content/posts` 的正文、封面、发布日期、标签与分类。
- 项目清单、Bangumi 收藏与热力图、GitHub 活动、时间胶囊、状态页、友链、About 文案。
- RSS、站点地图、搜索、文章目录和 Markdown 扩展等基础能力。

但迁移前有一个必须先修的域名问题：公共仓库的 `astro.config.mjs` 仍把 `site` 写成 `https://fuwari.vercel.app/`，[源码](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/astro.config.mjs#L30)；RSS 又在 `context.site` 不存在时回退到同一地址，[源码](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/src/pages/rss.xml.ts#L25)。Astro 官方说明 `site` 会参与 sitemap 与 canonical URL 的生成，而 RSS 也用它生成文章链接；因此新站第一步应统一为 `https://asashiki.com`，再验证 canonical、Open Graph、robots、sitemap 和 RSS 的全部绝对 URL。[Astro `site` 配置](https://docs.astro.build/en/reference/configuration-reference/#site)、[Astro RSS](https://docs.astro.build/en/recipes/rss/)

数据源也需要重构：

- GitHub 热力图在浏览器中直接请求 `github-contributions-api.jogruber.de`，失败时直接隐藏组件。[GithubHeatmap.astro](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/src/components/widget/GithubHeatmap.astro#L150-L186)
- Bangumi 收藏请求官方 `api.bgm.tv`，但热力图请求第三方 `bgm.ry.mk`。[bangumi.astro](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/src/pages/bangumi.astro#L13-L16)
- 时间胶囊在构建期请求外部 Worker RSS，并明确写明“每次 rebuild 刷新一次”。[capsule.astro](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/src/pages/capsule.astro#L5-L10)
- 状态页在运行时请求 `link.asashiki.com` 的设备、健康和时间线接口。[StatusPageRuntime.astro](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/src/components/StatusPageRuntime.astro#L125-L132)

建议为这些页面增加统一数据适配层：`source → timeout → normalize → cache/snapshot → stale fallback → empty/error UI`。页面只读取统一结构，并显示 `最后更新` 与 `数据来源`。第三方热力图挂掉时，旧快照仍可展示，不应整块消失。

### 3.3 joyehuang/blog：借它的内容模型，不照搬视觉

Joye 的 README 把个人站拆成 Blog、Notes、Curated、Talks、Projects、Links、About、Contact，并提供双语、RSS、搜索、评论、统计和 OG 图片。[README](https://github.com/joyehuang/blog/blob/9a7c87bc6d7c490ed35b646563c90c9002bb5f5e/README.md#功能) 更值得借鉴的是 `src/content.config.ts`：它用 `glob()` loader 和 Zod schema 分别建模 `blog/blogEn`、`notes/notesEn`、`curated`、`talks`，而不是把所有内容塞进一套文章字段。[content.config.ts](https://github.com/joyehuang/blog/blob/9a7c87bc6d7c490ed35b646563c90c9002bb5f5e/src/content.config.ts#L67-L159)

对 gal-blog 的启发：

- “文章”“短记录”“项目”“CG”“时间线事件”是不同领域对象，应有不同 schema。
- 页面展示可以很游戏化，但内容结构必须可验证、可查询、可生成路由。
- React/Svelte 只负责真正交互的岛，例如标题菜单、设置、音频、存档册；文章本身保持静态 HTML。

### 3.4 框架选型结论

**推荐方案：新建 Astro 内容内核，再迁移 Asashiki。** 保留 Asashiki 的文章 URL、正文、特殊页含义和数据源；把 Fuwari 当成博客功能清单与兼容参考，把 Joye 当成内容建模参考；两者都不作为 gal-blog 的视觉母版。

截至 2026-07-18，Astro 最新稳定版为 `7.1.1`；Astro 7 于 2026-06-22 正式发布。绿地工程建议锁定 `7.1.x` 并使用 Node.js `22.12.0+`，不要继续以旧站的 Astro 5 作为新项目基线。[Astro 7.0 发布说明](https://astro.build/blog/astro-7/)、[Astro 安装环境](https://docs.astro.build/en/tutorial/1-setup/1/)

需要注意版本边界：当前 Asashiki 固定在 Astro `5.13.10`，[package.json](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/package.json#L36) 并使用旧式 `src/content/config.ts` 集合定义，[源码](https://github.com/asashiki/asashiki/blob/98559e3f39bce2fc87580813922661c541b0c87a/src/content/config.ts)；当前 Astro 官方方案使用 `src/content.config.ts` 配合 `glob()`/`file()` loader。[官方 Content Collections](https://docs.astro.build/en/guides/content-collections/#build-time-collection-loaders) 绿地工程应采用当前 API，但迁移应分两步：先原样搬内容并锁定 URL，再升级集合模型；不要在同一轮同时改框架版本、frontmatter 和路由。

**最快上线备选：从 Fuwari fork，加一个 Title Overlay。** 这样可最快复用现成文章页、搜索、目录、RSS 和分类标签，只新增标题舞台与菜单。代价是继续继承 Fuwari 的视觉骨架、Swup 生命周期和旧集合模型；CG/Works/Timeline 后续仍要重构，独特性和长期维护性都弱于推荐方案。

## 4. 推荐的信息架构

### 4.1 标题菜单映射（全部为设计推论）

| Galgame 项 | gal-blog 中的真实功能 | 展示建议 |
|---|---|---|
| `START / NEW GAME` | 进入博客首页或“初见导览” | 第一次访问显示 3 个入口：最新文章、年度精选、关于本站；以后直接进入最新文章流 |
| `CONTINUE` | 回到上次阅读的文章和标题位置 | 有记录才可用；副标题显示文章名与上次时间；无记录时灰显并解释 |
| `LOAD` | 阅读存档册 | 展示最近阅读、手动收藏、稍后读；卡片可像存档槽，但必须显示文章标题和日期 |
| `EXTRA` | 个人站的收藏与世界观入口 | 进入 CG、Works、Bangumi、Recollection、Music Room、Timeline 的二级菜单 |
| `OPTION` | 真实设置 | 主题、文字大小、BGM 音量、音效、动效、背景对比度、语言、清除本地进度 |
| `EXIT` | 退出沉浸模式，而非关浏览器 | 切到 `/plain/` 的普通博客索引，或返回标题页；不要调用 `window.close()` |

Ren'Py 的主菜单确实采用 Start/Load/Preferences/Quit，并把 Gallery、Music Room、Replay 放入 Extras；上述博客含义则是有意转译。[Ren'Py 菜单](https://www.renpy.org/doc/html/screen_special.html#main-menu)、[Ren'Py Extras](https://www.renpy.org/doc/html/rooms.html)

`EXIT` 不应假装能关闭标签页：浏览器通常只允许脚本关闭由网页脚本创建的窗口，普通标签页调用 `window.close()` 往往无效。[MDN：Window.close()](https://developer.mozilla.org/en-US/docs/Web/API/Window/close)

菜单建议保留游戏英文与中文副标签，例如 `CONTINUE / 继续阅读`、`LOAD / 阅读存档`、`OPTION / 设置`。这样既保留作品感，也让第一次到访的人无需猜测。

### 4.2 建议路由树

```text
/
├─ /blog/                         START：文章流
├─ /continue/                     读取本地进度后重定向
├─ /load/                         最近阅读 / 收藏 / 稍后读
├─ /posts/[...slug]/              正式文章
├─ /archive/                      年份归档
├─ /categories/[category]/
├─ /tags/[tag]/
├─ /timeline/                     文章、项目、生活节点的站点时间线
├─ /extra/
│  ├─ /cg/                        真正的插画、壁纸、站点视觉稿
│  ├─ /works/                     GitHub / Web 项目画廊
│  ├─ /bangumi/                   追番、游戏、热力图
│  ├─ /recollection/              年报、精选长文、专题回想
│  └─ /music/                     Music Room
├─ /status/                       克制后的 Now / 状态页
├─ /about/
├─ /friends/
├─ /search/
├─ /settings/
└─ /plain/                        无舞台动画的普通博客入口
```

Astro 的 `src/pages/` 使用文件路由，文件路径自然成为 URL；内容集合本身不会自动生成页面，需要用动态路由和 `getStaticPaths()` 生成文章、标签或项目详情。[Astro Pages](https://docs.astro.build/en/basics/astro-pages/#file-based-routing)、[Content collections：Generating Routes](https://docs.astro.build/en/guides/content-collections/#generating-routes-from-content)

### 4.3 关键页面应该怎样展示

#### 标题页 `/`

- 全屏背景 + 一名主角色立绘 + 左或右侧纵向菜单；不要同时放常规博客卡片瀑布流。
- 轻量标题动画结束后立即可操作，不设置不可跳过的片头。
- 底部保留版本号、Credits、普通模式与音频状态；键盘方向键、Enter、Esc 均可用。
- 首次点击“进入并开启音乐”才播放 BGM；浏览器通常会阻止未经过用户交互的有声 autoplay。[MDN：Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)

#### 文章页 `/posts/[...slug]/`

- 第一屏可保留“场景”感：背景、标题、封面、日期、分类、角色旁白一句。
- 正文区域切换成高对比纯色阅读纸面，正文宽度约 42–48rem；立绘与粒子不得压在文字后。
- 桌面端显示目录；移动端放入抽屉。底部保留上一篇/下一篇、标签、相关推荐、收藏和回到标题页。
- Galgame Quick Menu 可转译为 `LOG=目录/阅读记录`、`SAVE=收藏`、`LOAD=存档册`、`CONFIG=设置`；同时显示中文解释，避免只剩游戏黑话。
- 只给少量叙事文章提供可选“对白演出模式”；普通技术文、长评和年报不要强制逐句点击。

#### Extra / CG / Works

- `CG` 保留真正喜欢的 CG、角色图、站点壁纸和视觉稿，必须记录来源、作者、授权与 alt。
- GitHub 项目另设 `WORKS`，但视觉上复用 CG 选择网格：封面像 CG 缩略图；点击先进入站内项目详情页，再由清楚标注的 Demo、Repository、相关文章按钮离站。
- 项目 schema 应包含 `name`、`summary`、`cover`、`status`、`year`、`tags`、`repoUrl`、`demoUrl`、`relatedPosts`；不要继续在 `.astro` 页面里维护大数组。
- 可用本地阅读状态点亮“NEW”“UPDATED”“VIEWED”徽章；不要锁住公开项目或 CG。

#### Bangumi / Timeline / Status

- Bangumi：顶部年度概况与热力图，下方 Anime/Game 标签、状态筛选、评分与年份筛选；数据错误时展示上次快照和更新时间。
- Timeline：按年份串联文章发布、项目发布、旅行/生活节点、年度观看总结；它是“站点剧情线”，不是把所有 RSS 项简单堆起来。
- Status：只公开经过脱敏的“现在在做什么、最近在看什么、设备是否在线”。不建议直接展示窗口标题、精确位置或连续健康数据。

#### About / Friends / 404

- About 可做成 Character Profile：立绘、基础资料、Now、工具、设备、联系方式、Credits。
- Friends 可做成人物关系图或“角色图鉴”，但必须保留普通列表和清晰外链。
- 404 可做 Bad End / Missing Route，并同时提供返回标题页、搜索、最近文章，不能只有彩蛋。

## 5. 推荐内容模型

Astro 内容集合适合管理一组结构相同的数据，提供 schema 校验、类型安全和查询接口；官方 loader 可从本地 glob、单文件或远端来源加载。[Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)

| Collection | 用途 | 核心字段 |
|---|---|---|
| `posts` | 正式文章 | `title, description, published, updated, cover, tags, category, series, draft, featured` |
| `notes` | 短想法、研究卡片、更新记录 | `title, date, type, status, tags, relatedPosts` |
| `projects` | Works 画廊 | `name, summary, cover, status, year, tags, repoUrl, demoUrl, relatedPosts` |
| `cg` | 真实 CG/插画/视觉稿 | `title, image, thumbnail, alt, artist, sourceUrl, license, year` |
| `timeline` | 跨类型人生/站点事件 | `date, type, title, summary, href, image, visibility` |
| `recollections` | 年报、专题、回想入口 | `title, period, cover, relatedPosts, relatedCg` |
| `music` | Music Room 元数据 | `title, artist, file, cover, creditUrl, loop, order` |

文章继续用 Markdown；只有需要内嵌交互组件的文章才用 MDX。Astro 官方 MDX 集成允许在 Markdown 中使用组件和 JSX 表达式，但这不应成为每篇文章的默认复杂度。[Astro MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/)

## 6. 推荐前端架构

### 6.1 总体选择

```text
Astro 静态页面
├─ 内容集合：posts / notes / projects / cg / timeline / music
├─ 标准页面：文章、归档、标签、RSS、sitemap、plain mode
├─ 交互岛：TitleMenu、Continue、LoadSlots、Settings、AudioPlayer
└─ 数据岛：GitHubHeatmap、BangumiPanel、StatusPanel
```

理由：Astro 组件默认在构建时或服务端生成 HTML，不向浏览器发送组件运行时；真正需要交互时再添加客户端岛。[Astro Components](https://docs.astro.build/en/basics/astro-components/)、[Client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives)

建议的 hydration：

- `client:load`：标题菜单、Continue、全局音频控制、当前页面必需的设置。
- `client:idle`：存档册增强、非首屏的筛选器。
- `client:visible`：GitHub/Bangumi 热力图、远端状态卡。
- 纯展示的角色立绘、菜单框、文章、CG 网格保持 Astro/HTML/CSS，不做 React/Svelte 组件。

Astro 可同时使用 React、Svelte、Vue 等官方集成，但 gal-blog 没必要混用多个框架；选择一个交互框架即可，甚至先用原生 Custom Elements。[Astro：Front-end frameworks](https://docs.astro.build/en/guides/framework-components/)

### 6.2 页面切换与持续 BGM

优先级建议：

1. 第一版使用普通多页导航，稳定完成文章、归档和 Extra。
2. 需要跨页保持 BGM 和标题舞台状态时，再启用 Astro `ClientRouter` 与 `transition:persist`。
3. 所有客户端脚本统一监听 Astro 路由生命周期，不再同时维护 Swup 事件。

Astro 官方 View Transitions 能做跨页面动画，`transition:persist` 可以保留音视频或交互岛状态；但 `ClientRouter` 也会带来脚本需要重新初始化等成本，所以它应是明确需求驱动的选择。[Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)

### 6.3 静态资源

- 封面、CG、立绘和可优化背景放在 `src/assets`，使用 `<Image />` / `<Picture />` 生成尺寸与现代格式。
- favicon、robots、无需处理的下载文件，以及需要稳定公开 URL 的音乐放 `public/`。
- 远端图片需要配置允许域；关键首屏素材尽量本地化，避免第三方失效。

Astro 推荐尽量把本地图片放在 `src/` 以便转换、优化和打包；`public/` 会原样复制，不经构建处理。[Astro Images](https://docs.astro.build/en/guides/images/#where-to-store-images)

### 6.4 部署与数据刷新

Astro 默认可输出完全静态站点；常见平台用 `astro build`，发布目录为 `dist`。只有需要请求时服务端渲染或私密代理时才安装对应 adapter。[Astro Deploy](https://docs.astro.build/en/guides/deploy/)

建议刷新策略：

| 数据 | 推荐方式 | 失败策略 |
|---|---|---|
| 文章、项目、CG、时间线 | 构建期内容集合 | schema 校验失败即阻止发布 |
| Bangumi 收藏/热力图 | 每日构建任务生成 JSON 快照 | 使用最后成功快照，显示 stale |
| GitHub 热力图 | 构建期或边缘缓存，最长一天 | 使用快照或明确空状态 |
| 时间胶囊 | 定时任务拉 RSS 并规范化 | 保留旧数据，不让构建失败 |
| 实时状态 | 客户端请求自有只读 API | 10 秒超时、模块独立失败、隐藏敏感字段 |

## 7. Continue、Load、Option 的状态设计

浏览器 `localStorage` 按 origin 隔离，并通常能跨浏览器重启保留；无痕模式结束时会清除。因此它适合保存非敏感的阅读进度和设置，但不能承诺“云存档”。[MDN：Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

建议仅保存：

```text
lastRead: { pathname, headingId, scrollRatio, title, updatedAt }
bookmarks: [{ pathname, title, savedAt }]
seen: [contentId]
settings: { theme, textScale, motion, bgmEnabled, bgmVolume, sfxEnabled }
```

- Continue 恢复到 `headingId`，找不到再按 `scrollRatio`，都失败就回文章顶部。
- Load 是用户可见、可删除、可导出 JSON 的收藏/历史列表，不伪装成真正服务器存档。
- Option 既遵循系统偏好，也允许用户站内覆盖；提供“一键恢复默认”和“清除阅读记录”。
- 不在本地保存健康、设备、位置或第三方 token。

## 8. 音频、动效与可访问性底线

- BGM 必须由用户点击 Start/Continue/“开启音乐”后启动；浏览器会限制未经过交互的有声自动播放。[MDN Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- 若音频自动播放超过 3 秒，WCAG 要求提供暂停/停止或独立音量控制；更稳妥的做法是只在用户明确请求后播放，并让静音按钮始终可见。[WCAG 1.4.2 Audio Control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html)
- 自动持续超过 5 秒、并与正文同时显示的移动/闪烁/滚动内容，需要暂停、停止或隐藏机制。[WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- 所有大幅平移、缩放、视差和页面翻转都响应 `prefers-reduced-motion`；设置中另有“关闭演出”总开关。[MDN：prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)、[WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)
- 任何菜单弹层都应有焦点管理、Esc 关闭、可见焦点；提供 skip link 与 `/plain/`，保证不依赖拖拽、悬停或声音理解信息。

## 9. 迁移实施顺序

### Phase 0：冻结资产与 URL

- 导出 Asashiki 全部文章、图片、项目、友链和外部数据源清单。
- 建立旧 URL → 新 URL 映射；能保留 `/posts/[...slug]/` 就不改。
- 立即修正 `site`、RSS fallback、robots、sitemap、OG/canonical 域名。

### Phase 1：先做“能当博客用”的内核

- 创建 Astro 工程、现代 `src/content.config.ts`、文章 schema。
- 完成文章详情、文章流、归档、标签、分类、搜索、RSS、sitemap、404。
- 迁移现有 Markdown 并验证构建结果；此阶段不做复杂舞台动画。

### Phase 2：做 Galgame 外壳

- 实现标题页、Start、Continue、Load、Option、Exit→Plain Mode。
- 接入本地进度、收藏、设置、用户手势后 BGM。
- 完成桌面/移动端和 reduced-motion 版本。

### Phase 3：迁移 Extra

- 先做 Works 与 CG；随后迁移 Bangumi、Timeline、Status、Friends。
- 把第三方请求统一收进适配层，增加超时、缓存、快照、更新时间和错误状态。
- 最后做 Recollection、Music Room、成就/彩蛋；这些都不能阻塞基本博客发布。

### Phase 4：质量门槛

- 验证所有旧链接、RSS 条目、sitemap、canonical、OG 图与 404。
- 键盘、触屏、窄屏、无 JS、无音频权限、远端 API 失败、无痕模式分别走一遍。
- 测首屏图片体积、字体加载、CLS、文章可读性；删掉没有信息价值的循环动画。

## 10. 优先级清单

### P0：上线前必须有

- 文章迁移、稳定 URL、归档/标签/分类、搜索、RSS/sitemap。
- 标题页 + Start + Continue + Load + Option + Plain Mode。
- 文章阅读页、移动端、键盘操作、音频控制、reduced-motion。
- 域名修正与外部数据失败兜底。

### P1：最能形成个人特色

- `EXTRA > CG` 与 `EXTRA > WORKS` 双画廊。
- Bangumi 年度热力图与追番筛选。
- Recollection：年报、精选文章、游戏/动画年度回想。
- Timeline、Now/Status、Friends 角色图鉴。

### P2：有余力再做

- Music Room、站点成就、随机场景、章节式专题、可选对白阅读模式。
- 评论/留言板、跨设备账号与云存档；这些会引入审核、隐私和后端成本，不应进入首版。

## 最终建议

最合适的方向不是“把 Asashiki 搬进一个 Galgame HTML”，而是：

> 用 Asashiki 作为内容数据库，用 Astro 作为博客引擎，用 Galgame 的舞台、菜单、存档、回想和 Extra 作为信息架构语言。

具体借鉴关系应当是：Fuwari 提供博客基本功，Asashiki 提供个人内容与数据组件，Joye 提供多集合内容建模，Ren'Py 提供菜单和 Extras 的可验证语法；gal-blog 自己负责最终的视觉身份与交互克制。这样既能一眼看出是 Galgame，也不会牺牲一个博客最重要的可读、可找、可分享与可长期维护。
