# Studio 游戏包接入

当前 Blog 已准备好 `gal-blog-bridge/v1` 宿主，但没有提交演示游戏或旧版 Studio ZIP。

Studio 交付正式包后：

1. 确认包内 `gal-blog.embed.json` 的 schema 为 `gal-blog-game-package/v1`，WebGAL 运行时已内置，且宿主 origin 不含 `*`。
2. 将完整包放入 `public/games/<slug>/<releaseId>/`，不得覆盖已有发布版本。
3. 在 `src/lib/gal-blog/release-registry.ts` 的对应游戏中登记目录，并设置 `currentReleaseId`。
4. 运行 `pnpm check` 与 `pnpm build`；清单或目录不一致会直接中止构建。
5. 用 `/start/stories/<slug>/` 验证 `hello → launch → ready`，再验证保存检查点后可从 LOAD 重新进入。

当前明确返回 `unsupported` 的能力是评论表单和运行时数据；在真实 Blog Provider 接入前不会伪装成功。旧版 `oblivion-haven@063d9eb` 导出包不符合 v1 握手与安全要求，不应登记为正式发布版本。
