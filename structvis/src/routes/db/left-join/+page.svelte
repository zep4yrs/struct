<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createLeftJoinFlowEngine } from '$lib/engines/sql/scripts/left-join';
</script>

<AlgoPage sectionNum="§03" sectionName="数据库查询" title="SQL 左外连接 LEFT JOIN">
	{#snippet desc()}
		以左表为主，无匹配时右半部填 <span class="mono">NULL</span>——对比内连接的丢弃行为； 再看
		<span class="mono">IS NULL</span>
		反查与 <span class="mono">COUNT</span> 统计两大经典套路。 每帧都是真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer
		load={createLeftJoinFlowEngine}
		topicId="left-join"
		topicName="SQL 左外连接 LEFT JOIN"
	/>
</AlgoPage>
