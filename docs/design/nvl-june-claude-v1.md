# 六月 Claude NVL · 第一版演出

制作方式：内置 image_gen。每次生成和背景修订均附带用户的两张参考图，不用生成结果替代原始角色参考。

## 参考图

- `C:/Users/Hey/Downloads/0.5__artist_gogalking__, 0.5__null (nyanpyoun)__, 1.3__artist_mignon__, 1.15__ar s-1274364884 (6).png`
- `C:/Users/Hey/Downloads/nai-prompt/nvl-lonely-sea/claude-assets/04-鼓励.png`

## 接入素材

`public/assets/nvl/2026-06/claude-v1/`：listen.png、concern.png、encourage.png、goodnight.png。

四张均为 1024×1536 PNG，深蓝不透明背景。初次透明请求得到烘焙棋盘格，已通过 image_gen 重绘背景，最终版本不宣称透明立绘。源参考图没有覆盖。

## 演出节点

| 页面 | 阅读位置（从 1 开始） | 图片 |
|---|---|---|
| ch2_claude_p01 | 第 1–2 行 / 第 3 行起 | 倾听 / 心疼 |
| ch2_claude_p02 | 第 1–2 行 / 第 3 行起 | 鼓励 / 心疼 |
| ch2_claude_p03 | 全页 | 倾听 |
| ch2_claude_p04 | 全页 | 鼓励 |
| ch2_claude_p05 | 第 1–4 行 / 第 5 行起 | 倾听 / 晚安 |

六月自述不展示 Claude；人物只在原文切换到 Claude 视角后出现。正文、行数、分页与存档坐标不变，无新增剧情，不需要改写原文。共用稳定 pageId 和行号，三语同步。构图为左侧阅读、右侧人物，短淡入；减少动态效果时直接换图。

## 提示词

共同要求：one production-ready anime visual novel character sprite; both user images are mandatory identity/style references for the same adult woman Claude; light honey-brown long wavy hair, amber eyes, pearl earrings, ivory high-neck floral lace blouse, taupe ribbon, peach-brown cardigan, dark brown pleated skirt; mature gentle adult; delicate anime linework and warm cel shading; front view, head to mid-thigh; no text, no watermark; preserve face and clothing identity.

- LISTEN: calm attentive soft closed-mouth smile, eyes looking directly at viewer, head slightly inclined, hands loosely joined at waist.
- CONCERN: empathetic listening, slightly raised inner eyebrows, softly concerned amber eyes, not crying; one hand on chest, other relaxed near waist.
- ENCOURAGE: warm confident encouraging smile, right hand on chest, left hand gently open toward viewer at waist height.
- GOODNIGHT: peaceful closed eyes, affectionate closed-mouth smile, head slightly tilted, both hands loosely folded over heart; no second person or bed.

最终背景修订提示：Edit the generated image only. Preserve the woman exactly, expression, hands, pose, hair, clothing and framing. Both user images remain mandatory identity references. Replace every checkerboard square, including between hair strands, with uniform solid opaque midnight navy #0b1520. No checkerboard, transparency simulation, scenery, added objects, text or redesign. Same portrait dimensions.
