<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LinearProbeEngine } from '$lib/engines/algorithm/hash/LinearProbeEngine';

	function createEngine(values: number[]): LinearProbeEngine {
		const e = new LinearProbeEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([47, 7, 29, 11, 16, 92, 22, 8, 3]));
</script>

<AlgoPage sectionNum="§06" sectionName="查找" title="哈希表 · 线性探测">
	{#snippet desc()}
		除留余数法定位，冲突时逐个向后探测空槽。观察 <span class="mono">probe</span> 探测路径与 ASL 统计。
	{/snippet}
	<AlgoPlayer {engine} topicId="hash-probing" topicName="线性探测（开放定址）" />
</AlgoPage>
