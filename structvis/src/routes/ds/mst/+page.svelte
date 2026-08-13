<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MstEngine, type MstMode } from '$lib/engines/algorithm/graph/MstEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4'];
	const DEFAULT_EDGES: [number, number, number][] = [
		[0, 1, 2],
		[0, 3, 6],
		[1, 2, 3],
		[1, 3, 8],
		[1, 4, 5],
		[2, 4, 7],
		[3, 4, 9]
	];

	function createEngine(mode: MstMode): MstEngine {
		const e = new MstEngine();
		e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES, mode, start: 0 });
		return e;
	}

	let engine = $state(createEngine('prim'));
</script>

<AlgoPage sectionNum="§06" sectionName="图状结构" title="最小生成树">
	{#snippet desc()}
		用 n-1 条边连通全部 n 个顶点且总权最小的树，就是最小生成树（MST）。Prim 从一个顶点
			逐步扩张树，Kruskal 把边按权从小到大挑选、成环即弃。观察边权数字与颜色变化，对比两种
			算法的贪心策略。
	{/snippet}
	<AlgoPlayer {engine} topicId="mst" topicName="最小生成树" />
</AlgoPage>