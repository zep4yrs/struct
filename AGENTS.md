# AGENTS.md — StructVis 项目

如果仓库中存在 .nexus-map/INDEX.md，先阅读它，然后在执行任务前读完其路由块中列出的所有文件。

如果 .nexus-map/ 不存在，且当前任务涉及跨模块修改或接口变更，先向用户提议运行 nexus-mapper；若用户需立即开始，至少先运行 query_graph.py --summary 建立结构感知。

当任务改变了项目的结构认知（系统边界、入口、依赖关系），在交付前评估是否需要更新 .nexus-map。

## 项目速查

- 主项目在 `structvis/`（Svelte 5 + SvelteKit + Tailwind v4 + GSAP + Vitest，adapter-static 纯静态）
- 权威规划文档：根目录 `StructVis-长期开发文档.md`（`N08-UI-Design.md` 为过时的 React 时代设计稿，token 级内容以 `src/lib/styles/app.css` 为准）
- 代码集中在 `structvis/src/`；`lib/engines/sql/` 已有 SelectEngine（SELECT 分步执行），`lib/data/`、`lib/visualization/graph/` 为空目录（规划中）
- 已实现页面：`/ds/quick-sort`、`/ds/binary-tree`（四序遍历）、`/ds/linear-list`（插入/删除）、`/db/sql`（SELECT 分步）；`/progress` 已接线进度数据；暗色主题已启用（settings.theme，TopBar 切换）
- 引擎契约：AlgorithmEngine 泛型接口（TInput），AlgoPlayer 为 `AlgorithmEngine<unknown>`；data 为 number[]（树用层序编码、链表用值序列）；sql-table 额外用 step.table（SqlTableData）；渲染器按 engine.renderType 插件化（array/tree/linkedlist/sql-table 均已实现）
- 测试：`npm run test`（vitest，requireAssertions；含 BinaryTree/SinglyLinkedList/SelectEngine 三组引擎测试）
- 已知残余：`/ds/stack-queue`、`/db/tables`、`/db/index` 为占位页；prettier --check 全量仍有既有格式欠账（改动文件已格式化）
