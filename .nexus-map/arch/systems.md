# 系统边界与代码位置

> generated_by: nexus-mapper v2
> verified_at: 2026-08-03
> provenance: AST-backed for TypeScript/JavaScript；Svelte 组件边界 inferred from manual inspection（svelte 为 module-only 覆盖）

## 1. 引擎层 — `structvis/src/lib/engines/`

职责：把算法/SQL/DDL/索引过程编译为分步关键帧，供播放器消费。统一契约在 `algorithm/types.ts`：

- `AlgorithmEngine<TInput>` 接口：`init(input)` / `steps: AlgorithmStep[]` / `totalSteps` / `playbackPos` / `pseudocode` / `practiceQuestions` / `renderType` / 可选 `presets` / `customConfig` / `applyPreset` / `applyCustom` / **`demoScript?: DemoScriptItem[]`（v0.3 讲授剧本）**
- `AlgorithmStep`：`{ data; highlights: Highlight[]; pseudocodeLine; description; page?; recursionDepth? }` + optional `presenterNote`（步骤级旁白）与 `table?: SqlTableData`
- StepType union：`init | compare | swap | pivot-select | partition-start | partition-end | recurse-enter | recurse-exit | complete | default`

子目录与引擎（13 类）：

| 引擎族 | 文件 | 说明 |
| --- | --- | --- |
| 快速排序 | `algorithm/quicksort/QuickSortEngine.ts` | Lomuto 分区，pivot/compare/swap/recurse 全类型关键帧，含 `demoScript` 全阶段叙述 |
| 基础排序 | `algorithm/basicsort/`（Bubble/Insertion/Selection/Merge 4 类 + 4 spec） | 上浮/插入/选最小/归并，均配 `demoScript` |
| 二叉树 | `algorithm/binarytree/BinaryTreeEngine.ts` | preorder/inorder/postorder/levelorder，递归步进入/返回 |
| 链表 | `algorithm/linkedlist/SinglyLinkedListEngine.ts` | insert/delete |
| 栈队列 | `algorithm/stackqueue/StackQueueEngine.spec.ts` → 实现 `StackQueueEngine` | renderType 随 structure 返回 'stack'/'queue' |
| SQL 查询 | `sql/SelectEngine.ts` | FROM→WHERE→GROUP BY→SELECT→ORDER BY→LIMIT；关键阶段携带 `presenterNote`；含 `demoScript` |
| DML | `sql/DmlEngine.ts` | INSERT/UPDATE/DELETE 分步 |
| 建表 | `sql/create-table.ts`（函数非类） | `parseCreateTable` 解析 CREATE TABLE |
| 数据库 | `db/ErEngine.ts` / `IndexEngine.ts`（B+ 树）/ `NormalizeEngine.ts` | E-R/索引/范式（renderType: er/btree/…） |

测试：每个引擎族带 `.spec.ts`（共 96 测试，见 test_coverage.md）。

## 2. Canvas 渲染器层 — `structvis/src/lib/visualization/`

职责：按 `engine.renderType` 插件化绘制关键帧。AlgoPlayer 模板内 8 分支分发：

- `array/ArrayRenderer.svelte` + `array-render-utils.ts`（bar 身份追踪、easeOutCubic）
- `tree/TreeRenderer.svelte`、`linkedlist/LinkedRenderer.svelte`、`sqltable/SqlTableRenderer.svelte`
- `stack/StackRenderer.svelte`（stack/queue 二合一 mode prop）
- `er/ErRenderer.svelte`（E-R 图）、`btree/BPlusTreeRenderer.svelte`（B+ 树）——v0.2 数据库页新增
- `visualization-utils.ts` — `resolveCSSVar()` 读 token、`watchThemeChange()`（MutationObserver）驱动暗色重绘

## 3. 播放器 — `structvis/src/lib/components/player/`

- `AlgoPlayer.svelte` — 三类模式：`mode: 'demo'|'practice'`（右上 mode-switch）+ **`projector` 投影态**（`engine.demoScript` 存在时头部显示「投影」）；GSAP timeline 驱动 playbackPos；`{#key engineRevision}` 包住 canvas-body 解决数据切换渲染器不重建的 bug；全屏投影 `requestFullscreen`/`exitFullscreen` 由 `$effect` 管理
- `ControlBar.svelte` — 进度条 + 键盘（space/←→/Home/End），`disabled` prop 在投影模式关闭键盘避免双触发
- `PseudocodePanel.svelte`、`PracticePanel.svelte` — 伪代码高亮 / 练习弹层（数字键/H 键）

## 4. 布局、状态与内容 — `lib/components/layout/` + `ui/` + `stores/` + `styles/` + `content/`

- `AppLayout.svelte`（顶栏+侧栏，sidebarOpen 非持久）、`Sidebar.svelte`（224↔0 过渡）、`TopBar.svelte`（侧栏切换+主题切换）
- `ui/Logo.svelte`、`ui/TopicGrid.svelte`（消费 content 卡片，首页强制收起场景）
- `stores/progress.ts`（topic 掌握度+错题+streak）、`settings.ts`（theme/sqlEngine/animationSpeed/showHints）、`persistent.ts`（localStorage 包装）
- `styles/app.css`（`:root`/`.dark` 两套 token）；`content/topics.ts`（`dsTopics`×8、`dbTopics`×6、`TopicCard`）

## 5. 页面层 — `structvis/src/routes/`

- 目录页：`/` 首页（卡片导航）、`/ds`、`/db`
- ds 播放器页：quick-sort、bubble-sort、insertion-sort、merge-sort、selection-sort、binary-tree、linear-list、stack-queue（共 8）
- db 播放器页：er、index（索引原理）、normalize、sql、tables（建表解析）、update —— **全实现，无占位**
- `/progress` 进度页
- 构建配置：`+layout.ts` 是 `prerender = true`、`trailingSlash = 'always'`；`+layout.svelte` 切 dark class

## 6. 规划中系统（planned）

- `lib/data/` 数据层 — 空目录，课程目录已由其 concurrently `content/topics.ts` 承担
- 图结构可视化（`visualization/graph`）— 主计划仍在；`settings` 无 `/settings` 路由（TopBar 占用齿轮位）