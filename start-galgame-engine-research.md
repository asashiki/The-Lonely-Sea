# gal-blog `START`：Galgame 引擎、AI 编排与 Astro 7 接缝研究

> 调研日期：2026-07-18  
> 结论适用范围：`gal-blog` 正式框架化的当前阶段；`START` 尚未确定最终制作工具、素材与玩法。  
> 资料规则：外部事实仅采用官方文档、官方仓库/源码、标准；GitHub 链接固定到本次调研的 commit。

## 结论先行

**现在正常进入 Astro 开发，不要让 `START` 的终局设计阻塞博客。** 但要在第一天保留一条清楚的“游戏运行时边界”：Astro 管博客、目录、SEO、内容索引与启动页；每个完整 Galgame 运行时管自己的舞台、音频、存档和脚本执行。

推荐按四层拆开：

1. **博客层（现在做）**：文章、标签、项目、时间线、`START` 入口和体验目录。
2. **确定性叙事层（先试）**：手工编排的迎宾、短篇、日记。内容固定、可复现、可测试。
3. **AI 辅助制作层（后接）**：AI 产出“演出草案”，经过 schema 校验、预览与人工确认后才发布。
4. **实时 AI 层（最后单独做）**：酒馆式自由对话/动态剧情，使用独立后端、独立存档和明确的实验标识；不与作者写定的正篇混为一种内容。

当前不建议：

- 不要先自研“完整 Galgame 编译器/引擎”。
- 不要把一次 AI 生成的 HTML 当未来内容格式。
- 不要为了兼容 WebGAL、Let’sGal、Ren’Py，预先发明一个能覆盖三者全部能力的万能 IR。
- 不要在素材与一段真实短剧本都没有时，仅凭功能列表决定永久引擎。

## 1. 应该如何分层

### 1.1 面向访客的产品层

```text
/start/
├─ guide/                 # 3–5 分钟博客迎宾，确定性、可跳过
├─ stories/[slug]/        # 手工短篇 / WebGal
├─ diary/[slug]/          # 日记叙事化；同时保留纯文本阅读入口
└─ lab/
   ├─ generated/          # AI 生成后经作者确认的作品
   └─ tavern/             # 实时 AI，会话型实验区
```

`START` 是“体验大厅”，不是单一超大游戏。这样可以同时容纳角色路线、博客介绍、短篇 WebGal、日记改编和 AI 实验，而不会要求它们共享同一套存档语义。

这也会改变标题菜单的细节：`CONTINUE` 应明确显示“继续阅读”还是“继续某条故事路线”；`LOAD` 可以分成 `READING DATA` 与 `STORY DATA` 两页，但引擎内部存档仍由各运行时自己的命名空间管理，不能把文章滚动位置和 Galgame 状态硬塞进同一对象。

### 1.2 内容可信度层

| 层级 | 内容来源 | 是否可复现 | 发布方式 | 建议标记 |
|---|---|---:|---|---|
| A | 作者手写文章/日记 | 是 | Astro 静态内容 | 正文 |
| B | 作者手工编排 Galgame | 是 | 固定脚本与固定引擎版本 | 互动叙事 |
| C | AI 草拟、作者确认 | 是 | 校验后的 JSON/脚本提交进仓库 | AI 辅助制作 |
| D | AI 实时生成 | 否 | 服务端会话实时运行 | 实验 / AI 互动 |

这一区分比“是否用了 AI”更重要：读者必须知道眼前内容是作者的定稿，还是一次可能变化的模型会话。

### 1.3 Astro 与游戏运行时的边界

Astro 官方把 Islands 定义为“静态 HTML 海洋中的独立交互组件”，只有显式使用 `client:*` 的组件才向浏览器发送对应 JavaScript；`client:only` 可完全跳过服务端渲染。[Astro Islands（固定 commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/concepts/islands.mdx#L27-L39) [Client Islands（固定 commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/concepts/islands.mdx#L65-L86) [框架组件与 hydration（固定 commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/guides/framework-components.mdx#L49-L81)

因此建议两种接法：

- **自有轻量播放器**：做成一个 Svelte/React client island；只适合迎宾、短日记等受控能力集。
- **WebGAL / Let’sGal 等完整运行时**：输出为独立 Web 文档，由 Astro 页面使用 `<iframe>` 承载；避免两套运行时的 CSS、路由、全屏、音频与生命周期互相污染。HTML 标准明确把 `iframe` 定义为独立的嵌入式内容导航上下文，并提供 `sandbox`、`allow`、`loading` 等控制。[WHATWG `iframe`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element)

若父页面需要接收“已准备、进度、退出、错误”等事件，使用一个版本化的 `postMessage` bridge；必须检查 `origin` 和消息 schema，不对敏感消息使用 `*`。这是 HTML 标准直接要求的安全做法。[WHATWG cross-document messaging](https://html.spec.whatwg.org/multipage/web-messaging.html#security-postmsg)

### 1.4 代码接缝：只让 Astro 认识 `StoryHost`

把 `StoryHost` 设计成一个深 Module：Interface 只接收 `ExperienceManifest`、容器和恢复信息，并只向调用者发出 `ready / progress / exit / error`。WebGAL iframe、Let’sGal iframe、原生轻量播放器分别是坐在这条 Seam 上的 Adapter；测试使用内存 Adapter。Astro 页面不应认识 `changeFigure`、Let’sGal Block、Pixi 容器或引擎存档内部结构。

这样复杂的资源加载、音频交接、消息校验、销毁和错误恢复都留在 Module 的 Implementation 内，调用页面只学习一套小 Interface。未来真正同时存在“确定性脚本”和“实时 AI”两种来源时，再为 `NarrativeSource.next()` 建第二条 Seam；现在只有一种来源时不要提前增加假想抽象。

## 2. 采用还是自研：选择矩阵

| 方案 | 浏览器原生 | 制作体验 | 演出/存档成熟度 | 与博客融合 | 许可/锁定 | 当前建议 |
|---|---:|---:|---:|---:|---:|---|
| 一次性 AI 生成 HTML | 高 | 初看很快 | 低 | 表面高、长期低 | 代码归属可控，格式漂移大 | 只做原型 |
| 自研轻量 Blog VN Player | 高 | 需自己做编辑器或写 JSON | 低到中 | 最高 | 可完全自控 | 只覆盖迎宾/日记最小集 |
| WebGAL + Terre/Craft | 高 | 脚本与可视化编辑器 | 高 | 以独立运行时嵌入 | MPL-2.0，开源可审计 | **完整 WebGal 首选候选** |
| Let’sGal Studio / AVGPlus | 高（可 Web 出包） | 本地体验最符合用户偏好 | 高 | 以构建产物嵌入 | Studio/模板授权边界需确认 | **制作工具 PoC 首选候选** |
| Ren’Py | Web 为移植目标而非浏览器原生设计 | 成熟 | 很高 | 较低 | MIT 主体，依赖另计 | 作为语义参考；独立大作可选 |
| 自研完整编译器+引擎+编辑器 | 可以 | 远期可定制 | 起点极低 | 最高 | 自控 | **现在不做** |

“自研轻量播放器”和“自研完整引擎”必须分开判断。前者是一个有限状态播放器；后者还要解决脚本控制流、资源生命周期、输入、历史、快进、自动播放、存读档、回滚、版本迁移、编辑器预览、调试、浏览器兼容与移动端内存。成熟引擎的源码与文档显示这些能力本来就是多个系统，而不是一个对白组件。

### 2.1 现有 AI 原型已经说明了边界

本地 `C:\Users\Hey\Downloads\webgal\src\gal-script-model.js` 的 8 项测试全部通过，已经能证明 AI 可以较快做出“旁白 / 对白 / 场景 / 分支 + JSON 导入导出”的轻量模型。但当前 `expression` 只进入数据，尚未进入最终舞台状态；也没有多立绘站位、真实资源预载、音频、转场、粒子、历史、自动播放、存读档、rollback 与版本迁移。

所以它很适合继续充当 schema/交互试验场，不适合直接升级成本站唯一生产引擎。这不是原型失败，恰好说明“一次生成能做出可玩的表面，长期质量取决于后续补齐的引擎系统”。

## 3. WebGAL 调研

### 3.1 当前形态

本次固定快照为 `e7f0abeb855b5b442460743bdaa9778ca751b43f`。官方将 WebGAL 定义为网页端视觉小说引擎，提供 WebGAL Script、图形化编辑器、调试工具与 VS Code 语法工具，并允许以 Pixi.js 添加自定义效果。[官方 README：定位与编辑器（固定 commit）](https://github.com/OpenWebGAL/WebGAL/blob/e7f0abeb855b5b442460743bdaa9778ca751b43f/README.md#L11-L17) [工具与能力（固定 commit）](https://github.com/OpenWebGAL/WebGAL/blob/e7f0abeb855b5b442460743bdaa9778ca751b43f/README.md#L31-L53)

仓库是多 package 结构，核心实现将脚本解析、游戏执行、状态/存档、舞台渲染与 UI 分离。对 gal-blog 的含义是：采用它等于采用一个完整运行时，不应把内部状态逐项复制进 Astro 全局状态。

### 3.2 脚本与 AI 适配性

WebGAL Script 是逐行文本指令，普通对白保持接近自然剧本，场景、立绘、音频、分支、变量、跳转等使用明确命令。它比任意 HTML 更适合版本控制，也比自由 JSON 更适合作者直接阅读；同时适合 AI 生成“候选脚本”，再交给官方 parser/编辑器检查。

但 AI 仍只能引用素材清单中真实存在的文件/角色/表情。不要允许模型自由发明路径；生成前给它枚举 ID，生成后执行语法解析、引用完整性检查和实际预览。

### 3.3 编辑、构建与嵌入

官方提供 WebGAL Terre 图形化编辑器与调试工具；README 另列 WebGAL Craft 跨平台工作室。[官方工具入口（固定 commit）](https://github.com/OpenWebGAL/WebGAL/blob/e7f0abeb855b5b442460743bdaa9778ca751b43f/README.md#L31-L37) [相关项目（固定 commit）](https://github.com/OpenWebGAL/WebGAL/blob/e7f0abeb855b5b442460743bdaa9778ca751b43f/README.md#L67-L71) 对 gal-blog 最稳妥的集成不是把 WebGAL 改写成 Astro 组件，而是：

1. 在 WebGAL/Craft 中制作与预览；
2. 导出完整静态 Web 产物；
3. 以带版本的目录或独立子域部署；
4. Astro `experiences` 清单只记录入口 URL、引擎版本、封面、能力和 bridge 版本；
5. `/start/stories/[slug]/` 负责加载提示、全屏按钮、纯文本替代入口与 iframe。

### 3.4 许可

WebGAL 仓库是 **MPL-2.0**；官方 README 明确说明可在该许可证范围内免费使用并商用。[LICENSE（固定 commit）](https://github.com/OpenWebGAL/WebGAL/blob/e7f0abeb855b5b442460743bdaa9778ca751b43f/LICENSE) [官方说明（固定 commit）](https://github.com/OpenWebGAL/WebGAL/blob/e7f0abeb855b5b442460743bdaa9778ca751b43f/README.md#L59-L63) 素材、字体、插件和作品脚本仍需分别确认授权；“引擎可商用”不等于示例素材可直接用于本站。

## 4. Ren’Py：应该借鉴什么，为什么不作为本站内核

本次固定源码快照为 `0c50d0130c90c629e9ffd0dac48309d5446c9bd0`。

Ren’Py 值得借鉴的是它经过长期验证的**语义**：

- Script 负责叙事控制流；Screen Language 负责界面声明；Displayable 是可显示对象抽象。
- persistent data 与普通 save slot 是不同生命周期。
- rollback 不是简单的“浏览器后退”，而是引擎对可回滚状态、交互点和随机性的系统性管理。
- save/load 要保存脚本位置与可序列化状态，还要考虑版本升级后的兼容。

这些能力说明：如果未来自研轻量播放器，应明确宣布“不支持 Ren’Py 等价回滚/存档语义”，而不是做出几个按钮后误称完整引擎。

Ren’Py 已提供 Web 构建目标，但其官方 Web 文档仍把该支持标为 beta，并列出浏览器、媒体、下载体积/缓存与平台差异等限制。它的主要抽象、Python 运行环境与资产打包首先服务于 Ren’Py 游戏，再移植到浏览器；而 gal-blog 需要的是小体积、按体验懒加载、与真实网页路由/SEO并存的浏览器内容平台。因此：

- 已经用 Ren’Py 制作的大型完整作品，可以作为独立 Web/下载作品链接；
- 不建议把 Ren’Py Web 包作为每次打开博客 `START` 都必须加载的基础运行时；
- Screen、Displayable、persistent、save/rollback 的设计可作为需求清单和反例库。

## 5. Let’sGal Studio / AVGPlus 本地审计

### 5.1 证据快照

读取了用户指定的 `C:\Users\Hey\Downloads\webgal\RESEARCH.md`，并对本机安装的 Let’sGal Studio 1.6.2 做了只读复核。关键校验值：

| 项目 | SHA-256 |
|---|---|
| `RESEARCH.md` | `D12D1A284DE161BC90418658E6C0CCFF4A1B4E41A62791ABC36BA415D9772B8D` |
| `resources/app.asar` | `B0CBAFFA4D4A81F60E48B7B6904225127EB874696E65ED825C9518F3531273C7` |
| `dist/resources/web-shell/index.html` | `FE286CAA27940E9C16551BE99D1AAF95E67F7DC1CA916F7C2236531690DEC2C6` |
| 模板 `project.json` | `655798E322C25EB23A2537C4046CFA5EF5ADDE89B973ADFB5F3CFC010B02B2EF` |

本机 `app.asar/package.json` 标记包名 `@avgplus/engine`、版本 `1.6.2`、许可证 `MIT`，依赖中包含 React、Pixi.js、Howler、Dexie 等。此信息只证明该安装包内的 engine package metadata，不能自动推导 Studio、本地模板素材或未来商业发行条款全部相同。

### 5.2 工作流与数据格式

本地模板证实：

- `project.json`：工程 ID、版本、分辨率、章节顺序、扩展与系统 UI bindings。
- `chapters/*.json`：`fragments[] -> blocks[]`；分支可跳转 fragment。
- `characters.json`：角色、表情资源与预设站位。
- `scenes.json`：多图层背景及距离信息。
- Block 覆盖对白、旁白、场景、立绘、分支、变量、镜头、音频、视频、粒子、帷幕、等待、扩展 UI 等。

这正面回答了“表情、位置、背景、粒子是否属于制作数据”：**属于，而且应该是显式 cue/block，不应藏在播放器的临时猜测里。**

官方首页也明确宣传结构化角色/场景/音轨、时间轴调试、快照、变量观察、React UI 扩展，以及 macOS / Windows / Web 出包。[Let’sGal Studio 官方页](https://avg-engine.com/)

### 5.3 Web 输出

本地 1.6.2 安装包包含预构建 `dist/resources/web-shell/`。从 `app.asar` 可复核的 `src/studio/dist-electron/build-worker.js` 显示构建目标包含 `web | desktop | all`；Web 构建会：

- 复制 `web-shell`；
- 写入 `config.json`；
- 写入游戏 manifest、章节与资源映射；
- 产出 `web` 目录及相邻 `assets` artifact；
- 支持配置资源服务器 URL。

所以 Let’sGal 不是“只能导出桌面应用”；可以把其 Web 构建产物视为独立站点嵌入 Astro。真正需要做 PoC 验证的是：目标部署平台上的相对路径、跨域资源、缓存、存档、移动端内存、全屏/音频手势和版本升级，而不是重新实现它的编译器。

### 5.4 采用边界

建议把 Let’sGal 当作**外部 authoring/build tool**：

- 源工程保存在独立目录或仓库；
- gal-blog 只消费有版本号的 Web 输出和元数据；
- 不让 Astro 内容 schema 直接依赖 Let’sGal 内部 block 全量结构；
- 不以逆向 app.asar 作为长期构建 API；
- 在正式发布商业内容前，向官方确认 Studio、runtime、模板素材和扩展的实际授权条件。

## 6. AI 能否决定表情、站位、背景、粒子与词典

### 6.1 简短答案

**AI 可以可靠地产出“格式正确的候选 cue”，不能仅凭 schema 保证“演出判断正确”。** OpenAI 官方说明 Structured Outputs 可约束输出匹配 JSON Schema，但也明确指出它仍可能在 JSON 值内部犯错；模型行为本身具有变化性，官方建议固定模型快照并建立 eval。[Structured Outputs 官方说明](https://openai.com/index/introducing-structured-outputs-in-the-api/) [API 向后兼容与可变输出](https://platform.openai.com/docs/api-reference/backward-compatibility)

表情和演出是上下文与作者意图问题：同一句“没关系”可能是温柔、强忍、嘲讽或冷漠。没有人物设定、前后文、可用素材目录和演出规则，就不存在唯一正确答案。

### 6.2 分项建议

| 问题 | AI 适合做什么 | 必须由规则/作者控制什么 |
|---|---|---|
| 角色表情 | 从受限 `expressionId` 枚举中提议；标注情绪与置信度 | 角色弧光、反差表演、关键句最终选择 |
| 立绘位置 | 从 `left / center-left / center / center-right / right` 等槽位选择 | 同屏人数、遮挡、安全区、镜头连续性 |
| 背景切换 | 根据明确的地点/时间/场次变化提议 | 场次边界、回忆/现实语义、是否故意不切 |
| 粒子/特效 | 从低强度预设中提议，默认 `none` | 关键演出、性能预算、避免每句都加效果 |
| 特殊词/词典 | 找候选词、匹配已有词条 | 词条定义、剧透等级、首次出现和精确链接 |

对 `B68E8F3D42A67DBCE9F61039B300B4FC.jpg` 这类“对白中高亮专有词，展开解释卡”的效果，建议建立权威 `glossary` collection，而不是运行时让 AI 临时解释：

```yaml
id: bakufu
label: 幕府
aliases: [江都幕府]
definition: ...
spoilerLevel: 0
source: author
```

脚本只引用 `termId`；AI 可提出“这里可能该链接 `bakufu`”，编译器只接受存在的 ID。展示时使用可聚焦按钮/链接与 popover/dialog，不能只靠颜色表达“可交互”。

### 6.3 推荐的 AI 编排管线

```text
作者原文 + 人物设定 + 当前场景 + 素材清单 + 演出规则
                         ↓
                 AI 输出 SceneDraft
                         ↓
       JSON Schema / 语法 / 资源引用 / 状态约束校验
                         ↓
                 引擎真实预览与截图
                         ↓
                作者逐场确认或修改
                         ↓
           固定脚本进入 Git，发布为 C 层内容
```

首版 schema 应限制枚举与预设，而不是让 AI 输出任意 CSS、像素坐标或 JavaScript。可记录 `generatedBy`、模型快照、prompt 版本与人工确认状态，方便回归测试，但不要把模型的自由文本“理由”作为运行时逻辑。

### 6.4 “酒馆式”实时玩法是另一个系统

实时 AI 需要额外处理：会话记忆、人物设定检索、状态机、内容边界、超时/重试、费用与速率、日志/隐私、模型升级回归、存档恢复和失败时的降级对白。它不应只是给静态播放器加一个 `fetch()`。

API 密钥不能放进 Astro 客户端或游戏 iframe。OpenAI 官方明确要求浏览器请求经自有后端转发，以免密钥被窃取和滥用。[API key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)

## 7. Astro 7 绿地项目现在要引入什么

### 7.1 版本基线

截至本次调研，npm 发布的稳定版为 **Astro 7.1.1**；固定 release commit 的 `packages/astro/package.json` 同时给出 `node >=22.12.0`、`npm >=9.6.5`。[Astro 7.1.1 package（固定 commit）](https://github.com/withastro/astro/blob/91c645acdedf066ccd2b4257c92b33c49dbb7729/packages/astro/package.json#L1-L4) [engines（固定 commit）](https://github.com/withastro/astro/blob/91c645acdedf066ccd2b4257c92b33c49dbb7729/packages/astro/package.json#L214-L217)

Astro 7.0 于 2026-06-22 发布，带来 Vite 8、稳定的 Rust compiler、Markdown/MDX 新管线与构建性能更新；绿地项目直接使用 7.x，不需要先建 Astro 6 再升级。[Astro 7 官方发布](https://astro.build/blog/astro-7/)

初始化前先固定 Node 版本（例如 `.nvmrc`/Volta/asdf 和 CI），官方安装文档要求 Node `v22.12.0` 以上且不支持奇数版本，并推荐 `npm create astro@latest`。[安装文档（固定 commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/install-and-setup.mdx#L267-L306)

### 7.2 第一阶段建议引入

| 能力 | 现在引入 | 原因 |
|---|---:|---|
| Astro 7.1.1 + TypeScript strict | 是 | 内容路由与类型边界 |
| Content Collections | 是 | posts、projects、characters、glossary、experiences |
| 一个 UI framework | 是，但只选一个 | 标题菜单与轻量播放器 islands；避免混用 |
| RSS、sitemap、图片优化、OG | 是 | 博客基础能力 |
| 单元测试 + Playwright 冒烟 | 是 | 路由、schema、菜单与播放器边界 |
| 完整 Galgame 引擎 npm 深度集成 | 否 | 先用独立产物/iframe PoC |
| AI SDK / 向量库 /数据库 | 否 | 实时 AI 尚未形成需求与安全边界 |
| 自研场景编辑器 | 否 | 先比较 WebGAL Craft 与 Let’sGal |

Astro Content Collections 可从 Markdown、MDX、JSON、YAML、TOML 加载内容，用 Zod 校验并生成类型，也支持 collection references；适合记录文章与叙事体验的元数据。[collections/loaders（固定 commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/guides/content-collections.mdx#L263-L274) [schema/references（固定 commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/guides/content-collections.mdx#L491-L551)

建议新增的只是**体验清单**，不是万能剧本 IR：

```ts
type ExperienceManifest = {
  id: string;
  title: string;
  kind: "guide" | "story" | "diary" | "generated" | "tavern";
  engine: "native-lite" | "webgal" | "letsgal" | "renpy-web";
  entryUrl: string;
  engineVersion: string;
  artifactVersion: string;
  saveNamespace: string;
  bridgeVersion?: 1;
  fallbackUrl?: string;       // 纯文本或普通文章
  capabilities: ("save" | "fullscreen" | "audio" | "ai")[];
};
```

### 7.3 现在就预留的接缝

- `/start/[...slug]` Astro host route。
- `ExperienceFrame`：加载、错误、全屏、退出、替代阅读入口。
- `GameBridgeV1`：`ready | progress | exit | error`，origin + schema 校验。
- 音频所有权：博客 BGM 与游戏 BGM 不同时播放；进入体验时交接、退出时恢复。
- 存档命名空间：按 `engine + experienceId + artifactVersion` 隔离；明确升级策略。
- 资源产物版本：游戏构建目录不可被下一次构建静默覆盖。
- `prefers-reduced-motion`、字幕/文本速度、音量、键盘、触屏与纯文本 fallback。
- CSP/iframe `allow` 最小化；AI 体验优先独立 origin。

## 8. 渐进路线与决策门

### Phase 0：博客框架化（现在）

- Astro 7.1.1、Node 22.12+、TypeScript strict。
- 完成 posts/projects/glossary/experiences collections。
- 建好普通文章、LOAD、EXTRA、SEO、RSS、sitemap、图片管线。
- `START` 先是可用入口页，不承诺最终引擎。

### Phase 1：原生轻量竖切

做一个 3–5 分钟迎宾：1 个角色、3 个表情、2 个背景、1 次选择、1 个词典卡、1 个粒子预设、可跳过、可退出。目标是验证站点壳、音频交接、存档命名和移动端，而不是验证完整引擎。

### Phase 2：双工具烘焙测试

用同一段 8–10 分钟故事和同一套最小素材，各做两份：

- WebGAL Terre（或 Craft）：测试脚本、Git diff、Web 导出、定制与许可流程。
- Let’sGal Studio：测试编辑效率、时间轴/分支调试、Web 输出、嵌入与升级。

按真实数据选择：制作时长、返工次数、产物大小、首屏/可玩时间、手机内存、存档、可访问性、定制成本。**不要求整个站永远只有一个引擎**；只要 `ExperienceManifest + iframe bridge` 稳定即可并存。

### Phase 3：AI 辅助编排

- 先积累人工确认的场景与 cue 规则。
- AI 只生成受限 `SceneDraft`，禁止任意代码。
- 建立 20–50 个代表性片段的 eval：表情可用性、站位连续性、背景切换、过度特效、词典漏链/错链。
- 所有发布内容仍经过人工预览确认。

### Phase 4：实时 AI Lab

单独设计服务端、预算、限流、记忆、隐私和内容策略；失败时退回确定性分支。它应是 `/start/lab/tavern/`，而不是替换作者正篇。

### 重新评估“自研完整引擎”的门槛

仅当以下条件同时出现，再考虑自研编译器/编辑器：

1. WebGAL 和 Let’sGal 都无法表达多个已明确、反复出现的核心玩法；
2. 这些缺口不是通过扩展、桥接或独立小组件能解决；
3. 已有足够作品证明需求稳定；
4. 愿意长期维护保存格式、迁移、编辑器、调试器和浏览器兼容。

否则，最划算的是自研“博客接缝、内容目录、词典、AI 编排器和验证器”，把场景执行交给成熟运行时。

## 9. 最终建议

1. **项目现在直接按 Astro 7.1.1 正常开工**，先完成博客核心。
2. **START 采用“体验大厅 + 多运行时适配”**，不要把未来押在一个巨型组件上。
3. **完整手工 Galgame 首先对比 WebGAL 与 Let’sGal Web 导出**；用户已确认 Let’sGal 制作体验更舒服，它应进入真实 PoC，而不是被理论排除。
4. **Ren’Py 用来校准 save/persistent/rollback/screen/displayable 等成熟语义**，不作为博客通用内核。
5. **AI 先做导演助理，不做无人监督导演**：受限资源 ID、结构化输出、规则校验、真实预览、人工批准。
6. **日记永远保留纯文本 canonical 版本**；Galgame 是一种呈现/改编，不是唯一可访问副本。
7. **暂不使用 `grill-me` 阻塞框架搭建**。在 Phase 2 双工具竖切完成、出现真实取舍后，再针对角色路线、作者身份、AI 自由度、日记隐私与内容边界进行一次有证据的产品访谈。

## 来源索引

- [Astro 7.0 官方发布](https://astro.build/blog/astro-7/)
- [Astro 7.1.1 package 与 Node engines（固定 commit）](https://github.com/withastro/astro/blob/91c645acdedf066ccd2b4257c92b33c49dbb7729/packages/astro/package.json)
- [Astro 安装（固定 docs commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/install-and-setup.mdx)
- [Astro Islands（固定 docs commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/concepts/islands.mdx)
- [Astro Content Collections（固定 docs commit）](https://github.com/withastro/docs/blob/0eaddbeca24fd7a45470f0701b3071f86a238b56/src/content/docs/en/guides/content-collections.mdx)
- [WebGAL 官方仓库（固定 commit）](https://github.com/OpenWebGAL/WebGAL/tree/e7f0abeb855b5b442460743bdaa9778ca751b43f)
- [WebGAL MPL-2.0（固定 commit）](https://github.com/OpenWebGAL/WebGAL/blob/e7f0abeb855b5b442460743bdaa9778ca751b43f/LICENSE)
- [Let’sGal Studio 官方页](https://avg-engine.com/)
- [Ren’Py 官方仓库（固定 commit）](https://github.com/renpy/renpy/tree/0c50d0130c90c629e9ffd0dac48309d5446c9bd0)
- [WHATWG `iframe`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element)
- [WHATWG cross-document messaging](https://html.spec.whatwg.org/multipage/web-messaging.html#crossDocumentMessages)
- [OpenAI Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/)
- [OpenAI API key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
