# 孤独之海 Blog 探索归档与回看入口

截至 2026-11-15，值得回看的成果分为两条线：**本地三个试作**与**GitHub 上 10 月底的整站体验迭代**。先保存成果，之后换环境体验，再决定开发方向。此归档不代表设计已获认可、已合并或已上线。

## 先看这两份

| 版本 | 内容 | 下载 |
| --- | --- | --- |
| 本地探索归档 `codex/blog-exploration-archive-20261115` | 同行记忆、潮间带、未竟之海；本文件 | [分支](https://github.com/asashiki/The-Lonely-Sea/tree/codex/blog-exploration-archive-20261115) · [ZIP](https://github.com/asashiki/The-Lonely-Sea/archive/refs/heads/codex/blog-exploration-archive-20261115.zip) |
| 远端体验线 `codex/latest-nvl-20260910` | CG 鉴赏、首页到文章、观海室、通信室、书签、设置试页 | [分支](https://github.com/asashiki/The-Lonely-Sea/tree/codex/latest-nvl-20260910) · [本次核对版本 ZIP](https://github.com/asashiki/The-Lonely-Sea/archive/54a4586632419c1c72e2a7ac8f921715b015fbde.zip) |

本地探索基于 `b335416`（2026-09-22），远端体验线已经到 `54a4586`（2026-10-30），两条线尚未整合。直接下载默认 `main` 会遗漏这些近期探索。`main` 当前为 `f491aaa`，与远端体验线各有 2 / 13 个独有提交；main 的两个独有提交是合并提交，不能简单按分支名称判断新旧。

## 本地三个试作

| 方向 | 怎么体验 | 做了什么 | 状态与边界 |
| --- | --- | --- | --- |
| 同行记忆 | `/?screen=extra&extraMode=character&memory=anna-origin`，或 EXTRA → CHARACTER | 安娜、Claude、爱丽丝；公开日记节选定位原文并返回；附言、复制上下文、Markdown 导出；中英日界面 | 附言保存在浏览器；没有在线 AI 对话或 Notion 自动同步；爱丽丝只有介绍，不开放未发布日记 |
| 潮间带 | `/intertidal/?pair=after-the-ending`，或 EXTRA → PROJECT | 四组跨年原文对读；固定一侧、换篇、交换、中缝拖动；展开全文；“循词”找原文；文章尾部“另一页的回声” | 面向博客阅读的探索；只索引公开文章；位置留在浏览器；本轮完成构建和页面可达检查，未做完整交互与视觉验收 |
| 未竟之海 | `/unfinished/`，或 EXTRA → PROJECT | 半成形念头、续写历史、改主意、手动关联；上下文导出；JSON 导入导出 | **旧交接记录明确记载用户不喜欢其 ChatGPT 式设计，后来转向阅读探索。保留供回看，不作为确定方向。** 数据仅在浏览器 |

本次保存原有 24 个改动文件（7 个已跟踪修改、17 个新增文件）。唯一功能外修复是给 `unfinished-sea.ts` 加模块声明，解决 `status`、`toolbar`、`escape` 与浏览器全局类型冲突；另修正三处改动行的行尾空白。原始源码改动另有本地恢复补丁。

源码入口：

- 同行记忆：`src/data/companion-memories.ts`、`src/scripts/experience/companion-room.ts`、`src/styles/companion-room.css`；返回路径涉及 `experience.js`、`extra.js`、`nvl-engine.js`。
- 潮间带：`src/pages/intertidal.astro`、`src/data/intertidal.ts`、`src/lib/intertidal.ts`、`src/scripts/intertidal.ts`；文章回声位于 `ArticleEcho.astro`，循词组件为 `TidalConcordance.astro`。
- 未竟之海：`src/pages/unfinished.astro`、`src/scripts/unfinished-sea.ts`、`src/styles/unfinished-sea.css`。

## 远端体验线

以下直接存在于远端分支，并非新 PR。Git 提交作者不足以独立证明执行宿主或具体模型；这里按实际成果归类。

| 提交与日期 | 体验内容 | 回看入口 |
| --- | --- | --- |
| `b92f582` · 10-28 | CG 全画幅鉴赏、缩略索引、纯画面、键盘与焦点；CONTINUE 显示真实最近记录 | EXTRA → CG；`prototypes/cg-theater-preview.html`；[设计说明](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/docs/design/cg-theater-2026-10-28.md) |
| `db48d25`、`f46c17a`、`15e4afe` · 10-28 | 首页发现文章 → LOAD 选篇 → 阅读页；封面、目录、专注阅读、篇章衔接 | 首页、LOAD → ARTICLES；`prototypes/reading-journey-preview.html`；[说明](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/docs/design/reading-journey-2026-10-28.md) |
| `be36f89` · 10-29 | 手绘观海室；望远镜选篇、搜索目录、只看海、返回选中位置 | `/observatory/`；[说明](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/docs/design/observatory-2026-10-29.md) |
| `4d6e56b` · 10-29 | 窗边通信室；留言与友链、信纸预览、草稿下载 | `/connect/`；`prototypes/sea-rooms-review.html` |
| `396fb24` · 10-29 | 最远读过与最后停留位置分开；继续阅读、从头读、合书返回观海室 | 从观海室打开文章，读到中段后返回 |
| `54a4586` · 10-30 | OPTION 真实段落试页；字号、行距、段距及 AUTO 试读 | OPTION → BLOG → 阅读 |

9 月已有的基底还包括海面 OPTION、通信草稿保留、原生表单与友链交换、字号试样、未发布八月日记排除。可参阅远端 `docs/design/native-ui-polish-2026-09-22.md`、`correspondence-2026-09-22.md` 与仓库历史。

不运行项目也可以先看远端已有截图：[首页](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/output/reading-home-2026-10-28.jpg)、[LOAD](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/output/reading-load-2026-10-28.jpg)、[文章](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/output/reading-article-2026-10-28.jpg)、[观海室](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/output/observatory-2026-10-29.jpg)、[通信室](https://github.com/asashiki/The-Lonely-Sea/blob/54a4586/output/correspondence-2026-10-29.jpg)。它们是历史截图，不是本次重新验收。

远端设计说明记载过构建和部分桌面浏览器验证；完整实体手机触摸、阅读宿主内 OPTION 行为、跨页面音频所有权仍是接续检查点。本轮核对代码、提交和说明，没有重做这些体验的验收。

## GitHub PR 与历史分支

本轮归档前仓库共有 11 个 PR：9 个已合并、1 个已关闭未合并、1 个开放草稿。

| PR | 状态 | 内容与处理建议 |
| --- | --- | --- |
| [#10](https://github.com/asashiki/The-Lonely-Sea/pull/10) | OPEN、Draft、当前有冲突 | Copilot 的隐藏八月日记与 EXTRA PROJECT 翻页位置修正，2026-09-18 更新。属于旧窄修正；现有体验线已另有八月内容处理，之后核对差异即可，不直接合并 |
| [#11](https://github.com/asashiki/The-Lonely-Sea/pull/11)、[#9](https://github.com/asashiki/The-Lonely-Sea/pull/9) | MERGED | 9 月 NVL 版本与上线包；之后的新体验继续留在同名分支 |
| [#8](https://github.com/asashiki/The-Lonely-Sea/pull/8)、[#7](https://github.com/asashiki/The-Lonely-Sea/pull/7)、[#6](https://github.com/asashiki/The-Lonely-Sea/pull/6) | MERGED | Blog polish、文章 NVL 与章节内容 |
| [#5](https://github.com/asashiki/The-Lonely-Sea/pull/5) | MERGED | Studio 游戏包宿主适配 |
| [#4](https://github.com/asashiki/The-Lonely-Sea/pull/4) | CLOSED、未合并 | 最小精简发布版；历史备选方向 |
| [#3](https://github.com/asashiki/The-Lonely-Sea/pull/3)、[#2](https://github.com/asashiki/The-Lonely-Sea/pull/2)、[#1](https://github.com/asashiki/The-Lonely-Sea/pull/1) | MERGED | EXTRA 六页、特殊页面、LOAD XIII 存读档基础 |

旧远端分支 `codex/blog-4321-polish`、`codex/nvl-diary-rebuild`、`redesign/tide-system-2026-09` 的尖端均已是当前体验线祖先，可以作为历史参考，无需重复整合。

`agent/gal-blog-bridge-v1-host` 另有一个不在体验线祖先链上的提交 `9b1fa3a`（08-24），涉及声音实验室、通信、原型与数据。相同主题已有后续实现，不能把“不是祖先”当成所有内容都缺失；将来需要该方向时再对照差异。保留所有历史分支和旧 PR 状态。

## 换一台机器怎么打开

建议 clone 一次，再建两个 worktree，各自安装依赖。Node.js 至少 22.12.0，pnpm 使用 11.9.0。

```sh
git clone https://github.com/asashiki/The-Lonely-Sea.git
cd The-Lonely-Sea
git fetch origin
git worktree add ../sea-local-explorations origin/codex/blog-exploration-archive-20261115
git worktree add ../sea-remote-experiences 54a4586632419c1c72e2a7ac8f921715b015fbde
```

在 `sea-local-explorations` 中：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm preview --host 127.0.0.1 --port 4323
```

在 `sea-remote-experiences` 中同样安装、构建，预览端口用 `4324`。两个目录均为 detached HEAD，试改前执行 `git switch -c 你选的新分支名`。也可分别解压上面的 ZIP；切勿把两个版本覆盖到同一目录。

浏览器附言、未竟之海念头、阅读位置等不在 Git 中。换机器前需要的内容应由对应页面导出；新环境不会自动拥有旧浏览器存档。各端口也是不同的存储来源。

## 推荐回看顺序与待决定问题

1. 先体验远端的首页 → LOAD → 文章，再看观海室、通信室和 OPTION，判断整个 Blog 是否舒服、连贯。
2. 再体验本地潮间带，判断对读、循词和文章回声是否值得接回主阅读流程。
3. 最后看同行记忆；未竟之海只作为保留方案回顾，不默认继续投入。
4. 决定优先级：以文章阅读为主，还是增加角色陪伴；观海室与 LOAD 是否都保留；记忆与写作是否需要跨设备数据。

两条线都修改了文章页、EXTRA 与主体验脚本。确定取舍后再合并、消除冲突和验收，而不是把所有试作一次性塞进线上版本。

## 本次验证与范围

- 本地归档版本 `pnpm build` 通过：0 errors、0 warnings、2 个既有未使用音频函数 hints；仍有大 JS chunk 提示。生成 22 页，Pages 整理为 838 文件、约 199.7 MiB。
- `check-companion-memories.mjs` 通过：公开来源、语言、原文锚点、隐私边界、资源和导出。
- `check-companion-navigation.mjs` 通过：三语、原文定位、存档与焦点、OPTION / LOAD / SAVE 返回；这是 DOM 回归，非视觉验收。
- 构建后的首页、潮间带、未竟之海 HTTP 200 与关键 DOM 标记检查通过；`git diff --check` 通过。
- 原 24 个改动文件已做常见凭据模式扫描，未发现命中；不包含浏览器个人存档、依赖目录或构建缓存。
- 本机已扫描 Documents 与 Codex worktrees 中的 Git checkout，只发现一份 `asashiki/The-Lonely-Sea`。该 checkout 的忽略项只有 `.astro/`、`dist/`、`node_modules/`，没有 README 所提旧 `.local/` 原型目录。旧记录可能来自别的机器，不能视为已在本机找到。
- 独立 `ai-galgame-engine`、Live2D、Prelulu 公司实验属于别的项目，此次不混入公开 Blog。仓库中的旧游戏集成、声音与设计研究仍原样保留。
- 没有修改生产分支、部署配置或域名；实际线上当前版本未核验。

本机接续：源码在 `/Users/asashiki/Documents/Codex/2026-10-23/down-github/work/The-Lonely-Sea`。旧交接在该工作目录外的 `../../outputs/继续开发说明.txt`；原始改动备份为同目录 `blog-exploration-before-archive-2026-11-15.patch`。本索引与源码一同进入 Git，之后接手优先读这里和 `AGENTS.md`。
