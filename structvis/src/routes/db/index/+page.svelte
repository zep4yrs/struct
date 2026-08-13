<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { IndexEngine, getIndexPresets } from '$lib/engines/db/IndexEngine';

	const PRESETS = getIndexPresets();

	function createEngine(preset: string): IndexEngine {
		const e = new IndexEngine();
		e.init({ preset });
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].name));
</script>

<AlgoPage sectionNum="§06" sectionName="索引与视图" title="索引原理">
	{#snippet desc()}
		索引的底层结构是 <b>B+ 树</b
			>：内部节点只存放分隔键，所有数据键在叶子节点，叶子间用指针连成链表。 查找只需从根下钻一层比较
			<b>O(log m n)</b> 次；范围查询定位下界后沿叶子链表顺序扫描。 逐步播放，看等值查找、范围查找与插入分裂的完整过程。
	{/snippet}
	<AlgoPlayer {engine} topicId="index" topicName="索引原理" />
</AlgoPage>