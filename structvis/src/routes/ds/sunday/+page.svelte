<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { SundayEngine } from '$lib/engines/algorithm/search/SundayEngine';

	function createEngine(): SundayEngine {
		const e = new SundayEngine();
		e.init(['', '']);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§04" sectionName="串" title="Sunday 匹配">
	{#snippet desc()}
		BM 的简化变体：失配时看<span class="mono">对齐区间后的下一个字符</span>，按偏移表大步跳跃——平均
		O(n)，实践中比 KMP 更快。
	{/snippet}
	<AlgoPlayer {engine} topicId="sunday" topicName="Sunday 匹配" />
</AlgoPage>
