# 复现顺序

## 第一步：生成灰雾母版

使用 `01-mist-master.txt`，按以下顺序传入三张参考图：

1. `02-reference-images/used/01-primary-grey-watercolor__0d1f74e5-f1ea-435e-a801-c7a87823fbc1.png`
2. `02-reference-images/used/02-wide-negative-space__8fb6cc05-6f0d-445c-813b-e5f22bc73b2a.png`
3. `02-reference-images/used/03-quiet-shoreline__3879517842980862.png`

把得到的满意版本保存为母版。原流程中的母版见：

`03-intermediate-images/01-master-mist-used-for-edits.png`

## 第二步：从同一母版派生三种状态

每次编辑都必须把母版放在输入 1，把对应的色彩氛围图放在输入 2：

| 状态 | 提示词 | 输入 2 |
| --- | --- | --- |
| 晴天 | `02-day-edit.txt` | `04-sunny-palette__74d0f069-029f-4ecb-b927-2aeb91ff9088.png` |
| 暗夜 | `03-night-edit.txt` | `05-night-palette__8343117842981502.png` |
| 黑血红深夜 | `04-crimson-edit.txt` | `06-crimson-palette__6834217842981182.png` |

## 验收标准

- 仍然是同一机位和海岸线，而不是“画风相似的另一处海滩”。
- 地平线高度、波浪走向、左侧空舞台和右侧低对比菜单区基本稳定。
- 手绘水彩、纸张颗粒和简化轮廓仍在，不能变成摄影、3D 或高光油亮的概念图。
- 不出现参考图中的人物、文字、标志、前景道具或水印。
- 不把雪、雨、粒子烘焙进背景；这些由网页运行时实现。

## 新增第五种状态的模板

沿用任意编辑提示词，只替换：

- 状态名称；
- 输入 2 的色彩参考；
- “Change only”段落中的天气、时间与配色；
- 与新参考图有关的“不要复制”对象。

不要删除锁定母版构图、负空间和手绘媒介的段落。
