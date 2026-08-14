<script lang="ts">
	import { resolve } from '$app/paths';
	import type { RouteId } from '../../../routes/$types';
	import { progress } from '$lib/stores/progress';
	import type { TopicCard } from '$lib/content/topics';
	import { revealOnScroll } from '$lib/utils/motion';

	interface Props {
		topics: TopicCard[];
	}

	let { topics }: Props = $props();

	function handleCardClick(e: MouseEvent, planned?: boolean) {
		if (planned) e.preventDefault();
	}
</script>

<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each topics as topic, i (topic.title)}
		<a
			use:revealOnScroll={{ delay: (i % 8) * 55 }}
			href={topic.planned ? undefined : resolve(topic.href as RouteId)}
			class="topic-card block rounded-md border p-4 no-underline transition-all"
			class:planned={topic.planned}
			style="
				background: var(--color-surface);
				border-color: var(--color-line-hair);
				-webkit-backdrop-filter: blur(10px) saturate(1.4);
				backdrop-filter: blur(10px) saturate(1.4);
				opacity: {topic.planned ? '0.5' : '1'};
				cursor: {topic.planned ? 'not-allowed' : 'pointer'};
			"
			onclick={(e) => handleCardClick(e, topic.planned)}
			title={topic.planned ? '规划中，敬请期待' : ''}
		>
			<div class="mb-2 flex items-start justify-between">
				<h3 class="text-base font-medium" style="color: var(--color-ink);">{topic.title}</h3>
				{#if topic.planned}
					<span
						class="font-mono text-[10px] tracking-wider uppercase"
						style="color: var(--color-ink-3);"
					>
						soon
					</span>
				{:else}
					<span class="tag tag-blue" style="font-size: 10px;">{topic.badge}</span>
				{/if}
			</div>
			<p class="mb-3 text-xs" style="color: var(--color-ink-2); line-height: 1.6;">
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

	.topic-card {
		transition:
			transform 0.22s var(--ease-out),
			box-shadow 0.22s var(--ease-out),
			border-color 0.22s var(--ease-out);
	}

	.topic-card:not(.planned):hover {
		border-color: var(--color-ink) !important;
		transform: translateY(-4px);
		box-shadow: 0 12px 30px -14px rgb(0 0 0 / 0.22);
	}

	.topic-card:not(.planned):active {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px -6px rgb(0 0 0 / 0.18);
	}
</style>
