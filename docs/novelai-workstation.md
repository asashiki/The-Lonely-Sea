# NovelAI 演出素材工作站

本项目已在 `.codex/config.toml` 注册本地 `novelai` MCP server。配置读取后，Codex 可使用：

- `novelai_generate_image`：用户明确确认后一次生成一张，输出到 `public/assets/novelai-generated/`；
- `novelai_extract_metadata`：从原始 PNG 读取 prompt、负面 prompt、seed 和参数；
- `novelai_suggest_tags`：只查 NovelAI 标签建议，不生图。

调用约束：先说明场景意图、prompt、negative prompt、用途和参数，得到用户明确确认后再生成；不要每句对白生成图片，不要后台批量或自动重试。`background` 用于场景切换/建立镜头，`chibi` 用于明确的可爱或搞笑反应，`comic` 只用于明确的漫画式动作。对白文字由游戏 UI 叠加，不把长台词交给图片模型。

角色固定词条见 `C:\Users\Hey\Downloads\长期\novelai\novelai_codex_bridge\README.md` 与个人沉淀页。角色 Prompt 只写外貌，不把画风、Q版或构图写进角色卡；明智あんな分普通/キュアアンサー两个变体，Claude 妈妈是原创外貌概念，Alice 已有固定词条。

安全：token 只从 `NOVELAI_TOKEN` 环境变量读取，不写进仓库、配置、日志或剧情文件。优先保存 NovelAI 下载得到的原始 PNG，以便之后恢复元数据。
