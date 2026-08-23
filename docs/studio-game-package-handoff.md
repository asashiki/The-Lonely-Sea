# Studio 游戏包接入

当前正式第一章：

- 游戏：`lonely-sea-chapter-one`
- 当前版本：`0.2.0-083634d3`
- Blog 目录：`public/games/lonely-sea-chapter-one/0.2.0-083634d3/`
- Studio 导出命令：`npm run export:chapter-one`

## 最省事的更新流程

1. 只在 Studio 修改 Story IR、编译器、主题或 Bridge。
2. 运行 `npm run test:core` 与 `npx tsc --noEmit`。
3. 运行 `npm run export:chapter-one`，生成内容寻址的新 ZIP 和解压目录。
4. 将新目录复制到 Blog 的 `public/games/lonely-sea-chapter-one/`，在 `release-registry.ts` 新增 release 并切换 `currentReleaseId`。
5. 运行 Blog 构建和 `.local/qa-game-integration.mjs`。旧 release 不删除、不覆盖，旧存档继续按原版本读取。

Blog 会在构建期验证 manifest、完整文件集合、字节数和 SHA-256。任何剧情、CSS、Bridge 或扩展变化都必须重新导出，不能手改已登记 release。

## 当前 v1 行为

- 游戏包自己适配 WebGAL 的 SAVE、LOAD、OPTION、TITLE、ESC 与运行控制栏；Blog 不跨 iframe 操作引擎 DOM。
- TITLE 固定回 Blog 标题；ESC 隐藏 / 恢复对白框；STORY 在声明的片段边界返回来源页面。
- OPTION 在宿主层覆盖打开，9 项共享设置实时进入当前 iframe。
- SAVE 捕获 480×270 WebP 实时画面；自动续玩点与手动槽分开；LOAD 固定 release 与检查点。
- 当前 manifest 有 8 个 save point、2 个公开 STORY scene、8 个流程图节点。
- Blog 侧另有独立的 RSS、留言、友链通讯场景。旧 `open-comment-form` 保持兼容；新导出包可使用 `open-blog-scene`，无需把页面 UI 编进游戏包。

通讯场景的桥接参数与返回值见 `docs/blog-communication-scenes.md`。
