# Git 热点与耦合分析

> generated_by: nexus-mapper v2
> verified_at: 2026-08-03
> provenance: git_detective.py 产出（90 天窗口）
> 强制降级说明：**仓库仅 5 commits，且工作区存在大量未提交变更**（`git status` 显示 v0.2 全量 + v0.3 首件均未入库：basicsort/、db/、sql/Dml、er/btree 渲染器、content/、TopicGrid、docs/ 等均为 untracked 或 modified）。因此 hotspots 数据基于已提交历史，**不代表当前活跃变更的真实热点**。

## 基础数据

- 提交数：5；作者数：1
- 结构：`559fa85` 基线 → `2cf0101` v0.1 扩充 → `81509fa` 首次 map → `8982eed` 栈队列 → `b257671` 更新 map；**之后 v0.2 与 v0.3 首件全部未提交**

## Hotspots（全部 low risk，无排序意义）

- changes=3：`.nexus-map/*`（INDEX/systems/test_coverage/concept_model/git_forensics，3 次均为"随迭代重写"）、`AppLayout.svelte`、`AlgoPlayer.svelte`、`types.ts`
- changes=2：`Sidebar`、`TopBar`、`ControlBar`、`StackQueueEngine(+spec)`、`dependencies/domains/raw`、`routes/ds/stack-queue`

解读：与旧版结论一致——**播放器、布局、引擎契约是跨迭代稳定变更面**（types.ts ↔ AlgoPlayer ↔ AppLayout 三文件共现）。"新引擎落地 = 新增引擎目录 + 改 types.ts（renderType）+ 改 AlgoPlayer（渲染器分支）+ 页面"四改点模式继续成立。

## 新增文件（仅出现在后续提交中的断代）

- commit 2 新增：BinaryTreeEngine(+spec)、SinglyLinkedListEngine(+spec)、SelectEngine(+spec)、TreeRenderer、LinkedRenderer、SqlTableRenderer、visualization-utils.ts
- commit 4 新增：StackQueueEngine(+spec)、StackRenderer、首页强制收起侧栏
- commit 5 *未含 v0.2*：v0.2 的 13 引擎全族/er/btree 渲染/建表解析/db 页 均未入提交

## Coupling pairs

co_changes 且 coupling_score=1.0 的文件对均为"同轮同时改动"，无独立信号（insufficient history）。`types.ts ↔ AlgoPlayer ↔ AppLayout` 共现 3 次：引擎扩展示意图。

## 风险结论

- **insufficient history + 大面积未提交变更**：热点与耦合数据仅作定性参考，不得作为重构依据
- 工作区堆积的 v0.2/v0.3 变更一旦统一提交，"新引擎必改三件套"仍是主线，届时 map 需要重新生成
- 真正值得注意的耦合点（手动推断）：`types.ts`（契约）↔ 13 引擎 + AlgoPlayer + 7 渲染器；`app.css` token ↔ 全部渲染器；`AlgoPlayer.svelte` 单文件承载三模式 + 全屏 + 键盘 + 弹窗 + 两处 timeline（复杂度持续上升，拆分优先级高）