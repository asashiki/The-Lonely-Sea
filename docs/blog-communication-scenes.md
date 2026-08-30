# Blog 通讯场景

RSS、留言与友链由 Blog 宿主维护，不属于 WebGAL 剧情或 Studio 导出资源。独立入口为 `/connect/`，START 的 `CONNECT` 会进入该页面。

## 三项真实行为

- `rss`：读取真实文章列表，复制 `https://asashiki.com/rss.xml`，也可直接查看 XML。
- `comments`：留言可以明确保存为本机草稿；“公开留言”会打开本站 GitHub Issue 的确认页，访客最终提交后才算送达。
- `friends`：公开友链只读取 `src/data/communication.ts` 中经过确认的真实数据；申请可保存本机草稿，或在 GitHub 确认后公开提交。空数据不生成示例站点。

## Studio 后续桥接

推荐动作：

```json
{
  "action": "open-blog-scene",
  "input": {
    "scene": "rss"
  }
}
```

`scene` 允许 `rss`、`comments`、`friends`。可选字段 `title`、`prompt`、`placeholder` 只改当次宿主提示，不改变页面逻辑。

返回：

- RSS 地址复制成功：`{ "status": "success", "value": "https://asashiki.com/rss.xml" }`
- 本机留言保存成功：`value` 为留言正文。
- 本机友链草稿保存成功：`value` 为站点 URL。
- 用户返回游戏：`{ "status": "cancel" }`

旧包仍可调用 `open-comment-form`，并通过 `input.mode` 传入同样三个值。宿主覆盖层关闭后继续原 iframe 会话，不重新加载游戏。
