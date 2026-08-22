<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LCAEngine } from '$lib/engines/algorithm/graph/LCAEngine';

	function createEngine(): LCAEngine {
		const e = new LCAEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图结构" title="LCA 最近公共祖先">
	{#snippet desc()}
		<span class="mono">倍增上跳</span>:深的先追平、两点同步试跳——树上差分与距离计算的基础。
	{/snippet}
	<AlgoPlayer {engine} topicId="lca" topicName="LCA 最近公共祖先" />
</AlgoPage>
