<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { NQueensEngine } from '$lib/engines/algorithm/backtrack/NQueensEngine';

	function createEngine(): NQueensEngine {
		const e = new NQueensEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§03" sectionName="回溯算法" title="N 皇后（6×6 回溯演示）">
	{#snippet desc()}
		逐行放置皇后，<span class="mono">冲突剪枝</span>、走不通就回溯——回溯法最经典的教科书案例。6
		皇后共 4 个解。
	{/snippet}
	<AlgoPlayer {engine} topicId="n-queens" topicName="N 皇后回溯" />
</AlgoPage>
