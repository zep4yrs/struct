<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MaxFlowEngine } from '$lib/engines/algorithm/graph/MaxFlowEngine';

	function createEngine(): MaxFlowEngine {
		const e = new MaxFlowEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图结构" title="最大流 Edmonds-Karp">
	{#snippet desc()}
		BFS 反复在残余网络中找最短增广路，沿<span class="mono">瓶颈边</span
		>推流——直到无路可走，累计流量即最大流。
	{/snippet}
	<AlgoPlayer {engine} topicId="max-flow" topicName="最大流 Edmonds-Karp" />
</AlgoPage>
