<script lang="ts">
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics, TOPIC_ALIASES, DS_GROUP_ORDER } from '$lib/content/topics';
	import type { TopicCard } from '$lib/content/topics';
	import { progress } from '$lib/stores/progress';
	import { reveal, revealOnScroll } from '$lib/utils/motion';

	/**
	 * v3.1 课程目录 — 三分区去杂重构：
	 * 顶部「数据结构 / MySQL / SQL 实验」分段 tab（一次只看一门，密度减半）；
	 * 段内保留分组锚点 + 双列列表 + 掌握度条；搜索跨全部分段过滤。
	 * 数据全部来自 topics.ts 单源 + progress 掌握度。
	 */
	interface Group {
		id: string;
		label: string;
		shortLabel: string;
		topics: TopicCard[];
	}
	interface Segment {
		id: 'ds' | 'db-course' | 'db-lab';
		label: string;
		marker: string;
		count: number;
		groups: Group[];
	}

	const dsGroups: Group[] = DS_GROUP_ORDER.map((g) => ({
		id: 'ds-' + g,
		label: g,
		shortLabel: g,
		topics: dsTopics.filter((t) => t.group === g)
	})).filter((g) => g.topics.length > 0);

	// 数据库拆两段：课程系（基础/进阶/设计/运维）与实验区（实验）——性质不同，分开展示
	const dbCourseGroups: Group[] = (['基础', '进阶', '设计', '运维'] as const)
		.map((g) => ({
			id: 'db-' + g,
			label: g,
			shortLabel: g,
			topics: dbTopics.filter((t) => t.group === g)
		}))
		.filter((g) => g.topics.length > 0);
	const dbLabGroups: Group[] = (['实验'] as const)
		.map((g) => ({
			id: 'lab-' + g,
			label: 'SQL 实验',
			shortLabel: g,
			topics: dbTopics.filter((t) => t.group === g)
		}))
		.filter((g) => g.topics.length > 0);

	const SEGMENTS: Segment[] = [
		{
			id: 'ds',
			label: '数据结构',
			marker: '教材配套 · 李春葆',
			count: dsTopics.length,
			groups: dsGroups
		},
		{
			id: 'db-course',
			label: 'MySQL 课程',
			marker: '教材配套 · 杨宏霞',
			count: dbCourseGroups.reduce((n, g) => n + g.topics.length, 0),
			groups: dbCourseGroups
		},
		{
			id: 'db-lab',
			label: 'SQL 实验',
			marker: 'sql.js 真实执行',
			count: dbLabGroups.reduce((n, g) => n + g.topics.length, 0),
			groups: dbLabGroups
		}
	];

	let segment = $state<'ds' | 'db-course' | 'db-lab'>('ds');
	let query = $state('');

	// 匹配文本与全站搜索同一口径：标题 + 描述 + 别名表
	const haystack = new Map<string, string>(
		[...dsTopics, ...dbTopics].map((t) => [
			t.href,
			(t.title + ' ' + t.description + ' ' + (TOPIC_ALIASES[t.href]?.join(' ') ?? '')).toLowerCase()
		])
	);

	const activeSegment = $derived(SEGMENTS.find((s) => s.id === segment)!);

	/** 搜索时跨全部分段；非搜索时只看当前分段 */
	const visibleGroups: Group[] = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return activeSegment.groups;
		const filter = (g: Group) => ({
			...g,
			topics: g.topics.filter((t) => (haystack.get(t.href) ?? '').includes(q))
		});
		return SEGMENTS.flatMap((s) => s.groups.map(filter)).filter((g) => g.topics.length > 0);
	});

	const totalShown = $derived(visibleGroups.reduce((n, g) => n + g.topics.length, 0));
	const searching = $derived(query.trim().length > 0);

	function masteryOf(t: TopicCard): number {
		return t.topicId ? ($progress.topics[t.topicId]?.mastery ?? 0) : 0;
	}

	function jump(groupId: string) {
		document
			.getElementById('group-' + groupId)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<div class="mx-auto max-w-6xl px-5 pb-28 2xl:max-w-[1400px]">
	<!-- 头部：标题 + 搜索条 -->
	<header class="catalog-head">
		<div class="catalog-head-row">
			<div>
				<h1 class="catalog-title">课程</h1>
				<p class="catalog-sub">{dsTopics.length + dbTopics.length} 个课题 · 一次专注一门</p>
			</div>
			<nav class="tool-links" aria-label="学习工具">
				<a class="tool-link" href={resolve('/map')}>技能图谱</a>
				<a class="tool-link" href={resolve('/race')}>竞速实验室</a>
			</nav>
		</div>
		<div class="search-wrap">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="8" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
			<input
				type="search"
				placeholder="搜索课题：名称 / 别名 / 关键词"
				aria-label="搜索课程"
				bind:value={query}
			/>
			{#if searching}
				<span class="search-count">{totalShown} 个结果</span>
			{/if}
		</div>

		<!-- 三分段 tab：数据结构 / MySQL 课程 / SQL 实验 -->
		<div class="seg-row" role="tablist" aria-label="课程分段" tabindex="-1">
			{#each SEGMENTS as s (s.id)}
				<button
					class="seg-chip"
					class:active={segment === s.id && !searching}
					role="tab"
					aria-selected={segment === s.id}
					onclick={() => {
						segment = s.id;
						query = '';
					}}
				>
					<span class="seg-name">{s.label}</span>
					<span class="seg-count">{s.count}</span>
				</button>
			{/each}
		</div>

		<!-- 段内分组锚点（搜索时隐藏） -->
		{#if !searching}
			<nav class="anchor-row" aria-label="分组锚点">
				{#each activeSegment.groups as g (g.id)}
					<button class="anchor-chip" onclick={() => jump(g.id)}>{g.shortLabel}</button>
				{/each}
			</nav>
		{/if}
	</header>

	<!-- 段标识行 -->
	{#if !searching}
		<div class="seg-mark" use:reveal>
			<span class="seg-mark-label">{activeSegment.label}</span>
			<span class="seg-mark-note">{activeSegment.marker}</span>
		</div>
	{/if}

	<!-- 分组列表 -->
	{#each visibleGroups as g (g.id)}
		<section id="group-{g.id}" class="group" use:revealOnScroll={{ delay: 60, y: 18 }}>
			<h2 class="group-label">{g.label}</h2>
			<ul class="topic-list">
				{#each g.topics as t, ti (t.href)}
					{@const m = masteryOf(t)}
					<li use:reveal={{ delay: Math.min(ti * 40, 320), y: 10 }}>
						<a class="topic-row liquid" href={resolve(t.href as '/ds/quick-sort')}>
							<div class="topic-main">
								<span class="topic-title">{t.title}</span>
								<span class="topic-desc">{t.description}</span>
							</div>
							<div class="topic-side">
								<span class="topic-badge">{t.badge}</span>
								{#if t.topicId}
									<span class="mastery" class:done={m >= 80} class:learning={m > 0 && m < 80}>
										<i style="width:{m}%"></i>
									</span>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<p class="empty">没有匹配「{query}」的课题——试试别名，比如 BST、并查集、EXPLAIN。</p>
	{/each}

	<footer
		class="mt-16 flex items-center justify-between border-t pt-8 font-mono text-[11px] tracking-wider uppercase"
		style="border-color: var(--color-line-hair); color: var(--color-ink-3); letter-spacing: 0.08em;"
	>
		<span>StructVis</span>
		<span>© 2026 zep4yrs</span>
	</footer>
</div>

<style>
	.catalog-head {
		position: sticky;
		top: 0;
		z-index: 30;
		background: color-mix(in srgb, var(--color-paper) 88%, transparent);
		padding: 20px 0 12px;
		-webkit-backdrop-filter: blur(14px) saturate(1.5);
		backdrop-filter: blur(14px) saturate(1.5);
	}

	.catalog-head-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	.catalog-title {
		font-family: var(--font-display);
		font-size: 34px;
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		margin: 0;
	}

	.catalog-sub {
		font-size: 12.5px;
		color: var(--color-ink-2);
		margin: 4px 0 14px;
	}

	.tool-links {
		display: flex;
		gap: 8px;
	}

	.tool-link {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 14px;
		border: 1px solid var(--color-line-regular);
		border-radius: 999px;
		background: var(--glass-tint);
		font-size: 12.5px;
		font-weight: 500;
		color: var(--color-ink-2);
		text-decoration: none;
		transition:
			color 150ms var(--ease-out),
			border-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	.tool-link:hover {
		color: var(--color-accent-text);
		border-color: var(--color-accent);
		box-shadow: 0 4px 14px rgba(217, 119, 6, 0.12);
	}

	.search-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border: 1px solid var(--color-line-regular);
		border-radius: 12px;
		background: var(--glass-tint);
	}

	.search-wrap:focus-within {
		border-color: var(--color-accent);
	}

	.search-wrap svg {
		width: 17px;
		height: 17px;
		color: var(--color-ink-3);
		flex-shrink: 0;
	}

	.search-wrap input {
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		font-size: 14px;
		color: var(--color-ink);
	}

	.search-count {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	/* ═══ 三分段 tab ═══ */
	.seg-row {
		display: flex;
		gap: 8px;
		margin-top: 14px;
	}

	.seg-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: 999px;
		background: var(--glass-tint);
		font-size: 13px;
		color: var(--color-ink-2);
		cursor: pointer;
		transition:
			color 150ms var(--ease-out),
			border-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	.seg-chip:hover {
		color: var(--color-ink);
	}

	.seg-chip.active {
		color: var(--color-accent-text);
		font-weight: 600;
		border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-line-hair));
		box-shadow:
			inset 0 1px 0 var(--glass-hi),
			0 2px 8px color-mix(in srgb, var(--color-accent) 18%, transparent);
	}

	.seg-count {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--color-ink-3);
	}

	.seg-chip.active .seg-count {
		color: var(--color-accent);
	}

	.anchor-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}

	.anchor-chip {
		border: 1px solid var(--color-line-hair);
		border-radius: 999px;
		background: var(--glass-tint);
		padding: 4px 11px;
		font-size: 11.5px;
		color: var(--color-ink-2);
		cursor: pointer;
		transition:
			color 120ms var(--ease-out),
			border-color 120ms var(--ease-out);
	}

	.anchor-chip:hover {
		color: var(--color-accent-text);
		border-color: var(--color-accent);
	}

	/* 段标识行：当前分段的大字标识 + 定位说明 */
	.seg-mark {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin: 26px 0 6px;
	}

	.seg-mark-label {
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-ink);
	}

	.seg-mark-note {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-ink-3);
	}

	.group {
		margin-top: 24px;
		scroll-margin-top: 200px;
	}

	.group-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-ink-3);
		margin: 0 0 8px;
	}

	.topic-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
		gap: 10px;
	}

	.topic-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		height: 100%;
		padding: 13px 16px;
		border-radius: var(--radius-md, 12px);
		text-decoration: none;
	}

	.topic-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.topic-title {
		font-size: 14.5px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.topic-desc {
		font-size: 12px;
		color: var(--color-ink-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.topic-side {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.topic-badge {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-ink-3);
	}

	.mastery {
		width: 56px;
		height: 4px;
		border-radius: 2px;
		background: var(--color-line-hair);
		overflow: hidden;
		display: inline-block;
	}

	.mastery i {
		display: block;
		height: 100%;
		background: var(--color-accent);
	}

	.mastery.done i {
		background: var(--color-success);
	}

	.empty {
		margin-top: 40px;
		text-align: center;
		font-size: 13.5px;
		color: var(--color-ink-2);
	}
</style>
