# NVL 演出效果与素材边界（Ren’Py 官方文档核验）

只核对 Ren’Py 能力，不确认《月姬》成片实现；未提供原视频，不能由观感反推素材结构。

## 不必新增插画的效果

- **裁切、移动、缩放、矩形 iris、推入/擦除**：可用 `CropMove` 等内置 transition，作用于已有画面，无需新插画。
- **淡入淡出、纯色闪白/黑、dissolve、像素化**：`Fade` 可指定纯色；3–5 帧切换可由脚本和短 transition 实现。
- **NVL 排版**：窗口、背景、文字位置/间距由 NVL screen/GUI 控制，不等于新增立绘。

## 需要素材或明确边界的效果

- **LayeredImage 多层角色**：部件/姿态通常是独立 image，再由属性组合；真正不同的姿态需对应图层素材，不会由一张完整立绘自动生成。
- **图像控制遮罩溶解**：`ImageDissolve(image, ...)` 需要 control image；特殊遮罩若属此类需控制图，普通 wipe/iris 不必。
- **径向模糊**：三篇文档未列为内置 transition，也未证明是否需控制图；应视为需自定义 shader/transform 的待验证项，不能凭成片判断。

## 原始来源

1. [Ren’Py Transitions](https://www.renpy.org/doc/html/transitions.html)
2. [Ren’Py Layered Images](https://www.renpy.org/doc/html/layeredimage.html)
3. [Ren’Py NVL-Mode Tutorial](https://www.renpy.org/doc/html/nvl_mode.html)
