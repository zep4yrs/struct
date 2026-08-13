<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BubbleSortEngine } from '$lib/engines/algorithm/basicsort/BubbleSortEngine';

	function createEngine(values: number[]): BubbleSortEngine {
		const e = new BubbleSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([5, 2, 8, 1, 9]));
</script>

<AlgoPage sectionNum="§01" sectionName="排序算法" title="冒泡排序">
	{#snippet desc()}
		相邻元素两两比较，较大者向后交换，每一轮把无序区中的最大值"冒泡"到末尾。 稳定排序，时间复杂度
			O(n²)。观察 <span class="mono">sorted</span> 绿色区域如何从右向左扩展。
	{/snippet}
	<AlgoPlayer {engine} topicId="bubble-sort" topicName="冒泡排序" />
</AlgoPage>