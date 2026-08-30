# 自定义扩展

`entry.js` 是可信作者代码入口。它不会远程 import、不会 eval，也不包含密钥。

稳定生命周期事件：

- `galblog:bridge-ready`
- `galblog:launch-applied`
- `galblog:webgal-ready`
- `galblog:action-result`

请勿依赖 WebGAL 私有 Core；版本相关访问集中在 `gal-blog-bridge.js` 的 4.6.2 adapter。
