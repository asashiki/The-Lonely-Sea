# 游戏与 Blog 一体化改修报告（更新于 2026-08-13）

## 当前结论

当前正式游戏为 `lonely-sea-chapter-one@0.2.0-0cc652e9`。Blog 的 START、CONTINUE、LOAD / SAVE DATA、OPTION、STORY 与游戏内控制栏已经连接到同一个不可变发布包，不再启动旧 `lonely-sea-guide` 演示内容。

实际闭环为：

`首次语言选择 → 第一章 → 自动续玩点 → 手动 SAVE → Blog SAVE DATA 选槽 → LOAD 指定存档 → CONTINUE → TITLE 返回 Blog`

## 游戏内容与演出

- 第一章按 `branch-plan (3).json` 与 `branch-planner.html` 重写，共 8 个场景、8 个作者检查点；第一层分支为“关于本站 / 关于站长 / 关于我”。
- Alice 单独面对玩家时居中，讲解 Blog 截图时才让出画面；同角色差分零毫秒硬切，不再出现旧立绘淡出、新立绘淡入的“双影”。
- 导出包先预载 12 张基础表情，当前表情的嘴型与眼睛差分再按需预热；既避免硬切空白闪帧，也不会在开场并发解码全部 51 张差分。语音只交给 WebGAL 原生口型；Bridge 拦截原生的“每句语音立即眨眼”，改为 4.2–8 秒随机间隔独立眨眼。
- 15 句关键对白使用实际日语 MP3；宿主语音音量只缩放一次。
- 分支按场景放在左 / 中 / 右的对白安全区，不使用卡片、单侧强调线或会遮挡对白框的固定大按钮；820×900 与 390×844 均按 16:9 舞台缩放。
- “返回上一项”直接回到上一个选项组，不重新播放整段开场。

## Blog 融合

### 启动与返回

- 第一次点 START 先选中文 / English / 日本語；选择会写入共享偏好并直接进入第一章。
- TITLE 始终返回 Blog 标题。ESC 第一次隐藏对白框，第二次恢复，不再误退回主界面。
- STORY 只公开“系统功能”和“Alice 介绍”两个独立入口；内部选项可正常循环，片段到声明边界后返回原 STORY 页面。
- 有有效游戏存档后，标题 CONTINUE 立即启用并读取最近记录。

### SAVE / LOAD

- 游戏内 SAVE 打开 Blog 的 SAVE DATA 写入模式：空槽可写，已有槽可覆盖；游戏内 LOAD 打开读取模式。
- 自动检查点只保留一个续玩槽，不会每次进入都新增；手动存档独立占用用户选择的槽位。
- 存档从 WebGAL 画布采集 480×270 WebP，LOAD 显示真实当时画面，不再固定使用雾景。
- LOAD 会按存档固定的 `releaseId + savePoint` 启动对应不可变包，避免新旧剧情串档。
- 存档同时记录当前作者对白块；LOAD 与 CONTINUE 已实测直接回到保存时的对白，不再从场景开头播放。
- 手动存档成功会触发“留下航标”成就提示。

### OPTION 与游戏内功能

- 游戏控制栏提供 `LOG / AUTO / SKIP / SAVE / LOAD / OPTION / TITLE`，窄屏保留 `SAVE / LOAD / OPTION / TITLE`。
- OPTION 无需重载 iframe；关闭设置后继续当前游戏。
- 当前包实际接收并应用 9 项共享设置：总静音、BGM、界面音效、语音、文字大小、文字速度、减少动效、特殊指针、界面语言。
- OPTION 的“清除本浏览器数据”会删除设置、阅读记录、游戏存档、互动草稿、缓存与离线数据；清除后的首屏不会立即重建空记录。

### 游戏内 Blog 交互

- 对话里的 `LOAD`、`OPTION`、`留言`、`友链` 可作为无下划线的内联动作直接点击。
- 留言与友链表单在 Blog 宿主层打开，关闭后回到同一游戏会话，不重新加载 WebGAL。
- 当前留言与友链申请仅保存于本机，已验证写入与回到游戏；公开发布仍需要后端服务。

## 发布与边界

- ZIP：`C:\Users\Hey\Downloads\oblivion-haven\gal-blog-game-studio\artifacts\lonely-sea-chapter-one\lonely-sea-chapter-one-0.2.0-0cc652e9-runtime.zip`
- Blog 安装目录：`public/games/lonely-sea-chapter-one/0.2.0-0cc652e9/`
- Blog 在构建期逐文件验证 manifest、字节数和 SHA-256；登记后的 release 不原地修改。
- 当前存档协议是 `checkpoint-v1`：恢复到作者定义的场景入口与白名单状态，不承诺恢复到任意一个字符的打印位置。
- 公开评论 / 友链审核后端、剩余正式台词与更多语音素材仍需真实内容或服务配置；当前不会伪造线上成功。

## 验证结果

- Studio 核心测试：69 / 69 通过。
- Studio TypeScript：`npx tsc --noEmit` 通过。
- Blog：Astro 54 个文件诊断 0 error / 0 warning / 0 hint，9 个静态页面构建通过。
- 浏览器完整路径通过：首次语言、第一章启动、ESC 隐藏 / 恢复、OPTION 实时同步、自动 / 手动存档、真实缩略图、LOAD、CONTINUE、TITLE、STORY 内部分支、留言、友链与成就。
- 清除数据实测会先关闭同源 WebGAL iframe，再删除其 IndexedDB；重新 START 后语言门重新出现，LOAD 手动存档数为 0。
- 尺寸验证通过：1280×720、820×900、390×844；选项没有横向溢出，也没有压住对白框。
