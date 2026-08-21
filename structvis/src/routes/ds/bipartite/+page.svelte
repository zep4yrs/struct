<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BipartiteEngine } from '$lib/engines/algorithm/graph/BipartiteEngine';

	function createEngine(): BipartiteEngine {
		const e = new BipartiteEngine();
		e.init({
			labels: ['1', '2', '3', '4', '5', '6'],
			edges: [
				[0, 3],
				[0, 4],
				[0, 5],
				[1, 3],
				[1, 5],
				[2, 4]
			]
		});
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图结构" title="二分图判定">
	{#snippet desc()}
		BFS <span class="mono">交替染色</span
		>：相邻顶点必须异色。染色完成无冲突即二分图；同色相邻说明存在奇环。
	{/snippet}
	<AlgoPlayer {engine} topicId="bipartite" topicName="二分图判定" />
</AlgoPage>
