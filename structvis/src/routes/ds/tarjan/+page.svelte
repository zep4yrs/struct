<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { TarjanEngine } from '$lib/engines/algorithm/graph/TarjanEngine';

	function createEngine(): TarjanEngine {
		const e = new TarjanEngine();
		e.init({
			labels: ['A', 'B', 'C', 'D', 'E', 'F'],
			edges: [
				[0, 1],
				[1, 2],
				[2, 0],
				[2, 3],
				[3, 4],
				[4, 5],
				[5, 3]
			]
		});
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图结构" title="Tarjan 强连通分量">
	{#snippet desc()}
		一次 DFS 求出所有强连通分量：<span class="mono">dfn</span> 时间戳 +
		<span class="mono">low</span> 回溯值，dfn == low 处切分分量。
	{/snippet}
	<AlgoPlayer {engine} topicId="tarjan" topicName="Tarjan 强连通分量" />
</AlgoPage>
