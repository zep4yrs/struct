# 核心领域概念

> generated_by: nexus-mapper v2
> verified_at: 2026-08-03
> provenance: manual inspection（领域概念来自长期开发文档与代码阅读，非 AST 推导）

## 1. 步进关键帧模型（algorithm-step）

- 引擎把一次算法执行编译为**关键帧序列**（steps），每帧含：`data`（快照）、`highlights`（高亮类型 + indices）、`pseudocodeLine`、`description`（字幕文本）
- 高亮类型集：`pivot`/`compare`/`swap`/`sorted`/`current`/`partition`/`pointer-i`/`pointer-j`
- StepType（决定动画时长与讲授旁白匹配）：`init`/`compare`/`swap`/`pivot-select`/`partition-start`/`partition-end`/`recurse-enter`/`recurse-exit`/`complete`/`default`
- 数据编码约定：数组=值序列；树=层序（-1 空节点）；链表=值序列（新节点 index -1）；SQL=可选 `step.table`（SqlTableData 列/行快照）
- 播放器按 `renderType` 选择渲染器，渲染器只消费 steps + playbackPos（浮点，插值用）

## 2. SQL 逻辑执行顺序（sql-execution-order）

- 教学核心：`FROM → WHERE → GROUP BY → SELECT → ORDER BY → LIMIT`
- 解析器"尾先切子句"（ORDER BY → GROUP BY → WHERE → FROM），非法 SQL 抛错（页面 try/catch 显示）
- WHERE 逐行求值并**实际收缩**中间结果；GROUP BY 用 COUNT(*)，SELECT 投影列，ORDER BY 单列排序
- SelectEngine 各阶段步骤携带 `presenterNote` 讲授旁白（v0.3）

## 3. 播放三模式（player-modes）

- **演示**：纯播放，不弹题，用于连贯观察
- **练习**：播放到 `practiceQuestions[].stepIndex` 暂停弹题（PracticePanel），答题后 `updateTopicMastery(+10)` / `addMistake` 落库，答过的题不重复弹（answeredStepIds）；数字键 1-9/Enter/H 提示
- **投影（v0.3）**：`engine.demoScript` 存在时头部显示「投影」按钮 → 全屏覆盖，大字号旁白条（`step.presenterNote` 优先，回落 `demoScript` 按类型匹配，再回落 `description`），自动进出浏览器全屏；键盘 Esc 退出、Space 播放/暂停、←→ 步进；投影期间 ControlBar 键盘禁用（disabled prop）避免双触发

## 4. 讲授剧本（lesson-narrative）

- `DemoScriptItem = { type: StepType; narration: string }`，引擎侧声明按步骤类型的默认旁白
- `AlgorithmStep.presenterNote` 步骤级专用旁白，优先级高于类型级（SQL 关键阶段用）
- 完整性约束由 `demoScript.spec.ts` 强制：引擎实际产生的每个步骤类型（default 除外）都必须在 demoScript 有旁白覆盖

## 5. 主题 token 体系（theme-tokens）

- `app.css` 定义 `:root`（亮）与 `.dark` 两套 token（paper/surface/ink/accent 等）
- `settings.theme` 持久化；`+layout.svelte` `$effect` 同步 `<html class="dark">`
- 渲染器不硬编码颜色：`resolveCSSVar('--color-x')` 取值，`watchThemeChange`（MutationObserver）触发重绘

## 6. 学习进度（learning-progress）

- `progress.ts` store：topic 掌握度（0-100）、错题列表、连续学习天数；`/progress` 页读取展示；全量 localStorage 持久化

## 7. 数据面板交互范式（页面层）

- 播放器页顶部数据面板：**示例 / 自定义互斥切换**（同一行交叉淡入淡出，隐藏方绝对定位不占位）
- 自定义输入带校验（数量上下限、数字合法性、位置范围、删除目标存在性；SQL 解析失败显示引擎错误）
- 自定义后的引擎重建不丢当前模式/树（二叉树页 switchMode 保留自定义树）

## 8. 课程目录（content-catalog）

- `content/topics.ts` 是 `/`、`/ds`、`/db` 目录页唯一数据源：`dsTopics`（8 项，含 topicId 与 badge 分类「分步式」等）、`dbTopics`（6 项）
- `TopicGrid.svelte` 渲染卡片；`topicId` 与 progress store 的 key 及页面 AlgoPlayer 的 `topicId` prop 三者一致（进度落库靠它）