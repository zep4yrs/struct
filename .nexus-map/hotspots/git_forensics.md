# Git 热点与耦合分析

> generated_by: nexus-mapper v2
> verified_at: 2026-08-02
> provenance: git_detective.py 产出（90 天窗口）
> 降级说明：仓库仅 4 commits（`559fa85` 基线 + `2cf0101` v0.1 扩充 + `81509fa` map + `8982eed` 栈队列），热点/耦合数据仍无统计意义，以下为限制性解读

## 基础数据

- 提交数：4；作者数：1
- 结构：一次全量基线（71 文件）+ 一次内容扩充（30 文件 +3310/-200）+ 一次 map 更新 + 一次栈队列（7 文件 +1102/-25）

## Hotspots（全部 low risk，无排序意义）

- changes=3：AlgoPlayer、AppLayout、types.ts（引擎/渲染器每轮新增都要动这三处：播放器分发分支、布局状态、契约类型）
- changes=2：StackQueue 页面、全部 .nexus-map 文件、Sidebar/TopBar/ControlBar/PracticePanel、AGENTS.md 等 20+ 文件

解读：这不是"核心热点"证据，而是"每轮迭代都触及的文件"。可推断事实：**播放器、布局、引擎契约是跨迭代稳定变更面**，与 dependencies.md 的风险提示（types.ts/app.css 影响半径大）相互印证。新引擎落地 = 新增引擎目录 + 改 types.ts（RenderType）+ 改 AlgoPlayer（分支）+ 页面，共 4 处必改点。

## 新增文件（仅出现在后续提交）

- commit 2 新增：BinaryTreeEngine(+spec)、SinglyLinkedListEngine(+spec)、SelectEngine(+spec)、TreeRenderer、LinkedRenderer、SqlTableRenderer、visualization-utils.ts
- commit 4 新增：StackQueueEngine(+spec 7 测试)、StackRenderer —— 新系统自创建起即带测试（对比 QuickSortEngine 无测试 → 测试实践在演进）

## Coupling pairs

co_changes 且 coupling_score=1.0 的文件对均为"同轮同时变动"，无解释价值。可留意 types.ts ↔ AlgoPlayer ↔ AppLayout 三文件共现 3 次（引擎扩展的固定改动面）。

## 风险结论

- insufficient history：热点与耦合结论仅作定性参考，不得作为重构决策依据
- 真正值得注意的耦合点（手动推断）：`types.ts`（契约）与 5 引擎 + AlgoPlayer + 5 渲染器；`app.css` token 与全部渲染器
