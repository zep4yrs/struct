# AGENTS.md — StructVis 项目

如果仓库中存在 .nexus-map/INDEX.md，先阅读它，然后在执行任务前读完其路由块中列出的所有文件。

如果 .nexus-map/ 不存在，且当前任务涉及跨模块修改或接口变更，先向用户提议运行 nexus-mapper；若用户需立即开始，至少先运行 query_graph.py --summary 建立结构感知。

当任务改变了项目的结构认知（系统边界、入口、依赖关系），在交付前评估是否需要更新 .nexus-map。

## 项目速查

- 主项目在 `structvis/`（Svelte 5 + SvelteKit + Tailwind v4 + GSAP + Vitest，adapter-static 纯静态）
- 权威规划文档：根目录 `StructVis-长期开发文档.md`（`N08-UI-Design.md` 为过时的 React 时代设计稿，token 级内容以 `src/lib/styles/app.css` 为准）
- 代码集中在 `structvis/src/`；`lib/engines/sql/`、`lib/data/` 为空目录（规划中）
- 状态断层（v0.1 接线点）：practiceQuestions 练习系统、addMistake/updateTopicMastery 进度接口、/progress 页均为"接口就绪、UI 未接线"
- 架构约束：引擎纯逻辑（不碰 DOM）；单向数据流（控制面板是唯一状态修改入口）；渲染器按 engine.renderType 插件化（当前仅 array）
- 测试：`npm run test`（vitest，requireAssertions）
