<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		dsTopics,
		dbTopics,
		TOPIC_ALIASES,
		DS_GROUP_ORDER,
		DB_GROUP_ORDER
	} from '$lib/content/topics';
	import type { TopicCard } from '$lib/content/topics';
	import { progress } from '$lib/stores/progress';
	import { reveal, revealOnScroll } from '$lib/utils/motion';

	/**
	 * v3 课程目录 — 通讯录形态（底部导航「课程」tab 的落点）：
	 * 顶部常驻搜索条（标题/描述/别名实时过滤）+ 分组锚点 + 分组列表（掌握度条）。
	 * 数据全部来自 topics.ts 单源 + progress 掌握度。
	 */
	interface Group {
		id: string;
		label: string;
		topics: TopicCard[];
	}

	const GROUPS: Group[] = [
		...DS_GROUP_ORDER.map((g) => ({
			id: 'ds-' + g,
			label: '数据结构 · ' + g,
			topics: dsTopics.filter((t) => t.group === g)
		})),
		...DB_GROUP_ORDER.map((g) => ({
			id: 'db-' + g,
			label: '数据库 · ' + g,
			topics: dbTopics.filter((t) => t.group === g)
		}))
	].filter((g) => g.topics.length > 0);

	let query = $state('');

	// 匹配文本与全站搜索同一口径：标题 + 描述 + 别名表
	const haystack = new Map<string, string>(
		[...dsTopics, ...dbTopics].map((t) => [
			t.href,
			(t.title + ' ' + t.description + ' ' + (TOPIC_ALIASES[t.href]?.join(' ') ?? '')).toLowerCase()
		])
	);

	const filtered: Group[] = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return GROUPS;
		return GROUPS.map((g) => ({
			...g,
			topics: g.topics.filter((t) => (haystack.get(t.href) ?? '').includes(q))
		})).filter((g) => g.topics.length > 0);
	});

	const totalShown = $derived(filtered.reduce((n, g) => n + g.topics.length, 0));

	function masteryOf(t: TopicCard): number {
		return t.topicId ? ($progress.topics[t.topicId]?.mastery ?? 0) : 0;
	}

	function jump(groupId: string) {
		document
			.getElementById('group-' + groupId)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<div class="mx-auto max-w-6xl px-5 pb-28">
	<!-- 头部：标题 + 搜索条（通讯录形态的固定入口） -->
	<header class="catalog-head">
		<div class="catalog-head-row">
			<div>
				<h1 class="catalog-title">课程</h1>
				<p class="catalog-sub">
					{dsTopics.length} 数据结构 + {dbTopics.length} 数据库 · 跟教材章节走
				</p>
			</div>
			<!-- 学习工具入口（技能图谱 / 竞速实验室） -->
			<nav class="tool-links" aria-label="学习工具">
				<a class="tool-link" href={resolve('/map')}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="5" r="3" />
						<circle cx="5" cy="19" r="3" />
						<circle cx="19" cy="19" r="3" />
						<line x1="12" y1="8" x2="5" y2="16" />
						<line x1="12" y1="8" x2="19" y2="16" />
					</svg>
					技能图谱
				</a>
				<a class="tool-link" href={resolve('/race')}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
					</svg>
					竞速实验室
				</a>
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
			{#if query}
				<span class="search-count">{totalShown} 个结果</span>
			{/if}
		</div>
		<!-- 分组锚点 -->
		<nav class="anchor-row" aria-label="分组锚点">
			{#each GROUPS as g (g.id)}
				<button class="anchor-chip" onclick={() => jump(g.id)}>{g.label.split('· ')[1]}</button>
			{/each}
		</nav>
	</header>

	<!-- 分组列表 -->
	{#each filtered as g (g.id)}
		<section id="group-{g.id}" class="group" use:revealOnScroll={{ delay: 60, y: 18 }}>
			<h2 class="group-label">{g.label}</h2>
			<ul class="topic-list">
				{#each g.topics as t, ti (t.href)}
					{@const m = masteryOf(t)}
					<li use:reveal={{ delay: Math.min(ti * 40, 320), y: 10 }}>
						<a class="topic-row" href={resolve(t.href as '/ds/quick-sort')}>
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
		background: color-mix(in srgb, var(--color-bg, #fcfaf6) 88%, transparent);
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

	/* 学习工具入口：技能图谱 / 竞速实验室 */
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
		background: var(--color-surface);
		font-size: 12.5px;
		font-weight: 500;
		color: var(--color-ink-2);
		text-decoration: none;
		transition:
			color 150ms var(--ease-out),
			border-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	.tool-link svg {
		width: 15px;
		height: 15px;
	}

	.tool-link:hover {
		color: var(--color-accent-text);
		border-color: var(--color-accent);
		box-shadow: 0 4px 14px rgba(217, 119, 6, 0.12);
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

	.search-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border: 1px solid var(--color-line-regular);
		border-radius: 12px;
		background: var(--color-surface);
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

	.anchor-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 12px;
	}

	.anchor-chip {
		border: 1px solid var(--color-line-hair);
		border-radius: 999px;
		background: var(--color-surface);
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

	.group {
		margin-top: 28px;
		scroll-margin-top: 130px;
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

	.topic-list li + li .topic-row {
		border-top: none;
	}

	.topic-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		height: 100%;
		padding: 13px 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md, 12px);
		background: var(--color-surface);
		text-decoration: none;
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out),
			box-shadow 120ms var(--ease-out);
	}

	.topic-row:hover {
		border-color: var(--color-accent);
		box-shadow: 0 4px 14px rgba(217, 119, 6, 0.1);
	}

	.topic-row:hover {
		background: color-mix(in srgb, var(--color-accent) 5%, transparent);
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
