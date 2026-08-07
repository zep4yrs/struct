# AGENTS.md — StructVis 项目

如果仓库中存在 .nexus-map/INDEX.md，先阅读它，然后在执行任务前读完其路由块中列出的所有文件。

如果 .nexus-map/ 不存在，且当前任务涉及跨模块修改或接口变更，先向用户提议运行 nexus-mapper；若用户需立即开始，至少先运行 query_graph.py --summary 建立结构感知。

当任务改变了项目的结构认知（系统边界、入口、依赖关系），在交付前评估是否需要更新 .nexus-map。

## 项目速查

- 主项目在 `structvis/`（Svelte 5 + SvelteKit + Tailwind v4 + GSAP + Vitest，adapter-static 纯静态）
- 权威规划文档：根目录 `StructVis-长期开发文档.md`（`N08-UI-Design.md` 为过时的 React 时代设计稿，token 级内容以 `src/lib/styles/app.css` 为准）
- 代码集中在 `structvis/src/`：`lib/engines/`（算法 18 + SQL 7 + DB 4，全部带 spec）、`lib/visualization/`（12 类渲染器）、`lib/components/`（AlgoPlayer 播放器）、`lib/content/topics.ts`（课程目录）；`lib/data/` 为空目录（规划中，暂无落地必要）
- 已实现页面：**30 个，无占位页** —— ds 19 页（排序/树/链表/栈队列/图/查找）、db 九页（含触发器/存储过程）、`/progress`、`/settings`、`/about`；README、LICENSE（proprietary）已就位
- 引擎契约：AlgorithmEngine 泛型接口（TInput），AlgoPlayer 为 `AlgorithmEngine<unknown>`；data 为 number[]（树用层序编码、链表用值序列）；sql-table 额外用 step.table（SqlTableData）；渲染器按 engine.renderType 插件化（array/tree/linkedlist/sqltable/stack/queue/er/btree/graph/kmp/huffman/hashtable/pseudocode 均已实现）
- 测试：`npm run test`（vitest，requireAssertions；392/38 spec），`npm run test:e2e`（Playwright 24/24），`npm run check`（svelte-check 0 errors）
- 部署：GitHub Actions（`.github/workflows/deploy.yml`）push 到 master 自动 build 并提交 `docs/` 回仓库；Pages 源 = master 根 `/docs`，base `/struct`
