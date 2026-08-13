<script lang="ts">
	import { base } from '$app/paths';
	import { progress } from '$lib/stores/progress';
	import type { TopicCard } from '$lib/content/topics';

	interface Props {
		topics: TopicCard[];
	}

	let { topics }: Props = $props();

	function handleCardClick(e: MouseEvent, planned?: boolean) {
		if (planned) e.preventDefault();
	}
</script>

<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each topics as topic, idx (topic.title)}
		<a
			href={topic.planned ? undefined : base + topic.href}
			class="topic-card card-note block rounded-md border p-4 no-underline transition-all page-rise"
			class:planned={topic.planned}
			style="
				background: var(--color-surface);
				border-color: var(--color-line-hair);
				opacity: {topic.planned ? '0.5' : '1'};
				cursor: {topic.planned ? 'not-allowed' : 'pointer'};
				animation-delay: {(idx % 8) * 45}ms;
			"
			onclick={(e) => handleCardClick(e, topic.planned)}
			title={topic.planned ? '规划中，敬请期待' : ''}
		>
			<!-- 目录条目行：编号 + 标题 + 点线 + 箭头 -->
			<div class="entry-row">
				<span class="entry-num mono">{String(idx + 1).padStart(2, '0')}</span>
				<h3 class="entry-title">{topic.title}</h3>
				<span class="entry-dots" aria-hidden="true"></span>
				<span class="entry-arrow" aria-hidden="true">→</span>
				{#if topic.planned}
					<span class="font-mono text-[10px] tracking-wider uppercase" style="color: var(--color-ink-3);">soon</span>
				{:else}
					<span class="tag tag-blue" style="font-size: 10px;">{topic.badge}</span>
				{/if}
			</div>
			<p class="mb-3 mt-1 text-xs" style="color: var(--color-ink-2); line-height: 1.6;">
				{topic.description}
			</p>
			{#if topic.topicId && !topic.planned}
				{@const mastery = $progress.topics[topic.topicId]?.mastery ?? 0}
				<div class="h-0.5 w-full rounded-full" style="background: var(--color-subtle);">
					<div
						class="h-full rounded-full transition-all"
						style="width: {mastery}%; background: var(--color-success);"
					></div>
				</div>
			{/if}
		</a>
	{/each}
</div>

<style>
	.topic-card.planned {
		cursor: not-allowed;
	}

	.topic-card:not(.planned):hover {
		border-color: var(--color-ink) !important;
	}

	/* 目录条目 */
	.entry-row {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 8px;
	}

	.entry-num {
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 600;
		color: var(--color-accent);
	}

	.entry-title {
		font-family: var(--font-display);
		font-size: 16px;
		font-weight: 600;
		color: var(--color-ink);
		margin: 0;
		white-space: nowrap;
	}

	.entry-arrow {
		font-size: 13px;
		color: var(--color-ink-3);
		transition:
			transform 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.topic-card:not(.planned):hover .entry-arrow {
		color: var(--color-accent);
		transform: translateX(3px);
	}
</style>
