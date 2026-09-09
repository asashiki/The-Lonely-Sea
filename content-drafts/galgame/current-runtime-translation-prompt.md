# 当前 Galgame 英文补译任务

工作目录仅限：
`C:\Users\Hey\.codex\worktrees\70e5\The-Lonely-Sea`

现有英文交付稿基于旧版 0.2.0，共 37 句；当前运行版有 139 句，台词 ID 不同。请不要再以旧版 scene/ 或 dialogue-draft-v2.md 作为翻译源。

唯一运行文本源（只读）：
`public\games\lonely-sea-chapter-one\0.3.0-4830749c\story-ir.json`

请先读取该文件的 scenes、characters；以 dialogue block 的 localizedText.zh-CN / ja-JP 和 text 为上下文，提供自然的英文翻译。覆盖全部 dialogue block 及 choice 选项，保留原 scene.id、block.id、option.id，不合并或增加台词，不改人物、演出、跳转、语音或资源引用。不生成 TTS。不要修改运行游戏包或停止服务。

输出至：
`content-drafts\galgame\lonely-sea-prologue-0.3.0.en-US.json`

结构为：
```json
{
  "sourceRelease": "0.3.0-4830749c",
  "language": "en-US",
  "scenes": {
    "原scene.id": {
      "dialogues": {
        "原block.id": { "text": "英文译文" }
      },
      "choices": {
        "原choice block.id": {
          "原option.id": "英文选项"
        }
      }
    }
  }
}
```

如实际选项结构或标识不同，先报告，不自造 ID。完成后核对 139 个 dialogue block 全部覆盖，报告遗漏或事实疑问，并给出交付文件完整路径。接入由 Codex 完成。
