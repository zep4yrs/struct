<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { RadixSortEngine } from '$lib/engines/algorithm/basicsort/RadixSortEngine';

	function createEngine(values: number[]): RadixSortEngine {
		const e = new RadixSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([329, 457, 657, 839, 436, 720, 355]));
</script>

<AlgoPage sectionNum="§08" sectionName="排序算法" title="基数排序">
	{#snippet desc()}
		不比较大小，按数字的每一位分桶收集（LSD：从个位到最高位）。稳定，O(d·n)。 观察每个元素如何按 <span
			class="mono">桶号</span
		> 进出数组。
	{/snippet}
	<AlgoPlayer {engine} topicId="radix-sort" topicName="基数排序" />
</AlgoPage>
