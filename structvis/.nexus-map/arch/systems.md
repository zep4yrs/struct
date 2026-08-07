# 系统边界与代码位置

> generated_by: nexus-mapper v2 (manual refresh)
> verified_at: 2026-08-07
> provenance: AST-backed for TypeScript/JavaScript；Svelte 组件边界 inferred from manual inspection（svelte 为 module-only 覆盖）

## 1. 引擎层 — `structvis/src/lib/engines/`

职责：把算法/SQL/DDL/索引过程编译为分步关键帧，供播放器消费。统一契约在 `algorithm/types.ts`：

- `AlgorithmEngine<TInput>` 接口：`init(input)` / `steps: AlgorithmStep[]` / `totalSteps` / `playbackPos` / `pseudocode` / `practiceQuestions` / `renderType` / 可选 `presets` / `customConfig` / `applyPreset` / `applyCustom` / **`demoScript?: DemoScriptItem[]`（v0.3 讲授剧本）**
- `AlgorithmStep`：`{ data; highlights: Highlight[]; pseudocodeLine; description; page?; recursionDepth? }` + optional `presenterNote`（步骤级旁白）与 `table?: SqlTableData`、`er?: ErDiagramData`、`btree?: BPlusTreeData`、`graph?: GraphData`、`kmp?: KmpData`、`huffman?: HuffmanData`、`hash?: HashData`（各专用渲染器快照）
- StepType union：`init | compare | swap | pivot-select | partition-start | partition-end | recurse-enter | recurse-exit | edge-candidate | edge-select | edge-reject | complete | default`（v1.0 图专题第二增量新增 3 类）

子目录与引擎（算法 18 类 + SQL/DB 8）：

| 引擎族     | 文件                                                                                                     | 说明                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 快速排序   | `algorithm/quicksort/QuickSortEngine.ts`                                                                 | Lomuto 分区，pivot/compare/swap/recurse 全类型关键帧，含 `demoScript` 全阶段叙述                                                                                                                                            |
| 基础排序   | `algorithm/basicsort/`（Bubble/Insertion/Selection/Merge 4 类 + 4 spec）                                 | 上浮/插入/选最小/归并，均配 `demoScript`                                                                                                                                                                                    |
| 二叉树     | `algorithm/binarytree/BinaryTreeEngine.ts`                                                               | preorder/inorder/postorder/levelorder，递归步进入/返回                                                                                                                                                                      |
| 链表       | `algorithm/linkedlist/SinglyLinkedListEngine.ts`                                                         | insert/delete                                                                                                                                                                                                               |
| 栈队列     | `algorithm/stackqueue/StackQueueEngine.spec.ts` → 实现 `StackQueueEngine`                                | renderType 随 structure 返回 'stack'/'queue'                                                                                                                                                                                |
| 图遍历     | `algorithm/graph/GraphTraversalEngine.ts`                                                                | BFS（队列）/DFS（递归），`graph` 快照逐帧 nodeState，含 `demoScript`                                                                                                                                                        |
| 最小生成树 | `algorithm/graph/MstEngine.ts`                                                                           | Prim（扩张树）/Kruskal（避环选边）双模式，候选边扫描/选中/成环拒绝关键帧，含 `demoScript`                                                                                                                                   |
| 最短路径   | `algorithm/graph/DijkstraEngine.ts`                                                                      | 单源 Dijkstra，dist 松弛关键帧 + `nodeNote` 实时标注，含 `demoScript`                                                                                                                                                       |
| 拓扑排序   | `algorithm/graph/TopoSortEngine.ts`                                                                      | Kahn 入度法，入度 nodeNote 实时标注 + 环检测（edge-reject），含 `demoScript`                                                                                                                                                |
| 关键路径   | `algorithm/graph/CriticalPathEngine.ts`                                                                  | AOE 拓扑→ve→vl→关键活动判定四阶段，nodeNote ve/vl 双标注，含 `demoScript`                                                                                                                                                   |
| 图的存储   | `algorithm/graph/GraphStorageEngine.ts`（v0.6 新增）                                                     | 邻接矩阵 vs 邻接表逐步构建；3 preset（无向矩阵/无向表/带权有向矩阵）；2 道练习；复用 graph 渲染器，通过 nodeState/edgeState 控制高亮                                                                                        |
| 二分查找   | `algorithm/search/BinarySearchEngine.ts`                                                                 | 有序表折半，partition+pivot+low/high 指针高亮，复用 array 渲染器，含 `demoScript`                                                                                                                                           |
| KMP        | `algorithm/search/KMPEngine.ts`                                                                          | 求 next 数组（buildNext 帧）→ 匹配（i 不回退），renderType 'kmp'，含 `demoScript`                                                                                                                                           |
| 二叉搜索树 | `algorithm/bst/BstEngine.ts`                                                                             | 查找/插入/删除三模式（伪代码与练习按模式切换），层序快照复用 tree 渲染器，含 `demoScript`                                                                                                                                   |
| 哈夫曼树   | `algorithm/huffman/HuffmanEngine.ts`                                                                     | 每次选两最小根合并建树，renderType 'huffman'（森林多根布局），WPL 练习，含 `demoScript`                                                                                                                                     |
| 哈希表     | `algorithm/hash/HashTableEngine.ts`                                                                      | 线性探测构造/查找/链地址法三模式，除留余数法 + ASL(成功) 统计，renderType 'hashtable'，含 `demoScript`                                                                                                                      |
| SQL 查询   | `sql/SelectEngine.ts`                                                                                    | FROM→WHERE→GROUP BY→SELECT→ORDER BY→LIMIT；关键阶段携带 `presenterNote`；含 `demoScript`                                                                                                                                    |
| 高级查询   | `sql/AdvancedQueryEngine.ts`（v0.5 新增）                                                                | HAVING / LEFT JOIN / UNION / EXISTS / NOT EXISTS 四种子句 dispatch；EXISTS 相关子查询经 `_subqueryNonEmpty` 直接判 WHERE 非空（SELECT 1 常量列 SelectEngine 不支持）；`_group` 支持 tableCols 定位、`_project` 支持表前缀列 |
| DML        | `sql/DmlEngine.ts`                                                                                       | INSERT/UPDATE/DELETE 分步                                                                                                                                                                                                   |
| 视图       | `sql/ViewEngine.ts`（v0.4 新增）                                                                         | CREATE VIEW 解析→底层 SELECT 复用→视图完成→查询视图→基表更新后视图自动刷新（动态性演示）                                                                                                                                    |
| 触发器     | `sql/TriggerEngine.ts`（数据库第 7 章新增）                                                              | 教学模拟：手动解析 CREATE TRIGGER（BEFORE/AFTER × INSERT/UPDATE/DELETE），演示 NEW/OLD 值流与自动执行；3 预设 + 2 练习；renderType sql-table；共享 `sql-utils.evalSqlWhere` 做 DML 预览                                     |
| 存储过程   | `sql/ProcedureEngine.ts`（数据库第 7 章新增）                                                            | 教学级模拟器：解析 DECLARE/SET/SELECT INTO/IF/ELSEIF/ELSE/WHILE/CALL，进程内求值表达式与条件；DECLARE 字符串默认值需去尾部 `;` 与包围引号；4 预设 + 2 练习；renderType pseudocode                                           |
| 建表       | `sql/create-table.ts`（函数非类）                                                                        | `parseCreateTable` 解析 CREATE TABLE                                                                                                                                                                                        |
| 数据库     | `db/ErEngine.ts` / `IndexEngine.ts`（B+ 树）/ `NormalizeEngine.ts` / `TransactionEngine.ts`（v0.5 新增） | E-R/索引/范式/事务（renderType: er/btree/…/sql-table）；TransactionEngine 三模式（commit/rollback/lost-update），undo 日志回滚演示，A/B 账户 Σ 守恒                                                                         |

测试：每个引擎族带 `.spec.ts`（引擎 + 组件/stores 共 392 测试，见 test_coverage.md）。

## 2. Canvas 渲染器层 — `structvis/src/lib/visualization/`

职责：按 `engine.renderType` 插件化绘制关键帧。AlgoPlayer 模板内 11 分支分发：

- `array/ArrayRenderer.svelte` + `array-render-utils.ts`（bar 身份追踪、easeOutCubic）
- `tree/TreeRenderer.svelte`、`linkedlist/LinkedRenderer.svelte`、`sqltable/SqlTableRenderer.svelte`
- `stack/StackRenderer.svelte`（stack/queue 二合一 mode prop）
- `er/ErRenderer.svelte`（E-R 图）、`btree/BPlusTreeRenderer.svelte`（B+ 树）——v0.2 数据库页新增
- `graph/GraphRenderer.svelte`（图：环形自动布局、节点五态/边五态配色、边权标签、有向箭头、`nodeNote` 节点下方标注）——v1.0 图专题新增
- `kmp/KmpRenderer.svelte`（文本/模式/next 三行布局，buildNext 阶段展示模式串+next 行）、`huffman/HuffmanRenderer.svelte`（森林多根并列布局，WPL 完成徽标）、`hashtable/HashtableRenderer.svelte`（线性：单行槽位+探测序列；链式：槽位列+横向链表）——v1.0 补齐批新增
- `visualization-utils.ts` — `resolveCSSVar()` 读 token、`watchThemeChange()`（MutationObserver）驱动暗色重绘

## 3. 播放器 — `structvis/src/lib/components/player/`

- `AlgoPlayer.svelte` — 三类模式：`mode: 'demo'|'practice'`（右上 mode-switch）+ **`projector` 投影态**（`engine.demoScript` 存在时头部显示「投影」）；GSAP timeline 驱动 playbackPos；`{#key engineRevision}` 包住 canvas-body 解决数据切换渲染器不重建的 bug；全屏投影 `requestFullscreen`/`exitFullscreen` 由 `$effect` 管理
- `ControlBar.svelte` — 进度条 + 键盘（space/←→/Home/End），`disabled` prop 在投影模式关闭键盘避免双触发
- `PseudocodePanel.svelte`、`PracticePanel.svelte` — 伪代码高亮 / 练习弹层（数字键/H 键）

## 4. 布局、状态与内容 — `lib/components/layout/` + `ui/` + `stores/` + `styles/` + `content/`

- `AppLayout.svelte`（顶栏+侧栏，sidebarOpen 非持久）、`Sidebar.svelte`（224↔0 过渡）、`TopBar.svelte`（侧栏切换+主题切换）
- `ui/Logo.svelte`、`ui/TopicGrid.svelte`（消费 content 卡片，首页强制收起场景）
- `stores/progress.ts`（topic 掌握度+答题计数+错题本+复习流+streak）、`settings.ts`（theme/sqlEngine/animationSpeed/showHints）、`persistent.ts`（localStorage 包装）
- `styles/app.css`（`:root`/`.dark` 两套 token）；`content/topics.ts`（`dsTopics`×18、`dbTopics`×13、`TopicCard`）

## 5. 页面层 — `structvis/src/routes/`

- 目录页：`/` 首页（卡片导航）、`/ds`、`/db`
- ds 播放器页：quick-sort、bubble-sort、insertion-sort、merge-sort、selection-sort、binary-tree、linear-list、stack-queue、graph-traversal、mst、shortest-path、topo-sort、critical-path、binary-search、kmp、bst、huffman、hash-table、graph-storage（图的存储，v0.6 新增）—— **共 19，全部已实现**
- db 播放器页：er、index（索引原理）、normalize、sql、tables（建表解析）、update、advanced-query（高级查询）、overview（数据库系统概述概念页+练习）、transaction（事务与并发控制）、users（用户与权限管理概念页+练习）、**triggers（触发器，v0.7 新增）、procedures（存储过程，v0.7 新增）**—— **全实现，无占位**（杨宏霞《数据库技术及应用》v0.2 范围已全部覆盖，含第 7 章存储过程/触发器）
- `/progress` 进度页
- `/settings` 设置页（动画速度/显示提示/主题，v0.7 新增）
- `/about` 关于页（项目定位/技术栈/状态/许可，v0.7 新增）
- 构建配置：`+layout.ts` 是 `prerender = true`、`trailingSlash = 'always'`；`+layout.svelte` 切 dark class

## 6. 已完成项（原 planned 已落地）

- `lib/data/` 数据层 — 原规划为空目录；实际课程目录、引擎预设、示例数据集均由 `content/topics.ts` 与各引擎内联 preset 承担，无需独立目录
- `/settings` 路由 — v0.7 已完成（动画速度/显示提示/主题切换，TopBar 齿轮 + Sidebar 底部入口）
