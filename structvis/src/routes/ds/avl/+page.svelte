<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { AvlEngine } from '$lib/engines/algorithm/avl/AvlEngine';

	function createEngine(values: number[]): AvlEngine {
		const e = new AvlEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([10, 20, 30, 40, 50]));
</script>

<AlgoPage sectionNum="§07" sectionName="树状结构" title="AVL 树">
	{#snippet desc()}
		自平衡的二叉搜索树：插入后任何节点的左右子树高度差不超过 1，失衡时通过
		<span class="mono">左旋 / 右旋 / 双旋</span> 恢复平衡。查找、插入、删除都是 O(log n)。
	{/snippet}
	<AlgoPlayer {engine} topicId="avl" topicName="AVL 树" />
</AlgoPage>
