<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { IsolationEngine } from '$lib/engines/sql/IsolationEngine';

	function createEngine(): IsolationEngine {
		const e = new IsolationEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§08" sectionName="数据库查询" title="事务隔离级别">
	{#snippet desc()}
		T1 写 T2 读交错执行：脏读 / 不可重复读的产生过程逐步演示。
	{/snippet}
	<AlgoPlayer {engine} topicId="isolation" topicName="事务隔离级别" />
</AlgoPage>
