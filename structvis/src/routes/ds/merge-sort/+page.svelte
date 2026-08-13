<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MergeSortEngine } from '$lib/engines/algorithm/basicsort/MergeSortEngine';

	function createEngine(values: number[]): MergeSortEngine {
		const e = new MergeSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([5, 2, 8, 1, 9]));
</script>

<AlgoPage sectionNum="§01" sectionName="排序算法" title="归并排序">
	{#snippet desc()}
		分治思想的代表：子序列从长度 1 开始两两合并，合并时逐对比较头部、较小者先入辅助数组，
		每轮子序列长度翻倍，直到整个数组有序。稳定排序，时间复杂度 O(n log n)，需 O(n) 辅助空间。
	{/snippet}
	<AlgoPlayer {engine} topicId="merge-sort" topicName="归并排序" />
</AlgoPage>
