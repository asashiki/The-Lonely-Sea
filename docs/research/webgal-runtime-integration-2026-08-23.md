# WebGAL 4.6.x、Studio Runtime 与 Blog 集成判断

日期：2026-08-23  
核对基线：WebGAL `4.6.2`（Studio 当前锁定版本），并对照 `4.6.4` 的官方改动。  
外部资料范围：仅 WebGAL 官方文档、OpenWebGAL 官方 GitHub 仓库及源码。

## 结论先行

针对这个项目，最合适的不是继续修改每一份 WebGAL 导出包，也不是立刻重写一个“完整 WebGAL”。建议采用：

> **Studio 的结构化 Story runtime + 分层立绘渲染器成为 Blog 游戏的主运行时；WebGAL 保留为兼容导出 adapter。**

原因是当前 Studio 已经有可序列化的剧情状态机、选择/变量/跳转/输入/Blog Action，以及独立眼睛和嘴巴渲染器。我们不是从零实现脚本语言，而是把已有预览内核补成一个范围受控的视觉小说播放器。相反，要让原版 WebGAL 同时满足 Blog 原生 SAVE/LOAD/OPTION、语义桥接、同角色硬切、持续自然眨眼、独立口型，已经不是“换皮”，而是要修改 UI、存储接缝、运行时桥接和 Pixi 立绘核心，实际接近深分支。

WebGAL 不应删除：它仍然适合 Studio 的标准独立游戏导出、WebGAL 生态兼容，以及使用其复杂原生指令的项目。两条运行时必须消费同一份 Story IR，并用一致性测试保证选择、变量和跳转结果相同。

## 1. WebGAL 4.6.x 的 UI 到底能改到什么程度

### 官方模板的边界很窄

WebGAL 4.6.2 的模板加载器把可替换样式硬编码为三个区域：

- 标题页 `UI/Title/title.scss`
- 对话框 `Stage/TextBox/textbox.scss`
- 选项 `Stage/Choose/choose.scss`

证据见官方 [`templateLoader.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/util/coreInitialFunction/templateLoader.ts#L85-L103) 和[自定义 UI 文档](https://docs.openwebgal.com/webgal-script/custom-ui.html)。模板能够深度改变这三处的视觉，但组件结构、按钮数量和点击行为仍由 WebGAL React 组件决定；标题页固定连接开始、继续、设置、读档、鉴赏、退出等行为，见官方 [`Title.tsx`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/UI/Title/Title.tsx#L64-L139)。

引擎启动时还会加载任意的 `game/userStyleSheet.css`，见 [`initializeScript.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/initializeScript.ts#L39-L48)。它适合补充全局字体、颜色或隐藏元素，但不能稳定替换 React DOM 和业务逻辑；大量原生页面使用 CSS Modules，依赖构建后的类名做 DOM/CSS 注入会随版本和构建变化。

| 界面 | 官方模板换肤 | 完整替换结构/行为 | 本项目建议归属 |
| --- | --- | --- | --- |
| Title | 支持外观 | 需要改源码或绕过组件 | Blog |
| Textbox | 支持外观 | 复杂交互仍需改运行时 | Native Runtime |
| Choose | 支持外观 | 复杂布局规则仍需改运行时 | Native Runtime |
| Save / Load | 不支持模板 | 需要改源码或桥接底层 | Blog UI + Runtime Snapshot |
| Backlog / History | 不支持模板 | 需要改源码或桥接底层 | Blog UI + Runtime Log |
| Options | 不支持模板 | 需要改源码或桥接状态 | Blog |
| Extra / Flowchart | 不支持模板 | 需要改源码或桥接状态 | Blog |

Save、Load、Options、Backlog 都是固定 React 组件，由 [`App.tsx`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/App.tsx) 和 [`Menu.tsx`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/UI/Menu/Menu.tsx) 直接挂载。完整替换可以实现，但只能走官方允许的“定制/派生引擎”路径，而不是普通模板；官方也明确提供了[定制引擎的分发方式](https://docs.openwebgal.com/derivative.html)。

## 2. 原生存档能力可用，但不能从 Blog 外部直接调用

WebGAL 的底层存档并不只是“跳回某个场景”：

- [`generateCurrentStageData()`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/controller/storage/saveGame.ts#L27-L61) 会保存场景 URL、当前语句、调用栈、舞台状态、Backlog，并从 `pixiCanvas` 生成 480×270 WebP 实际游戏截图。
- [`loadGameFromStageData()`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/controller/storage/loadGame.ts#L28-L72) 会恢复场景、语句位置、调用栈、Backlog、舞台状态和演出。
- 原生设置包含主音量、文字速度、自动速度、文字大小、语音/BGM/SE/UI 音量、字体、对话框透明度、语言等，见 [`IOptionData`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/store/userDataInterface.ts#L32-L50)。

因此，之前 LOAD/CONTINUE 回到开头、缩略图使用默认图，并不是 WebGAL 做不到，而是桥接层没有把“完整快照”作为唯一读写单位。

但 WebGAL 单例没有作为公共 API 暴露到 `window`；官方源码中的 `window.WebGAL = WebGAL` 是注释状态，见 [`WebGAL.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/WebGAL.ts#L1-L9)。所以 Blog 不能可靠地从 iframe 外部抓取内部对象。若继续使用 WebGAL，必须把窄桥接层编译进派生引擎，不能靠导出后查询 DOM 或点击带哈希的类名。

## 3. 原生静态立绘眨眼、口型的结构性限制

WebGAL 4.6.2 对图片立绘提供 `mouthOpen / mouthHalfOpen / mouthClose / eyesOpen / eyesClose`，官方用法见[图片立绘嘴型同步](https://docs.openwebgal.com/webgal-script/animation.html#图片立绘嘴型同步)及 [`changeFigure`](https://docs.openwebgal.com/script-reference/commands/changeFigure.html)。但源码实现决定了它无法直接复现 Studio 测试页的分层效果：

1. 每段语音启动时会立即眨一次眼，之后仅以约 3.5–3.8 秒间隔继续，闭眼固定 200ms；调度入口直接调用 `blink()`，见 [`vocalAnimation.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/gameScripts/vocal/vocalAnimation.ts#L60-L80)。这正会造成“每点一句就眨一下”的观感。
2. 眨眼只随该段语音运行，并被硬性限制在 10 秒内，见 [`vocal/index.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/gameScripts/vocal/index.ts#L136-L145)，不是持续的待机生命循环。
3. 口型每 50ms 读取一次 Web Audio FFT 平均音量，再分成闭、半开、全开三档，见 [`vocal/index.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/gameScripts/vocal/index.ts#L91-L133)。它不是音素/viseme 时间线；浏览器 AudioContext 未被激活时还会直接跳过分析。
4. 最关键的是，嘴型和眨眼最终都给同一个 Pixi Sprite 赋值 `sprite.texture`，见 [`PixiController.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/controller/stage/pixi/PixiController.ts#L338-L395)。两者并非独立图层，眼睛和嘴巴同时变化时会互相覆盖状态。

Live2D 有自己的眨眼和嘴型参数体系，但需要额外 SDK/授权准备，官方步骤见 [Live2D 文档](https://docs.openwebgal.com/live2D.html)；它不适合直接解决目前这套分层 PNG 素材。

同角色切换的“透明术”也有源码原因：4.6.2 在立绘 URL 变化时把它视为新对象，默认入场 300ms、退场 450ms，见 [`constants.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/constants.ts#L8-L12) 与 [`changeFigure.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/gameScripts/changeFigure.ts#L117-L181)。`4.6.4` 重写了不少立绘身份和动画连续性逻辑，但口型/眨眼共用整张纹理的核心没有改变；版本差异见[官方 4.6.2→4.6.4 比较](https://github.com/OpenWebGAL/WebGAL/compare/4.6.2...4.6.4)。

结论：若走 WebGAL，必须开发分层 Pixi 人物节点和统一的眼/嘴状态机；若走现有 Native Runtime，这部分基础已经在 Studio 的 `lib/figure-motion/*` 中存在。

## 4. iframe + Blog 的合理边界

WebGAL 官方确实在编辑器嵌入预览时使用 iframe/postMessage：[`embeddedPreviewBootstrap.ts`](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/packages/webgal/src/Core/util/syncWithEditor/runtime/embeddedPreviewBootstrap.ts#L47-L100)。但该代码只交换编辑器预览启动 ID，后续同步走编辑器专用通道，不是成品游戏的稳定公共桥接 API。因此 `gal-blog-bridge/v1` 仍应由我们维护。

建议的职责划分：

```text
Studio Project（唯一剧情源）
  └─ Story IR + assets + manifest
       ├─ Native Runtime export ──> Blog iframe（主目标）
       └─ WebGAL adapter export ──> 标准 WebGAL 包（兼容目标）

Blog Shell
  ├─ START / SAVE / LOAD / OPTION / STORY / EXTRA
  ├─ RSS / 留言 / 友链 / 成就 / 后端与持久化
  └─ gal-blog-bridge/v1 <──> Runtime
```

桥接至少应明确以下语义，而不是模拟点击 UI：

- 生命周期：`hello / init / ready / pause / resume / dispose`
- 启动：`start / launch-entry / restore-snapshot`
- 存档：`snapshot.create / snapshot.restore / snapshot.available`
- 历史：`backlog.list / backlog.jump / voice.replay`
- 设置：`settings.apply / settings.changed`
- Blog：`open-blog-scene / blog-scene-result`
- 结果：`segment-complete / return-request / achievement-unlocked`

每条消息带 `protocol、gameId、releaseId、sessionId、requestId`，父子双方校验 `origin`、`source` 和会话。游戏 iframe 在一个会话里保持挂载；SAVE/LOAD/OPTION/RSS/留言/友链以 Blog 覆层打开，运行时暂停但不卸载。这样点击可以立即出现过渡反馈，关闭页面后也不必重新加载引擎。

RSS、留言、友链的“剧情内容入口”应作为 Studio 中的 `blog-action` 节点编排；真实 UI、数据、网络请求和持久化属于 Blog。Studio 预览使用同一协议的 mock host 返回 success/cancel/failure。这样修改 Blog 页面不必重导剧情，修改台词或分支也不必改 Blog。

## 5. 三条技术路线的真实成本

| 路线 | 初期成本 | 后续维护 | 是否满足当前目标 | 判断 |
| --- | --- | --- | --- | --- |
| 原版 WebGAL + 模板/CSS | 低 | 中；容易被 DOM/CSS 变化破坏 | 否；Save/Load/Option、桥接、分层脸均不足 | 不采用 |
| WebGAL 薄分支，仅加 Bridge | 中 | 中 | 仍不能完整解决分层脸与同角色切换 | 只适合兼容导出 |
| WebGAL 深分支：UI、存储、桥接、立绘核心全改 | 高 | 高；上游舞台/动画更新需要持续合并 | 能做到，但等于长期维护私有引擎 | 不作为 Blog 主线 |
| 现有 Story runtime 升级为轻量 Native Runtime | 中高，但不是从零 | 可控；功能边界由项目决定 | 最贴合 Blog 和现有分层素材 | **推荐主线** |
| 从零复制完整 WebGAL 功能 | 极高 | 极高 | 理论可行 | 明确不做 |

官方 WebGAL 已经包含场景调用栈、资源预加载、Pixi 舞台、动画、存读档、Backlog、Auto/Skip、流程图等大量系统，见[官方技术介绍](https://docs.openwebgal.com/tech/)。因此“自建轻量运行时”必须严格限制为当前 Story IR 所需能力，不能把目标写成重造 WebGAL。

当前 Studio 的本地代码审计显示：

- `lib/story/runtime.ts` 已覆盖场景、块、选择、变量、条件、跳转、输入、Blog Action、演出 Cue 和日志。
- `lib/figure-motion/layeredRenderer.ts`、`blinkScheduler.ts`、`mouthTimeline.ts` 已有分层人物基础。
- 但 `DynamicGalgameStage.tsx` 仍是固定时长、固定 guide/welcome 演示；正式 compiler/exporter 尚未消费 `facialMotion`，`during-line.voiceTimeMs` 也没有真实音频时钟调度。

这意味着 Native Runtime 不是完成品，但缺口主要集中在“通用播放器外壳”，而不是剧情语言本身。与其把同样的分层逻辑重新嵌进 WebGAL 私有 Pixi 核心，再维护一套 Blog Bridge，提升现有 runtime 的重复工作更少。

## 6. 推荐制作流程

### 唯一源与修改方式

1. 剧情、台词、分支、人物演出、Blog Action 都只在 Studio Project 中修改。
2. Studio 的正式预览必须运行同一个 Native Runtime；删除当前硬编码测试时间线。
3. 用户指出某个点不满意时，按稳定 `sceneId/blockId/cueId` 修改源项目，再生成 review release；不直接改导出目录。
4. Blog 导入的内容包视为不可变产物，只做清单校验、哈希命名和注册，不做二次源码补丁。
5. Blog 页面和后端功能只改 Blog；协议变化才同时升级 runtime adapter 与 Blog。

### Native Runtime v1 只做这些

- ADV/NVL 对话、逐字、选择、变量、条件与跳转
- BGM/语音/SE、Auto/Skip、历史
- 通用舞台和响应式布局
- 分层 Alice：独立身体/眼/嘴、持续自然眨眼、Web Audio 时钟口型
- 同角色表达硬切；只有明确的入退场才允许渐变
- 序列化 snapshot、恢复、实际舞台缩略图
- 输入、Blog Action、成就和片段完成事件
- 键鼠/触控和暂停恢复

暂不承诺 Live2D、Spine、任意 WebGAL 原生脚本、无限滤镜或第三方插件；需要这些能力的项目走 WebGAL adapter。

### 两个运行时的一致性门槛

为同一 Story Project 运行固定输入序列，至少比较：

- 当前 `sceneId/blockId`
- 变量与已解锁记录
- 可见选择与返回上一选择
- 人物/背景/BGM 逻辑状态
- Blog Action 的 success/cancel/failure 分支
- 保存后恢复得到的稳定状态

视觉层允许 Native Runtime 与 WebGAL 不同，但剧情结果必须一致。这样未来即使彻底停用 WebGAL，剧情资产也无需重写。

## 最终判断

WebGAL 仍然“能做正常游戏”，且官方支持派生引擎；但它的模板不是完整 UI 系统，静态 PNG 眨眼/口型也确有结构性限制。对一般视觉小说，固定版本薄分支很划算；对当前这个强调 Blog 原生页面、特殊交互和分层 Alice 的项目，所需补丁已经跨过薄分支边界。

因此建议：**Native Runtime 作为 Blog 主线，WebGAL adapter 作为 Studio 的兼容导出，不再把 WebGAL 内建标题、SAVE/LOAD、OPTION、历史强行美化后塞回 Blog。**

若分发修改过的 WebGAL 文件，还需遵循其 [MPL-2.0 LICENSE](https://github.com/OpenWebGAL/WebGAL/blob/4.6.2/LICENSE)；Native Runtime 自有代码则可以独立选择许可证。
