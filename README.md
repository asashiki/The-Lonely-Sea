# 孤独之海 / The Lonely Sea

以 Galgame 系统界面呈现个人文章与长期记录的 Astro 项目。

## 当前公开版本

- TITLE：场景、天气、开场与主菜单
- LOAD：仅保留第 XIII 套正式读取界面
- START / EXTRA / OPTION：现阶段功能页面
- PAGE：Markdown 文章阅读页

过去的 12 套 LOAD 原型、设计参考、截图和实验项目仍保存在本地 `.local/`，不会进入 Git 仓库或部署产物。

## 本地运行

环境要求：

- Node.js `>= 22.12.0`
- pnpm `>= 11.0.0`

```powershell
pnpm install
pnpm dev
```

默认地址：`http://localhost:4321`

## 检查与构建

```powershell
pnpm check
pnpm build
pnpm preview
```

## 目录

```text
public/                 # 线上静态资源
src/
├─ components/          # Astro 组件
├─ content/posts/       # Markdown 文章
├─ data/                # 页面数据
├─ layouts/             # 页面布局
├─ lib/                 # 内容读取与转换
├─ pages/               # 路由
├─ scripts/             # 浏览器交互
└─ styles/              # 页面样式
docs/                   # 当前架构与协作约定
.local/                 # 本地参考与旧原型，已忽略
```

LOAD 的领域语言与交互约定见 [CONTEXT.md](./CONTEXT.md)。
