<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LISEngine } from '$lib/engines/algorithm/dp/LISEngine';

	function createEngine(): LISEngine {
		const e = new LISEngine();
		e.init([10, 9, 2, 5, 3, 7, 101, 18]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="动态规划" title="最长递增子序列 LIS">
	{#snippet desc()}
		dp[i] = 以 a[i] 结尾的 LIS 长度——<span class="mono">扫描更小的前驱</span>取最大值加一。
	{/snippet}
	<AlgoPlayer {engine} topicId="lis" topicName="最长递增子序列 LIS" />
</AlgoPage>
