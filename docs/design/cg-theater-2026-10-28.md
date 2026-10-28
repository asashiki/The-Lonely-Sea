# CG 鉴赏与继续读取 · 2026-10-28

这一轮延续视觉小说的鉴赏室和标题画面。用户给了 kiseki.blog 作为完成度参照，并明确要求保持自己的 Galgame 方向，不模仿布局。实际查看的参考首页使用大幅背景、社交/活动小组件；本轮把精力放在现有美术的呈现和返回阅读时的连续感。

## 已实现

- CG 展开为完整画面区域，深色留白承载操作，图片保持比例、不裁掉原图。全屏指覆盖站点可用画布，不强制调用浏览器 Fullscreen API。
- 顶部返回 / 索引 / 纯画面；底部编号和画面名；按需展开横向缩略索引。纯画面保留低干扰的“显示操作”入口。没有自动轮播。
- ← / → 切图，Home / End 首尾，I 索引，H 纯画面，Esc 先恢复操作再返回。关闭恢复原按钮焦点，背景控件隔离，Tab 留在鉴赏室内。
- 先解码再换图；快速切换以最后一次选择为准；失败保留上一张并提供重试。只把成功展示的图计入已有鉴赏记录。
- 20 张现有 CG 增加中英日视觉描述名。这些是图库标签，不增加剧情台词或声音。
- 缩略图用一张 118,886 字节的 WebP 合图，展开索引时才请求。原始 CG 保持不变。重建：`node scripts/build-cg-index.mjs`。
- 标题页 CONTINUE 增加真实最近记录的封面、标题、日期和 NVL 页码 / 游戏槽位。无记录时不显示。跨页返回及另一标签页更新存档时刷新。预览仅使用站内资源或既有 WebP 存档缩略图，不请求存档中任意外部图片 URL。
- 不新增运行依赖、持续动画循环或外部服务。遵循系统与站内 reduced-motion。

## 设计预览

`prototypes/cg-theater-preview.html` 可单独打开，嵌入三张缩小后的现有 CG，并复用生产组件的标记、控制器和样式。它是交互设计样本，不替代整站验收。重建：`node scripts/build-cg-preview.mjs`。

## 验证与限制

- Astro 构建和静态检查。
- `node scripts/check-cg-theater.mjs`：实际生成 DOM + 真实控制器，模拟图像解码的先后顺序和失败；验证锁定图、键盘焦点、纯画面退出、恢复焦点、减少动态效果和继续记录展示。
- 既有 `pnpm test:communication` 回归。
- 当前云浏览器无法连接工程本地服务；线上 asashiki.com 的研究请求返回 502。没有完成真实浏览器的截图、手机横竖屏和四场景视觉验收，不能把 DOM 测试当作视觉验收。

实现依据：[MDN Image.decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)、[MDN inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)。使用的是成熟的原生能力，不将它们宣传为今年新发布的特性。
