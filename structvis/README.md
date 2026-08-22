# StructVis

> 看见数据结构与数据库的每一步跳动。

完整说明见仓库根目录 [README.md](../README.md)。

## 快速开始

```bash
npm install
npm run dev
```

## 常用命令

| 命令               | 说明                                            |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | 启动开发服务器（http://localhost:5173）         |
| `npm run check`    | svelte-check 类型检查                           |
| `npm run test`     | 单元测试（Vitest，server + client 双项目）      |
| `npm run test:e2e` | 端到端测试（Playwright，自动起 dev server）     |
| `npm run build`    | 生产构建（adapter-static 输出到仓库根 `docs/`） |
| `npm run lint`     | Prettier + ESLint                               |

## 目录速览

```
src/
├── lib/
│   ├── engines/          # 算法/SQL/数据库引擎（AlgorithmEngine 契约，纯逻辑）
│   ├── visualization/    # Canvas 渲染器（按 engine.renderType 插件化）
│   ├── components/       # AlgoPlayer 播放器 / AlgoPage 页面壳 / 布局 / 通用 UI
│   ├── content/          # 课程目录（topics.ts，导航/面包屑/搜索的唯一数据源）
│   ├── stores/           # progress / settings（localStorage 持久化，带版本迁移）
│   └── styles/           # app.css 设计 token（亮/暗双主题）
├── routes/               # 84 个页面（/、/catalog、ds×48、db×24、/progress、/quiz、/race、/map、/report、/settings、/about）
├── test/                 # canvas-mock 记录式 2D 上下文
└── test-setup.ts         # jsdom 测试基建
e2e/                      # Playwright 端到端测试
```

## 新增一个算法页（贡献指南）

1. 在 `src/lib/engines/` 实现引擎（implements AlgorithmEngine），配同名 `.spec.ts`
2. 在 `src/lib/content/topics.ts` 加一项（title/description/href/topicId/badge/group/crumb）—— 目录卡、侧边栏、面包屑、搜索自动同步
3. 新建 `src/routes/.../+page.svelte`，用 `AlgoPage` + `<AlgoPlayer {engine} topicId={...} />` 组装
4. 若渲染器类型是新的，在 `src/lib/components/player/RendererSwitch.svelte` 加分支
5. 跑 `npm run check && npm run test && npm run test:e2e`
