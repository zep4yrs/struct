<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		GraphStorageEngine,
		type StorageMode
	} from '$lib/engines/algorithm/graph/GraphStorageEngine';

	const PRESETS = [
		{ name: '无向图 5 顶点（邻接矩阵）', mode: 'adjacency-matrix' as StorageMode },
		{ name: '无向图 5 顶点（邻接表）', mode: 'adjacency-list' as StorageMode },
		{ name: '带权有向图（邻接矩阵）', mode: 'adjacency-matrix' as StorageMode }
	];

	function createEngine(preset: string): GraphStorageEngine {
		const e = new GraphStorageEngine();
		e.applyPreset(preset);
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].name));
</script>

<AlgoPage sectionNum="§06" sectionName="图状结构" title="图的存储" variant="badge">
	{#snippet desc()}
		同一张图可以用两种经典结构存储：<b>邻接矩阵</b>（二维数组，O(1) 查边，空间 O(V²)）和
			<b>邻接表</b>（数组+链表，空间 O(V+E)）。切换预设，观察矩阵逐格填充与链表逐头插入的过程。
	{/snippet}
	<AlgoPlayer {engine} topicId="graph-storage" topicName="图的存储" />
</AlgoPage>