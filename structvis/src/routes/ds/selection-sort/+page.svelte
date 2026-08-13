<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { SelectionSortEngine } from '$lib/engines/algorithm/basicsort/SelectionSortEngine';

	function createEngine(values: number[]): SelectionSortEngine {
		const e = new SelectionSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([5, 2, 8, 1, 9]));
</script>

<AlgoPage sectionNum="§01" sectionName="排序算法" title="简单选择排序">
	{#snippet desc()}
		每轮在无序区扫描一遍选出最小元素，与无序区第一个位置交换，使有序前缀从左向右扩展。 比较次数固定
		O(n²)，交换次数最多 n-1 次，是不稳定排序。
	{/snippet}
	<AlgoPlayer {engine} topicId="selection-sort" topicName="简单选择排序" />
</AlgoPage>
