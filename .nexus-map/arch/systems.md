# 系统边界与代码位置

> generated_by: nexus-mapper v2
> verified_at: 2026-08-02
> provenance: AST-backed for TypeScript；Svelte 组件边界 inferred from manual inspection（svelte 为 module-only 覆盖）

## 1. 算法引擎层 — `structvis/src/lib/engines/`

职责：把算法/SQL 执行过程编译为分步关键帧，供播放器消费。统一契约在 `algorithm/types.ts`：

- `AlgorithmEngine<TInput>` 接口：`init(input)` / `stepForward()` / `stepBackward()` / `steps: AlgorithmStep[]` / `totalSteps` / `pseudocode` / `practiceQuestions` / `renderType: 'array' | 'tree' | 'linkedlist' | 'stack' | 'queue' | 'graph' | 'sql-table'`
- `AlgorithmStep`：`{ data: number[]; highlights: Highlight[]; pseudocodeLine; description }`，SQL 引擎额外带可选 `table?: SqlTableData`（列/行快照）
- 引擎数据编码约定：数组用值序列；树用层序编码（-1 空节点）；链表用值序列；栈/队列用值序列（栈底→栈顶 / 队头→队尾）；SQL 表用 `SqlTableData`

子目录：

| 引擎 | 文件 | 说明 |
| --- | --- | --- |
| QuickSortEngine | `algorithm/quicksort/QuickSortEngine.ts` | Lomuto 分区，全类型高亮关键帧（pivot/sorted/compare/partition/pointer-i/j） |
| BinaryTreeEngine | `algorithm/binarytree/BinaryTreeEngine.ts` | preorder/inorder/postorder/levelorder 四模式，递归/队列生成访问序列 |
| SinglyLinkedListEngine | `algorithm/linkedlist/SinglyLinkedListEngine.ts` | insert/delete，pre/p 指针定位，新节点用 index -1 表示 |
| StackQueueEngine | `algorithm/stackqueue/StackQueueEngine.ts` | 栈（push/pop）与队列（enqueue/dequeue）四操作；`renderType` 随 structure 返回 'stack'/'queue'；出操作校验目标与栈顶/队头一致，空容器下溢步骤 |
| SelectEngine | `sql/SelectEngine.ts` | SELECT 迷你解析（尾先切子句 ORDER BY→GROUP BY→WHERE→FROM），逻辑执行序生成步骤；WHERE 逐行 current 高亮并收缩结果集 |

测试：每个引擎同目录 `.spec.ts`（见 test_coverage.md）。

## 2. Canvas 渲染器层 — `structvis/src/lib/visualization/`

职责：按 `engine.renderType` 插件化绘制关键帧。AlgoPlayer 模板内 5 分支分发：

- `array/ArrayRenderer.svelte` — 柱状图，bar 身份追踪（array-render-utils）、分区背景、指针文字标签、easeOutCubic 插值
- `tree/TreeRenderer.svelte` — 层序重建树，中序布局 + 深度分层，圆节点 + 高亮
- `linkedlist/LinkedRenderer.svelte` — 节点框 + 箭头 + NULL 尾，整链水平居中，新节点虚线框
- `sqltable/SqlTableRenderer.svelte` — 表格（表头/边框/当前行琥珀底/行数 footer）
- `stack/StackRenderer.svelte` — 栈/队列二合一：`mode` prop 区分布局（栈=竖向容器自底向上 + top/bottom 标签；队列=横向容器 + front/rear 标签与箭头），超 6 个元素折叠为 `+n` 虚线块
- `visualization-utils.ts` — `resolveCSSVar()` 读 token；`watchThemeChange()` 用 MutationObserver 监听 `<html class>` 变化回调重绘

统一约定：画布限制最大逻辑尺寸（宽 ≤760、四周留边），外层 wrap flex 居中；颜色全部走 CSS token（不硬编码），暗色主题即插即用。

## 3. 播放器 — `structvis/src/lib/components/player/`

- `AlgoPlayer.svelte` — 编排核心：GSAP timeline（paused，playbackPos 驱动渲染器）；演示/练习双模式（mode-switch，练习模式遇 practiceQuestions 暂停出题）；快捷键、进度条、步进/跳转；答题回调 `updateTopicMastery`/`addMistake` 落 progress store
- `ControlBar.svelte` — 播放控制（键盘优先），onDestroy 有 SSR 守卫（prerender 500 的历史根因）
- `PseudocodePanel.svelte` — 伪代码行高亮（activeLine），面板内居中
- `PracticePanel.svelte` — 练习弹层（选择/填空、正确/错误态、解释），`correctAnswer` 类型收窄为 `string | number | boolean`

## 4. 布局与状态 — `structvis/src/lib/components/layout/` + `stores/` + `styles/`

- `AppLayout.svelte` — 顶栏 + 内容区；侧栏显隐状态（sidebarOpen，非持久化）；面包屑（crumb 按路由映射）
- `Sidebar.svelte` — 常驻侧栏，顶栏按钮切换显隐（宽度 224↔0 过渡动画），非抽屉非浮层
- `TopBar.svelte` — 侧栏切换按钮（panel-left 图标，40px 大号）+ 主题切换（太阳/月亮）
- `stores/persistent.ts` — localStorage 包装 store
- `stores/settings.ts` — theme('light'|'dark')/sqlEngine/animationSpeed/showHints，toggleTheme
- `stores/progress.ts` — topic mastery/错题/streak，addMistake/updateTopicMastery
- `styles/app.css` — 亮暗双 token 体系（:root 与 .dark），字体、间距、按钮、标签组件类

## 5. 页面层 — `structvis/src/routes/`

- `/`（首页）— 卡片式导航，planned 项禁用态
- `/ds`、`/db` — 目录页
- `/ds/quick-sort`、`/ds/binary-tree`、`/ds/linear-list`、`/ds/stack-queue`、`/db/sql` — 播放器页：页头 + 数据面板（示例/自定义互斥切换 + 校验）+ 播放器（player-wrap 剩余空间居中）；stack-queue 页面板含结构切换（栈/队列）并与其他操作合并为一行
- `/progress` — 进度展示
- 占位：`/db/tables`、`/db/index`（规划中）
- 布局：`+layout.ts`（prerender/ssr=false? 静态导出）、`layout.css`

## 6. 规划中系统（planned）

- `lib/data/` 数据层 — 空目录，练习数据当前由引擎内嵌
- 图结构可视化（visualization/graph 不存在）— 对应 /ds 图结构导航 planned
- 残余占位页 tables / index
