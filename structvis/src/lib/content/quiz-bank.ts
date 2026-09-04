/** 章节自测题库（quiz 页与「每日一题」共用）——题干为真实踩坑/任务场景 */
export interface QuizQuestion {
	chapter: string;
	q: string;
	options: string[];
	answer: number;
	explain: string;
	topicId: string;
}

export const QUIZ_BANK: QuizQuestion[] = [
	{
		chapter: '线性结构',
		q: '你写了一个「撤销」功能：最后做的操作要最先被撤销。这应该用哪种结构存操作记录？',
		options: ['先进先出的队列', '后进先出的栈', '随机存取的数组', '两端都可进出的双端队列'],
		answer: 1,
		explain: '最后做的最先撤销，正是后进先出（LIFO）——栈。队列是先进先出。',
		topicId: 'stack-queue'
	},
	{
		chapter: '线性结构',
		q: '一个百万级的名单，频繁在中间插入和删除行，很少按位置查找。选哪种存储更合适？',
		options: ['顺序表（数组）', '单链表', '哈希表', '循环队列'],
		answer: 1,
		explain: '链表插入删除只改指针、不用搬动后面的元素；顺序表每次中间插删都要整体挪动。',
		topicId: 'linear-list'
	},
	{
		chapter: '线性结构',
		q: '全文搜索一篇文章里的关键词，暴力匹配太慢。KMP 的提速关键是什么？',
		options: [
			'让主串指针永不回退，失配时按 next 表跳模式串',
			'从后往前匹配',
			'给每个字符建哈希',
			'每次随机换一个起点'
		],
		answer: 0,
		explain: 'KMP 预先算好 next 数组，失配时模式串滑到该去的位置，主串指针从头到尾只进不退。',
		topicId: 'kmp'
	},
	{
		chapter: '树形结构',
		q: '往 AVL 树里连续插入几个节点后，某个节点的平衡因子变成了 2。接下来该做什么？',
		options: [
			'删掉刚插的节点',
			'按失衡类型做单旋或双旋',
			'重建整棵树',
			'不做处理，等下次插入自动恢复'
		],
		answer: 1,
		explain: 'LL/RR 型单旋一次，LR/RL 型先转成单旋型再旋，树就恢复平衡。',
		topicId: 'avl'
	},
	{
		chapter: '树形结构',
		q: '画红黑树时，你把某个红色节点的孩子也涂成了红色。这违反了什么？',
		options: ['根必须为黑', '红节点的孩子必须是黑色', '叶子必须是红', '黑高一致'],
		answer: 1,
		explain: '红节点的两个孩子都必须是黑色——这条保证没有路径比其他路径长一倍以上。',
		topicId: 'rbtree'
	},
	{
		chapter: '树形结构',
		q: '要给一篇文档里的字符设计总长度最短的编码，且任意编码不能是另一个的前缀。用什么？',
		options: ['哈夫曼树（最小带权路径）', 'BST', '堆', 'B+ 树'],
		answer: 0,
		explain: '哈夫曼树让高频字符路径更短，叶子编码天然互不为前缀。',
		topicId: 'huffman'
	},
	{
		chapter: '树形结构',
		q: '往 BST 里按正顺序插入 1、2、3……10000，之后查找一个不存在的数会很慢。为什么？',
		options: [
			'树退化成了单链表，最坏 O(n)',
			'数据太多导致 O(n²)',
			'BST 查找本来就是 O(n log n)',
			'指针太多拖慢了速度'
		],
		answer: 0,
		explain: '有序插入让 BST 全部右偏成单链，查找退化为 O(n)——这正是平衡树存在的理由。',
		topicId: 'bst'
	},
	{
		chapter: '树形结构',
		q: '输入法要实现「输入 cat 立刻联想 category」，核心用什么结构？',
		options: ['哈希表存单词', 'Trie：按公共前缀共享路径', '排序后二分', '红黑树逐个比对'],
		answer: 1,
		explain: 'Trie 让 cat 和 category 共享 c-a-t 路径，走到前缀末尾就往下收集所有单词。',
		topicId: 'trie'
	},
	{
		chapter: '图结构',
		q: '社交网络里求「从你出发第 1 度、第 2 度、第 3 度好友」，逐层扩散该用什么辅助结构？',
		options: ['栈', '队列', '优先队列', '并查集'],
		answer: 1,
		explain: 'BFS 的逐层扩散靠队列保证「先入层的先出层」；DFS 才用栈。',
		topicId: 'graph-traversal'
	},
	{
		chapter: '图结构',
		q: '导航软件要算「从你家到每个地点的最短距离」，边权都是正的。最合适的算法是？',
		options: ['Dijkstra', '最小生成树', '拓扑排序', '求关键路径'],
		answer: 0,
		explain: 'Dijkstra 求单源最短路径；注意它不能处理负权边。',
		topicId: 'shortest-path'
	},
	{
		chapter: '图结构',
		q: '教务系统要排出选课顺序，课程之间有先修依赖。这个需求能用拓扑排序做吗？',
		options: [
			'不能，拓扑排序只用于带权图',
			'能，先修图是无环有向图（DAG）时可以',
			'不能，拓扑排序只用于无向图',
			'能，任何图都可以'
		],
		answer: 1,
		explain: '拓扑排序适用于 DAG；如果排不完（剩余点入度非 0），说明依赖里有环。',
		topicId: 'topo-sort'
	},
	{
		chapter: '图结构',
		q: '修路问题里你已经建了一棵「部分树」，下一步要把它连向外面的村庄。Prim 的选法是？',
		options: [
			'在所有边里选全局最小且不成环的',
			'从树内的点出发，选伸向树外的最小边',
			'把所有边降序排再逐条试',
			'删掉最贵的边'
		],
		answer: 1,
		explain: 'Prim 沿着树向外扩张最小边；「全局排序选最小边判环」是 Kruskal 的做法。',
		topicId: 'mst'
	},
	{
		chapter: '图结构',
		q: '寻路算法要「已走距离 + 到终点的预估距离」综合排序，估价函数怎么写？',
		options: ['f = g（只看已走）', 'f = g + h', 'f = h（只看预估）', 'f = g × h'],
		answer: 1,
		explain: 'f(n) = g(n) + h(n)：实际代价加启发式估计；h 高估会失去最优性。',
		topicId: 'astar'
	},
	{
		chapter: '排序算法',
		q: '成绩单里同名同分的学生要求保持原有先后顺序。以下哪种排序方案不能用？',
		options: ['快排、堆排', '冒泡、插入、归并', '基数', '它们都可以'],
		answer: 0,
		explain: '快排/堆排/选择/希尔不稳定——相等元素相对顺序可能被打乱；冒泡/插入/归并/基数稳定。',
		topicId: 'bubble-sort'
	},
	{
		chapter: '排序算法',
		q: '面试官问：数据基本乱序时平均要比较多少量级？而数据恰好已经有序时呢？',
		options: [
			'都是 O(n log n)',
			'平均 O(n log n)，已有序退化为 O(n²)',
			'平均 O(n²)，已有序 O(n log n)',
			'都是 O(n²)'
		],
		answer: 1,
		explain: '快排平均 O(n log n)；选首元素做基准且数据已有序时划分极不均衡，退化 O(n²)。',
		topicId: 'quick-sort'
	},
	{
		chapter: '排序算法',
		q: '堆排序每次取出最大值之后，必须马上做的一步是什么？',
		options: ['重新建堆', '把末尾元素放到堆顶再下滤', '归并剩余元素', '把堆反转'],
		answer: 1,
		explain: '堆顶换末尾元素后堆性质被破坏，下滤（siftDown）把它沉到合法位置。',
		topicId: 'heap-sort'
	},
	{
		chapter: '排序算法',
		q: '号码全部是 8 位数字，要按数字排序。基数排序的总耗时是什么量级？',
		options: ['O(n²)', 'O(n log n)', 'O(d·n)，d=8 就是 8 趟分配收集', 'O(n!)'],
		answer: 2,
		explain: 'd 是位数：每趟按当前位分桶收集 O(n)，共 d 趟，与比较型排序的下界无关。',
		topicId: 'radix-sort'
	},
	{
		chapter: '排序算法',
		q: '数据量很大且基本有序，直接插入排序已经很快了。还想更快，往哪个方向优化？',
		options: ['改成递归分治', '按递减增量分组做插入，逐步缩到 1', '改成两两交换', '改成每次选最小'],
		answer: 1,
		explain:
			'希尔排序：大步长时只搬动少量距离，数据迅速「基本有序」，最后一趟增量为 1 时几乎不用挪。',
		topicId: 'shell-sort'
	},
	{
		chapter: '查找',
		q: '同事想在链表上做二分查找，被你拦下了。理由是什么？',
		options: [
			'链表太占空间',
			'二分要求数据有序且能随机访问，链表取中间元素只能从头数',
			'链表不能排序',
			'二分只适合数字'
		],
		answer: 1,
		explain: '二分的前提 = 有序 + 顺序存储；链表定位中间元素是 O(n)，二分优势尽失。',
		topicId: 'binary-search'
	},
	{
		chapter: '查找',
		q: '哈希表里两个键算出了同一个下标。链地址法的处理方式是？',
		options: [
			'往后找下一个空槽',
			'把同义词挂在同一个槽的链表上',
			'整表重新散列',
			'按平方间隔跳着找'
		],
		answer: 1,
		explain: '链地址法：同义词挂同一条链；「顺次找空槽」和「平方跳」是开放定址法的两种。',
		topicId: 'hash-table'
	},
	{
		chapter: '查找',
		q: '线性探测的哈希表里，为什么删除元素时只能打删除标记而不能直接清空？',
		options: [
			'为了节省内存',
			'直接清空会截断后面同义词的探测路径',
			'为了保持有序',
			'系统不允许写空'
		],
		answer: 1,
		explain: '清空后查找会在空位误判「不存在」，后面同义词就找不到了。',
		topicId: 'hash-probing'
	},
	{
		chapter: 'SQL',
		q: '两张表 JOIN 时忘了写 ON 条件，结果集行数变成了两表行数的乘积。这是什么？',
		options: ['内连接的正常结果', '笛卡尔积', '左外连接', '自连接'],
		answer: 1,
		explain: '没有连接条件的 JOIN 就是笛卡尔积：n 行 × m 行 = n×m 行，几乎一定是写错了。',
		topicId: 'join'
	},
	{
		chapter: 'SQL',
		q: '用 LEFT JOIN 列出「所有学生及成绩」，发现某行的成绩列是 NULL。这说明什么？',
		options: ['成绩是 0 分', '这个学生没有任何成绩记录', '数据损坏了', 'SQL 写错了'],
		answer: 1,
		explain: 'LEFT JOIN 保留左表全部行；右表无匹配时右侧列填 NULL——正是「没考过试」的表现。',
		topicId: 'left-join'
	},
	{
		chapter: 'SQL',
		q: '你写了 SELECT name, AVG(score) FROM exam GROUP BY class，却报错了。哪里错了？',
		options: [
			'name 不是分组列，不能出现在 SELECT 里',
			'AVG 不能和 GROUP BY 同用',
			'缺 HAVING',
			'表名没大写'
		],
		answer: 0,
		explain:
			'分组后每行代表一个组：SELECT 里只能出现分组列和聚合函数，非分组列必须去掉或加进 GROUP BY。',
		topicId: 'group-by'
	},
	{
		chapter: 'SQL',
		q: '转账「扣款成功但对方没到账」的事故，暴露的是 ACID 里哪个性质没被保证？',
		options: ['A 原子性', 'C 一致性', 'I 隔离性', 'D 持久性'],
		answer: 0,
		explain: '原子性要求「要么全做、要么全不做」；半成功正是原子性被破坏。I 指并发事务互不干扰。',
		topicId: 'transaction'
	},
	{
		chapter: 'SQL',
		q: '「比全班平均分还高的学生」写成 WHERE score > AVG(score) 直接报错。正确的改法是？',
		options: [
			'把 AVG 放进先执行的内层子查询，外层拿它当比较条件',
			'把 AVG 挪到 HAVING',
			'去掉 AVG 直接比',
			'把 WHERE 换成 ORDER BY'
		],
		answer: 0,
		explain: 'WHERE 在聚合前执行，看不到 AVG 的值；非相关子查询先算出平均值，再供外层比较。',
		topicId: 'subquery'
	}
];
