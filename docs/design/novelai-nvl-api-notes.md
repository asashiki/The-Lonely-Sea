# NovelAI NVL CG API 调研

核查日期：2026-09-06。仅检索官方资料与公开前端；本调研没有使用账号、提交生成或消耗 Anlas。

## 已核实的接口与模型

- 官方图像 API 仍为 `https://image.novelai.net`。Swagger 的当前定义为 [doc.json](https://image.novelai.net/docs/doc.json)，[可视文档](https://image.novelai.net/docs/index.html)。
- `POST /ai/generate-image` 接收 `action,input,model,parameters`。默认返回 ZIP；请求 `Accept: application/json` 时可返回 base64 图像数组，成功状态为 201。认证头为 `Authorization`。官方公开前端使用 `Bearer ` 加令牌。
- `GET /ai/generate-image/suggest-tags` 参数为 `model`、`prompt`，可选 `lang=en` 或 `lang=jp`。tag 建议不是识别率或角色正确性的保证。
- 官方模型介绍确认 [V5 Full / V5 Curated](https://docs.novelai.net/en/image/models/) 已发布。Swagger 的 model 字段只标 string，没有枚举；准确 ID 来自 [官方当前前端 bundle](https://novelai.net/_next/static/chunks/pages/_app-e266d6454d48c92a.js)：`nai-diffusion-5-full`、`nai-diffusion-5-curated`。这是前端常量核实，不是账号生成成功验证。
- 官方定义仍使用 `v4_prompt` / `v4_negative_prompt` 字段；其中结构为 `caption: {base_caption, char_captions:[{char_caption,centers:[{x,y}]}]}, use_coords, use_order`。不能因名称旧就擅自换成 v5_prompt。
- 常规参数字段有 `width,height,steps,scale,seed,sampler,noise_schedule,n_samples,negative_prompt,params_version`。Swagger 未给所有取值与默认值，不应把自行拼出的请求称为“官方完整示例”。
- 官方 API 描述要求生成由用户动作发起，不得自动造成过量负载。遇到访问控制错误应停止，不以伪装浏览器或换身份绕过。

主任务反馈：普通 Python tag 查询返回 Cloudflare 403 / Error 1010 `browser_signature_banned`。这不是模型 ID 不存在的证据，也不是余额问题的证据。尚无成功生成请求；后续应走官方支持入口或让用户联系服务方，不能称 API 已调通。

## Opus 不是 V5 无限生成

当前 [订阅说明](https://docs.novelai.net/en/subscription/) 与 [官方变更公告](https://blog.novelai.net/subscription-updates-usage-limits-2025-88a208d5d9c5) 均说明：V5 正常尺寸、至多 28 步的免费生成消耗自动恢复的 usage allowance；耗尽后会消费 Anlas。V4.5 及更早模型在符合条件时仍无限。官方公告称完全恢复约一周；具体账户剩余额度本次未查询。不能按用户“最高会员无限”推定 V5 可无上限批量重试。

## 对这次分镜有用的官方能力

[V5 发布说明](https://journal.novelai.net/image-generation-novelai-diffusion-v5-is-here-c2df7c6b8d2d/) 支持英文/日文自然语言与 tag 混合提示，支持多格漫画和自由角色定位。发布时 Precise Reference / Vibe Transfer 尚未随 V5 上线，因此不要直接承诺 V5 参考图一致性功能可用。应核对当前网页能力再定。

[官方 tag 文档](https://docs.novelai.net/en/image/tags/) 有 `visual novel art`、`visual novel bg`、`visual novel cg`、`visual novel chibi`。`high complexity` 适合一般复杂场景，`low complexity` 可用于风格化画面；不是所有图片越复杂越好。

[质量标签](https://docs.novelai.net/en/image/qualitytags/) 的 V5 Light 追加 `very aesthetic, amazing quality, no text`，Standard 追加 `very aesthetic, masterpiece, no text`。本项目三语共用 CG，因此不把日记文字烘焙进图片。

[步数与 guidance](https://docs.novelai.net/en/image/stepsguidance/) 建议 V3 以上 guidance 约 5–6；这只是试片起点，不保证本片最佳。

## 明智あんな的身份与外观核实边界

[东映官方角色页](https://www.toei-anim.co.jp/tv/precure/character/?character=3) 确认：明智あんな / Cure Answer，14 岁中学二年级，2027 年来到 1999 年；与小林みくる在キュアット探偵事務所生活。用于本次画面时应保持非性感化、正常衣着，不混入变身战斗服，除非实际场景要求。

角色页提供普通服/变身视觉切换。其 HTML 链出的普通服组为 `https://precure-web.com/star-detective/assets/img/character/img_chara-main01-B1.webp`（B2/B3 同组）；变身组为 A1/A2/A3。此次网页图片解析未成功，因此不把具体衣服颜色、发饰样式编成“已看过官方图”的事实。应在正式角色试片前由浏览器看到官方普通服图再锁定描述。

`akechi anna` / `meitantei precure!` 只是待 tag 查询验证的候选，不是本调研已验证的 NovelAI 训练标签；角色名字能搜到不等于生成服装必然正确。
