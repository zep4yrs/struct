/**
 * 课程内容目录 — 首页 / /ds /db 目录页、侧边栏导航、面包屑、全站搜索的唯一数据源。
 * topicId 与 progress store 的 topics key 以及播放器页 AlgoPlayer 的 topicId 保持一致。
 * group 用于侧边栏分组；crumb 用于 TopBar 面包屑（[current]…[/current] 标记当前页）。
 * 新增课程 = 在这里加一项 + 建页面 + 建引擎，导航/目录/搜索自动同步。
 */

export interface TopicCard {
	title: string;
	description: string;
	href: string;
	/** 对应 progress.topics 的 key；缺省则不显示掌握度进度条 */
	topicId?: string;
	/** 徽标文案（如 交互式 / 分步执行） */
	badge: string;
	/** 侧边栏分组名 */
	group: string;
	/** 面包屑文本（含 [current] 标记） */
	crumb: string;
	/** 规划中（当前无条目，保留支持） */
	planned?: boolean;
}

/** 侧边栏分组顺序（组内按 topics 数组顺序，即课程教学顺序） */
export const DS_GROUP_ORDER = [
	'线性结构',
	'树形结构',
	'图结构',
	'排序算法',
	'查找',
	'动态规划',
	'回溯算法'
] as const;
export const DB_GROUP_ORDER = ['基础', '进阶', '设计', '运维', '实验'] as const;

export const dsTopics: TopicCard[] = [
	{
		title: '快速排序',
		description: '分治策略 · 平均 O(n log n)',
		href: '/ds/quick-sort',
		topicId: 'quick-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]快速排序[/current]'
	},
	{
		title: '二叉树遍历',
		description: '前/中/后/层序 · 递归与迭代',
		href: '/ds/binary-tree',
		topicId: 'binary-tree',
		badge: '交互式',
		group: '树形结构',
		crumb: '数据结构 / 树 / [current]二叉树遍历[/current]'
	},
	{
		title: '单链表',
		description: '插入/删除 · 指针定位',
		href: '/ds/linear-list',
		topicId: 'linear-list',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]单链表[/current]'
	},
	{
		title: '栈和队列',
		description: '后进先出 · 先进先出',
		href: '/ds/stack-queue',
		topicId: 'stack-queue',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]栈和队列[/current]'
	},
	{
		title: '冒泡排序',
		description: '相邻交换上浮 · 稳定 · O(n²)',
		href: '/ds/bubble-sort',
		topicId: 'bubble-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]冒泡排序[/current]'
	},
	{
		title: '直接插入排序',
		description: '插入有序前缀 · 稳定 · O(n²)',
		href: '/ds/insertion-sort',
		topicId: 'insertion-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]直接插入排序[/current]'
	},
	{
		title: '简单选择排序',
		description: '选出最小交换 · 不稳定 · O(n²)',
		href: '/ds/selection-sort',
		topicId: 'selection-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]简单选择排序[/current]'
	},
	{
		title: '归并排序',
		description: '两两合并 · 稳定 · O(n log n)',
		href: '/ds/merge-sort',
		topicId: 'merge-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]归并排序[/current]'
	},
	{
		title: '堆排序',
		description: '建堆下滤 · 不稳定 · O(n log n)',
		href: '/ds/heap-sort',
		topicId: 'heap-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]堆排序[/current]'
	},
	{
		title: '希尔排序',
		description: '递减增量分组 · 不稳定 · O(n^1.3)',
		href: '/ds/shell-sort',
		topicId: 'shell-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]希尔排序[/current]'
	},
	{
		title: '基数排序',
		description: '按位分桶 · 稳定 · O(d·n)',
		href: '/ds/radix-sort',
		topicId: 'radix-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]基数排序[/current]'
	},
	{
		title: '计数排序',
		description: '频次统计按序回填 · 稳定 · O(n+k)',
		href: '/ds/counting-sort',
		topicId: 'counting-sort',
		badge: '交互式',
		group: '排序算法',
		crumb: '数据结构 / 排序 / [current]计数排序[/current]'
	},
	{
		title: '图的存储',
		description: '邻接矩阵 · 邻接表 · 空间对比',
		href: '/ds/graph-storage',
		topicId: 'graph-storage',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]图的存储[/current]'
	},
	{
		title: '图的遍历',
		description: 'BFS 队列扩散 · DFS 递归深入',
		href: '/ds/graph-traversal',
		topicId: 'graph-traversal',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]图的遍历[/current]'
	},
	{
		title: '最小生成树',
		description: 'Prim 扩张树 · Kruskal 避环选边',
		href: '/ds/mst',
		topicId: 'mst',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]最小生成树[/current]'
	},
	{
		title: '最短路径',
		description: 'Dijkstra 贪心 · dist 松弛',
		href: '/ds/shortest-path',
		topicId: 'shortest-path',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]最短路径[/current]'
	},
	{
		title: '拓扑排序',
		description: 'Kahn 入度法 · 环检测',
		href: '/ds/topo-sort',
		topicId: 'topo-sort',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]拓扑排序[/current]'
	},
	{
		title: '关键路径',
		description: 'AOE 网络 · ve/vl 判定',
		href: '/ds/critical-path',
		topicId: 'critical-path',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]关键路径[/current]'
	},
	{
		title: '串的模式匹配（KMP）',
		description: 'next 数组 · i 不回退 · O(n+m)',
		href: '/ds/kmp',
		topicId: 'kmp',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]串的模式匹配（KMP）[/current]'
	},
	{
		title: 'Sunday 匹配',
		description: '偏移表 · 大步跳跃 · 平均 O(n)',
		href: '/ds/sunday',
		topicId: 'sunday',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]Sunday 匹配[/current]'
	},
	{
		title: '最长回文子串',
		description: '中心扩展 · 相似度基础',
		href: '/ds/manacher',
		topicId: 'manacher',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 串 / [current]最长回文子串[/current]'
	},
	{
		title: '二叉搜索树',
		description: '查找 · 插入 · 删除',
		href: '/ds/bst',
		topicId: 'bst',
		badge: '交互式',
		group: '树形结构',
		crumb: '数据结构 / 树 / [current]二叉搜索树[/current]'
	},
	{
		title: '哈夫曼树',
		description: '带权路径长度 · 编码',
		href: '/ds/huffman',
		topicId: 'huffman',
		badge: '交互式',
		group: '树形结构',
		crumb: '数据结构 / 树 / [current]哈夫曼树[/current]'
	},
	{
		title: 'AVL 树',
		description: '平衡因子 · 四种旋转',
		href: '/ds/avl',
		topicId: 'avl',
		badge: '交互式',
		group: '树形结构',
		crumb: '数据结构 / 树 / [current]AVL 树[/current]'
	},
	{
		title: '二分查找',
		description: '有序表折半 · O(log n)',
		href: '/ds/binary-search',
		topicId: 'binary-search',
		badge: '交互式',
		group: '查找',
		crumb: '数据结构 / 查找 / [current]二分查找[/current]'
	},
	{
		title: '哈希表',
		description: '散列函数 · 冲突处理',
		href: '/ds/hash-table',
		topicId: 'hash-table',
		badge: '交互式',
		group: '查找',
		crumb: '数据结构 / 查找 / [current]哈希表[/current]'
	},
	{
		title: '哈希表 · 线性探测',
		description: '开放定址 · 探测路径 · ASL',
		href: '/ds/hash-probing',
		topicId: 'hash-probing',
		badge: '交互式',
		group: '查找',
		crumb: '数据结构 / 查找 / [current]哈希表 · 线性探测[/current]'
	},
	{
		title: '红黑树',
		description: '变色 · 旋转 · O(log n)',
		href: '/ds/rbtree',
		topicId: 'rbtree',
		badge: '交互式',
		group: '树形结构',
		crumb: '数据结构 / 树 / [current]红黑树[/current]'
	},
	{
		title: 'Trie 字典树',
		description: '公共前缀共享 · 自动补全',
		href: '/ds/trie',
		topicId: 'trie',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 串 / [current]Trie 字典树[/current]'
	},
	{
		title: 'A* 寻路',
		description: '启发式搜索 · f = g + h',
		href: '/ds/astar',
		topicId: 'astar',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]A* 寻路[/current]'
	},
	{
		title: '并查集',
		description: '森林集合 · 路径压缩 · 按秩合并',
		href: '/ds/union-find',
		topicId: 'union-find',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]并查集[/current]'
	},
	{
		title: 'Tarjan 强连通分量',
		description: 'dfn/low · 一次 DFS 求全部 SCC',
		href: '/ds/tarjan',
		topicId: 'tarjan',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]Tarjan 强连通分量[/current]'
	},
	{
		title: '割点检测',
		description: 'low ≥ dfn · 连通性关键点',
		href: '/ds/cut-vertices',
		topicId: 'cut-vertices',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]割点检测[/current]'
	},
	{
		title: 'LCA 最近公共祖先',
		description: '倍增上跳 · O(log n) 查询',
		href: '/ds/lca',
		topicId: 'lca',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]LCA 最近公共祖先[/current]'
	},
	{
		title: 'Bellman-Ford 最短路',
		description: '负权松弛 · 负环检测',
		href: '/ds/bellman-ford',
		topicId: 'bellman-ford',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]Bellman-Ford 最短路[/current]'
	},
	{
		title: '最大流 Edmonds-Karp',
		description: '增广路 · 瓶颈推流',
		href: '/ds/max-flow',
		topicId: 'max-flow',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]最大流 Edmonds-Karp[/current]'
	},
	{
		title: '二分图判定',
		description: '交替染色 · 无奇环',
		href: '/ds/bipartite',
		topicId: 'bipartite',
		badge: '交互式',
		group: '图结构',
		crumb: '数据结构 / 图 / [current]二分图判定[/current]'
	},
	{
		title: 'B+ 树插入',
		description: '多路平衡 · 叶满分裂 · 键提升',
		href: '/ds/bplus-insert',
		topicId: 'bplus-insert',
		badge: '交互式',
		group: '查找',
		crumb: '数据结构 / 查找 / [current]B+ 树插入[/current]'
	},
	{
		title: '单调栈',
		description: '每日温度 · 单调性维护 · O(n)',
		href: '/ds/mono-stack',
		topicId: 'mono-stack',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]单调栈[/current]'
	},
	{
		title: '跳表 Skip List',
		description: '多层链表 · 抛硬币层高 · O(log n)',
		href: '/ds/skip-list',
		topicId: 'skip-list',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]跳表 Skip List[/current]'
	},
	{
		title: '树状数组 Fenwick Tree',
		description: 'lowbit 跳跃 · 前缀和 O(log n)',
		href: '/ds/fenwick-tree',
		topicId: 'fenwick-tree',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]树状数组 Fenwick Tree[/current]'
	},
	{
		title: 'LRU 缓存',
		description: '哈希+双向链表 · O(1) 淘汰',
		href: '/ds/lru-cache',
		topicId: 'lru-cache',
		badge: '交互式',
		group: '线性结构',
		crumb: '数据结构 / 线性表 / [current]LRU 缓存[/current]'
	},
	{
		title: 'N 皇后回溯',
		description: '冲突剪枝 · 状态回退',
		href: '/ds/n-queens',
		topicId: 'n-queens',
		badge: '交互式',
		group: '回溯算法',
		crumb: '数据结构 / 回溯 / [current]N 皇后回溯[/current]'
	},
	{
		title: '0-1 背包',
		description: '动态规划 · 取与不取的抉择',
		href: '/ds/knapsack',
		topicId: 'knapsack',
		badge: '交互式',
		group: '动态规划',
		crumb: '数据结构 / 动态规划 / [current]0-1 背包[/current]'
	},
	{
		title: '最长公共子序列',
		description: 'LCS · 表格回溯',
		href: '/ds/lcs',
		topicId: 'lcs',
		badge: '交互式',
		group: '动态规划',
		crumb: '数据结构 / 动态规划 / [current]最长公共子序列 LCS[/current]'
	},
	{
		title: '最长递增子序列 LIS',
		description: 'DP 前驱扫描 · 可二分优化',
		href: '/ds/lis',
		topicId: 'lis',
		badge: '交互式',
		group: '动态规划',
		crumb: '数据结构 / 动态规划 / [current]最长递增子序列 LIS[/current]'
	},
	{
		title: '编辑距离',
		description: '插入删除替换 · 相似度度量',
		href: '/ds/edit-distance',
		topicId: 'edit-distance',
		badge: '交互式',
		group: '动态规划',
		crumb: '数据结构 / 动态规划 / [current]编辑距离[/current]'
	},
	{
		title: '矩阵链乘法',
		description: '区间 DP · 最优切分',
		href: '/ds/matrix-chain',
		topicId: 'matrix-chain',
		badge: '交互式',
		group: '动态规划',
		crumb: '数据结构 / 动态规划 / [current]矩阵链乘法[/current]'
	},
	{
		title: '完全背包',
		description: '无限件选取 · 同行转移',
		href: '/ds/complete-knapsack',
		topicId: 'complete-knapsack',
		badge: '交互式',
		group: '动态规划',
		crumb: '数据结构 / 动态规划 / [current]完全背包[/current]'
	}
];

export const dbTopics: TopicCard[] = [
	{
		title: 'MySQL 架构总览',
		description: '一条 SQL 的完整旅程 · 五层链路',
		href: '/db/mysql-arch',
		topicId: 'mysql-arch',
		badge: '交互式',
		group: '基础',
		crumb: '数据库 / [current]MySQL 架构总览[/current]'
	},
	{
		title: '锁机制与死锁',
		description: '排他锁 · 循环等待 · 等待图检测',
		href: '/db/lock-deadlock',
		topicId: 'lock-deadlock',
		badge: '交互式',
		group: '基础',
		crumb: '数据库 / [current]锁机制与死锁[/current]'
	},
	{
		title: 'InnoDB 日志体系',
		description: 'undo/redo/binlog · 两阶段提交',
		href: '/db/innodb-log',
		topicId: 'innodb-log',
		badge: '交互式',
		group: '基础',
		crumb: '数据库 / [current]InnoDB 日志体系[/current]'
	},
	{
		title: '主从复制',
		description: '三线程 · relay log · 读写分离',
		href: '/db/replication',
		topicId: 'replication',
		badge: '交互式',
		group: '基础',
		crumb: '数据库 / [current]主从复制[/current]'
	},
	{
		title: '数据库系统概述',
		description: '数据模型 · 三级模式结构',
		href: '/db/overview',
		topicId: 'overview',
		badge: '交互式',
		group: '基础',
		crumb: '数据库 / [current]数据库系统概述[/current]'
	},
	{
		title: 'MySQL 数据查询',
		description: 'SELECT / WHERE / GROUP BY',
		href: '/db/sql',
		topicId: 'sql',
		badge: '分步执行',
		group: '基础',
		crumb: '数据库 / [current]MySQL 数据查询[/current]'
	},
	{
		title: 'SQL 内连接 JOIN',
		description: '嵌套循环连接 · 结果逐行生长',
		href: '/db/join',
		topicId: 'join',
		badge: '分步执行',
		group: '基础',
		crumb: '数据库 / [current]SQL 内连接 JOIN[/current]'
	},
	{
		title: 'SQL 左外连接 LEFT JOIN',
		description: '保留左表 · 无匹配填 NULL',
		href: '/db/left-join',
		topicId: 'left-join',
		badge: '分步执行',
		group: '基础',
		crumb: '数据库 / [current]SQL 左外连接 LEFT JOIN[/current]'
	},
	{
		title: 'SQL 分组聚合 GROUP BY',
		description: '分组计数 · 聚合结果表',
		href: '/db/group-by',
		topicId: 'group-by',
		badge: '分步执行',
		group: '基础',
		crumb: '数据库 / [current]SQL 分组聚合 GROUP BY[/current]'
	},
	{
		title: 'SQL 子查询',
		description: '先子后外 · 标量/集合',
		href: '/db/subquery',
		topicId: 'subquery',
		badge: '分步执行',
		group: '基础',
		crumb: '数据库 / [current]SQL 子查询[/current]'
	},
	{
		title: '事务隔离级别',
		description: '脏读 · 不可重复读 · 并发演示',
		href: '/db/isolation',
		topicId: 'isolation',
		badge: '分步执行',
		group: '进阶',
		crumb: '数据库 / [current]事务隔离级别[/current]'
	},
	{
		title: '高级查询',
		description: 'HAVING · 外连接 · UNION · EXISTS',
		href: '/db/advanced-query',
		topicId: 'sql-advanced',
		badge: '分步执行',
		group: '基础',
		crumb: '数据库 / [current]高级查询[/current]'
	},
	{
		title: '窗口函数',
		description: 'ROW_NUMBER / RANK / SUM OVER',
		href: '/db/window-function',
		topicId: 'window-function',
		badge: '分步执行',
		group: '进阶',
		crumb: '数据库 / [current]窗口函数[/current]'
	},
	{
		title: '执行计划与索引选择',
		description: '全表扫描 vs 索引查找',
		href: '/db/explain-plan',
		topicId: 'explain-plan',
		badge: '分步执行',
		group: '进阶',
		crumb: '数据库 / [current]执行计划与索引选择[/current]'
	},
	{
		title: '建表练习',
		description: 'CREATE TABLE / 数据类型',
		href: '/db/tables',
		topicId: 'tables',
		badge: '交互式',
		group: '基础',
		crumb: '数据库 / [current]建表练习[/current]'
	},
	{
		title: '数据更新',
		description: 'INSERT / UPDATE / DELETE',
		href: '/db/update',
		topicId: 'dml',
		badge: '分步执行',
		group: '基础',
		crumb: '数据库 / [current]数据更新[/current]'
	},
	{
		title: '索引原理',
		description: 'B+ 树 · 查找与分裂',
		href: '/db/index',
		topicId: 'index',
		badge: '分步执行',
		group: '进阶',
		crumb: '数据库 / [current]索引原理[/current]'
	},
	{
		title: '视图',
		description: '创建视图 · 查询与更新',
		href: '/db/view',
		topicId: 'view',
		badge: '分步执行',
		group: '进阶',
		crumb: '数据库 / [current]视图[/current]'
	},
	{
		title: '触发器',
		description: 'BEFORE/AFTER · DML 事件自动执行',
		href: '/db/triggers',
		topicId: 'triggers',
		badge: '分步执行',
		group: '进阶',
		crumb: '数据库 / [current]触发器[/current]'
	},
	{
		title: '存储过程',
		description: '参数 · 变量 · IF/WHILE 流程控制',
		href: '/db/procedures',
		topicId: 'procedures',
		badge: '分步执行',
		group: '进阶',
		crumb: '数据库 / [current]存储过程[/current]'
	},
	{
		title: 'E-R 模型',
		description: '概念模型 · 关系转换',
		href: '/db/er',
		topicId: 'er',
		badge: '分步执行',
		group: '设计',
		crumb: '数据库 / [current]E-R 模型[/current]'
	},
	{
		title: '关系规范化',
		description: '函数依赖 · 范式分解',
		href: '/db/normalize',
		topicId: 'normalize',
		badge: '分步执行',
		group: '设计',
		crumb: '数据库 / [current]关系规范化[/current]'
	},
	{
		title: '事务与并发控制',
		description: 'ACID · 隔离级别',
		href: '/db/transaction',
		topicId: 'transaction',
		badge: '分步执行',
		group: '运维',
		crumb: '数据库 / [current]事务与并发控制[/current]'
	},
	{
		title: '用户与权限管理',
		description: '用户 · GRANT · 备份恢复',
		href: '/db/users',
		topicId: 'users',
		badge: '交互式',
		group: '运维',
		crumb: '数据库 / [current]用户与权限管理[/current]'
	},
	{
		title: 'SQL 集合运算',
		description: 'UNION · INTERSECT · EXCEPT',
		href: '/db/union-set',
		topicId: 'union-set',
		badge: '真实执行',
		group: '实验',
		crumb: '数据库 / 实验 / [current]SQL 集合运算[/current]'
	},
	{
		title: 'CASE 表达式',
		description: '搜索 CASE · 简单 CASE · 分类统计',
		href: '/db/case-expr',
		topicId: 'case-expr',
		badge: '真实执行',
		group: '实验',
		crumb: '数据库 / 实验 / [current]CASE 表达式[/current]'
	},
	{
		title: 'SQL 函数演练',
		description: '字符串 · 数值 · 日期 · NULL 处理',
		href: '/db/sql-functions',
		topicId: 'sql-functions',
		badge: '真实执行',
		group: '实验',
		crumb: '数据库 / 实验 / [current]SQL 函数演练[/current]'
	},
	{
		title: 'WHERE 与 HAVING',
		description: '筛行 vs 筛组 · 执行顺序',
		href: '/db/having-deep',
		topicId: 'having-deep',
		badge: '真实执行',
		group: '实验',
		crumb: '数据库 / 实验 / [current]WHERE 与 HAVING[/current]'
	}
];

/**
 * 搜索别名表（audit-9）：key = TopicCard.href，value = 额外可命中的关键词。
 * 全站搜索在 title/description 之外追加匹配这些别名（缩写 / 英文 / 常见叫法）。
 */
export const TOPIC_ALIASES: Record<string, string[]> = {
	'/ds/linear-list': ['链表', 'linked list'],
	'/ds/kmp': ['kmp', '模式匹配', '字符串匹配'],
	'/ds/sunday': ['sunday', ' sunday算法'],
	'/ds/manacher': ['manacher', '回文'],
	'/ds/skip-list': ['skiplist', '跳表'],
	'/ds/fenwick-tree': ['fenwick', 'bit', '树状数组'],
	'/ds/lru-cache': ['lru', '缓存'],
	'/ds/bst': ['bst', '搜索树'],
	'/ds/huffman': ['huffman', '霍夫曼'],
	'/ds/avl': ['avl', '平衡二叉树'],
	'/ds/rbtree': ['红黑树', 'red-black', 'rbtree'],
	'/ds/bplus-insert': ['b+树', 'bplus', 'b树'],
	'/ds/mst': ['mst', 'kruskal', 'prim'],
	'/ds/shortest-path': ['dijkstra', '迪杰斯特拉', '最短路', 'spfa'],
	'/ds/topo-sort': ['拓扑'],
	'/ds/astar': ['a*', 'a star', '启发式搜索'],
	'/ds/union-find': ['并查集', 'union find', 'dsu'],
	'/ds/tarjan': ['tarjan', '强连通'],
	'/ds/lca': ['最近公共祖先', 'lowest common'],
	'/ds/max-flow': ['网络流', 'edmonds', 'ford'],
	'/ds/hash-table': ['散列表', 'hash'],
	'/ds/hash-probing': ['线性探测', '开放寻址', 'probing'],
	'/ds/knapsack': ['背包', '01背包', 'dp'],
	'/ds/complete-knapsack': ['完全背包', 'dp'],
	'/ds/lcs': ['最长公共子序列', 'lcs'],
	'/ds/lis': ['最长递增子序列', 'lis'],
	'/ds/edit-distance': ['levenshtein', '编辑距离'],
	'/ds/trie': ['字典树', '前缀树'],
	'/ds/radix-sort': ['基数排序', '桶排序'],
	'/ds/counting-sort': ['计数排序', '桶排序'],
	'/db/sql': ['select', '查询', 'dql'],
	'/db/advanced-query': ['having', 'group by', '分组'],
	'/db/window-function': ['窗口函数', 'over', 'rank'],
	'/db/explain-plan': ['explain', '执行计划'],
	'/db/join': ['join', '连接查询'],
	'/db/left-join': ['left join', '左连接'],
	'/db/subquery': ['子查询', '嵌套查询'],
	'/db/index': ['index', 'b+树索引', 'innodb'],
	'/db/transaction': ['acid', 'mvcc', '隔离级别'],
	'/db/isolation': ['隔离级别', '锁'],
	'/db/lock-deadlock': ['死锁', '行锁'],
	'/db/normalize': ['范式', '3nf', '函数依赖'],
	'/db/er': ['er图', 'e-r', '实体关系'],
	'/db/view': ['视图', 'view'],
	'/db/triggers': ['触发器', 'trigger'],
	'/db/procedures': ['存储过程', 'procedure'],
	'/db/users': ['grant', 'revoke', '权限'],
	'/db/union-set': ['union', 'intersect', 'except', '并集', '交集', '差集'],
	'/db/case-expr': ['case when', '分支', '条件表达式'],
	'/db/sql-functions': ['函数', 'substr', 'strftime', 'coalesce', '日期函数'],
	'/db/having-deep': ['having', '分组过滤', '聚合筛选']
};
