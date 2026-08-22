<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { FenwickEngine } from '$lib/engines/algorithm/fenwick/FenwickEngine';

	function createEngine(): FenwickEngine {
		const e = new FenwickEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="线性结构" title="树状数组 Fenwick Tree">
	{#snippet desc()}
		<span class="mono">lowbit 跳跃</span>:单点更新与前缀和都是 O(log n)——比线段树轻量十倍。
	{/snippet}
	<AlgoPlayer {engine} topicId="fenwick-tree" topicName="树状数组" />
</AlgoPage>
