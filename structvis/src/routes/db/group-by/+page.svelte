<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { GroupByEngine } from '$lib/engines/sql/GroupByEngine';

	function createEngine(): GroupByEngine {
		const e = new GroupByEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§04" sectionName="数据库查询" title="SQL 分组聚合 GROUP BY">
	{#snippet desc()}
		按列分组，组内聚合计数，结果表逐组生长。
	{/snippet}
	<AlgoPlayer {engine} topicId="group-by" topicName="SQL 分组聚合 GROUP BY" />
</AlgoPage>
