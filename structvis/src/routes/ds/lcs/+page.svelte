<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LCSEngine } from '$lib/engines/algorithm/dp/LCSEngine';

	function createEngine(): LCSEngine {
		const e = new LCSEngine();
		e.init(['ABCBDAB', 'BDCABA']);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="动态规划" title="动态规划 · 最长公共子序列 LCS">
	{#snippet desc()}
		逐格比较两个字符串的字符，相等斜走 +1、不等取上左较大值；完成时回溯箭头标出 LCS 路径。
	{/snippet}
	<AlgoPlayer {engine} topicId="lcs" topicName="最长公共子序列 LCS" />
</AlgoPage>
