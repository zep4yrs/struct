<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ManacherEngine } from '$lib/engines/algorithm/search/ManacherEngine';

	function createEngine(): ManacherEngine {
		const e = new ManacherEngine();
		e.init(['babad']);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§04" sectionName="串" title="最长回文子串">
	{#snippet desc()}
		中心扩展法:<span class="mono">枚举每个中心</span>向两侧扩展,记录最长回文。
	{/snippet}
	<AlgoPlayer {engine} topicId="manacher" topicName="最长回文子串" />
</AlgoPage>
