# 孤独之海 · 第一章：灯塔导览

Gal Blog Game Studio 正式运行包。

## 本地运行

解压后在本目录启动静态服务器，例如 `python -m http.server 8000`，再打开 `http://localhost:8000/`。不承诺通过 `file://` 直接运行。

## 部署到《孤独之海》

把本目录完整放到 `public/games/lonely-sea-chapter-one/0.2.0-0cc652e9/`，并在 Blog 的 release registry 登记 slug、releaseId 与目录。允许宿主：http://127.0.0.1:4321、http://localhost:4321。

## 可编辑内容

- `game/scene/*.txt`：可读 WebGAL 剧本
- `game/userStyleSheet.css`：游戏样式
- `game/template/`：WebGAL template
- `game/extensions/entry.js`：可信作者扩展
- 素材目录：普通静态文件

手工修改后，现有 releaseId 与 integrity 会失效。请回到 Studio 重新导出为新 release，不要覆盖已发布版本。公开运行包不含 Story IR；工程备份请在 Studio 单独导出。
