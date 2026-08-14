<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { HeapSortEngine } from '$lib/engines/algorithm/basicsort/HeapSortEngine';

	function createEngine(values: number[]): HeapSortEngine {
		const e = new HeapSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([5, 2, 8, 1, 9]));
</script>

<AlgoPage sectionNum="§06" sectionName="排序算法" title="堆排序">
	{#snippet desc()}
		先建大根堆（父节点不小于孩子），再反复把堆顶与堆末尾交换，每轮确定一个最大值就位。
		就地排序，时间复杂度稳定 O(n log n)。观察 <span class="mono">partition</span> 堆范围如何从右向左收缩。
	{/snippet}
	<AlgoPlayer {engine} topicId="heap-sort" topicName="堆排序" />
</AlgoPage>
