# 静态测试面

> generated_by: nexus-mapper v2
> verified_at: 2026-08-06
> provenance: 文件系统扫描 + vitest 配置阅读 + 实际运行（364/364 通过）+ Playwright E2E 22/22 通过

## 测试配置

- 运行器：Vitest v4（`test:unit` 脚本），`requireAssertions: true`（强制每条测试必须有断言）
- 双项目：`server`（node 环境，引擎/存储层）+ `client`（jsdom 环境，`.svelte.spec.ts` 组件/渲染器测试，setup `src/test-setup.ts`：matchMedia / getBoundingClientRect / element.animate stub + 记录式 canvas 2D 上下文 + 内联设计 token 供 resolveCSSVar）
- 命令：`npm run test`（CI 一键）、`npm run test:unit`（watch）
- 引擎 spec 与引擎源码同目录（`*.spec.ts`），共 **36 个 spec 文件 / 364 个测试**

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
| `components/player/AlgoPlayer.svelte.spec.ts` | 17 | **AlgoPlayer（播放器测试批）** | 渲染/两位补零、练习弹题/答对 mastery/答错 addMistake/演示不弹题、播放暂停、键盘步进、Home/End、演示数据预设重建、modal-close/遮罩关闭、自定义合法重建/非法报错、投影模式进出/旁白/强制演示、投影内播放 |
| `visualization/array/ArrayRenderer.svelte.spec.ts` | 11 | **ArrayRenderer（渲染器测试批）** | 数值/索引绘制、compare/sorted/pivot/swap/pointer 颜色映射（记录式 canvas 断言 fillStyle）、i/j/基准标签颜色、partition 虚线矩形、空 steps 防御 |
| `visualization/renderers.svelte.spec.ts` | 28 | **全渲染器冒烟（渲染器测试批）** | 11 渲染器 14 场景：关键文本绘制（栈/队/树/链表/KMP 两阶段与 found/B+ 树/E-R/哈希两种模式/图/SQL 表）、中间播放位置健壮性 |
| `engines/db/ErEngine.spec.ts` | 9 | ErEngine | E-R 图实体/联系/关系模式生成 |
| `engines/db/IndexEngine.spec.ts` | 11 | IndexEngine | B+ 树查找/范围/插入分裂关键帧 |
| `engines/db/NormalizeEngine.spec.ts` | 7 | NormalizeEngine | 范式判定 |
| `engines/sql/SelectEngine.spec.ts` | 20 | SelectEngine | WHERE 收缩、GROUP BY、投影、ORDER BY、多表连接、子查询 |
| `engines/sql/AdvancedQueryEngine.spec.ts` | 17 | **AdvancedQueryEngine（v0.5 新增）** | HAVING 人数/平均分过滤、LEFT JOIN 保留未选课学生、UNION 去重、EXISTS/NOT EXISTS 相关子查询（SELECT 1 常量列直判非空）、applyPreset/custom sql |
| `engines/db/TransactionEngine.spec.ts` | 9 | **TransactionEngine（v0.5 新增）** | commit/rollback/lost-update 三模式、Σ 守恒终态、undo 日志回滚恢复、丢失更新 T2 覆盖 T1、步骤链 BEGIN/一致性检查/COMMIT |
| `engines/algorithm/graph/GraphStorageEngine.spec.ts` | 11 | **GraphStorageEngine（v0.6 新增）** | 邻接矩阵/邻接表两种存储模式、init/每条边/complete 步骤数正确、对称填充、双向链表、applyPreset/applyCustom 重建、带权图、pseudocode 切换、2 道练习、graph 快照节点数、getCurrentStep/getProgress |
| `engines/sql/DmlEngine.spec.ts` | 8 | DmlEngine | INSERT/UPDATE/DELETE 分步 |
| `engines/sql/ViewEngine.spec.ts` | 11 | ViewEngine（v0.4 新增） | CREATE VIEW 解析、基表更新后视图自动刷新、隐藏列/聚合/连接视图、伪代码计划 |
| `engines/sql/create-table.spec.ts` | 8 | create-table.ts | CREATE TABLE 解析、约束/外键 |
| `vitest-examples/greet.spec.ts` | 1 | 样板 | vitest 环境自检（历史样板） |

## E2E 测试面（Playwright，v0.4 验收新增）

- 命令：`npm run test:e2e`（等价 `npx playwright test`）；`npm run test:all` 先单测后 E2E
- 配置：`playwright.config.ts` — chromium 单项目、baseURL `http://localhost:5173/struct`、webServer 自动起 vite dev（`--port 5173 --strictPort`）；`test-results/`、`playwright-report/` 已入 .gitignore
- 用例（`e2e/app.spec.ts`，23 个）：首页区块、冒泡排序页渲染（引擎名/总步数/9 行伪代码）、下一步推进+伪代码激活行+Home、播放/暂停自动推进、演示数据预设重建、自定义输入合法重建/非法报错、练习答对/答错弹题流、投影模式进入/ArrowRight 推进/Esc 退出、暗色主题 html.dark+theme-color 同步、侧边栏导航跳转、进度页空状态、搜索弹窗（过滤/Enter 跳转/无结果/`/` 快捷键）、数据库·概述（概念区块+练习即时反馈）、数据库·高级查询（渲染/四种子句切换/HAVING 逐步至完成/练习弹题）、数据库·事务与权限（事务页逐步至回滚结论、用户权限页概念+练习）、视图页（渲染/演示数据切换/练习弹题）、**设置页（动画速度/显示提示/主题切换）**
- **E2E 基建坑位备忘**：① vite dev 冷启动首编有水合竞态——SSR HTML 已渲染但 Svelte 事件系统未挂载，首个加载页交互全失效（点击已派发但无响应），功能探测后 `reload` 可恢复；测试用「点击下一步轮询 `.current-num` 变 02」与「主题开关 toggle 往返」两个水合等待 helper（`waitForHydrated`/`waitForHydratedGlobal`）；② 真实 GSAP tween 下 `playbackPos` 滞后于 `currentStepIdx`（compare 步长 1s），连续步进前须 `settleTween`（等 1.3s），否则 `floor(playbackPos)+1` 仍指旧步骤；③ 主题按钮文案随状态翻转，恢复点击须按新文案查找；④ 自定义弹窗 aria-label 来自 `engine.customConfig.title`（冒泡排序为「自定义数据」），非法输入文案为 `"x" 不是有效数字`；⑤ 全量并行（12 workers）下播放器控制时序 flaky——`tweenTo` 控制 tween 是独立 tween，`tl.getTweensOf(tl)` 漏杀会导致 Home/重建后播放头被拉回（currentStepIdx 漂移），已改 `gsap.killTweensOf(tl)` 治本并连续 3 轮全量验证；⑥ 访问深层路由须用全路径（`goto('/struct/db/view')`），`goto('/db/view')` 会解析到 host 根而命中 base 提示页；⑦ **`tweenTo(idx)/seek(idx)` 不可把步骤序数当 timeline 秒数**——非 1s 步长（swap=1.2、complete=1.5）会错位导致卡步死循环（事务回滚页预设切换后卡 ROLLBACK 的根因），v0.5 已改 `stepEndSeconds[target]` 秒数换算（AlgoPlayer.buildTimeline 构建换算表，单测断言同步改为秒数）

## 证据缺口

- **Canvas 像素级无验证**：记录式 stub 断言绘制调用与颜色，不验证像素/布局视觉结果（缺 visual regression 基建，属计划外）
- **实际运行验证**：`npm run check`（svelte-check 0 errors）、`npm run test`（364/364，双项目）、`npm run test:e2e`（22/22）、`npm run build`（adapter-static 全量预渲染到根 `docs/`）本轮均通过；`prettier --check` 全量已清零
- **测试基建坑位备忘**：① Svelte 5 transition 依赖 WAAPI，`element.animate` stub 必须在微任务中触发 `onfinish`，否则弹窗 outro 永不完成、节点不移除；② GSAP timeline 被 mock 后 `playbackPos` 不随动画推进，练习流测试需通过捕获 `tl.to` 的 renderProxy/onUpdate 手动 `advanceTo(n)` 模拟推进；③ 弹窗关闭断言需 `waitFor`（outro 跨多轮微任务）；④ AlgoPlayer 的 status 文本由 `$derived(currentStep)` 驱动，重建引擎后须先离开第 0 步再应用预设，`currentStepIdx` 发生真实变化才能重算；⑤ cmd 控制台 GBK 管道查看中文源码易现乱码（误判编码），中文文案核实以 read 工具/UTF-8 显式解码为准