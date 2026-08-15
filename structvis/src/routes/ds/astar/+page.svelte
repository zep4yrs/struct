<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { AStarEngine } from '$lib/engines/algorithm/graph/AStarEngine';

	function createEngine(): AStarEngine {
		const e = new AStarEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="图状结构" title="A* 寻路">
	{#snippet desc()}
		启发式搜索：f = g + h，优先扩展 f 最小的格子，网格寻路一目了然。
	{/snippet}
	<AlgoPlayer {engine} topicId="astar" topicName="A* 寻路" />
</AlgoPage>
