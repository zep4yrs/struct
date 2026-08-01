# 领域概念 — Domains

> generated_by: nexus-mapper v2
> verified_at: 2026-08-01
> provenance: 领域定义来自 `StructVis-长期开发文档.md`（根目录）人工阅读；仓库代码仅落地面向快速排序的教学可视化样板。unsupported language downgrade: 无（代码语言均受支持；svelte 为 module-only 覆盖）

## 核心领域概念

### 1. 交互式步进可视化（Stepwise Visualization）

项目第一性概念。不是被动看动画，而是每一步可暂停、可自己操作、可试错的练习。实现上拆为两层（文档 §3.7）：
- **引擎关键帧**（Engine Keyframes）：`AlgorithmStep` 序列，纯逻辑产出
- **渲染补间**（Render Tween）：GSAP timeline 在关键帧间插值，浮点 `playbackPos` 驱动，60fps 平滑

已实现：AlgoPlayer 用 GSAP timeline + `renderProxy.pos` 浮点进度驱动 ArrayRenderer；步骤时长表（STEP_DURATIONS）对应文档 §3.7 的节奏建议。

### 2. 算法引擎契约（AlgorithmEngine Contract）

"一套播放器 + N 个算法引擎"插件化模式的基石（文档 §3.6）：
- 引擎声明 `renderType`（array/tree/linkedlist/graph/sql-table），播放器按类型匹配渲染器 —— 当前仅 array 落地
- 引擎自带 `pseudocode` 与 `practiceQuestions` —— 练习数据阶段 A 已接线（AlgoPlayer 暂停出题 → PracticePanel 答题 → 进度接口）

### 3. 单向数据流（Unidirectional Data Flow）

文档 §3.8：引擎是唯一真相源，只有控制面板能改状态，其他模块纯渲染。实现已遵守（ControlBar 回调 → AlgoPlayer 控制函数 → engine.setProgress → 响应式视图）。

### 4. 知识点三模式（三种学习模式）

文档 §5.1：每个知识点 = 动画演示 + 分步练习 + 测试。当前代码：演示模式 ✓；**分步练习**（阶段 A：stepIndex 暂停出题、即时判错、错题本联动）✓；测试（考试）模式未开始。

### 5. 本地学习进度（Local Learning Progress）

掌握度（0-100，>=80 完成）、错题本、连续学习天数，localStorage 持久化（key: `structvis:progress`）。阶段 A 已接线：答对 `updateTopicMastery(+10)`、答错 `addMistake`，`/progress` 页展示统计/掌握度/错题本。

### 6. SQL 分步执行与方言适配（SQL Step Execution + Dialect Adaptation）

文档 §3.3/§3.4：统一 `SQLEngine` 接口（execute/explain/dialect），sql.js（SQLite WASM）与 MySQL 双实现，MySQL→SQLite 单向方言转换（AUTO_INCREMENT→AUTOINCREMENT、strip ENGINE= 等）。**全部未实现**（engines/sql/ 空）。

### 7. 编辑技术极简主义（Editorial Technical Minimalism）

设计系统定位（文档 §6.1，实现于 `src/lib/styles/app.css` @theme）：纸白 `#FAF9F6` + 墨黑 `#1A1A1A`、Fraunces（标题衬线）/ DM Sans（正文）/ JetBrains Mono（代码）、0.5px 细线、琥珀 `#D97706` 做步进高亮、极淡纸纹噪声。

## 文档体系说明（重要，避免误导）

| 文档 | 状态 | 说明 |
|------|------|------|
| `StructVis-长期开发文档.md`（根目录） | **权威，当前** | 与代码一致：Svelte 5、GSAP、Canvas 2D、编辑技术极简主义；含 v0.1→v1.0 路线图 |
| `N08-UI-Design.md`（根目录） | **过时** | 声称 React 19 + Radix UI + shadcn/ui + framer-motion + 学术蓝 `#2563EB`；技术栈与配色均与实现不符（Svelte 5 + Tailwind + 琥珀）。设计稿中的交互原则（键盘优先、状态可见、不靠颜色 alone、prefers-reduced-motion）已被实现继承，但 token 级内容以 app.css 为准 |
| `ui-design-reference.html` | 视觉参考稿 | 浏览器打开看效果用 |
| `structvis/README.md` | 脚手架模板 | sv 模板默认内容，无项目信息 |

## 路线图快照（verified_at: 2026-08-01，来源：StructVis-长期开发文档.md §4）

- **v0.1**（进行中）：快速排序 ✓ / 单链表 / 二叉树遍历 + SQL 基础查询 + 建表练习 + 进度系统 + 主题切换 + 响应式
- **v0.2**：栈队列、排序对比、二分查找、图 BFS/DFS、SQL 题库、数据更新、索引可视化、错题本、掌握度、自定义输入、速度控制
- **v0.3**：教学辅助（演示投影模式、讲授剧本、班级码、统计，可选 MySQL 后端）
- **v1.0**：两本教材核心章节全覆盖

> 注意：文档头部"状态：v0.1 规划中"未随代码更新，实际代码已推进到 M1（快速排序样板完成）。
