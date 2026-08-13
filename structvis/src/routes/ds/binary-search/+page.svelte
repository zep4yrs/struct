<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BinarySearchEngine } from '$lib/engines/algorithm/search/BinarySearchEngine';

	const DEFAULT_DATA = [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92];
	const DEFAULT_TARGET = 21;

	function createEngine(): BinarySearchEngine {
		const e = new BinarySearchEngine();
		e.init({ data: DEFAULT_DATA, target: DEFAULT_TARGET });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="查找" title="二分查找">
	{#snippet desc()}
		折半查找针对有序表：每轮取区间中点与目标比较，相等即命中；目标小于中点就只查左半，
		大于则只查右半，查找区间每轮缩小一半。比较 ⌈log₂(n+1)⌉ 次以内必然出结果。
	{/snippet}
	<AlgoPlayer {engine} topicId="binary-search" topicName="二分查找" />
</AlgoPage>
