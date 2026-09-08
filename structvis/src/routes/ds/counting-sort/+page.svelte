<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { CountingSortEngine } from '$lib/engines/algorithm/sortextra/CountingSortEngine';

	function createEngine(): CountingSortEngine {
		const e = new CountingSortEngine();
		// 演示数据须与 applyPreset 一致——占位 [0] 会让画布只剩一根 0 高度柱
		e.init([4, 2, 2, 8, 3, 3, 1]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§01" sectionName="排序算法" title="计数排序">
	{#snippet desc()}
		非比较排序:<span class="mono">统计频次按序回填</span>,O(n+k)——值域不大时快过一切比较排序。
	{/snippet}
	<AlgoPlayer {engine} topicId="counting-sort" topicName="计数排序" />
</AlgoPage>
