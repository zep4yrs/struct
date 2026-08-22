<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LRUEngine } from '$lib/engines/algorithm/lru/LRUEngine';

	function createEngine(): LRUEngine {
		const e = new LRUEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="线性结构" title="LRU 缓存">
	{#snippet desc()}
		哈希表 + 双向链表：<span class="mono">O(1) 定位 + O(1) 淘汰</span>。头部 MRU、尾部
		LRU——容量满时淘汰最久未使用者。
	{/snippet}
	<AlgoPlayer {engine} topicId="lru-cache" topicName="LRU 缓存" />
</AlgoPage>
