<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createAdvancedQueryFlowEngine } from '$lib/engines/sql/scripts/advanced-query';
</script>

<AlgoPage sectionNum="§05" sectionName="高级查询" title="高级查询">
	{#snippet desc()}
		在基础 SELECT 之上的四类进阶：<span class="mono">LEFT JOIN + IS NULL</span> 反查缺失关系、
		<span class="mono">UNION</span> 合并去重、<span class="mono">EXISTS</span> 相关子查询逐行判断，
		最后以一个 IN + GROUP BY + HAVING 的综合查询收束。 每帧都是真实执行的 SQL（<span class="mono"
			>SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer load={createAdvancedQueryFlowEngine} topicId="sql-advanced" topicName="高级查询" />
</AlgoPage>
