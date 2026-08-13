<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BstEngine } from '$lib/engines/algorithm/bst/BstEngine';

	const DEFAULT_TREE = [10, 5, 15, 3, 7, 12, 20];

	function createEngine(): BstEngine {
		const e = new BstEngine();
		e.init({ tree: DEFAULT_TREE, mode: 'search', target: 12 });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="树状结构" title="二叉搜索树">
	{#snippet desc()}
		二叉搜索树让每个结点都满足"左子树 ＜ 根 ＜ 右子树"，于是查找、插入、删除都能沿路径下行。
			查找比目标小就向左、大就向右；插入的新结点总是叶子；
			删除按三种情况处理——叶子直接摘、单孩子用孩子顶替、双孩子用中序后继替换。
	{/snippet}
	<AlgoPlayer {engine} topicId="bst" topicName="二叉搜索树" />
</AlgoPage>