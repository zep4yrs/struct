<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { SkipListEngine } from '$lib/engines/algorithm/skiplist/SkipListEngine';

	function createEngine(): SkipListEngine {
		const e = new SkipListEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="线性结构" title="跳表 Skip List">
	{#snippet desc()}
		多层有序链表：<span class="mono">上层是快速通道</span
		>，查找逐层下沉、向右推进；插入抛硬币决定层高——Redis ZSet 的底层结构。
	{/snippet}
	<AlgoPlayer {engine} topicId="skip-list" topicName="跳表 Skip List" />
</AlgoPage>
