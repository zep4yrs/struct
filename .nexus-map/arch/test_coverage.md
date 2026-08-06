# 静态测试面

> generated_by: nexus-mapper v2
> verified_at: 2026-08-05
> provenance: 文件系统扫描 + vitest 配置阅读 + 实际运行（260/260 通过）；组件测试批已运行 `npm run test`

## 测试配置

- 运行器：Vitest v4（`test:unit` 脚本），`requireAssertions: true`（强制每条测试必须有断言）
- 双项目：`server`（node 环境，引擎/存储层）+ `client`（jsdom 环境，`.svelte.spec.ts` 组件测试，setup `src/test-setup.ts`：matchMedia / getBoundingClientRect / element.animate stub）
- 命令：`npm run test`（CI 一键）、`npm run test:unit`（watch）
- 引擎 spec 与引擎源码同目录（`*.spec.ts`），共 **29 个 spec 文件 / 260 个测试**

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
| `engines/algorithm/graph/TopoSortEngine.spec.ts` | 10 | **TopoSortEngine（v1.0 图专题收尾）** | Kahn 序列、入度 nodeNote、current/done/frontier 状态、序列单调增长、环检测 reject 帧、越界/自环校验、自定义无环图、demoScript 覆盖 |
| `engines/algorithm/graph/CriticalPathEngine.spec.ts` | 10 | **CriticalPathEngine（v1.0 图专题收尾）** | 关键活动索引、总工期、selected/tried 终态、ve/vl 标注、汇点 vl=ve、可延误时长、环图失败帧、格式/越界校验、汇点按 ve 定位、demoScript 覆盖 |
| `engines/algorithm/search/BinarySearchEngine.spec.ts` | 13 | **BinarySearchEngine（v1.0 补齐批 1）** | 命中/未命中路径、区间收缩帧、练习 stepIndex 有效、applyCustom 升序校验、applyPreset |
| `engines/algorithm/search/KMPEngine.spec.ts` | 11 | **KMPEngine（v1.0 补齐批 1）** | buildNext 阶段 next 数组、匹配 i 单调、失配 j 回退、50 步总数、练习 |
| `engines/algorithm/bst/BstEngine.spec.ts` | 14 | **BstEngine（v1.0 补齐批 2）** | 查找/插入/删除三模式、层序快照、中序有序、双孩子删除后继顶替、重复关键字不插入、applyCustom 校验 |
| `engines/algorithm/huffman/HuffmanEngine.spec.ts` | 10 | **HuffmanEngine（v1.0 补齐批 2）** | 最小两棵合并、WPL=60 终态、森林 roots 收敛、练习、applyCustom |
| `engines/algorithm/hash/HashTableEngine.spec.ts` | 18 | **HashTableEngine（v1.0 补齐批 3）** | 线性探测布局 [22,01,46,13,67,…]、30/67 探测序列、ASL 统计、链地址法链结构、查找命中/失败、applyCustom 校验 |
| `engines/algorithm/quicksort/QuickSortEngine.spec.ts` | 16 | **QuickSortEngine（技术债批补齐）** | Lomuto 分区不变式、pivot 选中尾元素、pointer-i/j 关键帧、swap 帧数据真交换、分区结束左≤pivot<右、递归深度 |
| `engines/algorithm/demoScript.spec.ts` | 2 | **讲授剧本（v0.3 新增）** | 17 引擎 demoScript 覆盖实际产生的全部步骤类型（default 除外）；SelectEngine presenterNote 优先于类型旁白 |
| `stores/stores.spec.ts` | 9 | **progress/settings 存储（技术债批新增）** | persistentStore SSR 双环境（vi.doMock('$app/environment')）、toggleTheme、updateTopicMastery 0-100 夹取与 80 完成、addMistake 字段、updateStreak 首日/连续/同日/重置 |
| `components/player/ControlBar.svelte.spec.ts` | 9 | **ControlBar（组件测试批）** | 步数/进度条宽度/速度高亮渲染、按钮回调、进度条比例 onJump 夹取、键盘 Space/←/→/Home/End、disabled 全失效 |
| `components/player/PracticePanel.svelte.spec.ts` | 11 | **PracticePanel（组件测试批）** | 题目/选项/键渲染、提交判题正确/错误回调与反馈、提交后禁用+✓/✗+继续、数字键+Enter、H 键与按钮提示切换、无提示不渲染 |
| `engines/db/ErEngine.spec.ts` | 9 | ErEngine | E-R 图实体/联系/关系模式生成 |
| `engines/db/IndexEngine.spec.ts` | 11 | IndexEngine | B+ 树查找/范围/插入分裂关键帧 |
| `engines/db/NormalizeEngine.spec.ts` | 7 | NormalizeEngine | 范式判定 |
| `engines/sql/SelectEngine.spec.ts` | 20 | SelectEngine | WHERE 收缩、GROUP BY、投影、ORDER BY、多表连接、子查询 |
| `engines/sql/DmlEngine.spec.ts` | 8 | DmlEngine | INSERT/UPDATE/DELETE 分步 |
| `engines/sql/create-table.spec.ts` | 8 | create-table.ts | CREATE TABLE 解析、约束/外键 |
| `vitest-examples/greet.spec.ts` | 1 | 样板 | vitest 环境自检（历史样板） |

## 证据缺口

- **渲染器无测试**：10 个 Canvas 渲染器无测试，也无 visual regression 基建；Canvas 在 node 环境不可测，属计划外
- **AlgoPlayer 无组件测试**：三模式/键盘/全屏/投影交互依赖 GSAP 时间线，测试成本高，尚未覆盖
- **实际运行验证**：`npm run check`（svelte-check 0 errors）、`npm run test`（260/260，双项目）、`npm run build`（adapter-static 全量预渲染到根 `docs/`）本轮均通过；`prettier --check` 全量已清零