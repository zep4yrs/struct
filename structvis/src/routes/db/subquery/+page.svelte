<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { SubQueryEngine } from '$lib/engines/sql/SubQueryEngine';

	function createEngine(): SubQueryEngine {
		const e = new SubQueryEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="数据库查询" title="SQL 子查询">
	{#snippet desc()}
		先执行子查询得到平均分，外层再用它过滤——非相关子查询的标准执行顺序。
	{/snippet}
	<AlgoPlayer {engine} topicId="subquery" topicName="SQL 子查询" />
</AlgoPage>
