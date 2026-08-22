<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { CutVerticesEngine } from '$lib/engines/algorithm/graph/CutVerticesEngine';

	function createEngine(): CutVerticesEngine {
		const e = new CutVerticesEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图结构" title="割点检测">
	{#snippet desc()}
		Tarjan 的姊妹应用：<span class="mono">low[child] ≥ dfn[u]</span> 判定割点——删除后图断开的关节点。
	{/snippet}
	<AlgoPlayer {engine} topicId="cut-vertices" topicName="割点检测" />
</AlgoPage>
