<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { DijkstraEngine } from '$lib/engines/algorithm/graph/DijkstraEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4'];
	const DEFAULT_EDGES: [number, number, number][] = [
		[0, 1, 10],
		[0, 3, 5],
		[1, 2, 1],
		[1, 3, 2],
		[2, 4, 4],
		[3, 1, 3],
		[3, 2, 9],
		[3, 4, 2],
		[4, 0, 7],
		[4, 2, 6]
	];

	function createEngine(): DijkstraEngine {
		const e = new DijkstraEngine();
		e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES, directed: true, start: 0 });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图状结构" title="最短路径">
	{#snippet desc()}
		Dijkstra 算法求解单源最短路径：每轮确定一个距离已最小（dist）的顶点，再用它松弛全部
			出边，不断修正其余顶点的 dist。顶点下方的数字实时显示当前 dist，深色边构成最短路径树。
	{/snippet}
	<AlgoPlayer {engine} topicId="shortest-path" topicName="最短路径" />
</AlgoPage>