<script lang="ts">
	import TopicGrid from '$lib/components/ui/TopicGrid.svelte';
	import { dsTopics } from '$lib/content/topics';
</script>

<div class="mx-auto max-w-7xl px-8 py-16 min-[1856px]:max-w-[1856px] 2xl:max-w-[1600px]">
	<div class="section-label mb-4">数据结构</div>
	<h1 class="mb-2 font-display text-3xl font-medium" style="letter-spacing: -0.02em;">
		数据结构与算法
	</h1>
	<p class="mb-10" style="color: var(--color-ink-2); max-width: 560px;">
		李春葆《数据结构教程》第5版配套自学练习。每个知识点都有步进可视化 + 交互式练习，
		卡片底部的进度条反映你的掌握度。
	</p>

	<TopicGrid topics={dsTopics} />
</div>
