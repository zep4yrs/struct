<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ReplicationEngine } from '$lib/engines/db/ReplicationEngine';

	function createEngine(): ReplicationEngine {
		const e = new ReplicationEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§10" sectionName="高可用" title="主从复制">
	{#snippet desc()}
		<span class="mono">binlog → dump → IO → relay log → SQL</span> 三线程链路——读写分离与高可用的基础。
	{/snippet}
	<AlgoPlayer {engine} topicId="replication" topicName="主从复制" />
</AlgoPage>
