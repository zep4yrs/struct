# StructVis 项目索引 — Nexus Map

> generated_by: nexus-mapper v2
> verified_at: 2026-08-01
> provenance: AST-backed for TypeScript (12 files); Svelte 组件为 module-only 覆盖，组件间依赖关系 inferred from manual inspection；git 仓库存在但无任何 commit，hotspots 部分跳过

## 项目是什么

**StructVis（位于 `structvis/`）**：数据结构与数据库自学工具，纯前端 SvelteKit 静态站（adapter-static → GitHub Pages）。核心价值：把算法过程变成可交互、可步进、可试错的练习，对齐李春葆《数据结构教程》与杨宏霞《数据库技术及应用（MySQL）》。状态：**v0.1 开发中**（M0 骨架 + M1 快速排序样板已完成，文档自称"v0.1 规划中"，代码进度快于文档头部标注）。

## 代码库结构（全部代码在 structvis/src/，34 个源文件）

- `lib/engines/algorithm/` — 算法步进引擎层：`QuickSortEngine.ts`（Lomuto 分区，生成全类型关键帧）+ `types.ts`（AlgorithmEngine 统一契约）**已实现**
- `lib/components/player/` — `AlgoPlayer.svelte`（GSAP timeline 播放器）+ `PseudocodePanel` + `ControlBar`（键盘优先）**已实现**；`PracticePanel.svelte`（阶段 A 新增，练习弹层）**已实现**
- `lib/visualization/array/` — Canvas 柱状图渲染器 + `array-render-utils.ts`（身份追踪/颜色插值）**已实现**
- `lib/stores/` — localStorage 持久化：progress（掌握度/错题/streak）、settings、persistent **已实现**
- `lib/components/layout/` + `routes/` — 布局与页面：`/ds/quick-sort` 完整实现（含练习模式）；`/progress` 已接入进度数据（阶段 A）；`/ds/binary-tree`、`/ds/linear-list`、`/ds/stack-queue`、`/db/*` 均为 **WORK IN PROGRESS 占位页**
- `lib/data/`、`lib/engines/sql/`、`lib/visualization/tree|graph/` — 目录存在但**为空**（规划中）

## 关键事实与证据缺口

- **文档权威性**：以根目录 `StructVis-长期开发文档.md` 为准。根目录 `N08-UI-Design.md` 是**过时设计稿**（声称 React 19 + Radix + 学术蓝 #2563EB），与实现（Svelte 5 + Tailwind v4 + 纸白 #FAF9F6 + 琥珀 #D97706）不符，实现遵循长期开发文档 §6.1"编辑技术极简主义"。`ui-design-reference.html` 为视觉参考稿。
- **状态断层（阶段 A 已闭合一部分）**：练习系统（`practiceQuestions`）已接线到 AlgoPlayer/PracticePanel；`addMistake`/`updateTopicMastery` 已由练习答题触发并接入 `/progress` 页。**残余断层**：settings store 无 `/settings` 路由。
- **测试面**：vitest 已配置（node 环境、`requireAssertions: true`），但仅 `vitest-examples/greet.spec.ts` 样板，无业务测试。
- **Git 历史**：仓库无任何 commit → 无法做热点/耦合分析（降级探测）。
- **第三方资源**：`gsap_skilled_extracted/`（GSAP skills 插件，开发参考用）、`.trae-html-share-packages/` 非项目代码。

## 技术栈

Svelte 5（runes 强制开启）+ SvelteKit + Tailwind CSS v4 + GSAP 3.15（唯一 runtime 依赖）+ Canvas 2D + Vitest + adapter-static。

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
  → 必须运行 `query_graph.py --impact <目标文件>` 确认影响半径后再写代码。
- 若任务需要**判断某文件被谁引用**：
  → 运行 `query_graph.py --who-imports <模块名>`。
- 若仓库结构已发生重大变化（新增系统、重构模块边界）：
  → 任务完成后评估是否需要重新运行 nexus-mapper 更新知识库。
