<script lang="ts">
	import TopicGrid from '$lib/components/ui/TopicGrid.svelte';
	import { dbTopics } from '$lib/content/topics';
</script>

<div class="mx-auto max-w-7xl px-8 py-16">
	<div class="section-label mb-4">数据库</div>
	<h1 class="mb-2 font-display text-3xl font-medium" style="letter-spacing: -0.02em;">
		MySQL 数据库
	</h1>
	<p class="mb-10" style="color: var(--color-ink-2); max-width: 560px;">
		杨宏霞《数据库技术及应用（MySQL）》配套自学练习。分步执行可视化 + 即时练习反馈，
		卡片底部的进度条反映你的掌握度。
	</p>

	<TopicGrid topics={dbTopics} />
</div>
