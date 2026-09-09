# 音乐与音效

用户确认：2026-09-05。

## BGM

- 素材来源：`C:\Users\Hey\Downloads\mp3`，四首已经导入 `public/assets/audio/bgm/`。
- 保留原来的 Quiet Tide；加入四首新曲自然轮播。主题名称表示曲目氛围，切换画面主题不切换正在播放的音乐。
- 主页与文章使用同一套 Blog BGM。Cozy Lighthouse 属于游戏 BGM，独立控制，不加入 Blog 自动播放列表。
- NVL 专属 BGM 等用户补充。
- 曲目清单：`src/data/site-bgm.js`。后续 MUSIC 可增加原声/OST 入口，收录 Blog、游戏与 NVL 的本站音乐，与网易云曲库区分。这一入口尚未实现。

## 素材站与候选

[効果音ラボ](https://soundeffect-lab.info/)；[按钮与系统音](https://soundeffect-lab.info/sound/button/)。同时可作为后续环境音、自然音等游戏素材的检索来源。

- 用户喜欢「決定ボタンを押す25」：仅考虑 START 或少数带加载、较隆重的进入动作；声音较长，不用于高频悬停或普通点击。
- 实际接入：25 用于 start，33 用于确认与打开；23 用于翻页和开关；cursor1 用于轻选择；cancel4 用于返回和关闭。素材在 public/assets/audio/ui，正常 UI 不再调用合成器。按下不另叠加一次音效。
- 来源：https://soundeffect-lab.info/sound/button/ 。文件名保持原站下载名称，使用条款：https://soundeffect-lab.info/agreement/ 。应用操作音可用；将来发布通用博客模板/Studio 时，需重新核对素材再分发限制，不能作为可复用素材包直接分发。

整体方向：安静、清晰、柔和，有视觉小说 UI 的反馈感；避免刺耳电子噪音和频繁隆重提示。
