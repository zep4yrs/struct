# 核心领域概念

> generated_by: nexus-mapper v2
> verified_at: 2026-08-02
> provenance: manual inspection（领域概念来自长期开发文档与代码阅读，非 AST 推导）

## 1. 步进关键帧模型（algorithm-step）

- 引擎把一次算法执行编译为**关键帧序列**（steps），每帧含：`data`（当前数据结构快照）、`highlights`（高亮类型 + indices）、`pseudocodeLine`（伪代码行号）、`description`（字幕文本）
- 高亮类型集：`current`（琥珀）/ `compare`（学术蓝）/ `sorted`（绿）/ `pivot`（红）/ `swap` / `partition` / `pointer-i` / `pointer-j` / `recurse-enter|exit`
- 数据编码约定：数组=值序列；树=层序（-1 空节点）；链表=值序列（新节点 index -1）；SQL=可选 `step.table`（SqlTableData 列/行快照）
- 播放器按 `renderType` 选择渲染器，渲染器只消费 steps + playbackPos（浮点，插值用）

## 2. SQL 逻辑执行顺序（sql-execution-order）

- 教学核心：`FROM → WHERE → GROUP BY → SELECT → ORDER BY`
- 解析器"尾先切子句"（ORDER BY → GROUP BY → WHERE → FROM），非法 SQL 抛错（页面 try/catch 显示）
- WHERE 逐行求值并**实际收缩**中间结果（_currentTable/_currentRows），GROUP BY 用 COUNT(*)，SELECT 投影列，ORDER BY 单列排序

## 3. 演示 / 练习双模式

- **演示**：纯播放，不弹题，用于连贯观察
- **练习**：播放到 `practiceQuestions[].stepIndex` 暂停弹题（PracticePanel），答题后 `updateTopicMastery(+10/错)` / `addMistake` 落库，答过的题不重复弹（answeredStepIds）
- 模式切换在播放器右上角（mode-switch），不重置播放位置

## 4. 主题 token 体系（theme-tokens）

- `app.css` 定义 `:root`（亮）与 `.dark` 两套 token（paper/surface/ink/accent 等 ~30 个）
- `settings.theme` 持久化；`+layout.svelte` `$effect` 同步 `<html class="dark">`
- 渲染器不硬编码颜色：`resolveCSSVar('--color-x')` 取值，`watchThemeChange`（MutationObserver 监听 html class）触发重绘——暗色切换无需渲染器感知业务

## 5. 学习进度（learning-progress）

- `progress.ts` store：topic 掌握度（0-100，答题累积）、错题列表（含错误答案/正确解释）、连续学习天数
- 由 PracticePanel 答题驱动写入；`/progress` 页读取展示
- 全量 localStorage 持久化（persistent store 包装）

## 6. 数据面板交互范式（页面层）

- 播放器页顶部数据面板：**示例 / 自定义互斥切换**（同一行交叉淡入淡出，隐藏方绝对定位不占位）
- 自定义输入带校验：数量上下限、数字合法性、位置范围、删除目标存在性；SQL 解析失败显示引擎错误
- 自定义后的引擎重建不丢当前模式/树（二叉树页 switchMode 保留自定义树）
