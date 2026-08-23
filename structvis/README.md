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
│   ├── components/
│   │   ├── player/       # AlgoPlayer / ControlBar / PracticePanel / CoachMarkLayer / HelpSheet…
│   │   ├── layout/       # AppLayout / TopBar / Sidebar / SearchDialog
│   │   └── ui/           # TopicGrid / Scene3D / ActivityHeatmap / RadarChart…
│   ├── content/          # topics.ts（72 课题单源）+ quiz-bank.ts（自测题库）——导航/面包屑/搜索唯一数据源
│   ├── stores/           # progress / settings（localStorage 持久化，带版本信封迁移）
│   └── styles/           # app.css 设计 token（亮/暗双主题，AA 对比度基线）
├── routes/               # 84 个页面（/、/catalog、ds×48、db×24、/progress、/quiz、/race、/map、/report、/settings、/about）
├── test/                 # canvas-mock 记录式 2D 上下文
└── test-setup.ts         # jsdom 测试基建
e2e/                      # Playwright 端到端测试（含视觉截图基线）
```

## 新增一个算法页（贡献指南）

1. 在 `src/lib/engines/` 实现引擎（implements AlgorithmEngine），配同名 `.spec.ts`
2. 在 `src/lib/content/topics.ts` 加一项（title/description/href/topicId/badge/group/crumb）—— 目录卡、侧边栏、面包屑、搜索自动同步
3. 新建 `src/routes/.../+page.svelte`，用 `AlgoPage` + `<AlgoPlayer {engine} topicId={...} />` 组装
4. 若渲染器类型是新的，在 `src/lib/components/player/RendererSwitch.svelte` 加分支
5. 跑 `npm run lint && npm run check && npm run test && npm run test:e2e`
6. **文档同步**：若知识点总数/页面数/引擎数变化，更新根 `README.md` 的功能特性与徽章数字、本页目录速览

## 文档维护约定

- 一切统计数字以源码为准：topics.ts（课题）、quiz-bank.ts（题库）、routes 目录（页面）是唯一事实来源，README 不手写估算值
- 数字变化时按上方贡献指南第 6 步同步两份 README；应用内 `/about` 与首页的关键数字已是派生值，无需手改
