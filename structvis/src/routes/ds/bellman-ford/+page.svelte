<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BellmanFordEngine } from '$lib/engines/algorithm/graph/BellmanFordEngine';

	function createEngine(): BellmanFordEngine {
		const e = new BellmanFordEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图结构" title="Bellman-Ford 最短路">
	{#snippet desc()}
		逐轮<span class="mono">松弛所有边</span>:支持负权边,可检测负环;全对全用 Floyd。
	{/snippet}
	<AlgoPlayer {engine} topicId="bellman-ford" topicName="Bellman-Ford 最短路" />
</AlgoPage>
