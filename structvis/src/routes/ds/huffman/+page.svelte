<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { HuffmanEngine } from '$lib/engines/algorithm/huffman/HuffmanEngine';

	function createEngine(): HuffmanEngine {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="树状结构" title="哈夫曼树">
	{#snippet desc()}
		带权叶子构成森林，每轮取权值最小的两棵树合并（根权为两权之和），n 个叶子合并 n-1 次后
		只剩一棵树——哈夫曼树。它让带权路径长度 WPL 最小：权大的叶子离根近、权小的离根远，
		是哈夫曼编码（前缀编码）的基础。
	{/snippet}
	<AlgoPlayer {engine} topicId="huffman" topicName="哈夫曼树" />
</AlgoPage>
