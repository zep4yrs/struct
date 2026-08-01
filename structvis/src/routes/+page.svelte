<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';

	interface TopicCard {
		title: string;
		description: string;
		href: string;
		count: string;
		progress?: number;
		planned?: boolean;
	}

	const dsTopics: TopicCard[] = [
		{ title: '快速排序', description: '分治策略 · 平均 O(n log n)', href: '/ds/quick-sort', count: '交互式', progress: 0 },
		{ title: '二叉树遍历', description: '前/中/后/层序 · 递归与迭代', href: '/ds/binary-tree', count: '交互式', progress: 0 },
		{ title: '单链表', description: '插入/删除/反转', href: '/ds/linear-list', count: '交互式', progress: 0 },
		{ title: '栈和队列', description: '出栈序列 · 括号匹配', href: '/ds/stack-queue', count: '规划中', planned: true },
		{ title: '冒泡/插入/选择', description: '基础排序对比', href: '#', count: '规划中', planned: true },
		{ title: '图的遍历', description: 'BFS / DFS', href: '#', count: '规划中', planned: true }
	];

	const dbTopics: TopicCard[] = [
		{ title: 'SQL 基础查询', description: 'SELECT / JOIN / GROUP BY', href: '/db/sql', count: '分步执行', progress: 0 },
		{ title: '建表练习', description: 'CREATE TABLE / 数据类型', href: '/db/tables', count: '交互式', progress: 0 },
		{ title: '索引原理', description: 'B+ 树 · 执行计划', href: '/db/index', count: '规划中', planned: true },
		{ title: '数据更新', description: 'INSERT / UPDATE / DELETE', href: '#', count: '规划中', planned: true },
		{ title: 'E-R 模型', description: '概念模型 · 关系转换', href: '#', count: '规划中', planned: true },
		{ title: '关系规范化', description: '函数依赖 · 范式分解', href: '#', count: '规划中', planned: true }
	];

	function handleCardClick(e: MouseEvent, planned?: boolean) {
		if (planned) e.preventDefault();
	}
</script>

<div class="max-w-5xl mx-auto px-8 py-16">
	<!-- Hero -->
	<section class="mb-20 pb-12 border-b" style="border-color: var(--color-line-hair);">
		<div class="flex items-end gap-6 mb-8">
			<Logo size={56} />
			<h1
				class="font-display text-5xl font-medium leading-none"
				style="letter-spacing: -0.03em; color: var(--color-ink);"
			>
				StructVis<span style="color: var(--color-accent); font-weight: 400;">/</span>
			</h1>
		</div>

		<p
			class="font-display text-2xl font-normal italic max-w-xl"
			style="line-height: 1.35; color: var(--color-ink-2);"
		>
			看见数据结构与数据库的每一步跳动。<br />
			<span style="font-size: 0.8em; opacity: 0.6;">
				See every step of data structures &amp; databases, clearly.
			</span>
		</p>
	</section>

	<!-- 数据结构 -->
	<section class="mb-16">
		<div class="section-label mb-4">数据结构 · 李春葆《数据结构教程》第5版</div>
		<h2 class="font-display text-2xl font-medium mb-6" style="letter-spacing: -0.01em;">
			数据结构与算法
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each dsTopics as topic}
				<a
					href={topic.href}
					class="topic-card block p-4 rounded-md border no-underline transition-all"
					style="
						background: var(--color-surface);
						border-color: var(--color-line-hair);
						opacity: {topic.planned ? '0.5' : '1'};
						cursor: {topic.planned ? 'not-allowed' : 'pointer'};
					"
					onclick={(e) => handleCardClick(e, topic.planned)}
					title={topic.planned ? '规划中，敬请期待' : ''}
				>
					<div class="flex items-start justify-between mb-2">
						<h3 class="text-base font-medium" style="color: var(--color-ink);">{topic.title}</h3>
						{#if topic.planned}
							<span
								class="text-[10px] font-mono uppercase tracking-wider"
								style="color: var(--color-ink-3);"
							>
								soon
							</span>
						{:else}
							<span class="tag tag-blue" style="font-size: 10px;">{topic.count}</span>
						{/if}
					</div>
					<p class="text-xs mb-3" style="color: var(--color-ink-2); line-height: 1.6;">
						{topic.description}
					</p>
					{#if topic.progress !== undefined && !topic.planned}
						<div class="w-full h-0.5 rounded-full" style="background: var(--color-subtle);">
							<div
								class="h-full rounded-full transition-all"
								style="width: {topic.progress}%; background: var(--color-success);"
							></div>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	</section>

	<!-- 数据库 -->
	<section>
		<div class="section-label mb-4">数据库 · 杨宏霞《数据库技术及应用（MySQL）》</div>
		<h2 class="font-display text-2xl font-medium mb-6" style="letter-spacing: -0.01em;">
			数据库与 SQL
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each dbTopics as topic}
				<a
					href={topic.href}
					class="topic-card block p-4 rounded-md border no-underline transition-all"
					style="
						background: var(--color-surface);
						border-color: var(--color-line-hair);
						opacity: {topic.planned ? '0.5' : '1'};
						cursor: {topic.planned ? 'not-allowed' : 'pointer'};
					"
					onclick={(e) => handleCardClick(e, topic.planned)}
					title={topic.planned ? '规划中，敬请期待' : ''}
				>
					<div class="flex items-start justify-between mb-2">
						<h3 class="text-base font-medium" style="color: var(--color-ink);">{topic.title}</h3>
						{#if topic.planned}
							<span
								class="text-[10px] font-mono uppercase tracking-wider"
								style="color: var(--color-ink-3);"
							>
								soon
							</span>
						{:else}
							<span class="tag tag-blue" style="font-size: 10px;">{topic.count}</span>
						{/if}
					</div>
					<p class="text-xs mb-3" style="color: var(--color-ink-2); line-height: 1.6;">
						{topic.description}
					</p>
					{#if topic.progress !== undefined && !topic.planned}
						<div class="w-full h-0.5 rounded-full" style="background: var(--color-subtle);">
							<div
								class="h-full rounded-full transition-all"
								style="width: {topic.progress}%; background: var(--color-success);"
							></div>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<footer
		class="mt-20 pt-8 border-t flex justify-between items-center font-mono text-[11px] uppercase tracking-wider"
		style="border-color: var(--color-line-hair); color: var(--color-ink-3); letter-spacing: 0.08em;"
	>
		<span>StructVis · v0.1-dev</span>
		<span>自学工具 · 纯静态</span>
	</footer>
</div>

<style>
	.topic-card:hover:not([aria-disabled='true']) {
		border-color: var(--color-ink) !important;
		transform: translateY(-2px);
	}
</style>
