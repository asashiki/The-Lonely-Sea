# 图片传输与内容发现

## 无损 WebP

保留全部原 PNG，新增四张主题背景和四张六月 Claude 立绘的 WebP。使用 sharp 的 `webp({ lossless: true, effort: 6 })`，逐张解码为 RGBA 后比较，八张全部像素一致；不调整尺寸或画面。

| 资源 | PNG 字节 | WebP 字节 |
| --- | ---: | ---: |
| mist | 1,950,104 | 1,427,858 |
| day | 2,123,548 | 1,549,020 |
| night | 1,865,970 | 1,353,856 |
| crimson | 1,745,510 | 1,295,744 |
| Claude listen | 1,924,945 | 1,300,470 |
| Claude concern | 1,951,477 | 1,314,922 |
| Claude encourage | 1,974,663 | 1,332,660 |
| Claude goodnight | 1,851,416 | 1,237,890 |
| 合计 | 15,387,633 | 10,812,420 |

这些资源全部读取一遍时少传输 4,575,213 字节，减少 29.73%。这不是整站加载耗时或所有资源的缩减比例。默认 mist 单图少传输 522,246 字节。六月图仍在进入对应场景时加载。

首页预载、主题样式、主题配置、文章默认封面、六月立绘路径同步指向 WebP。原始 PNG 不删除，外部既有链接仍有效。游戏发布包保持只读，不重编码其中资源。

## AI 与搜索发现

- `/llms.txt`：欢迎 AI 代读者来访，解释 Galgame 导航与文章直接链接；列出已发布文章，不列出草稿。
- `/sitemap.xml`：由文章集合生成规范 URL 与实际文章日期，包含首页、文章存档和通讯页。
- `/robots.txt`：允许公开页面抓取，排除重复的文章内部片段，声明 sitemap。
- 复用现有 `/rss.xml`，不创建另一套订阅源。
- 首页与共用布局提供 llms、sitemap 发现链接、Open Graph 与 JSON-LD；文章原位切换同步元数据，避免下一篇还显示上一篇的信息。

文章本来就输出服务端 HTML，因此不需要 AI 运行游戏界面即可读取正文。这里没有伪装成 AI 的特殊页面，也不宣称 llms.txt 能提高排名或保证被任何模型采纳。

参考：[llms.txt 提案](https://llmstxt.org/)、[Google sitemap 文档](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)。

## 验证

本地四个发现端点均返回 HTTP 200 和正确 Content-Type；八张 WebP 均可读取。Playwright 检查首页 JSON-LD、发现链接和文章切换后的规范 URL 元数据。Astro 检查无错误；原有音频未使用函数提示不属于此改动。
