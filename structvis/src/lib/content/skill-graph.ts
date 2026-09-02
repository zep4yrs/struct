/**
 * 技能图谱单源 — /map 页面的节点与依赖边唯一数据源。
 *
 * 约定（防漂移）：
 * - node.topicId 必须与 topics.ts 的 topicId 一致，node.href 必须等于对应课题的 href
 *   （content.spec.ts 做一致性校验，改课题时图谱会显式报错而不是静默漂移）
 * - 新增课程 = topics.ts 加一项 + 本文件加节点/边；目录/侧栏/搜索自动同步
 * - 边语义：from 是 to 的前置基础（箭头指向进阶方向）
 */

export interface SkillNode {
	id: string;
	title: string;
	href: string;
	topicId?: string;
	group: string;
	desc: string;
}

export interface SkillEdge {
	from: string;
	to: string;
}

/** 分组行序（自上而下）；组内按 NODES 数组顺序水平排列 */
export const SKILL_GROUP_ORDER = [
	'线性结构',
	'树形结构',
	'图结构',
	'排序算法',
	'查找',
	'动态规划',
	'回溯算法',
	'数据库 · 基础',
	'数据库 · 查询',
	'数据库 · 设计',
	'数据库 · 进阶',
	'数据库 · 运维',
	'数据库 · 实验'
] as const;

export const SKILL_NODES: SkillNode[] = [
	{
		id: 'array',
		title: '数组',
		href: '/catalog',
		group: '线性结构',
		desc: '最基础的内存连续存储结构'
	},
	{
		id: 'linear-list',
		title: '单链表',
		href: '/ds/linear-list',
		topicId: 'linear-list',
		group: '线性结构',
		desc: '指针连接的动态结构'
	},
	{
		id: 'stack-queue',
		title: '栈和队列',
		href: '/ds/stack-queue',
		topicId: 'stack-queue',
		group: '线性结构',
		desc: '受限的线性表：LIFO / FIFO'
	},
	{
		id: 'kmp',
		title: 'KMP 匹配',
		href: '/ds/kmp',
		topicId: 'kmp',
		group: '线性结构',
		desc: 'next 数组与模式匹配'
	},
	{
		id: 'trie',
		title: 'Trie 字典树',
		href: '/ds/trie',
		topicId: 'trie',
		group: '线性结构',
		desc: '公共前缀共享'
	},
	{
		id: 'mono-stack',
		title: '单调栈',
		href: '/ds/mono-stack',
		topicId: 'mono-stack',
		group: '线性结构',
		desc: '单调性维护 · O(n)'
	},
	{
		id: 'skip-list',
		title: '跳表',
		href: '/ds/skip-list',
		topicId: 'skip-list',
		group: '线性结构',
		desc: '多层链表 · O(log n)'
	},
	{
		id: 'binary-tree',
		title: '二叉树遍历',
		href: '/ds/binary-tree',
		topicId: 'binary-tree',
		group: '树形结构',
		desc: '前中后层序遍历'
	},
	{
		id: 'bst',
		title: '二叉搜索树',
		href: '/ds/bst',
		topicId: 'bst',
		group: '树形结构',
		desc: '有序二叉树的查找/插入'
	},
	{
		id: 'avl',
		title: 'AVL 树',
		href: '/ds/avl',
		topicId: 'avl',
		group: '树形结构',
		desc: '平衡因子与四种旋转'
	},
	{
		id: 'rbtree',
		title: '红黑树',
		href: '/ds/rbtree',
		topicId: 'rbtree',
		group: '树形结构',
		desc: '变色与旋转'
	},
	{
		id: 'huffman',
		title: '哈夫曼树',
		href: '/ds/huffman',
		topicId: 'huffman',
		group: '树形结构',
		desc: '最优带权二叉树'
	},
	{
		id: 'bplus-insert',
		title: 'B+ 树',
		href: '/ds/bplus-insert',
		topicId: 'bplus-insert',
		group: '树形结构',
		desc: '插入 · 分裂 · 键提升'
	},
	{
		id: 'graph-storage',
		title: '图的存储',
		href: '/ds/graph-storage',
		topicId: 'graph-storage',
		group: '图结构',
		desc: '邻接矩阵 / 邻接表'
	},
	{
		id: 'graph-traversal',
		title: '图的遍历',
		href: '/ds/graph-traversal',
		topicId: 'graph-traversal',
		group: '图结构',
		desc: 'BFS / DFS'
	},
	{
		id: 'mst',
		title: '最小生成树',
		href: '/ds/mst',
		topicId: 'mst',
		group: '图结构',
		desc: 'Prim / Kruskal'
	},
	{
		id: 'shortest-path',
		title: '最短路径',
		href: '/ds/shortest-path',
		topicId: 'shortest-path',
		group: '图结构',
		desc: 'Dijkstra'
	},
	{
		id: 'topo-sort',
		title: '拓扑排序',
		href: '/ds/topo-sort',
		topicId: 'topo-sort',
		group: '图结构',
		desc: 'AOV 网线性化'
	},
	{
		id: 'critical-path',
		title: '关键路径',
		href: '/ds/critical-path',
		topicId: 'critical-path',
		group: '图结构',
		desc: 'AOE 网的最长路径'
	},
	{
		id: 'astar',
		title: 'A* 寻路',
		href: '/ds/astar',
		topicId: 'astar',
		group: '图结构',
		desc: '启发式搜索'
	},
	{
		id: 'union-find',
		title: '并查集',
		href: '/ds/union-find',
		topicId: 'union-find',
		group: '图结构',
		desc: '路径压缩 · 按秩合并'
	},
	{
		id: 'tarjan',
		title: 'Tarjan SCC',
		href: '/ds/tarjan',
		topicId: 'tarjan',
		group: '图结构',
		desc: '强连通分量'
	},
	{
		id: 'max-flow',
		title: '最大流',
		href: '/ds/max-flow',
		topicId: 'max-flow',
		group: '图结构',
		desc: 'Edmonds-Karp 增广'
	},
	{
		id: 'bipartite',
		title: '二分图判定',
		href: '/ds/bipartite',
		topicId: 'bipartite',
		group: '图结构',
		desc: '交替染色'
	},
	{
		id: 'bubble-sort',
		title: '冒泡排序',
		href: '/ds/bubble-sort',
		topicId: 'bubble-sort',
		group: '排序算法',
		desc: '相邻交换 · O(n²)'
	},
	{
		id: 'insertion-sort',
		title: '插入排序',
		href: '/ds/insertion-sort',
		topicId: 'insertion-sort',
		group: '排序算法',
		desc: '插入有序前缀 · O(n²)'
	},
	{
		id: 'selection-sort',
		title: '简单选择排序',
		href: '/ds/selection-sort',
		topicId: 'selection-sort',
		group: '排序算法',
		desc: '选最小交换 · O(n²)'
	},
	{
		id: 'quick-sort',
		title: '快速排序',
		href: '/ds/quick-sort',
		topicId: 'quick-sort',
		group: '排序算法',
		desc: '分治分区 · O(n log n)'
	},
	{
		id: 'merge-sort',
		title: '归并排序',
		href: '/ds/merge-sort',
		topicId: 'merge-sort',
		group: '排序算法',
		desc: '两两合并 · O(n log n)'
	},
	{
		id: 'heap-sort',
		title: '堆排序',
		href: '/ds/heap-sort',
		topicId: 'heap-sort',
		group: '排序算法',
		desc: '建堆下滤 · O(n log n)'
	},
	{
		id: 'counting-sort',
		title: '计数排序',
		href: '/ds/counting-sort',
		topicId: 'counting-sort',
		group: '排序算法',
		desc: '频次统计回填 · O(n+k)'
	},
	{
		id: 'binary-search',
		title: '二分查找',
		href: '/ds/binary-search',
		topicId: 'binary-search',
		group: '查找',
		desc: '有序序列折半'
	},
	{
		id: 'hash-table',
		title: '哈希表',
		href: '/ds/hash-table',
		topicId: 'hash-table',
		group: '查找',
		desc: '散列与冲突处理'
	},
	{
		id: 'hash-probing',
		title: '线性探测',
		href: '/ds/hash-probing',
		topicId: 'hash-probing',
		group: '查找',
		desc: '开放定址探测路径'
	},
	{
		id: 'knapsack',
		title: '0-1 背包',
		href: '/ds/knapsack',
		topicId: 'knapsack',
		group: '动态规划',
		desc: '取与不取'
	},
	{
		id: 'lcs',
		title: 'LCS',
		href: '/ds/lcs',
		topicId: 'lcs',
		group: '动态规划',
		desc: '最长公共子序列'
	},
	{
		id: 'n-queens',
		title: 'N 皇后回溯',
		href: '/ds/n-queens',
		topicId: 'n-queens',
		group: '回溯算法',
		desc: '冲突剪枝 · 逐行试探'
	},
	{
		id: 'mysql-arch',
		title: 'MySQL 架构',
		href: '/db/mysql-arch',
		topicId: 'mysql-arch',
		group: '数据库 · 基础',
		desc: '一条 SQL 的旅程'
	},
	{
		id: 'sql',
		title: '数据查询',
		href: '/db/sql',
		topicId: 'sql',
		group: '数据库 · 查询',
		desc: 'SELECT 基础'
	},
	{
		id: 'join',
		title: 'JOIN 连接',
		href: '/db/join',
		topicId: 'join',
		group: '数据库 · 查询',
		desc: '内连接逐步匹配'
	},
	{
		id: 'left-join',
		title: 'LEFT JOIN',
		href: '/db/left-join',
		topicId: 'left-join',
		group: '数据库 · 查询',
		desc: '左外连接补 NULL'
	},
	{
		id: 'group-by',
		title: 'GROUP BY',
		href: '/db/group-by',
		topicId: 'group-by',
		group: '数据库 · 查询',
		desc: '分组聚合'
	},
	{
		id: 'subquery',
		title: '子查询',
		href: '/db/subquery',
		topicId: 'subquery',
		group: '数据库 · 查询',
		desc: '先子后外'
	},
	{
		id: 'advanced-query',
		title: '高级查询',
		href: '/db/advanced-query',
		topicId: 'sql-advanced',
		group: '数据库 · 查询',
		desc: '多表 JOIN / 子查询'
	},
	{
		id: 'window-function',
		title: '窗口函数',
		href: '/db/window-function',
		topicId: 'window-function',
		group: '数据库 · 查询',
		desc: 'ROW_NUMBER / RANK 等'
	},
	{
		id: 'update',
		title: '数据更新',
		href: '/db/update',
		topicId: 'dml',
		group: '数据库 · 查询',
		desc: 'INSERT / UPDATE / DELETE'
	},
	{
		id: 'tables',
		title: '建表练习',
		href: '/db/tables',
		topicId: 'tables',
		group: '数据库 · 设计',
		desc: 'DDL 与约束'
	},
	{
		id: 'index',
		title: '索引原理',
		href: '/db/index',
		topicId: 'index',
		group: '数据库 · 设计',
		desc: 'B+ 树索引'
	},
	{
		id: 'er',
		title: 'E-R 模型',
		href: '/db/er',
		topicId: 'er',
		group: '数据库 · 设计',
		desc: '实体-联系建模'
	},
	{
		id: 'normalize',
		title: '关系规范化',
		href: '/db/normalize',
		topicId: 'normalize',
		group: '数据库 · 设计',
		desc: '1NF~3NF 分解'
	},
	{
		id: 'isolation',
		title: '事务隔离',
		href: '/db/isolation',
		topicId: 'isolation',
		group: '数据库 · 进阶',
		desc: '并发异常演示'
	},
	{
		id: 'lock-deadlock',
		title: '锁机制与死锁',
		href: '/db/lock-deadlock',
		topicId: 'lock-deadlock',
		group: '数据库 · 进阶',
		desc: '行锁 · 等待图检测'
	},
	{
		id: 'view',
		title: '视图',
		href: '/db/view',
		topicId: 'view',
		group: '数据库 · 进阶',
		desc: '虚拟表'
	},
	{
		id: 'triggers',
		title: '触发器',
		href: '/db/triggers',
		topicId: 'triggers',
		group: '数据库 · 进阶',
		desc: '事件驱动'
	},
	{
		id: 'procedures',
		title: '存储过程',
		href: '/db/procedures',
		topicId: 'procedures',
		group: '数据库 · 进阶',
		desc: '预编译 SQL 集'
	},
	{
		id: 'explain-plan',
		title: '执行计划',
		href: '/db/explain-plan',
		topicId: 'explain-plan',
		group: '数据库 · 进阶',
		desc: 'EXPLAIN 与索引选择'
	},
	{
		id: 'transaction',
		title: '事务与并发',
		href: '/db/transaction',
		topicId: 'transaction',
		group: '数据库 · 进阶',
		desc: 'ACID / 隔离级别'
	},
	{
		id: 'users',
		title: '用户与权限',
		href: '/db/users',
		topicId: 'users',
		group: '数据库 · 运维',
		desc: 'GRANT / REVOKE'
	},
	{
		id: 'union-set',
		title: '集合运算',
		href: '/db/union-set',
		topicId: 'union-set',
		group: '数据库 · 实验',
		desc: 'UNION · INTERSECT · EXCEPT'
	},
	{
		id: 'case-expr',
		title: 'CASE 表达式',
		href: '/db/case-expr',
		topicId: 'case-expr',
		group: '数据库 · 实验',
		desc: '行内分支 · 分类统计'
	},
	{
		id: 'sql-functions',
		title: '函数演练',
		href: '/db/sql-functions',
		topicId: 'sql-functions',
		group: '数据库 · 实验',
		desc: '字符串/数值/日期/NULL'
	},
	{
		id: 'having-deep',
		title: 'WHERE vs HAVING',
		href: '/db/having-deep',
		topicId: 'having-deep',
		group: '数据库 · 实验',
		desc: '筛行 vs 筛组'
	},
	{
		id: 'distinct-paging',
		title: '去重与分页',
		href: '/db/distinct-paging',
		topicId: 'distinct-paging',
		group: '数据库 · 实验',
		desc: 'DISTINCT · LIMIT/OFFSET'
	},
	{
		id: 'join-variants',
		title: 'JOIN 家族',
		href: '/db/join-variants',
		topicId: 'join-variants',
		group: '数据库 · 实验',
		desc: 'RIGHT/FULL/CROSS/SELF'
	},
	{
		id: 'view-update',
		title: '视图更新限制',
		href: '/db/view-update',
		topicId: 'view-update',
		group: '数据库 · 实验',
		desc: '只读视图 · INSTEAD OF'
	},
	{
		id: 'index-fail',
		title: '索引失效实验',
		href: '/db/index-fail',
		topicId: 'index-fail',
		group: '数据库 · 实验',
		desc: 'EXPLAIN 实证五场景'
	},
	{
		id: 'explain-detail',
		title: 'EXPLAIN 详解',
		href: '/db/explain-detail',
		topicId: 'explain-detail',
		group: '数据库 · 实验',
		desc: '计划层级树'
	},
	{
		id: 'constraints',
		title: '约束体系',
		href: '/db/constraints',
		topicId: 'constraints',
		group: '数据库 · 实验',
		desc: '五大约束操作台'
	},
	{
		id: 'index-query',
		title: '索引查询回表',
		href: '/db/index-query',
		topicId: 'index-query',
		group: '数据库 · 实验',
		desc: '二级索引 → 主键回表'
	},
	{
		id: 'lock-gantt',
		title: '锁甘特图',
		href: '/db/lock-gantt',
		topicId: 'lock-gantt',
		group: '数据库 · 实验',
		desc: '循环等待 · 死锁检测'
	},
	{
		id: 'serial-schedule',
		title: '可串行化调度',
		href: '/db/serial-schedule',
		topicId: 'serial-schedule',
		group: '数据库 · 实验',
		desc: '冲突对 · 等价串行'
	}
];

export const SKILL_EDGES: SkillEdge[] = [
	{ from: 'array', to: 'linear-list' },
	{ from: 'linear-list', to: 'stack-queue' },
	{ from: 'binary-tree', to: 'bst' },
	{ from: 'bst', to: 'avl' },
	{ from: 'binary-tree', to: 'huffman' },
	{ from: 'graph-storage', to: 'graph-traversal' },
	{ from: 'graph-traversal', to: 'mst' },
	{ from: 'graph-traversal', to: 'shortest-path' },
	{ from: 'graph-traversal', to: 'topo-sort' },
	{ from: 'topo-sort', to: 'critical-path' },
	{ from: 'insertion-sort', to: 'quick-sort' },
	{ from: 'merge-sort', to: 'heap-sort' },
	{ from: 'binary-tree', to: 'heap-sort' },
	{ from: 'binary-search', to: 'bst' },
	{ from: 'hash-table', to: 'hash-probing' },
	{ from: 'avl', to: 'rbtree' },
	{ from: 'sql', to: 'advanced-query' },
	{ from: 'sql', to: 'join' },
	{ from: 'join', to: 'left-join' },
	{ from: 'sql', to: 'group-by' },
	{ from: 'sql', to: 'subquery' },
	{ from: 'transaction', to: 'isolation' },
	{ from: 'shortest-path', to: 'astar' },
	{ from: 'graph-storage', to: 'union-find' },
	{ from: 'hash-probing', to: 'knapsack' },
	{ from: 'knapsack', to: 'lcs' },
	{ from: 'bst', to: 'bplus-insert' },
	{ from: 'graph-traversal', to: 'tarjan' },
	{ from: 'shortest-path', to: 'max-flow' },
	{ from: 'graph-traversal', to: 'bipartite' },
	{ from: 'linear-list', to: 'skip-list' },
	{ from: 'stack-queue', to: 'mono-stack' },
	{ from: 'mysql-arch', to: 'sql' },
	{ from: 'kmp', to: 'trie' },
	{ from: 'sql', to: 'update' },
	{ from: 'sql', to: 'view' },
	{ from: 'advanced-query', to: 'window-function' },
	{ from: 'advanced-query', to: 'explain-plan' },
	{ from: 'sql', to: 'procedures' },
	{ from: 'sql', to: 'triggers' },
	{ from: 'update', to: 'transaction' },
	{ from: 'er', to: 'normalize' },
	{ from: 'tables', to: 'index' },
	{ from: 'index', to: 'explain-plan' },
	{ from: 'hash-table', to: 'counting-sort' },
	{ from: 'stack-queue', to: 'n-queens' },
	{ from: 'sql', to: 'union-set' },
	{ from: 'sql', to: 'case-expr' },
	{ from: 'sql', to: 'sql-functions' },
	{ from: 'group-by', to: 'having-deep' },
	{ from: 'sql', to: 'distinct-paging' },
	{ from: 'join', to: 'join-variants' },
	{ from: 'view', to: 'view-update' },
	{ from: 'index', to: 'index-fail' },
	{ from: 'index-fail', to: 'explain-detail' },
	{ from: 'tables', to: 'constraints' },
	{ from: 'index', to: 'index-query' },
	{ from: 'lock-deadlock', to: 'lock-gantt' },
	{ from: 'transaction', to: 'serial-schedule' }
];
