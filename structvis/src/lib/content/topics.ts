/**
 * 课程内容目录 — 首页 / /ds /db 目录页共享的数据源。
 * topicId 与 progress store 的 topics key 以及播放器页 AlgoPlayer 的 topicId 保持一致。
 */

export interface TopicCard {
	title: string;
	description: string;
	href: string;
	/** 对应 progress.topics 的 key；缺省则不显示掌握度进度条 */
	topicId?: string;
	/** 徽标文案（如 交互式 / 分步执行） */
	badge: string;
	planned?: boolean;
}

export const dsTopics: TopicCard[] = [
	{
		title: '快速排序',
		description: '分治策略 · 平均 O(n log n)',
		href: '/ds/quick-sort',
		topicId: 'quick-sort',
		badge: '交互式'
	},
	{
		title: '二叉树遍历',
		description: '前/中/后/层序 · 递归与迭代',
		href: '/ds/binary-tree',
		topicId: 'binary-tree',
		badge: '交互式'
	},
	{
		title: '单链表',
		description: '插入/删除 · 指针定位',
		href: '/ds/linear-list',
		topicId: 'linear-list',
		badge: '交互式'
	},
	{
		title: '栈和队列',
		description: '后进先出 · 先进先出',
		href: '/ds/stack-queue',
		topicId: 'stack-queue',
		badge: '交互式'
	},
	{
		title: '冒泡排序',
		description: '相邻交换上浮 · 稳定 · O(n²)',
		href: '/ds/bubble-sort',
		topicId: 'bubble-sort',
		badge: '交互式'
	},
	{
		title: '直接插入排序',
		description: '插入有序前缀 · 稳定 · O(n²)',
		href: '/ds/insertion-sort',
		topicId: 'insertion-sort',
		badge: '交互式'
	},
	{
		title: '简单选择排序',
		description: '选出最小交换 · 不稳定 · O(n²)',
		href: '/ds/selection-sort',
		topicId: 'selection-sort',
		badge: '交互式'
	},
	{
		title: '归并排序',
		description: '两两合并 · 稳定 · O(n log n)',
		href: '/ds/merge-sort',
		topicId: 'merge-sort',
		badge: '交互式'
	},
	{
		title: '图的遍历',
		description: 'BFS 队列扩散 · DFS 递归深入',
		href: '/ds/graph-traversal',
		topicId: 'graph-traversal',
		badge: '交互式'
	},
	{
		title: '串与数组',
		description: '模式匹配 · 稀疏矩阵',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{
		title: '二叉搜索树',
		description: '查找 · 插入 · 删除',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{
		title: '哈夫曼树',
		description: '带权路径长度 · 编码',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{
		title: '二分查找',
		description: '有序表折半 · O(log n)',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{ title: '哈希表', description: '散列函数 · 冲突处理', href: '#', badge: '规划中', planned: true }
];

export const dbTopics: TopicCard[] = [
	{
		title: '数据库系统概述',
		description: '数据模型 · 三级模式结构',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{
		title: 'MySQL 数据查询',
		description: 'SELECT / WHERE / GROUP BY',
		href: '/db/sql',
		topicId: 'sql',
		badge: '分步执行'
	},
	{
		title: '高级查询',
		description: 'HAVING · 外连接 · UNION · EXISTS',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{
		title: '建表练习',
		description: 'CREATE TABLE / 数据类型',
		href: '/db/tables',
		topicId: 'tables',
		badge: '交互式'
	},
	{
		title: '数据更新',
		description: 'INSERT / UPDATE / DELETE',
		href: '/db/update',
		topicId: 'dml',
		badge: '分步执行'
	},
	{
		title: '索引原理',
		description: 'B+ 树 · 查找与分裂',
		href: '/db/index',
		topicId: 'index',
		badge: '分步执行'
	},
	{
		title: '视图',
		description: '创建视图 · 查询与更新',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{
		title: 'E-R 模型',
		description: '概念模型 · 关系转换',
		href: '/db/er',
		topicId: 'er',
		badge: '分步执行'
	},
	{
		title: '关系规范化',
		description: '函数依赖 · 范式分解',
		href: '/db/normalize',
		topicId: 'normalize',
		badge: '分步执行'
	},
	{
		title: '事务与并发控制',
		description: 'ACID · 隔离级别',
		href: '#',
		badge: '规划中',
		planned: true
	},
	{
		title: '用户与权限管理',
		description: '用户 · GRANT · 备份恢复',
		href: '#',
		badge: '规划中',
		planned: true
	}
];
