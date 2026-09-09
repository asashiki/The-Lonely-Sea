# 四月 NVL：首版 CG 分镜与生成单

> 已废止的首轮提案：用户否定了完整写实场景优先的方向。后续以 `nvl-april-character-direction.md` 为准。下文的“未生成”是当时记录：后来试生了图片，但未接入游戏、未获验收；不要照下文继续生成。

状态：分镜提案，尚未生成或接入。2026-09-06 官方标签接口返回 Cloudflare 403 / Error 1010，当前客户端签名被拒绝；不据此判断 token 无效。不自动重试或绕过限制。

正文源：`content-drafts/nvl/2026-04.{zh-CN,ja-JP,en-US}.json`。不改变任何台词、分页或 pageId。共 14 页：前 10 页自述，后 4 页安娜视角。

## 演出逻辑

前半不是动作故事，不把每项技术名词画成一张 CG。镜头沿“灰暗卧室 → 找到秩序的终端 → 深夜投入 → 通勤与崩溃 → 另一端亮着灯的事务所”推进。前半不画作者的脸，不虚构他的外貌。后半安娜是完整事件 CG 内的人物，不加独立立绘。

首轮 7 张：先验收卧室和事务所两个风格样张，再逐张补齐。暂不加入 Q 版：本篇主要情绪是压力与鼓励，现有内容没有必须插入漫画的笑点。花丸作为轻微收束即可，不另写剧情。

| 页 / 触发句（从 1 计数） | 图片 | 镜头 / 衔接 |
|---|---|---|
| self_p01 第1句 | 01-bedroom | 床沿低机位，全景；进入后静止。 |
| self_p02 | 01-bedroom 复用 | 保持空间，明度略降；不随每段独白换图。 |
| self_p03 第1句 | 02-day-desk | 300ms 淡切至桌前；到终端出现时仅缓慢推近约3%，不晃动文字。 |
| self_p04 | 02-day-desk 复用 | 同镜头，略恢复亮度。 |
| self_p05–06 | 03-night-desk | 时间跳转时450ms淡切；细节承接网络/手环/部署，不画技术图表。 |
| self_p07 | 03-night-desk 复用 | 镜头轻靠向桌上的手机与手环；不给读者整屏心电动画。 |
| self_p08 第3句 | 04-commute | 200ms 切到手机与车厢；前两句先沿用旧镜头，避免提前进入地铁。 |
| self_p09 第3句 | 03-night-desk 复用 | “晚上回到房间”再切回；之前保持冷色环境。 |
| self_p10 | 03-night-desk 复用 | 降低环境亮度与饱和度，不闪红、不震屏；最后一句仍停在现实这一侧。 |
| anna_p01 第1句 | 05-anna-office | 视点切换后暖光事务所；她在画面右侧，左侧留给 NVL 文本。 |
| anna_p02 | 05-anna-office 复用 | 不把回忆再逐张闪回，安娜与显示器留在同一空间。 |
| anna_p03 第1句 | 06-anna-answer | 中近景，坚定而非训斥；300ms短淡切，不移动文字区。 |
| anna_p04 第4句 | 07-tea | 到“沙发 / 热红茶”才切茶桌，前3句沿用安娜；最后停在暖光空景。 |

上表省略的 pageId 前缀都是 `ch1_`。图片视线与构图不追随浏览器宽度随机变化。16:9 主画幅，中心安全区兼顾稍窄桌面窗口；不为本次任务重做手机 UI。

## 提示词构成

每张正面 = 用途标签 + 下面的统一画风 + 镜头正文。环境用 `visual novel bg`，安娜事件图用 `visual novel cg`；这是官方 tag 文档列出的用途词，不代表样张已验收。角色镜头再加入单独的身份标签。提示词不包含原日记、私人日志、API key 或需要模型画出的界面文字。

统一画风（试样，尚未验证）：

```text
anime visual novel background illustration, hand-painted environment, delicate clean linework, soft cel shading, natural perspective, restrained color palette, atmospheric lighting, cinematic composition, detailed but quiet, landscape
```

统一负面（试样）：

```text
text, watermark, logo, signature, speech bubble, comic panel, collage, split screen, photorealistic, 3d, fisheye, extreme perspective, oversaturated, blurry, low quality
```

环境镜头补 `no humans`，人物镜头不加。不是把所有画面压成同一种色：现实前半灰蓝，终端柔和冷绿，事务所暖琥珀，保留相同线条与上色方式。

### 01-bedroom

```text
no humans, small lived-in rented bedroom on an overcast morning, low viewpoint from the edge of an unmade bed, rumpled blue-gray blanket in the foreground, a smartphone face down and folded eyeglasses on a bedside table, thin pale daylight through a narrow gap in curtains, quiet dim interior, modest contemporary furniture, muted gray-blue colors, empty breathing space across the middle of the composition
```

### 02-day-desk

```text
no humans, small rented room in the afternoon, eye-level view of a modest wooden desk, an older silver tablet computer with a kickstand and detachable dark keyboard, the screen showing a dark terminal with a tiny soft green cursor and no readable writing, a notebook and plain ceramic mug beside it, cool daylight from a side window, restrained green screen glow, believable ordinary workspace, quiet orderly framing
```

### 03-night-desk

```text
no humans, night in a small rented room, close view of a modest wooden desk, an older silver tablet computer with kickstand and dark detachable keyboard, dim abstract terminal light on the screen without readable text, a smartphone and a dark fitness wristband resting beside a notebook, deep blue room, a small warm desk lamp, quiet pools of green and amber light, subdued shadows, intimate ordinary workspace
```

### 04-commute

```text
first-person view inside a crowded commuter subway in the morning, one hand holding a smartphone in the foreground, an abstract dark terminal on its screen without readable letters, commuters seen as indistinct clothed shoulders and silhouettes, metal handrails and cool window light, shallow depth of field, muted blue-gray palette, a narrow private space inside a crowded carriage, realistic hand anatomy, restrained composition
```

### 05-anna-office

身份候选来自已有工作站：`akechi_anna, meitantei_precure!`。尚未通过官方 suggest-tags 验证；不能把本地记录当成模型识别成功。采用普通服装，不混用 Cure Answer 变身标签；具体发色、服饰以官方人设与实际样张核对，不能仅凭旧 README 的描述锁死。

```text
1girl, solo, akechi_anna, meitantei_precure!, cheerful young detective standing on a sturdy chair behind a desk, hands on hips, confident lively smile, modest detective office at night, manuscript pages, a magnifying glass, a teacup and two softly glowing monitors, full scene illustration, girl composed on the right third, warm desk lamp against cool night windows, uncluttered darker space on the left, wholesome, fully clothed
```

### 06-anna-answer

```text
1girl, solo, akechi_anna, meitantei_precure!, medium close shot in a warmly lit detective office, leaning slightly forward with a determined encouraging smile, one hand raised with index finger pointing upward, earnest friendly expression, looking toward the viewer, girl on the right third, softly painted desk and books in the background, restrained amber light, wholesome, fully clothed
```

### 07-tea

```text
no humans, close view of a steaming cup of black tea on a small wooden table beside a comfortable sofa in a quiet detective office at night, an open notebook and a simple flower-shaped red approval stamp mark without letters, soft amber lamp light, cool blue window in the distance, gentle welcoming atmosphere, detailed hand-painted still life, peaceful understated composition
```

## 首轮参数与验收

- 候选模型 `nai-diffusion-5-full`；当前免费额度规则见 `novelai-nvl-api-notes.md`，不假定 Opus 无限。
- 拟用 1344×768，单图，28 steps，CFG 5，`k_euler_ancestral`；采样器/噪声参数依官方模型支持与首次请求验证，现有桥接默认值不是官方保证。
- 每张独立 seed 并保存原始 PNG 和参数；相同 seed 不能保证不同镜头的角色一致。
- 先检查角色是否正确、手部、服装、空间、无乱码和可读安全区，再入库。禁止先铺满游戏再说以后修。
- 三语言共用独立演出表，按 pageId + 行序号触发，不能按中文字符数触发。
- 加载目标图成功后才淡入，旧图保留到新图可显示；过渡仅 opacity，推近仅 transform。不添加整页模糊或常驻粒子。
- 返回、读档、换语言直接恢复该句镜头最终状态；异步图片不得在玩家前进后反向覆盖。背景图加载失败仍可继续阅读。

## 下一步

先恢复官方允许的调用通路。当前没有生成任何图，也没有修改 NVL 播放器或剧情。通路恢复后从 01 与 05 两张开始验证，再完成其余镜头和实际页面验收。
