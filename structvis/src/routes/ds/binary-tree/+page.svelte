<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		BinaryTreeEngine,
		type TraversalMode
	} from '$lib/engines/algorithm/binarytree/BinaryTreeEngine';

	function createEngine(mode: TraversalMode, tree: number[]): BinaryTreeEngine {
		const e = new BinaryTreeEngine();
		e.init({ tree, mode });
		return e;
	}

	let engine = $state(createEngine('preorder', [10, 5, 15, 3, 7, 12, 20]));
</script>

<AlgoPage sectionNum="§05" sectionName="树形结构" title="二叉树遍历">
	{#snippet desc()}
		遍历是二叉树最重要的基本操作：按某种顺序不重复地访问每个节点。前序、中序、后序为
			深度优先（递归），层序为广度优先（队列）。对如下二叉树，尝试推演四种遍历的访问序列。
	{/snippet}
	<AlgoPlayer {engine} topicId="binary-tree" topicName="二叉树遍历" />
</AlgoPage>