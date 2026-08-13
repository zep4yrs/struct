<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { QuickSortEngine } from '$lib/engines/algorithm/quicksort/QuickSortEngine';

	function createEngine(data: number[]): QuickSortEngine {
		const e = new QuickSortEngine();
		e.init(data);
		return e;
	}

	let engine = $state(createEngine([6, 2, 8, 5, 1, 9, 3, 7]));
</script>

<AlgoPage sectionNum="§01" sectionName="排序算法" title="快速排序">
	{#snippet desc()}
		分治策略的经典算法。选择一个基准元素（pivot），将数组分为小于和大于基准的两部分，递归排序。
		平均时间复杂度 <span class="mono">O(n log n)</span>。
	{/snippet}
	<AlgoPlayer {engine} topicId="quick-sort" topicName="快速排序" />
</AlgoPage>
