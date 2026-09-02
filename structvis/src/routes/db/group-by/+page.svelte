<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createGroupByFlowEngine } from '$lib/engines/sql/scripts/group-by';
</script>

<AlgoPage sectionNum="§04" sectionName="数据库查询" title="SQL 分组聚合 GROUP BY">
	{#snippet desc()}
		按列分组、组内聚合，结果表逐组生长；HAVING 再对「组」筛选。 每帧都是真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer
		load={createGroupByFlowEngine}
		topicId="group-by"
		topicName="SQL 分组聚合 GROUP BY"
	/>
</AlgoPage>
