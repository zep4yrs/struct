<script lang="ts">
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';
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
	{#each topics as topic (topic.title)}
		<a
			href={topic.planned ? undefined : resolve(topic.href as RouteId)}
			class="topic-card block rounded-md border p-4 no-underline transition-all"
			style="
				background: var(--color-surface);
				border-color: var(--color-line-hair);
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
	.topic-card:hover:not([aria-disabled='true']) {
		border-color: var(--color-ink) !important;
		transform: translateY(-2px);
	}
</style>
