<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { KMPEngine } from '$lib/engines/algorithm/search/KMPEngine';

	const DEFAULT_TEXT = 'acabaabaabcacaabc';
	const DEFAULT_PATTERN = 'abaabcac';

	function createEngine(): KMPEngine {
		const e = new KMPEngine();
		e.init({ text: DEFAULT_TEXT, pattern: DEFAULT_PATTERN });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§04" sectionName="串与数组" title="串的模式匹配">
	{#snippet desc()}
		在长文本中查找模式串，KMP 比暴力匹配高明在：先求出模式串的 next 数组，
			匹配失配时让模式整体右滑、文本指针 i 从不回退。整体复杂度 O(n + m)， next
			数组记录的正是模式串自身的前后缀结构。
	{/snippet}
	<AlgoPlayer {engine} topicId="kmp" topicName="串的模式匹配" />
</AlgoPage>