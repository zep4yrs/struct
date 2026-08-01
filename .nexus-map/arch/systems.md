# 系统边界 — Systems

> generated_by: nexus-mapper v2
> verified_at: 2026-08-01
> provenance: AST-backed for TypeScript; Svelte 组件关系 inferred from manual inspection（svelte 为 module-only 覆盖，见 raw/ast_nodes.json stats）

## 系统一览

| 系统 | 状态 | 代码位置 | 职责 |
|------|------|---------|------|
| algo-engine 算法步进引擎层 | implemented | `structvis/src/lib/engines/algorithm/` | 引擎预生成全部关键帧步骤，实现 AlgorithmEngine 接口；当前仅 QuickSortEngine |
| player-visualization 播放器与可视化层 | implemented | `structvis/src/lib/components/player/` + `src/lib/visualization/array/` | GSAP timeline 播放器、伪代码面板、控制条、Canvas 数组渲染器 |
| ui-layout 布局与页面层 | implemented | `structvis/src/routes/` + `src/lib/components/layout/` + `ui/` | 应用骨架、首页内容地图、知识点页面 |
| state-layer 本地持久化状态层 | implemented | `structvis/src/lib/stores/` | progress/settings/persistent，localStorage 持久化 |
| sql-engine SQL 引擎层 | planned | `structvis/src/lib/engines/sql/`（目录为空） | SQL 执行适配（sql.js/MySQL），未开始 |
| content-data 教材内容数据层 | planned | `structvis/src/lib/data/`（目录为空） | 章节/题库/示例数据库，未开始 |

## 各系统边界细节

### 1. algo-engine（置信度高）
- 唯一实现：`QuickSortEngine`（Lomuto 分区；关键帧类型覆盖 init/compare/swap/pivot-select/partition-start/partition-end/recurse-enter/recurse-exit/complete/default）
- 契约层：`types.ts` 定义 AlgorithmStep/Highlight/StepType/RenderType/PracticeQuestion/AlgorithmEngine
- 边界规则：引擎是纯逻辑的，不 import 任何 DOM/Canvas/Svelte 内容（AST import 边确认仅依赖 `../types`）
- 练习题数据（PRACTICE_QUESTIONS）内嵌在引擎中，未独立成 data 文件

### 2. player-visualization（置信度高）
- `AlgoPlayer.svelte`：唯一状态修改入口（play/pause/prev/next/reset/jumpTo/changeSpeed），单向数据流；GSAP timeline 步骤时长表驱动浮点 playbackPos；**阶段 A 新增练习模式**：接收 `topicId`/`topicName` props，播放/步进到 `practiceQuestions` 命中步骤时暂停出题，答题期间拦截全部控制操作
- `PracticePanel.svelte`（阶段 A 新增）：练习浮层，选项 A-D、键盘 1-4/Enter/H、提示框、答后解析；答对调 `updateTopicMastery(+10)`，答错调 `addMistake` 并记入错题本
- `ControlBar.svelte`：键盘快捷键（空格=播放/暂停、左右箭头=步进）+ 进度条拖拽 + 倍速（0.5/1/1.5/2）；新增 `disabled` prop（答题期间禁用）
- `ArrayRenderer.svelte`：Canvas 柱状图，`precomputeBarIdentities` 追踪交换动画
- **当前局限**：`engine.renderType === 'array'` 分支硬编码，tree/graph/linkedlist/sql-table 渲染器均未实现

### 3. ui-layout（置信度高）
- `AppLayout.svelte`：TopBar（面包屑）+ Sidebar（教材章节分组导航）+ 内容区；面包屑按 `/ds/*`、`/db/*`、`/progress` 路由前缀生成
- 首页 `+page.svelte`：内容地图（ds 6 卡片 / db 6 卡片，planned 项置灰）
- 完整页面仅 `/ds/quick-sort`；其余 6 个路由页面为统一"WORK IN PROGRESS"占位模板
- `+layout.svelte` 在 onMount 调用 `updateStreak()`（这是 state-layer 目前唯一的 UI 接线点）

### 4. state-layer（置信度高，阶段 A 后接线基本完整）
- `persistentStore` 工厂：SSR 返回默认值，浏览器读写 localStorage，解析失败静默回退
- `progress.ts`：掌握度（>=80 完成）、错题、连续学习天数；**阶段 A 已接线**：`updateTopicMastery`/`addMistake` 由练习答题触发，`/progress` 页展示统计、掌握度列表与错题本
- `settings.ts`：theme（仅 'light'）、sqlEngine（仅 'sqljs'）、animationSpeed、showHints —— 预留扩展点，仍无 `/settings` 路由页面（残余断层）

### 5. sql-engine / 6. content-data（planned，置信度中）
- 设计契约见 `StructVis-长期开发文档.md` §3.3（SQLEngine 接口 + ExplainNode 统一格式）、§3.4（方言适配表）、§5.3（示例数据库清单）
- 目录已创建（占位意图明确）但无任何文件

## 边界之外的资产（非系统）

- `gsap_skilled_extracted/gsap-skills-main/` — 第三方 GSAP 官方 skills 插件包，供开发时参考 GSAP 用法，不应视为项目代码
- `N08-UI-Design.md` — 过时的 React 时代设计稿（技术栈与配色均已变更，见 domains.md）
- `ui-design-reference.html` — 视觉参考稿
- `.trae-html-share-packages/` — trae 分享包归档

## 已知证据缺口

- git 无历史：无法用热点数据佐证"核心系统"判断（降级）
- svelte module-only 覆盖：组件间 import 关系来自人工阅读，未经过 AST 验证
- `/settings` 页面与 settings store 的接线状态是动态的，后续若实现设置 UI，需重跑 nexus-mapper 更新本文件
