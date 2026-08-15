<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LeftJoinEngine } from '$lib/engines/sql/LeftJoinEngine';

	function createEngine(): LeftJoinEngine {
		const e = new LeftJoinEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§03" sectionName="数据库查询" title="SQL 左外连接 LEFT JOIN">
	{#snippet desc()}
		以左表为主，无匹配时右半部填 NULL——对比内连接的丢弃行为。
	{/snippet}
	<AlgoPlayer {engine} topicId="left-join" topicName="SQL 左外连接 LEFT JOIN" />
</AlgoPage>
