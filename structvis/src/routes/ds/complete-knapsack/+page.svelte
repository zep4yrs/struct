<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { CompleteKnapsackEngine } from '$lib/engines/algorithm/dp/CompleteKnapsackEngine';

	function createEngine(): CompleteKnapsackEngine {
		const e = new CompleteKnapsackEngine();
		e.init([2, 3, 3, 4, 4, 5]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="动态规划" title="完全背包">
	{#snippet desc()}
		物品可取<span class="mono">无限件</span>：转移来自本行左侧 dp[i][c-w]+v——与 0-1
		背包只差一个下标。
	{/snippet}
	<AlgoPlayer {engine} topicId="complete-knapsack" topicName="完全背包" />
</AlgoPage>
