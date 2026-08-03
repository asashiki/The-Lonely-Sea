# Studio 与 Blog 通过不可变游戏包交接

Studio 与《此岸之潮》保持独立仓库，Blog 只登记并托管 Studio 导出的不可变发布版本，通过 `gal-blog-bridge/v1` 协调站点动作和检查点存档。Blog 不合入 Studio 源码、不解析 WebGAL 脚本，也不跨 iframe 修改游戏 DOM；这样 Studio 可以继续演进制作流程，而 Blog 宿主只随冻结协议变化。
