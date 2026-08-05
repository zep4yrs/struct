# StructVis 项目索引 — Nexus Map

> generated_by: nexus-mapper v2
> verified_at: 2026-08-03
> provenance: AST-backed for TypeScript/JavaScript（92 文件，8 系统，Node 零截断）；Svelte 37 文件为 module-only 覆盖，组件间依赖 inferred from manual inspection；git 15 commits 已全部推送（含远程旧部署历史合并），工作区干净

## 项目是什么

**StructVis（位于 `structvis/`）**：数据结构与数据库自学工具，纯前端 SvelteKit 静态站（adapter-static，输出根 `docs/`，GitHub Pages `/struct` 部署）。核心价值：把算法/SQL/SQL 建表/索引动画变成可步进、可试错、可练习、可投影讲授的交互演示，对齐李春葆《数据结构教程》与杨宏霞《数据库技术及应用（MySQL）》。状态：**v0.2/v0.3 已完成**，**v1.0 图专题已完成（遍历/MST/最短路/拓扑排序/关键路径已上线）**。

## 代码库结构（structvis/src/，92 源文件）

- `lib/engines/` — **引擎层**（18 引擎类）：`algorithm/`（QuickSortEngine、自顶向下四排序 basicsort/、BinaryTreeEngine 四遍历、SinglyLinkedListEngine、StackQueueEngine、**GraphTraversalEngine BFS/DFS、MstEngine Prim/Kruskal、DijkstraEngine、TopoSortEngine Kahn、CriticalPathEngine AOE**）+ `sql/`（SelectEngine 分步、DmlEngine、create-table）+ `db/`（ErEngine、IndexEngine、NormalizeEngine）+ `algorithm/types.ts` 契约 + `parseInput.ts`（含 parseWeightedEdgeList）；**已实现 + 全套 spec**
- `lib/visualization/` — **渲染器层**：array/tree/linkedlist/sqltable/stack/er/btree/**graph** 八种 Canvas 渲染器，按 `engine.renderType` 插件化；`visualization-utils.ts`（resolveCSSVar + watchThemeChange 主题联动）**已实现**
- `lib/components/player/` — **播放器**：AlgoPlayer（GSAP timeline、演示/练习/**投影**三模式）+ ControlBar + PseudocodePanel + PracticePanel **已实现**
- `lib/components/layout/` + `ui/` + `stores/` + `styles/` — AppLayout/TopBar/Sidebar、Logo/TopicGrid、progress/settings/persistent stores、亮暗 token **已实现**
- `lib/content/topics.ts` — **课程目录数据层**（dsTopics×18 + dbTopics×11，TopicCard）已实现；`lib/data/` 仍为空（规划中）
- `routes/` — **23 个功能页面，无占位页**：`/`、`/ds`、`/db`、ds 全 14 页（5 排序+树+链表+栈队列+图遍历+最小生成树+最短路径+拓扑排序+关键路径）、db 五页（er/index/normalize/sql/tables/update）、`/progress`；`+layout.ts` prerender=true、trailingSlash='always'

## 关键事实

- **演示投影模式（v0.3）**：`AlgorithmEngine.demoScript?: DemoScriptItem[]` 按 StepType 配旁白；`AlgorithmStep.presenterNote?` 步骤级旁白优先；AlgoPlayer 有 `engine.demoScript` 时头部出现「投影」按钮 → 全屏覆盖 + requestFullscreen 自动进出，键盘 `Esc`/`Space`/`←→`，大字号讲授
- **图专题（v1.0 已完成）**：`AlgorithmStep.graph?: GraphData`（nodes/edges + `nodeState`/`edgeState`/`nodeNote` 逐帧快照）；`GraphRenderer.svelte` 环形自动布局、节点五态（unvisited/frontier/visited/current/done）与边五态（normal/tried/candidate/selected/current）配色、边权标签、有向箭头、节点下方标注、主题联动；**已上线五引擎**：`GraphTraversalEngine`（BFS/DFS）、`MstEngine`（Prim/Kruskal）、`DijkstraEngine`（dist 松弛 + nodeNote）、`TopoSortEngine`（Kahn 入度法 + 环检测）、`CriticalPathEngine`（AOE 拓扑→ve/vl→关键活动）；新增步骤类型 edge-candidate/edge-select/edge-reject（STEP_DURATIONS 已配时长）
- **契约字段**：仅 `engine.demoScript` 为可选（不破坏既有引擎）；11 引擎配齐讲解（quicksort 全分区阶段 + 四排序 + 二叉树 + SQL + 图遍历 + MST + 最短路 + 拓扑 + 关键路径，SQL 关键步骤用 presenterNote）
- **测试**：150 个测试 / 20 spec 文件（`npm run test`），`requireAssertions` 强制断言；`npm run check`（svelte-check 0 errors）、`npm run build` 自建 + 部署产物进仓库根 `docs/` 已验证
- **部署**：git remote `git@github.com:zep4yrs/struct.git`（master，15 commits 全部已推送）；**v1.0 图专题已上线** `https://zep4yrs.github.io/struct/`（Pages 源=master 根 `/docs`，`svelte.config.js` adapter 输出 `../docs`，`.nojekyll` 防 Pages 丢弃 `_app`）；`/ds/quick-sort` 为 `ssr=false` 客户端渲染页（空壳正常）

## 技术栈

Svelte 5（runes）+ SvelteKit（adapter-static）+ Tailwind v4 + GSAP 3.15（唯一 runtime 依赖，AlgoPlayer）+ Canvas 2D + Vitest。`animejs` 在 devDependencies 但源码无引用（遗留推断）。

## [操作指南] 强制执行步骤

> 本节是对所有读取本文件的 AI 发出的硬性操作指令，不是建议。

### 步骤1 — 必须先读完以下所有文件（顺序不限）

读完本文件后，在执行任何任务之前，必须依次 read 以下文件完整内容：

- `.nexus-map/arch/systems.md` — 系统边界与代码位置
- `.nexus-map/arch/dependencies.md` — 系统间依赖关系与 Mermaid 图
- `.nexus-map/arch/test_coverage.md` — 测试面与证据缺口
- `.nexus-map/hotspots/git_forensics.md` — Git 热点与耦合风险
- `.nexus-map/concepts/domains.md` — 核心领域概念

> 这些文件均为高密度摘要，总量通常 < 5000 tokens，是必要的上下文成本。
> 不得以"任务简单"或"只改一个文件"为由跳过。

### 步骤2 — 按任务类型追加操作（步骤1 完成后执行）

- 若任务涉及**接口修改、新增跨模块调用、删除/重命名公共函数**：
  → 必须运行 `query_graph.py --impact <目标文件>` 确认影响半径后再写标代码。
- 若任务需要**判断某文件被谁引用**：
  → 运行 `query_graph.py --who-imports <模块名>`。
- 若仓库结构已发生重大变化（新增系统、重构模块边界）：
  → 任务完成后评估是否需要重新运行 nexus-mapper 更新知识库。