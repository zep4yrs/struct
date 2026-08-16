<script lang="ts">
	import { progress } from '$lib/stores/progress';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/utils/motion';

	interface SkillNode {
		id: string;
		title: string;
		href: string;
		topicId?: string;
		group: string;
		desc: string;
	}

	interface SkillEdge {
		from: string;
		to: string;
	}

	const NODES: SkillNode[] = [
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
			id: 'trie',
			title: 'Trie 字典树',
			href: '/ds/trie',
			topicId: 'trie',
			group: '线性结构',
			desc: '公共前缀共享'
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
			id: 'bplus-insert',
			title: 'B+ 树',
			href: '/ds/bplus-insert',
			topicId: 'bplus-insert',
			group: '查找',
			desc: '插入 · 分裂 · 键提升'
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
			title: '选择排序',
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
			id: 'isolation',
			title: '事务隔离',
			href: '/db/isolation',
			topicId: 'isolation',
			group: '数据库 · 进阶',
			desc: '并发异常演示'
		},
		{
			id: 'advanced-query',
			title: '高级查询',
			href: '/db/advanced-query',
			topicId: 'advanced-query',
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
			topicId: 'update',
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
			id: 'users',
			title: '用户与权限',
			href: '/db/users',
			topicId: 'users',
			group: '数据库 · 运维',
			desc: 'GRANT / REVOKE'
		}
	];

	const EDGES: SkillEdge[] = [
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
		{ from: 'index', to: 'explain-plan' }
	];

	const GROUP_ORDER = [
		'线性结构',
		'树形结构',
		'图结构',
		'排序算法',
		'查找',
		'动态规划',
		'数据库 · 基础',
		'数据库 · 查询',
		'数据库 · 设计',
		'数据库 · 进阶',
		'数据库 · 运维'
	];

	const NODE_W = 108;
	const NODE_H = 46;
	const COL_GAP = 16;
	const ROW_GAP = 50;
	const PAD_Y = 36;
	const W = 964;

	const layout = $derived.by(() => {
		const pos: Record<string, { x: number; y: number }> = {};
		let y = PAD_Y;
		for (const g of GROUP_ORDER) {
			const nodes = NODES.filter((n) => n.group === g);
			const totalW = nodes.length * NODE_W + (nodes.length - 1) * COL_GAP;
			let x = (W - totalW) / 2;
			for (const n of nodes) {
				pos[n.id] = { x, y };
				x += NODE_W + COL_GAP;
			}
			y += NODE_H + ROW_GAP;
		}
		return pos;
	});

	const H = $derived(GROUP_ORDER.length * (NODE_H + ROW_GAP) + PAD_Y + 24);

	function masteryOf(id: string): number {
		const node = NODES.find((n) => n.id === id);
		if (!node?.topicId) return 0;
		return $progress.topics[node.topicId]?.mastery ?? 0;
	}

	function nodeState(id: string): 'done' | 'learning' | 'todo' {
		const m = masteryOf(id);
		if (m >= 80) return 'done';
		if (m > 0) return 'learning';
		return 'todo';
	}

	function edgePoints(edge: SkillEdge): string {
		const a = layout[edge.from];
		const b = layout[edge.to];
		if (!a || !b) return '';
		const ax = a.x + NODE_W / 2;
		const ay = a.y + NODE_H;
		const bx = b.x + NODE_W / 2;
		const by = b.y;
		// 简单三次曲线（垂直连线带轻微弧度）
		const mx = (ax + bx) / 2;
		return (
			'M ' +
			ax +
			' ' +
			ay +
			' C ' +
			mx +
			' ' +
			(ay + 6) +
			', ' +
			mx +
			' ' +
			(by - 6) +
			', ' +
			bx +
			' ' +
			by
		);
	}
</script>

<div class="mx-auto max-w-5xl p-8">
	<div class="section-label mb-4" use:reveal>技能图谱 · SKILL MAP</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em;"
		use:reveal={{ delay: 90 }}
	>
		知识依赖图谱
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2); max-width: 560px;" use:reveal={{ delay: 160 }}>
		每个知识点是一块基石，箭头指向它的进阶方向。已掌握的节点点亮，学习中的节点半亮——看看你走到了哪一步。
	</p>

	<div class="map-legend glass" use:reveal>
		<span class="map-legend-item"><i class="map-dot done"></i>已掌握（≥80%）</span>
		<span class="map-legend-item"><i class="map-dot learning"></i>学习中</span>
		<span class="map-legend-item"><i class="map-dot todo"></i>未开始</span>
		<span class="map-legend-item map-edge-sample">→ 前置依赖</span>
	</div>

	<div class="map-panel glass" use:reveal>
		<svg width="100%" viewBox="0 0 {W} {H}" role="img" aria-label="知识依赖图谱">
			{#each EDGES as edge (edge.from + edge.to)}
				<path
					d={edgePoints(edge)}
					fill="none"
					stroke="var(--color-line-regular)"
					stroke-width="1.2"
					opacity="0.55"
					marker-end="url(#mapArrow)"
				/>
			{/each}
			<defs>
				<marker id="mapArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
					<path d="M0,0 L7,3.5 L0,7 Z" fill="var(--color-line-regular)" opacity="0.7" />
				</marker>
			</defs>
			{#each NODES as n (n.id)}
				<g
					class="map-node"
					class:map-done={nodeState(n.id) === 'done'}
					class:map-learning={nodeState(n.id) === 'learning'}
				>
					<a href={resolve(n.href as '/ds/quick-sort')}>
						<rect
							x={layout[n.id].x}
							y={layout[n.id].y}
							width={NODE_W}
							height={NODE_H}
							rx="8"
							fill="var(--color-surface)"
							stroke="var(--color-line-hair)"
						/>
						<text
							x={layout[n.id].x + NODE_W / 2}
							y={layout[n.id].y + NODE_H / 2 + 4}
							text-anchor="middle"
							class="map-node-text"
						>
							{n.title}
						</text>
						<title>{n.title} — {n.desc}{nodeState(n.id) === 'done' ? '（已掌握）' : ''}</title>
					</a>
				</g>
			{/each}
		</svg>
	</div>
</div>

<style>
	.map-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		padding: 10px 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		margin-bottom: 16px;
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.map-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.map-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}

	.map-dot.done {
		background: var(--color-success);
	}

	.map-dot.learning {
		background: var(--color-accent);
		opacity: 0.6;
	}

	.map-dot.todo {
		background: var(--color-line-regular);
	}

	.map-edge-sample {
		color: var(--color-ink-3);
	}

	.map-panel {
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 18px 14px;
		overflow-x: auto;
	}

	.map-node {
		cursor: pointer;
		transition: opacity 150ms var(--ease-out);
	}

	.map-node rect {
		transition:
			fill 150ms var(--ease-out),
			stroke 150ms var(--ease-out),
			filter 150ms var(--ease-out);
	}

	.map-node:hover rect {
		stroke: var(--color-accent);
		filter: drop-shadow(0 2px 6px rgba(217, 119, 6, 0.25));
	}

	.map-node.map-done rect {
		fill: rgba(45, 106, 79, 0.14);
		stroke: var(--color-success);
	}

	.map-node.map-learning rect {
		fill: rgba(217, 119, 6, 0.08);
		stroke: var(--color-accent);
	}

	.map-node-text {
		font-size: 12.5px;
		fill: var(--color-ink);
		font-weight: 500;
		pointer-events: none;
	}
</style>
