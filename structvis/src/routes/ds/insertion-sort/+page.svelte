<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { InsertionSortEngine } from '$lib/engines/algorithm/basicsort/InsertionSortEngine';

	function createEngine(values: number[]): InsertionSortEngine {
		const e = new InsertionSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([5, 2, 8, 1, 9]));
</script>

<AlgoPage sectionNum="§01" sectionName="排序算法" title="直接插入排序">
	{#snippet desc()}
		维护一个"已有序前缀"：每轮取出无序区第一个元素，与前面从后向前比较，
			较大者逐个后移，直到找到合适位置插入。稳定排序，时间复杂度 O(n²)， 数据基本有序时接近 O(n)。
	{/snippet}
	<AlgoPlayer {engine} topicId="insertion-sort" topicName="直接插入排序" />
</AlgoPage>