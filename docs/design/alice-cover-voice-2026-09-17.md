# 爱丽丝封面出处配音补齐

- 新不可变发布：`0.3.0-7be69beb`，原 `0.3.0-19dbb930` 和 `0.3.0-4830749c` 保留供旧存档使用。
- 台词未改动；使用已有 Gemini 日语译文「今の私のこの姿は、『アリス2010』のパッケージのものなんですよ。」。
- 沿用整部序章的日语配音策略：MiniMax `speech-2.8-hd`、已有 Mai 音色、gentle（speed 0.94、pitch 0、vol 1）；32kHz 单声道 MP3。凭证仅从环境读取。
- 音频 110004 字节、6.710594 秒；复用 studio 原音频包络及日语口型分析，生成 42 个口型片段并开启 mouthSync。
- 可复现入口：`node scripts/package-alice-cover-voice.mjs`，需要 MiniMax 环境凭证、ffmpeg、原 studio 源码；已存在发布拒绝覆盖。本地生成缓存位于 `tmp/alice-cover-voice`。
- choices 移除边线、选中菱形和移动效果，保持无渐隐的清晰背景，仅用文字亮度和字重表示 hover/focus/active。
- 验证：230 个文件字节数及 SHA-256 全通过；浏览器真实音频解码时长正确，口型数据存在；`check-september-game-polish.mjs` 通过（文章 READ 残留、选项无边、SAVE/LOAD 音效、出处三语文本）。
