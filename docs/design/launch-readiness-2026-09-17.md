# 上线前收尾（检查结果与建议，尚未执行部署）

## 优先解决

1. 发布流程与缓存：`scripts/set-game-host-origins.mjs` 无参逻辑要求仅一个版本，但现在保留多个不可变发布；`docs/deployment.md` 仍按单包写。先确定发布哪些兼容版本，再修脚本与说明。`public/_headers` 对固定文件名的 `/assets/*` 设一年 immutable，需给可变资源版本号或缩短缓存，防止新版本仍拿到旧图旧声音。
2. 留言实际能力：当前为本机草稿，公开提交引导到 GitHub Issue，未实现站内公共留言回读。首发必须明确采用这种方式，或接入真实公共留言服务；视觉修改不能代替后端。
3. 存档边界：游戏和 NVL 存在当前浏览器 localStorage。建议先补明确的本地保存提示与导出/导入，暂不必做账号云同步。
4. 正式 HTTPS 验收：首访→START→保存→回标题→LOAD→NVL→刷新恢复；另外复测深色主题与反复切 LOAD 分类的内容消失反馈。验证实际 iframe origin、缓存、首次音频、手机旋转和后台返回。localhost通过不等于线上已验收。

## 接着优化

- 资源目录约392MB（审计时，新增语音包前），这是发布目录总量而非首屏下载量。旧0.2.0包有重复大字体；核对引用与存档后再归档，不直接删除。按实际首访请求做字体子集与延迟加载，避免盲目继续转换全部素材。
- 汇总已有音乐、图片、生成素材出处到公开credits；目前是分散文档，不是完全没有来源记录。
- UI先停止反复整页改版。固定现有分类和禁用规则，只围绕一个真实游戏场景给静态效果，再决定是否实现。试听也是先用原台词挑定音色，再整章生成。

## 已有，无需当成新工程

Astro静态文章、Cloudflare Pages配置、RSS、robots、sitemap、llms.txt、JSON-LD/OG、8张无损WebP均已存在。AI阅读不要求新增聊天机器人后端。

证据入口：`docs/deployment.md`、`public/_headers`、`scripts/set-game-host-origins.mjs`、`src/data/communication.ts`、`src/lib/blog-interactions.ts`、`src/lib/gal-blog/save-store.ts`、`src/lib/nvl/save-store.ts`。
