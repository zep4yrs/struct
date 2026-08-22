<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { EditDistanceEngine } from '$lib/engines/algorithm/dp/EditDistanceEngine';

	function createEngine(): EditDistanceEngine {
		const e = new EditDistanceEngine();
		e.init(['horse', 'ros']);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="动态规划" title="编辑距离">
	{#snippet desc()}
		horse → ros：<span class="mono">插入 / 删除 / 替换</span>三种操作的最小代价。
	{/snippet}
	<AlgoPlayer {engine} topicId="edit-distance" topicName="编辑距离" />
</AlgoPage>
