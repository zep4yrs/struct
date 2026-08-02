# StructVis 项目索引 — Nexus Map

> generated_by: nexus-mapper v2
> verified_at: 2026-08-02
> provenance: AST-backed for TypeScript (36 files，含引擎 5 类)；Svelte 26 文件为 module-only 覆盖，组件间依赖 inferred from manual inspection；git 4 commits，hotspots 为 low risk 全量文件（insufficient history）

## 项目是什么

**StructVis（位于 `structvis/`）**：数据结构与数据库自学工具，纯前端 SvelteKit 静态站（adapter-static）。核心价值：把算法/SQL 过程变成可步进、可试错、可练习的交互演示，对齐李春葆《数据结构教程》与杨宏霞《数据库技术及应用（MySQL）》。状态：**v0.1 已完成**，v0.2 已开始（栈和队列 `8982eed`）。

## 代码库结构（源码集中在 structvis/src/，43 个源模块）

- `lib/engines/` — **引擎层**：`algorithm/`（QuickSortEngine、BinaryTreeEngine 四遍历、SinglyLinkedListEngine 插删、StackQueueEngine 压栈/出栈/入队/出队）+ `sql/SelectEngine`（FROM→WHERE→GROUP BY→SELECT→ORDER BY 分步）+ `types.ts`（AlgorithmEngine<TInput> 契约、AlgorithmStep、SqlTableData；RenderType 含 stack/queue）**已实现**
- `lib/visualization/` — **渲染器层**：array/tree/linkedlist/sqltable/stack 五种 Canvas 渲染器（stack 渲染器经 mode prop 同时服务 stack/queue 两种 renderType），按 `engine.renderType` 插件化；`visualization-utils.ts`（resolveCSSVar + watchThemeChange 主题联动）**已实现**
- `lib/components/player/` — **播放器**：AlgoPlayer（GSAP timeline、演示/练习双模式、答题落库）+ ControlBar（键盘）+ PseudocodePanel + PracticePanel **已实现**
- `lib/components/layout/` + `lib/stores/` + `lib/styles/` — 布局（Sidebar 顶栏按钮显隐切换，首页强制收起）、localStorage stores（progress/settings/persistent）、亮暗 token **已实现**
- `lib/data/` — **空目录**，规划中的课程内容数据层
- `routes/` — 8 个已实现页面：`/`（首页）、`/ds`、`/ds/quick-sort`、`/ds/binary-tree`、`/ds/linear-list`、`/ds/stack-queue`、`/db/sql`、`/progress`；**残余占位页**：`/db/tables`、`/db/index`

## 关键事实与证据缺口

- **文档权威性**：根目录 `StructVis-长期开发文档.md` 为准；`N08-UI-Design.md` 是过时 React 时代设计稿（学术蓝 #2563EB），实现遵循编辑技术极简主义（纸白/琥珀 #D97706，`src/lib/styles/app.css` token 为准）
- **主题联动**：渲染器不硬编码颜色，经 `resolveCSSVar` 取 token，`.dark` 切换由 MutationObserver 驱动重绘；页面数据面板"示例/自定义"互斥切换（同位置交叉淡入淡出）
- **测试面**：19 个测试（greet 1 + BinaryTree 4 + SinglyLinkedList 3 + StackQueue 7 + SelectEngine 4），引擎 spec 与引擎同目录；`requireAssertions` 强制断言
- **Git**：4 commits（`559fa85` 基线 + `2cf0101` v0.1 扩充 + `81509fa` map + `8982eed` 栈队列）→ 热点分析仍降级（insufficient history）；AppLayout/AlgoPlayer/types.ts 为最高变更频次文件（3 次）
- **残余断层**：`/db/tables`、`/db/index` 占位；settings store 无 `/settings` 路由（TopBar 齿轮位已用主题切换占用）；`prettier --check` 全量仍有历史格式欠账

## 技术栈

Svelte 5（runes）+ SvelteKit + Tailwind v4 + GSAP 3.15（唯一 runtime 依赖，AlgoPlayer）+ Canvas 2D + Vitest + adapter-static。`animejs` 在 devDependencies 但源码无引用（推断：遗留）。

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
