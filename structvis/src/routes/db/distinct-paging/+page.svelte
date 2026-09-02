<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createDistinctPagingEngine } from '$lib/engines/sql/scripts/distinct-paging';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="DISTINCT 与分页">
	{#snippet desc()}
		<b>去重</b>与<b>分页</b>是一对报表基本功：DISTINCT 对整行组合去重、COUNT(DISTINCT …)
		去重计数、LIMIT/OFFSET 划分页窗口——以及大偏移深分页为什么慢。 每帧都是真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer
		load={createDistinctPagingEngine}
		topicId="distinct-paging"
		topicName="DISTINCT 与分页"
	/>
</AlgoPage>
