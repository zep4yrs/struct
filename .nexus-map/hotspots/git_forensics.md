# Git 热点与耦合分析

> generated_by: nexus-mapper v2
> verified_at: 2026-08-02
> provenance: git_detective.py 产出（90 天窗口）
> 降级说明：仓库仅 2 commits（`559fa85` 基线 + `2cf0101` v0.1 扩充），热点/耦合数据无统计意义，以下为限制性解读

## 基础数据

- 提交数：2；作者数：1
- 结构：一次全量基线（71 文件）+ 一次内容扩充（30 文件 +3310/-200）

## Hotspots（全部 low risk，无排序意义）

20 个文件 changes=2（两轮提交都改动），包括：AlgoPlayer/ControlBar/PracticePanel（player 三件套）、AppLayout/Sidebar/TopBar、QuickSortEngine、ArrayRenderer、settings.ts、app.css、4 个播放器页、AGENTS.md。

解读：这不是"核心热点"证据，而是"两轮全量迭代都触及的文件"。唯一可推断的事实：**播放器、布局、引擎契约、主题 token 是跨迭代稳定变更面**，与 dependencies.md 的风险提示（types.ts/app.css 影响半径大）相互印证。

## 新增文件（仅出现在 commit 2）

- 引擎：BinaryTreeEngine(+spec)、SinglyLinkedListEngine(+spec)、SelectEngine(+spec)
- 渲染器：TreeRenderer、LinkedRenderer、SqlTableRenderer、visualization-utils.ts
- 这些新系统自创建起即带测试（对比 QuickSortEngine 无测试 → 测试实践在演进）

## Coupling pairs

co_changes=2 且 coupling_score=1.0 的文件对：**全部 20 个 changes=2 文件互为完全耦合**（两轮都同时变动）。无解释价值，跳过。

## 风险结论

- insufficient history：热点与耦合结论仅作定性参考，不得作为重构决策依据
- 真正值得注意的耦合点（手动推断）：`types.ts`（契约）与 4 引擎 + AlgoPlayer + 4 渲染器；`app.css` token 与全部渲染器
