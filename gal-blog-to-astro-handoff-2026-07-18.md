# Gal-blog 正式开发交接

日期：2026-07-18  
下一 Session 目标：从已验收的视觉原型转入正式 Astro 工程的规划与初始化；保留用户逐阶段决策权，不一次性实现整站。

## 首先读取

- 项目约束：`%USERPROFILE%\Downloads\gal-blog\AGENTS.md`
- 完整研究底稿：`%USERPROFILE%\Downloads\gal-blog\docs\research\gal-blog-design-research.md`
- 可视化设计报告：`%USERPROFILE%\Downloads\gal-blog\docs\research\gal-blog-design-report.html`
- 当前已验收原型：`%USERPROFILE%\.codex\worktrees\b3e0\gal-blog\lonely-sea-modern-prototype-v4.html`
- 旧站本地源码：`%USERPROFILE%\Downloads\asashiki-github\asashiki`
- 线上站点与源码：[Asashiki.com](https://asashiki.com)、[asashiki/asashiki](https://github.com/asashiki/asashiki)

研究内容已完整记录在上述底稿中，不要重新复制一份研究报告。核心结论是：建立全新的 Astro 内容内核，迁移 Asashiki 的内容、URL 和个人数据功能；Fuwari 只作为博客基本功能参考，不整包换皮或直接 fork 为最终架构。

## 已确认的产品方向

- 网站本质仍是可读、可搜索、可分享的博客；Galgame 语言主要用于标题舞台、菜单、LOAD、Continue、Extra、转场和收藏结构。
- V4 的标题主界面保持原设计；此前已做过与 V2 的像素对比，主界面无变化。
- 特殊页采用 B「回忆书页」方向；A、C 不再考虑。
- 灰霭、晴天、暗夜、赤夜分别拥有对应的 LOAD / EXTRA / OPTION 视觉气氛。
- 顶部分类必须是彼此独立的入口，不使用连成一体的滑动标签或下划线。
- 翻页只在确实存在多页时显示：LOAD 全部文章与多页 CG 保留；单页分类、Projects、Music、Memory、Timeline、Character 隐藏；OPTION 不显示翻页条或两侧翻页箭头。
- LOAD：首页为一张大型最新文章和四张历史文章；后续页为六张横向封面。点击卡片直接进入文章，不经过二次 OPEN。
- EXTRA 当前包含 CG、Projects、Music、Memory、Timeline、Character 六种差异化结构；CG 可悬停反馈、点击全屏和前后切换；Character 使用立绘与角色档案，不是照片网格。
- EXIT 在标题页弹出 YES / NO，不进入新路由。
- 暗夜与赤夜已改为较克制的灰蓝、暗褐红，并为封面加入轻微降饱和、降亮度滤镜，使图片融入场景。
- OPTION 的具体控件仍可在正式框架阶段重做；About 暂未加入 Extra。

## 原型状态

- V4 是视觉与交互合同，不是可直接投产的单文件实现；正式工程应重新组件化，不要机械拆贴其中的大段 CSS/JS。
- V2、V3 未被修改；当前修改集中在 V4。
- V4 已验证主要交互、四个场景、4:3 / 16:9 / 超宽比例及 Esc 覆盖层行为；最近一次回归无控制台或脚本错误。
- 当前没有提交、PR 或正式 Astro 工程。

## 用户的协作偏好

- 中文、简洁，不要把计划拆成大量细碎步骤。
- 用户不会完全放手；每个阶段实施前，先明确本阶段范围，以及最多 1–3 个真正需要用户决定的问题。
- 先完成可验证的小闭环，再扩展，不要一次性执行整份设计报告。
- 动态立绘、BGM、音效仍会继续收集，但不应阻塞正式开发。先为角色状态、素材清单和统一音频控制预留清晰接口，使用占位资源；音频素材需记录来源、授权、用途与循环方式。

## 推荐的下一步

1. 建议保留旧 Asashiki 作为现网站与迁移来源，保留 `gal-blog` 作为研究/原型档案；另建干净正式工程，暂定 `%USERPROFILE%\Downloads\asashiki-next`（目录名和是否独立 GitHub 仓库尚需用户确认）。
2. 新工程初始化后先运行一次 `setup-matt-pocock-skills`，随后使用 `grill-with-docs`；不要使用 `grill-me`，因为已有代码库、研究资料和需要持续记录的架构决策。
3. `grill-with-docs` 只收敛 V1 边界和难以反悔的决定：正式目录/仓库策略、Astro 内容模型、旧 URL 保持方式、首批路由、部署与域名切换方式、客户端交互边界。不要重新讨论所有视觉小细节。
4. 收敛后走 `to-prd → to-issues`，只规划 V1，保持少量结果型任务。每个实现任务使用新 Session 执行 `implement`。

建议的四段实施顺序：

1. 打通一个真实垂直切片：标题入口 → LOAD → 一篇迁移后的真实文章 → 返回，并锁定真实 URL。
2. 迁移文章与博客基本功：内容集合、分类标签、搜索、RSS、sitemap、SEO 与旧链接兼容。
3. 正式实现 V4 的四场景、菜单、Continue、Option、状态和转场。
4. 再迁移 Extra、Projects、CG、Bangumi、热力图、Timeline、Friends，并加入动态立绘和音频，最后做质量验收与域名切换。

## 尚未决定

- 正式工程目录名、是否新建独立 GitHub 仓库，还是最终替换现有仓库。
- V1 首次上线究竟包含哪些特殊页；默认建议只承诺标题页、LOAD、文章页和博客基本功能。
- 交互层选原生 Custom Elements 还是单一框架岛；不要混用多个前端框架。
- 部署平台及 Asashiki.com 的切换、回滚方案。
- 动态立绘的状态数量、分层格式和音频素材尚未定稿，留到体验层阶段。

## Suggested skills

- `setup-matt-pocock-skills`：正式新仓库第一次工程流程前运行一次。
- `grill-with-docs`：下一 Session 的主流程，用于收敛 V1 和留下 `CONTEXT.md` / ADR 记录。
- `to-prd`、`to-issues`：架构与范围确定后，将 V1 转为少量可执行任务。
- `implement`：每个任务在独立 Session 中实现；按其流程完成测试与代码审查。
- `frontend-design`：将 V4 视觉合同正式组件化时使用。
- `handoff`：只有在阶段跨 Session 或上下文接近上限时再次使用。

不建议下一步使用 `grill-me`，也不建议继续在 V4 单文件里堆正式功能。
