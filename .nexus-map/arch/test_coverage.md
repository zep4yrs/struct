# 静态测试面

> generated_by: nexus-mapper v2
> verified_at: 2026-08-03
> provenance: 文件系统扫描 + vitest 配置阅读 + 实际运行（128/128 通过）；v1.0 图专题第二增量已运行 `npm run test`

## 测试配置

- 运行器：Vitest v4（`test:unit` 脚本），node 环境，`requireAssertions: true`（强制每条测试必须有断言）
- 命令：`npm run test`（CI 一键）、`npm run test:unit`（watch）
- 引擎 spec 与引擎源码同目录（`*.spec.ts`），共 **18 个 spec 文件 / 128 个测试**

## 覆盖矩阵（当前实测）

| spec 文件 | 数量 | 覆盖核心模块 | 验证内容 |
| --- | --- | --- | --- |
| `engines/algorithm/basicsort/BubbleSortEngine.spec.ts` | 4 | BubbleSortEngine | 升序终态、交换上浮、sorted 高亮、有序输入零交换 |
| `engines/algorithm/basicsort/InsertionSortEngine.spec.ts` | 4 | InsertionSortEngine | 插入序、边界 |
| `engines/algorithm/basicsort/SelectionSortEngine.spec.ts` | 4 | SelectionSortEngine | 选择最小、交换次数 |
| `engines/algorithm/basicsort/MergeSortEngine.spec.ts` | 4 | MergeSortEngine | 归并终态、递归区间 |
| `engines/algorithm/binarytree/BinaryTreeEngine.spec.ts` | 4 | BinaryTreeEngine | 前/中/后/层序四遍历访问序列 |
| `engines/algorithm/linkedlist/SinglyLinkedListEngine.spec.ts` | 3 | SinglyLinkedListEngine | 插入/删除步骤、data 序列、高亮 indices |
| `engines/algorithm/stackqueue/StackQueueEngine.spec.ts` | 7 | StackQueueEngine | push/pop/enqueue/dequeue、renderType 切换、栈顶一致性、空栈下溢、题随结构切换 |
| `engines/algorithm/graph/GraphTraversalEngine.spec.ts` | 9 | **GraphTraversalEngine（v1.0 图专题新增）** | BFS/DFS 访问序列、graph 快照状态累积、frontier 标记、非连通图、applyCustom 校验/重建、applyPreset、demoScript 覆盖 |
| `engines/algorithm/graph/MstEngine.spec.ts` | 12 | **MstEngine（v1.0 图专题第二增量）** | Prim/Kruskal 选边顺序与总权一致（16）、成环边 tried、selected 快照、候选集 frontier、applyCustom 连通性/格式/起点校验、自定义图运行、demoScript 覆盖 |
| `engines/algorithm/graph/DijkstraEngine.spec.ts` | 11 | **DijkstraEngine（v1.0 图专题第二增量）** | 最终 dist 正确性、确定顶点顺序、松弛帧 nodeNote/候选态、松弛无效帧、最短路径树 selected、有向/无向自定义、不可达 -1、格式校验、demoScript 覆盖 |
| `engines/algorithm/demoScript.spec.ts` | 2 | **讲授剧本（v0.3 新增）** | 9 引擎 demoScript 覆盖实际产生的全部步骤类型（default 除外）；SelectEngine presenterNote 优先于类型旁白 |
| `engines/db/ErEngine.spec.ts` | 9 | ErEngine | E-R 图实体/联系/关系模式生成 |
| `engines/db/IndexEngine.spec.ts` | 11 | IndexEngine | B+ 树查找/范围/插入分裂关键帧 |
| `engines/db/NormalizeEngine.spec.ts` | 7 | NormalizeEngine | 范式判定 |
| `engines/sql/SelectEngine.spec.ts` | 20 | SelectEngine | WHERE 收缩、GROUP BY、投影、ORDER BY、多表连接、子查询 |
| `engines/sql/DmlEngine.spec.ts` | 8 | DmlEngine | INSERT/UPDATE/DELETE 分步 |
| `engines/sql/create-table.spec.ts` | 8 | create-table.ts | CREATE TABLE 解析、约束/外键 |
| `vitest-examples/greet.spec.ts` | 1 | 样板 | vitest 环境自检（历史样板） |

## 证据缺口

- **QuickSortEngine 无专属 spec**：排序正确性由 demoScript.spec 间接覆盖步骤类型，但 Lomuto 分区/指针关键帧断言缺失（历史遗留，v0.3 未补）
- **渲染器无测试**：7 个 Canvas 渲染器无测试，也无 visual regression 基建；Canvas 在 node 环境不可测，属计划外
- **组件层无测试**：AlgoPlayer（三模式/键盘/全屏）、ControlBar、PracticePanel、页面无组件测试
- **stores 无测试**：progress/settings/persistent 的 localStorage 逻辑无测试
- **实际运行验证**：`npm run check`（svelte-check 0 errors）、`npm run test`（128/128）、`npm run build`（adapter-static 全量预渲染到根 `docs/`）本轮均通过；lint 仅对改动文件格式化，`prettier --check` 全量仍有历史欠账（InsertionSortEngine.spec.ts、StackQueueEngine.ts）