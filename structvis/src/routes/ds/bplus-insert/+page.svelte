<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BPlusInsertEngine } from '$lib/engines/algorithm/btree/BPlusInsertEngine';

	function createEngine(): BPlusInsertEngine {
		const e = new BPlusInsertEngine();
		e.init([8, 5, 12, 3, 7, 10, 15, 1, 9, 14, 6, 13]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§07" sectionName="查找" title="B+ 树插入">
	{#snippet desc()}
		阶 3 的 B+ 树：依次插入键值，叶满分裂、中间键向上提升——观察树如何始终保持平衡。
	{/snippet}
	<AlgoPlayer {engine} topicId="bplus-insert" topicName="B+ 树插入" />
</AlgoPage>
