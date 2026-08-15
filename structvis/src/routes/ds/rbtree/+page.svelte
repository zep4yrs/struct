<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { RedBlackTreeEngine } from '$lib/engines/algorithm/rbtree/RedBlackTreeEngine';

	function createEngine(values: number[]): RedBlackTreeEngine {
		const e = new RedBlackTreeEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([10, 20, 30, 15, 5, 40, 25]));
</script>

<AlgoPage sectionNum="§07" sectionName="树状结构" title="红黑树">
	{#snippet desc()}
		带颜色约束的自平衡 BST：插入后按父/叔颜色做<span class="mono">变色</span>或<span class="mono"
			>旋转+变色</span
		>修复。
	{/snippet}
	<AlgoPlayer {engine} topicId="rbtree" topicName="红黑树" />
</AlgoPage>
