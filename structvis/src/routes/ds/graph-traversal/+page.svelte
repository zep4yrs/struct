<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		GraphTraversalEngine,
		type GraphTraversalMode
	} from '$lib/engines/algorithm/graph/GraphTraversalEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4', '5'];
	const DEFAULT_EDGES: [number, number][] = [
		[0, 1],
		[0, 2],
		[1, 3],
		[1, 4],
		[2, 4],
		[2, 5],
		[3, 4],
		[4, 5]
	];

	function createEngine(mode: GraphTraversalMode): GraphTraversalEngine {
		const e = new GraphTraversalEngine();
		e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES, mode, start: 0 });
		return e;
	}

	let engine = $state(createEngine('bfs'));
</script>

<AlgoPage sectionNum="§06" sectionName="图状结构" title="图的遍历">
	{#snippet desc()}
		图的遍历是图算法的基础：从某顶点出发，沿边不重复地访问所有可达顶点。广度优先
		（BFS）用队列逐层扩散，深度优先（DFS）用递归一路深入。观察顶点颜色变化，推演两种
		遍历的访问顺序。
	{/snippet}
	<AlgoPlayer {engine} topicId="graph-traversal" topicName="图的遍历" />
</AlgoPage>
