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

生产构建通过；实际浏览器检查了 1363 × 936 构图与前后切篇，继续定向检查阅读返回、目录与窄屏。背景与 UI 没有新增剧情台词。

下一项是 `/connect/` 的完整海边通信场景，使用一张新画的窗边信桌与真正可填写的纸面。真实友链只有 `714.fyi`，不能虚构来信或在线访客。没有接收 endpoint 时仍明确表示本机保存，公开提交保留 GitHub 确认步骤。

用户请求持续几个小时，已创建一小时后开始、每小时一轮、共三轮的有限自动任务。每轮先看本文件的完成状态及远端分支，避免重复重做或覆盖并行提交。之后可继续打磨 OPTION 的现场预览；不为消耗额度反复运行测试，不为了新功能数量破坏已有风格。
