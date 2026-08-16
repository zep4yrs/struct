<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { KnapsackEngine } from '$lib/engines/algorithm/dp/KnapsackEngine';

	function createEngine(): KnapsackEngine {
		const e = new KnapsackEngine();
		e.init([2, 3, 3, 4, 4, 5, 5, 8]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="动态规划" title="动态规划 · 0-1 背包">
	{#snippet desc()}
		每件物品只能取一次，容量有限——逐格填充 <span class="mono">dp[i][c]</span>，高亮「取 /
		不取」两种转移来源。
	{/snippet}
	<AlgoPlayer {engine} topicId="knapsack" topicName="0-1 背包" />
</AlgoPage>
