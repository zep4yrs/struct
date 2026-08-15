<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ShellSortEngine } from '$lib/engines/algorithm/basicsort/ShellSortEngine';

	function createEngine(values: number[]): ShellSortEngine {
		const e = new ShellSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([9, 7, 5, 3, 1, 8, 6, 4]));
</script>

<AlgoPage sectionNum="§07" sectionName="排序算法" title="希尔排序">
	{#snippet desc()}
		按递减增量分组做插入排序：先让相隔较远的元素有序，再逐步缩小增量，最后一轮 gap=1 收尾。 平均
		O(n^1.3)，不稳定。观察 <span class="mono">pivot</span> 元素如何在组内跳跃插入。
	{/snippet}
	<AlgoPlayer {engine} topicId="shell-sort" topicName="希尔排序" />
</AlgoPage>
