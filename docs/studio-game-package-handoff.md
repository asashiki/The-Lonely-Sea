# Studio 游戏包接入

当前正式第一章：

- 游戏：`lonely-sea-chapter-one`
- 当前版本：`0.3.0-cea96b6f`
- Blog 目录：`public/games/lonely-sea-chapter-one/0.3.0-cea96b6f/`
- Studio 导出命令：`npm run export:prologue`
- 运行时：`Gal Story Runtime 1.1.1`（不依赖 WebGAL）

## 最省事的更新流程

1. 只在 Studio 修改 Story IR、台词 JSON、运行时、主题或 Bridge，不手改已导出的 release。
2. 运行 `npx tsc --noEmit`；改动运行时核心时再运行 `npm run test:core`。
3. 需要语音变化时先运行 `npm run voice:prologue`，再运行 `npm run export:prologue`，生成内容寻址的新 ZIP 和解压目录。139 句已登记，未改动台词会直接复用；单句强制重做可用 `npm run voice:prologue -- --force --take=A001`。
4. 将新目录复制到 Blog 的 `public/games/lonely-sea-chapter-one/`，在 `release-registry.ts` 新增 release 并切换 `currentReleaseId`。
5. 运行 Blog 构建和集成检查。旧 WebGAL 测试包不覆盖，但不再登记为可启动 release，避免旧存档误入已经作废的游戏流程。

Blog 会在构建期验证 manifest、完整文件集合、字节数和 SHA-256。任何剧情、CSS、Bridge 或扩展变化都必须重新导出，不能手改已登记 release。

## 当前 v1 行为

- 游戏包使用自研原生运行时，自己处理对白、选项、分支、立绘、眨眼、口型、LOG、AUTO、SKIP 和键鼠操作；Blog 不跨 iframe 操作运行时 DOM。
- TITLE 固定回 Blog 标题；ESC 隐藏 / 恢复对白框；STORY 在声明的片段边界返回来源页面。
- OPTION 在宿主层覆盖打开，共享语言、音量、文字、界面、动效和指针设置会即时进入当前 iframe；窄屏由 Blog 统一强制横向，不在游戏里维护第二套竖屏布局。
- SAVE 捕获包含背景和立绘的 480×270 WebP 实时画面；LOAD 以 release、剧情块 ID 和行内状态精确恢复，不再按易漂移的数字游标猜位置。
- 同一 release 读档直接热恢复，不重新加载 iframe；跨 release 的旧存档仍启动它所属的不可变版本。
- Studio `/playtest` 使用与正式导出完全相同的运行时和资源，并提供本地 SAVE / LOAD 预览，不依赖 Blog Bridge。
- Blog 侧承载 RSS、留言、友链通讯场景；游戏只声明场景动作和成功/取消分支，因此以后替换剧情或重新导出时不需要复制这些页面 UI。

通讯场景的桥接参数与返回值见 `docs/blog-communication-scenes.md`。
