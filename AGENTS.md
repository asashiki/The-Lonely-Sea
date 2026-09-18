## Agent skills

## 用户明确的设计禁用规则（2026-09-17）

- 禁止用选中项任意一侧的彩色/深色竖线、横线、描边强调条表示状态；不得把左边线改放到右边、上边或下边来规避要求。也不要换成菱形、圆点等附加标记。
- 不接受通用卡片、色边按钮、毛玻璃与两端渐隐作为 Galgame UI 的默认方案。不要把撤掉装饰说成完整的新设计。
- 保持用户已确定的 SYSTEM / BLOG / GAME 信息分类。新增总音量只在 SYSTEM 原声音设置里增加一项；游戏 BGM 与角色语音仍在 GAME，不得擅自集中、复制或搬迁。
- 保留已认可的顶部导航。视觉修改先给具体效果供判断，未确定前仅做明确要求的修正，不反复切换旧方案。
- 新增剧情台词需经用户指定 Gemini 生成/审校；有现成 MiniMax 配音流程时，补台词应同时补对应音频，不无故留下一句无声台词。

### Issue tracker

Issues and PRDs are tracked as GitHub issues; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical labels with their default names. See `docs/agents/triage-labels.md`.

### Domain docs

Use a single-context layout with root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
