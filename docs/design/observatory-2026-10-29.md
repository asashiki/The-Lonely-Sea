# 观海室与海边通信

用户希望本轮深入研究、创造有记忆点的体验，并已授权自主实现、分批提交到 `codex/latest-nvl-20260910`。不模仿参考站视觉，不改个人文章和封存 DIARY，不改已发布游戏包。

## 设计判断

现有主菜单本身属于 Galgame，但海景与实际文章的联系仍弱。这轮增加一个可进入的「观海室」，让真实封面出现在望远镜里；切换、打开、读文后返回都围绕同一个选篇位置。它是另一种阅读入口，主菜单和 LOAD 分类保留。

参考研究只提取方法，不借用美术：

- [makemepulse 官方 Nomadic Tribe 案例](https://www.makemepulse.com/case-study/nomadic-tribe)：章节式体验，故事、画面与音乐共同组织。交互应属于场景。
- [makemepulse 制作文章](https://www.makemepulse.com/news/article-the-value-and-interest-of-internal-studio-projects)：极简操作提示需要细致迭代，不能以藏起操作代替沉浸。
- [Felix Rieseberg](https://felixrieseberg.com/)：作者的静态回退描述雨夜桌面、电视与带标签的录像带，统一的物件语言比零散特效更有身份。本轮浏览器实际被路由至静态版，没有声称实测其 3D 交互。
- [魔法使之夜原 PC 版官方视觉说明](https://typemoon.com/products/mahoyo/windows/keyword.html)：光、空气、构图与背景调度是视觉小说演出的核心参考。

Nomadic Tribe 在当前浏览器只显示纸面、没有完整绘制场景。官方案例已可读，本轮没有绕过限制或复制其资产。

## 已实现的第一轮

- `/observatory/`：原创手绘蓝调时刻观景台；圆形镜筒展示公开文章封面，真实标题、摘要、日期、阅读时长始终可见。
- 原生刻度滑杆、前后按钮、方向键与镜面触屏横滑选篇；直接链接可单独打开。无 JS 时仍提供完整文章链接。
- 观测目录可搜索文章标题、分类、摘要；选篇后回到镜筒。不会把文章列表塞进隐藏热点。
- 「只看海」暂时收起阅读界面，保留明确返回按钮；减少动态偏好和省流偏好继续有效。
- 阅读使用已有文章页，返回链接回到同一篇；相邻文章切换保留观海室来源。中文 URL 与浏览器编码路径做规范化匹配。
- 真实正文阅读进度留在本机，未读抽选只依赖公开文章。点击文章本身不计为读完；关闭自动保存位置时不新增阅读痕迹。只保留最多 200 条文章进度。
- BGM 沿用统一控制器与原有偏好，不另建音频分类或重复播放器。
- 首页标题下增加入口；站点地图增加公开页面。新入口不触碰 NVL 月份。

## 本轮美术

内置 imagegen 生成原创背景，压为 WebP 使用。`public/assets/observatory/blue-hour.webp` 约 200 KiB，整页不依赖 WebGL。正文封面来自项目已有文章，不生成伪造配图。

最终生成提示（内置工具，不是 CLI）：

> Use case: illustration-story. Asset type: production background plate for an original 2D Japanese PC visual novel blog 'The Lonely Sea', landscape 1536x1024 or wider. Paint an exquisitely composed quiet seaside observatory at blue hour, seen from just inside an open timber pavilion facing an expansive sea. Hand-painted late-2000s Japanese visual novel background art, restrained delicate linework and translucent watercolor/gouache on very subtle paper, genuinely drawn 2D, NOT a 3D render and NOT photorealistic. Long luminous pale horizon crosses at 47% height, misty islands on the left distance, tiny lighthouse on a distant right promontory with a single warm lamp. Immense quiet grey-blue sea and lavender air, peach-pink remnants of sunset along horizon, fine silver water reflections, just a few warm stars. Framing: a dark desaturated teal wood post at far right edge, a thin roof beam in top 8%, a wooden sill/low desk across bottom 18%. An antique small brass terrestrial telescope on a tripod rests at bottom right, entirely below 75% height, pointing out to sea. A loosely folded ivory sea chart and closed slim blue notebook at extreme bottom left. Center 70% of the picture is spacious unobstructed water and sky so coded interaction can live there. Rich atmospheric depth, tactile brushwork, restrained luminous lighting, asymmetrical cinematic composition, personal intimate scale rather than epic fantasy. No characters, no UI, no frames inside image, no borders, no text, no lettering, no logos, no labels, no planets, no neon, no ornate fantasy motifs. This is an original illustration of a coastal reading observatory, not a copy of any reference website.

## 验证与接续

生产构建通过；实际浏览器检查了 1363 × 936 构图、前后切篇、目录搜索及只看海。中文 URL 文章读到 12% 后，返回准确恢复到原篇并显示 12%。另用同源 390 × 844 iframe 检查窄屏 CSS 排版；这不是实体手机触摸测试。背景与 UI 没有新增剧情台词。第一批提交 `be36f8955ac9f2588c6d358540b2e1fc5eec2476`。

`/connect/` 的完整海边通信场景也已实现：原创窗边信桌，竖排题署，单张信纸上的 RSS、留言和友链。移除了共享样式中旧的 connect 专用规则，由 communication-scene.css 负责这一场景，避免旧 Grid 与新纸面布局互相挤压。

真实友链仍只有 `714.fyi`。没有接收 endpoint 时明确表示本机保存，公开提交保留 GitHub 确认步骤；没有虚构来信或在线访客。新增「预览信纸」支持保留称呼、换行，原生 dialog 可返回继续写，另可下载 UTF-8 文本草稿。文章尾部的留言也接入同一套预览和信纸行距；游戏桥接对话没有改变。所有用户输入以 textContent 显示。

已在浏览器检查通信室桌面及 390 像素布局、留言预览、切换友链、RSS 复制反馈。测试输入只留在预览浏览器并已清空，没有发送任何消息。截图在 `output/observatory-2026-10-29.jpg` 与 `output/correspondence-2026-10-29.jpg`。

第二张原创资产为 `public/assets/observatory/correspondence.webp`。使用内置 imagegen，提示如下：

> Use case: illustration-story. Asset type: original background plate for the correspondence page of a 2D Japanese PC visual novel blog set in a lighthouse by a lonely sea. A close, intimate daytime view of the corner of a worn pale-blue wooden writing desk beside an open sea-facing window, an unsealed cream envelope, several blank folded letters, a small bottle of blue ink and a fountain pen on the lower LEFT of the desk, a tiny sprig of sea lavender in a simple glass at far left. Window fills left half, sea sunlight, pale cyan water, a distant tiny lighthouse, thin linen curtain, wind lifting a corner of a blank sheet. Right HALF is mostly quiet muted warm grey wall and pale desk, intentionally very low detail because the real interactive cream letter form will be placed over it in code. No people. Elegant late-2000s Japanese PC visual novel background painting, translucent watercolor and gouache with delicate traditional brush texture, crisp but gentle edges, very clearly 2D painted anime background, NOT a photograph, NOT a 3D render. Wide cinematic composition, asymmetric restrained art direction. Soft cool spring daylight entering from left mixed with gentle ivory paper colors, dusty blue wood, small violet flowers, natural subtle shadow. No text, no lettering, no stamps containing letters, no logos, no UI, no cartoon icons, no decorative frame, no neon, no desk computer, no generic workspace photograph. Make the left window and stationery the beautiful visual focal point; reserve right half for interface. Landscape format.

用户请求持续几个小时，已创建一小时后开始、每小时一轮、共三轮的有限自动任务。每轮先看本文件的完成状态及远端分支，避免重复重做或覆盖并行提交。之后可继续打磨 OPTION 的现场预览；不为消耗额度反复运行测试，不为了新功能数量破坏已有风格。

下一轮建议先处理：OPTION 的当前内容与现场字号／声音预览是否已经足够连贯，再决定是否重排。不要重做上述观海室与通信室。可以检查从首页 iframe 宿主进入这些独立场景时的音频所有权和返回路径；目前主要验收的是独立页面及从首页直接进入观海室的路线。

## 接续：阅读书签与合书返回（2026-10-29）

开始前已 fetch 核对，远端与本地均为 `4d6e56b`，上一轮两间房已完成。本轮不重做美术，只完善选篇→读文→返回的闭环。

研究：重新阅读 [TYPE-MOON 官方画面演出与美术说明](https://typemoon.com/products/mahoyo/windows/keyword.html)，以及 [Ren’Py 官方 Saving, Loading, and Rollback](https://www.renpy.org/doc/html/save_load_rollback.html)（2026-10-29 查阅）。前者强调光、空气和构图，后者把保存理解为恢复当前语句、画面等上下文。本轮的设计推导是：保持观海室空旷构图，用章节书签和原位返回形成连续感，而不新增装饰或玩法。

- 有新书签的文章显示“继续阅读”与“从头读”，旁边只留一行当前章节和位置；中英日 UI 文案齐全。
- 最远已读进度与最后停留位置分开。回翻不会抹掉已读记录，但下次会恢复最后实际停留的段落。
- 保存正文块序号与块内相对位置，替代单纯依赖滚动像素；旧像素记录仍可回退。不会修改正文；关闭自动记录时不写书签，也不展示继续入口。
- “从头读”为一次性入口，不会把 CONTINUE 永久锁在开头。
- 阅读正文时左下角出现“回到观海室”，无需翻到页首；专注阅读时隐藏，窄屏上移避免与右下操作栏重叠。
- 排除折叠内容中的零高度块，避免隐藏文字抢占书签。无书签的新文章保持简洁的单一打开入口。

限制：正文块序号不是跨文章大改的永久锚点；外部图片晚加载仍可能产生布局漂移。后续优先检查 OPTION 已有字号/行距示例与实际正文是否一致，以及宿主 iframe 音频所有权；不要重复新增观海室装饰。

本轮验证：生产构建通过。书签数据检查覆盖最后位置/最远进度分离、中文 URL 规范化和无效书签回退。真实浏览器桌面 1363×936 检查了书签行与两个阅读入口的构图；从“纸箱奖”11% 返回后仍选中原文（历史最远 12%），继续阅读恢复同一段，“从头读”回到篇章开场与 0%。正文内固定返回链接正常。此轮未重新做手机触摸或跨字号实机验收，不将 CSS 规则审阅等同于实测。
