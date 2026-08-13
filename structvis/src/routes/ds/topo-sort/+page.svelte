<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { TopoSortEngine } from '$lib/engines/algorithm/graph/TopoSortEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4', '5'];
	const DEFAULT_EDGES: [number, number][] = [
		[0, 1],
		[0, 2],
		[1, 3],
		[1, 4],
		[2, 4],
		[2, 5],
		[3, 5]
	];

	function createEngine(): TopoSortEngine {
		const e = new TopoSortEngine();
		e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图状结构" title="拓扑排序">
	{#snippet desc()}
		Kahn 算法：反复输出入度为 0 的顶点并删除其出边，直到全部顶点排成线性序列。适用于选课
			依赖、工程工序等有向无环图（DAG）；顶点下方的数字实时显示当前入度，若序列排不满则说明
			图中存在环。
	{/snippet}
	<AlgoPlayer {engine} topicId="topo-sort" topicName="拓扑排序" />
</AlgoPage>