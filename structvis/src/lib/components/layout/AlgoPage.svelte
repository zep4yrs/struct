<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/utils/motion';
	import { page } from '$app/stores';
	import { base, resolve } from '$app/paths';
	import { dbTopics, dsTopics } from '$lib/content/topics';

	interface Props {
		sectionNum: string;
		sectionName: string;
		title: string;
		/** 页面描述（渲染为 .page-desc 段） */
		desc: Snippet;
		/** 播放器区域内容 */
		children: Snippet;
		/** 变体：badge = 章节号圆形徽标（graph-storage 风格） */
		variant?: 'badge';
	}

	let { sectionNum, sectionName, title, desc, children, variant }: Props = $props();

	function stripBase(path: string): string {
		if (!base || base === '/') return path;
		if (!path.startsWith(base)) return path;
		// 归一化尾部斜杠：dev/Pages 会以目录 URL（…/bubble-sort/）服务，单源 href 无尾斜杠
		const stripped = (path.slice(base.length) || '/').replace(/\/+$/, '');
		return stripped === '' ? '/' : stripped;
	}

	// v3 布局路径线：侧栏移除后，课程页的路径线 = 「← 返回课程」+ 上一课/下一课 pager。
	// 当前课题从 pathname 反查课题单源（href 唯一）；prev/next 限定在同科数组内。
	const allTopics = [...dsTopics, ...dbTopics];

	const topicIndex = $derived(allTopics.findIndex((t) => t.href === stripBase($page.url.pathname)));
	const prevTopic = $derived(topicIndex > 0 ? allTopics[topicIndex - 1] : null);
	const nextTopic = $derived(
		topicIndex >= 0 && topicIndex < allTopics.length - 1 ? allTopics[topicIndex + 1] : null
	);
</script>

<!-- 每课题页独立 title/description（预渲染进静态 HTML：SEO/多标签/分享抓取都依赖） -->
<svelte:head>
	<title>{title} · StructVis</title>
	<meta
		name="description"
		content="{sectionName} · {title}——逐帧可视化、可交互练习，本地免费使用。"
	/>
</svelte:head>

<div class="page">
	<div class="wayfind" use:reveal>
		<a class="wayfind-back" href={resolve('/catalog')}>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="19" y1="12" x2="5" y2="12" />
				<polyline points="12 19 5 12 12 5" />
			</svg>
			课程目录
		</a>
		{#if topicIndex >= 0}
			<span class="wayfind-pos">
				{topicIndex + 1} / {allTopics.length}
			</span>
		{/if}
	</div>

	<div class="section-header">
		<div class="section-label" use:reveal>
			<span class="section-num" class:badge={variant === 'badge'}>{sectionNum}</span>
			<span class="section-name">{sectionName}</span>
		</div>
		<h1 class="page-title" use:reveal={{ delay: 90 }}>{title}</h1>
		<!-- 包装在组件内声明，.page-desc 作用域才有效（snippet 内容属于父组件作用域） -->
		<p class="page-desc" use:reveal={{ delay: 180 }}>{@render desc()}</p>
	</div>

	<div class="player-wrap" use:reveal={{ delay: 270 }}>
		{@render children()}
	</div>

	{#if topicIndex >= 0}
		<div class="pager" use:reveal={{ delay: 120, y: 12 }}>
			{#if prevTopic}
				<a class="pager-item" href={resolve(prevTopic.href as '/ds/quick-sort')}>
					<span class="pager-dir">← 上一课</span>
					<span class="pager-title">{prevTopic.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if nextTopic}
				<a class="pager-item pager-next" href={resolve(nextTopic.href as '/ds/quick-sort')}>
					<span class="pager-dir">下一课 →</span>
					<span class="pager-title">{nextTopic.title}</span>
				</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: min(1440px, 100%);
		margin: 0 auto;
		padding: 20px 32px 64px;
		min-height: calc(100vh - 48px);
		display: flex;
		flex-direction: column;
	}

	.player-wrap {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 32px;
		margin-bottom: 32px;
	}

	.section-header {
		margin-bottom: 32px;
	}

	/* v3 路径线：返回课程 + 全局序号 */
	.wayfind {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18px;
	}

	.wayfind-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--color-ink-2);
		text-decoration: none;
		padding: 6px 10px;
		margin-left: -10px;
		border-radius: var(--radius-sm);
		transition:
			color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.wayfind-back:hover {
		color: var(--color-ink);
		background: var(--color-subtle);
	}

	.wayfind-back svg {
		width: 15px;
		height: 15px;
	}

	.wayfind-pos {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.section-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.section-label::before {
		content: '';
		width: 24px;
		height: 1px;
		background: var(--color-line-regular);
	}

	.section-num {
		color: var(--color-accent);
		font-weight: 500;
	}

	.section-num.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-sm);
		background: var(--color-academic);
		color: #fff;
		font-size: 11px;
		font-weight: 600;
	}

	.section-name {
		font-weight: 500;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 500;
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin: 0 0 8px 0;
		color: var(--color-ink);
	}

	.page-desc {
		font-size: 14px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 620px;
		margin: 0;
	}

	/* 上一课 / 下一课 pager（侧栏移除后的学习路径线） */
	.pager {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: 8px;
	}

	.pager-item {
		display: flex;
		flex-direction: column;
		gap: 3px;
		max-width: 46%;
		padding: 12px 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		text-decoration: none;
		transition:
			border-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	.pager-item:hover {
		border-color: var(--color-accent);
		box-shadow: 0 4px 16px rgba(217, 119, 6, 0.12);
	}

	.pager-next {
		margin-left: auto;
		text-align: right;
	}

	.pager-dir {
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-ink-3);
	}

	.pager-title {
		font-size: 13.5px;
		font-weight: 500;
		color: var(--color-ink);
	}
</style>
