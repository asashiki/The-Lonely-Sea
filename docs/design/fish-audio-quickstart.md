# Fish Audio 试听入门

核对日期：2026-09-17。官方目前将 `s2.1-pro-free` API 定价列为 0 美元，并将免费窗口延长至 2026-11-30；受公平使用政策约束，不是永久免费的承诺。网页订阅套餐与 API 模型计费分开看。

1. 登录 https://fish.audio/app/api-keys ，创建自己的 API key。
2. 在 Fish 的音色库试听，进入选中的音色详情页，复制音色/模型 ID，作为 `reference_id`。先用现有短台词比较音色，不直接整章替换。
3. 打开 PowerShell 7，下面第一行会遮住输入的 key；仅保存在当前终端环境变量。把 `这里填音色ID` 替换成自己的选择。

```powershell
$env:FISH_AUDIO_API_KEY = Read-Host 'Fish API key' -MaskInput
$fishHeaders = @{
  Authorization = "Bearer $env:FISH_AUDIO_API_KEY"
  model = 's2.1-pro-free'
}
$fishBody = @{
  text = '今の私のこの姿は、『アリス2010』のパッケージのものなんですよ。'
  reference_id = '这里填音色ID'
  format = 'mp3'
} | ConvertTo-Json
Invoke-WebRequest -Uri 'https://api.fish.audio/v1/tts' -Method Post -Headers $fishHeaders -ContentType 'application/json' -Body ([System.Text.Encoding]::UTF8.GetBytes($fishBody)) -OutFile 'alice-fish-test.mp3'
```

4. 当前目录会得到 `alice-fish-test.mp3`，先与原 MiniMax 相邻台词对比音色、停顿、专有名词读音。选定一个 `reference_id` 再分句批量生成，保持整章同一人物的声音稳定。

模型名称放在请求头 `model`，不是音色 ID。不要把 API key 放入前端代码或游戏发布包。适合本项目的流程是开发时生成 MP3，游戏播放成品音频，不要求访客在线调用 TTS。

本文没有使用你的 Fish 账户发起请求，也没有替换现有整章配音。MiniMax 的缺句补配与 Fish 试听是两件独立的事。

官方来源：
- https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits
- https://fish.audio/blog/s2-1-pro-free-api/
