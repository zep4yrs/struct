<script lang="ts">
	import { recordExercise } from '$lib/stores/progress';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/utils/motion';

	interface QuizQuestion {
		chapter: string;
		q: string;
		options: string[];
		answer: number;
		explain: string;
		topicId: string;
	}

	const CHAPTERS = ['线性结构', '树形结构', '图结构', '排序算法', '查找', 'SQL'];

	const BANK: QuizQuestion[] = [
		// 线性结构
		{
			chapter: '线性结构',
			q: '栈的特点是？',
			options: ['先进先出', '后进先出', '随机存取', '两端进出'],
			answer: 1,
			explain: '栈是 LIFO（后进先出），队列才是 FIFO。',
			topicId: 'stack-queue'
		},
		{
			chapter: '线性结构',
			q: '单链表相比顺序表的主要优势是？',
			options: ['随机访问 O(1)', '插入删除无需移动元素', '空间占用更小', '缓存友好'],
			answer: 1,
			explain: '链表插入删除只改指针，顺序表需要移动后续元素。',
			topicId: 'linear-list'
		},
		{
			chapter: '线性结构',
			q: 'KMP 算法的核心优化是什么？',
			options: ['跳过不可能匹配的位置', '从后往前匹配', '随机移位', '两两比较'],
			answer: 0,
			explain: 'KMP 利用 next 数组让主串指针不回退。',
			topicId: 'kmp'
		},
		// 树形结构
		{
			chapter: '树形结构',
			q: 'AVL 树失衡后如何恢复平衡？',
			options: ['重建整棵树', '旋转（单旋/双旋）', '删除节点', '随机调整'],
			answer: 1,
			explain: 'LL/RR 单旋，LR/RL 双旋。',
			topicId: 'avl'
		},
		{
			chapter: '树形结构',
			q: '红黑树中，红节点的孩子必须是什么颜色？',
			options: ['红色', '黑色', '任意', '交替'],
			answer: 1,
			explain: '红节点的两个孩子都是黑色，这是红黑树的核心约束。',
			topicId: 'rbtree'
		},
		{
			chapter: '树形结构',
			q: '哈夫曼树的用途是？',
			options: ['排序', '最小带权路径编码', '查找', '索引'],
			answer: 1,
			explain: '哈夫曼树实现前缀编码，让高频字符编码更短。',
			topicId: 'huffman'
		},
		{
			chapter: '树形结构',
			q: 'BST 查找的时间复杂度（最坏）是？',
			options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
			answer: 2,
			explain: '退化成单链时是 O(n)，平衡树才是 O(log n)。',
			topicId: 'bst'
		},
		// 图结构
		{
			chapter: '图结构',
			q: 'BFS 使用的辅助数据结构是？',
			options: ['栈', '队列', '数组', '堆'],
			answer: 1,
			explain: 'BFS 用队列逐层扩散，DFS 用栈/递归。',
			topicId: 'graph-traversal'
		},
		{
			chapter: '图结构',
			q: 'Dijkstra 算法求解的是？',
			options: ['单源最短路径', '最小生成树', '拓扑排序', '关键路径'],
			answer: 0,
			explain: 'Dijkstra 求单源最短路径，不能处理负权边。',
			topicId: 'shortest-path'
		},
		{
			chapter: '图结构',
			q: '拓扑排序适用于？',
			options: ['带权图', '有向无环图（DAG）', '无向图', '完全图'],
			answer: 1,
			explain: '拓扑排序只能对 DAG 进行，得到顶点的线性序列。',
			topicId: 'topo-sort'
		},
		{
			chapter: '图结构',
			q: 'Prim 算法的每一步做什么？',
			options: ['选最小边且不成环', '从当前树向外扩展最小边', '把所有边排序', '删最大边'],
			answer: 1,
			explain: 'Prim 从单点出发不断扩展最小边；Kruskal 才是选全局最小边。',
			topicId: 'mst'
		},
		// 排序算法
		{
			chapter: '排序算法',
			q: '哪些排序是稳定的？',
			options: ['快排、堆排', '冒泡、插入、归并', '选择、希尔', '基数'],
			answer: 1,
			explain: '冒泡/插入/归并/基数稳定；快排/堆排/选择/希尔不稳定。',
			topicId: 'bubble-sort'
		},
		{
			chapter: '排序算法',
			q: '快速排序平均时间复杂度是？',
			options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'],
			answer: 1,
			explain: '平均 O(n log n)，最坏（已有序）退化为 O(n²)。',
			topicId: 'quick-sort'
		},
		{
			chapter: '排序算法',
			q: '堆排序的核心操作是？',
			options: ['分区', '下滤（siftDown）', '归并', '插入'],
			answer: 1,
			explain: '建堆和取堆顶都靠下滤维持堆性质。',
			topicId: 'heap-sort'
		},
		{
			chapter: '排序算法',
			q: '基数排序的时间复杂度是？',
			options: ['O(n²)', 'O(n log n)', 'O(d·n)', 'O(n!)'],
			answer: 2,
			explain: 'd 是位数，每轮分桶收集 O(n)，共 d 轮。',
			topicId: 'radix-sort'
		},
		{
			chapter: '排序算法',
			q: '希尔排序的核心思想是？',
			options: ['递归分治', '递减增量分组插入', '两两交换', '选择最小'],
			answer: 1,
			explain: '先按大步长分组插入排序，逐步缩小增量。',
			topicId: 'shell-sort'
		},
		// 查找
		{
			chapter: '查找',
			q: '二分查找的前提是？',
			options: ['无序数组', '有序序列', '链表', '哈希'],
			answer: 1,
			explain: '二分查找要求元素有序，且能随机访问。',
			topicId: 'binary-search'
		},
		{
			chapter: '查找',
			q: '哈希表冲突的链地址法怎么做？',
			options: ['探测后继槽', '同义词挂链表', '重新散列', '二次探测'],
			answer: 1,
			explain: '链地址法把同义词挂在同一槽的链表上。',
			topicId: 'hash-table'
		},
		{
			chapter: '查找',
			q: '线性探测遇到冲突时？',
			options: ['随机跳转', '向后逐个探测', '链表', '树形'],
			answer: 1,
			explain: '线性探测 (h+1) mod m 逐个找空位。',
			topicId: 'hash-probing'
		},
		// SQL
		{
			chapter: 'SQL',
			q: '内连接（INNER JOIN）结果包含？',
			options: ['左表所有行', '匹配成功的行对', '笛卡尔积', '右表所有行'],
			answer: 1,
			explain: '内连接只保留满足 ON 条件的行对。',
			topicId: 'join'
		},
		{
			chapter: 'SQL',
			q: 'LEFT JOIN 无匹配时右半部分填？',
			options: ['0', 'NULL', '空字符串', '跳过该行'],
			answer: 1,
			explain: '左外连接保留左表行，右表无匹配填 NULL。',
			topicId: 'left-join'
		},
		{
			chapter: 'SQL',
			q: 'GROUP BY 之后 SELECT 能输出？',
			options: ['任意列', '分组列和聚合函数', '只有 COUNT', '原始行'],
			answer: 1,
			explain: '分组后每行代表一个组，只能输出分组列 + 聚合结果。',
			topicId: 'group-by'
		},
		{
			chapter: 'SQL',
			q: '事务的 ACID 中 I 代表？',
			options: ['原子性', '一致性', '隔离性', '持久性'],
			answer: 2,
			explain: 'Isolation 隔离性：并发事务互不干扰。',
			topicId: 'transaction'
		}
	];

	// === 自测状态 ===
	let chapter = $state(CHAPTERS[0]);
	let questions = $state<QuizQuestion[]>([]);
	let idx = $state(0);
	let picked = $state<number | null>(null);
	let answers = $state<number[]>([]);
	let started = $state(false);
	let finished = $state(false);
	let secondsLeft = $state(300); // 5 分钟
	let timer: ReturnType<typeof setInterval> | null = null;

	function startQuiz() {
		const pool = BANK.filter((q) => q.chapter === chapter);
		// 打乱取 8 题
		const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(8, pool.length));
		questions = shuffled;
		idx = 0;
		answers = [];
		picked = null;
		started = true;
		finished = false;
		secondsLeft = 300;
		if (timer) clearInterval(timer);
		timer = setInterval(() => {
			secondsLeft -= 1;
			if (secondsLeft <= 0) finishQuiz();
		}, 1000);
	}

	function pick(i: number) {
		if (picked !== null) return;
		picked = i;
		answers[idx] = i;
	}

	function nextQ() {
		if (idx < questions.length - 1) {
			idx += 1;
			picked = answers[idx] ?? null;
		} else {
			finishQuiz();
		}
	}

	function finishQuiz() {
		if (timer) clearInterval(timer);
		timer = null;
		finished = true;
		started = false;
		// 计入掌握度
		for (let i = 0; i < questions.length; i++) {
			recordExercise(questions[i].topicId, answers[i] === questions[i].answer);
		}
	}

	const score = $derived(questions.filter((q, i) => answers[i] === q.answer).length);
</script>

<div class="mx-auto max-w-3xl p-8">
	<div class="section-label mb-4" use:reveal>章节自测 · QUIZ</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em;"
		use:reveal={{ delay: 90 }}
	>
		章节自测
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2);" use:reveal={{ delay: 160 }}>
		选一个章节，8 道题 5 分钟限时。成绩计入对应知识点的掌握度。
	</p>

	{#if !started && !finished}
		<div class="glass quiz-panel" use:reveal>
			<div class="quiz-chapters">
				{#each CHAPTERS as c (c)}
					<button class="quiz-chapter-btn" class:on={chapter === c} onclick={() => (chapter = c)}>
						{c}
					</button>
				{/each}
			</div>
			<div class="quiz-start-row">
				<span style="color: var(--color-ink-3); font-size: 13px;">
					{BANK.filter((q) => q.chapter === chapter).length} 道题可用 · 8 题随机 · 5 分钟限时
				</span>
				<button class="btn btn-accent" onclick={startQuiz}>开始自测</button>
			</div>
		</div>
	{/if}

	{#if started && questions.length > 0}
		<div class="glass quiz-panel" use:reveal>
			<div class="quiz-top">
				<span class="quiz-progress">第 {idx + 1} / {questions.length} 题</span>
				<span class="quiz-timer" class:urgent={secondsLeft <= 60}
					>⏱ {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span
				>
			</div>
			<div class="quiz-question">{questions[idx].q}</div>
			<div class="quiz-options">
				{#each questions[idx].options as opt, i (i)}
					<button
						class="quiz-opt"
						class:correct={picked !== null && i === questions[idx].answer}
						class:wrong={picked === i && i !== questions[idx].answer}
						disabled={picked !== null}
						onclick={() => pick(i)}
					>
						<span class="quiz-opt-key">{'ABCD'[i]}</span>
						{opt}
					</button>
				{/each}
			</div>
			{#if picked !== null}
				<div class="quiz-feedback" class:ok={picked === questions[idx].answer}>
					{picked === questions[idx].answer ? '✓ 回答正确' : '✗ 回答错误'}
					<span class="quiz-explain">{questions[idx].explain}</span>
				</div>
				<button class="btn btn-accent" onclick={nextQ}>
					{idx < questions.length - 1 ? '下一题 →' : '交卷'}
				</button>
			{/if}
		</div>
	{/if}

	{#if finished}
		<div class="glass quiz-panel quiz-result" use:reveal>
			<div class="quiz-score">{score} / {questions.length}</div>
			<div class="quiz-score-label">
				正确率 {Math.round((score / Math.max(1, questions.length)) * 100)}%
			</div>
			<div class="quiz-score-desc">
				{#if score === questions.length}满分！完美掌握。
				{:else if score >= Math.ceil(questions.length * 0.7)}不错！继续保持。
				{:else if score >= Math.ceil(questions.length * 0.5)}及格了，再复习一下错题。
				{:else}别灰心，去对应章节再看看动画。{/if}
			</div>
			<div class="quiz-actions">
				<button class="btn btn-accent" onclick={startQuiz}>再来一次</button>
				<a href={resolve('/progress')} class="btn btn-ghost">查看进度</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.quiz-panel {
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 22px 26px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.quiz-chapters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.quiz-chapter-btn {
		padding: 6px 14px;
		font-size: 13px;
		color: var(--color-ink-2);
		background: transparent;
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.quiz-chapter-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.quiz-chapter-btn.on {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background: rgba(217, 119, 6, 0.06);
	}

	.quiz-start-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.quiz-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.quiz-progress {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
	}

	.quiz-timer {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--color-ink-2);
		font-variant-numeric: tabular-nums;
	}

	.quiz-timer.urgent {
		color: var(--color-danger);
	}

	.quiz-question {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 500;
		color: var(--color-ink);
		line-height: 1.5;
	}

	.quiz-options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.quiz-opt {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
		text-align: left;
		font-size: 14px;
		color: var(--color-ink-2);
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			background 120ms var(--ease-out);
	}

	.quiz-opt:hover:not(:disabled) {
		border-color: var(--color-ink);
	}

	.quiz-opt.correct {
		border-color: var(--color-success);
		background: rgba(45, 106, 79, 0.1);
		color: var(--color-success);
	}

	.quiz-opt.wrong {
		border-color: var(--color-danger);
		background: rgba(155, 34, 38, 0.08);
		color: var(--color-danger);
	}

	.quiz-opt-key {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
		width: 22px;
		flex-shrink: 0;
	}

	.quiz-feedback {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-danger);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.quiz-feedback.ok {
		color: var(--color-success);
	}

	.quiz-explain {
		font-size: 12.5px;
		font-weight: 400;
		color: var(--color-ink-2);
		line-height: 1.6;
	}

	.quiz-result {
		align-items: center;
		text-align: center;
		padding: 40px 26px;
	}

	.quiz-score {
		font-family: var(--font-display);
		font-size: 56px;
		font-weight: 600;
		color: var(--color-ink);
		letter-spacing: -0.02em;
	}

	.quiz-score-label {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-ink-3);
	}

	.quiz-score-desc {
		font-size: 14px;
		color: var(--color-ink-2);
	}

	.quiz-actions {
		display: flex;
		gap: 10px;
	}
</style>
