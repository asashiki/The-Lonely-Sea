# Anna 人物画风：可核来源与缺口

日期：2026-09-06。仅研究，不生图、不改运行剧本。

## 结论

本轮未找到同时满足“明智安娜 / 名侦探光之美少女、NovelAI V5、作者公开完整提示词及作品”的可靠实例。不能声称已找到经过验证的 Anna 画师串，也不能把网上一张好看的作品倒推成它的生成配方。

可直接使用的研究依据是一个作者公开的 V5 画师对照实验，以及官方 V5 标签、权重和默认质量标签说明。它们支持有控制地选画风，不保证某个串在 Anna 上必然好看。

## 1. 作者自己的 V5 画师对照实验

[Carlyone：I tested 1,900 artist tags in NAI Diffusion V5 using the same prompt and seed](https://www.reddit.com/r/NovelAi/comments/1vuuvvs/i_tested_1900_artist_tags_in_nai_diffusion_v5/)

作者明确公开：V5 Full、28 步、Guidance 4、Quality Tags 开、UC Heavy、seed 2138582679；每张只更换 artist 标签。其人物提示是面向观众、完整着装的 girl，主体构图为 cowboy shot。原帖含完整测试 prompt。

作者自己的图集链接是 [nax.moe 的 V5 画师实验](https://nax.moe/?gallery=danbooru-artist-tags-2-v5)。本次工具未能打开图集，故没有目测比较图集里的具体画师结果。原帖可读，参数与实验方法可核；不能声称已选出最佳画师。

本项目可借鉴其“固定角色、姿势、seed、参数，只比较画风”的方法，但不要照搬原帖人体排除词到未成年角色提示里。本轮没有复制这套测试 prompt 进行生成。

## 2. 官方 V5 风格 / 复杂度标签

[NovelAI Tags 官方文档](https://docs.novelai.net/en/image/tags/)

V5 提供 low / medium / high / ultra complexity，官方没有把 ultra 定义为永远最好；复杂度要配合风格。也支持 visual novel art、visual novel cg、visual novel chibi、visual novel sprite 等专用标签。

对当前任务的推论：人物纯底色插画和 Q 版反应格没有必要堆写实场景细节或默认 ultra；普通人物与 Q 版可以作为同一设计的两个表现层。但具体组合仍需样张确认。

## 3. 官方权重语法

[Strengthening & Weakening 官方文档](https://docs.novelai.net/en/image/strengthening-weakening/)

V4 及以后支持 `1.2::tag::` 数值权重；关闭标记 `::` 结束加权段。0 到 1 为减弱。不是随意套用其他生图工具的冒号括号语法。

官方此页解释语法，不提供“某两个画师必然适合 Anna”的配方。搜索到的社区关于标签前后位置的说法互相不一致，本轮不将其当成 V5 的确定规则。

## 4. 官方默认质量标签

[Add Quality Tags Toggle 官方文档](https://docs.novelai.net/en/image/qualitytags/)

V5 Standard 会自动在末尾补上 `very aesthetic, masterpiece, no text`；Light 补上 `very aesthetic, amazing quality, no text`。写 prompt 时应知道当前开关，避免把自动追加的效果与画师标签效果混淆。

## X 搜索缺口

检索了“明智あんな NovelAI プロンプト”“akechi anna NovelAI prompt”“名探偵プリキュア NovelAI 画風”等组合。出现的 X 二手索引证明有人发布相关生成图，但未核到 Anna 原作者的完整配方，部分结果是其他角色或精密参考操作说明。没有将这些当作成功画师串来源。

这不代表 X 上没有好作品，而是本次公开检索没有得到足够证据。下一步若从用户已登录的 Grok / X 找到具体喜欢的公开作品，应先以画面作为审美参考；只有作者明确给出 prompt 或原始元数据，才把它标为已验证配方。
