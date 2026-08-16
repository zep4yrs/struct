<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MonotonicStackEngine } from '$lib/engines/algorithm/monostack/MonotonicStackEngine';

	function createEngine(): MonotonicStackEngine {
		const e = new MonotonicStackEngine();
		e.init([73, 74, 75, 71, 69, 72, 76, 73]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="线性结构" title="单调栈 · 每日温度">
	{#snippet desc()}
		维护一个温度递减的栈，扫描到更高温度时<span class="mono">批量结算</span
		>答案——每个元素最多进出栈一次，总复杂度 O(n)。
	{/snippet}
	<AlgoPlayer {engine} topicId="mono-stack" topicName="单调栈（每日温度）" />
</AlgoPage>
