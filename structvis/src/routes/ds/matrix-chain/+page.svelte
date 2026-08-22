<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MatrixChainEngine } from '$lib/engines/algorithm/dp/MatrixChainEngine';

	function createEngine(): MatrixChainEngine {
		const e = new MatrixChainEngine();
		e.init([30, 35, 15, 5, 10, 20, 25]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="动态规划" title="区间DP · 矩阵连乘">
	{#snippet desc()}
		<span class="mono">枚举切分点 k</span>：左边最优 + 右边最优 + 合并代价，按区间长度从小到大填表。
	{/snippet}
	<AlgoPlayer {engine} topicId="matrix-chain" topicName="矩阵链乘法" />
</AlgoPage>
