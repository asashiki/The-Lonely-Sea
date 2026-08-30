---
title: Markdown 阅读样式测试
slug: preview/markdown-components
published: 2026-08-30
description: 用于集中检查 PAGE 的 Markdown 被动阅读样式
tags: [preview, markdown]
category: 样式测试
draft: true
lang: zh-CN
---

这篇草稿不会进入正式文章列表，只用于确认正文里各种元素放在一起时是否协调。

## 基础文字

普通正文包含 **强调文字**、*斜体文字*、~~删除内容~~、`行内代码`，以及一个[站内链接](/)和一个[站外链接](https://example.com)。

> 引用应该像文章中的一段留白，而不是额外塞进来的网页卡片。

### 列表

- 第一项无序内容
- 第二项无序内容
  - 一项缩进内容

1. 第一项有序内容
2. 第二项有序内容

## 代码与数据

```ts
type ReadingState = {
  article: string;
  affection: number;
};

export function finishReading(state: ReadingState) {
  return { ...state, affection: 100 };
}
```

| 状态 | 表现 | 数值 |
| --- | --- | ---: |
| 初见 | 心形较小、颜色克制 | 0% |
| 熟悉 | 心形逐渐填充 | 50% |
| 读完 | 好感度完整点亮 | 100% |

## 图片与折叠内容

![灯塔场景](/assets/lonely-sea/day.png)

<details>
  <summary>展开补充内容</summary>
  <p>不打断正文，需要时再查看。</p>
</details>

---

测试文章结束。
