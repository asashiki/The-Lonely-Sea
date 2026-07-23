# ADR 0001：LOAD 存档界面重设计（三方案对比期）

日期：2026-07-22
状态：已由 ADR 0002 取代

## 背景

LOAD 页面原样只是文章卡片列表，缺少 galgame 存档界面感。设计参考系：恋狱月狂病（Innocent Grey）与月姬 -A piece of blue glass moon- 的 UI——高级感 = 克制但不是简陋，允许“复杂的克制”（细线、叠色、微字距），拒绝多余文字提示（无键位提示、无操作指南、无刻度线）。

## 决策

1. **三方案并存对比**：Ⅰ MEMORY CARD（统一 6 槽网格 + 设备切换 tab）/ Ⅱ ARCHIVE LIST（列表式 + 分类筛选 tab）/ Ⅲ EDITORIAL（原 featured 混排精修，对照组）。LOAD 界面左下角临时切换器或按 1/2/3 切换，选择存 localStorage，定稿后删除切换器与落选方案。
2. **固定 24 槽容量**：4 页 × 6 槽（EDITORIAL 因 featured 占格为 5 页）。空槽显示 EMPTY DATA，文章发布后自动填充下一个槽位，超 24 槽再扩页。
3. **筛选语义**：设备 tab（RECORD A 文章 / RECORD B 游戏存档预留）与分类 tab 互斥于不同方案；筛选命中槽从 1 号槽紧凑排列，空槽补齐。
4. **槽位信息**：编号 No.01 + 标题 + 真实存档日期（发布日期，`2026.01.11 SAT` 带星期）+ 角落分类标签；砍掉编造的 MIN 阅读时长。
5. **上次读档标记**：localStorage 记录最近打开的文章，对应槽位右上角标注 LAST LOAD（已读变暗、QUICK/AUTO 槽均被否）。
6. **页码**：方案一为纯衬线数字 01-04 可直跳、无框无箭头；方案二/三保留 PREV/NEXT + PAGE 01/04 精修。
7. **BACK**：方案二/三保留原形；方案一试竖细线 + 宽字距形态。
8. **转场提速**：场景渐变 1500ms → 800ms；切屏遮罩 430+620ms → 260+380ms；ESC 返回改为走同一遮罩渐变。缓动曲线不变。
9. **主界面菜单 hover**：文字色由 var(--accent) 改为 color-mix(in srgb, var(--accent) 72%, var(--ink))，下沉一档。

## 备注

- 阅读回收率统计想法已记入 docs/ideas.md（只做后台统计，不上页面）。
- 回归脚本：scripts/verify-load.mjs（Playwright，截图到 shots/）。
