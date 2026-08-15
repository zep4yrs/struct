<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { TrieEngine } from '$lib/engines/algorithm/trie/TrieEngine';

	function createEngine(values: string[]): TrieEngine {
		const e = new TrieEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine(['cat', 'car', 'dog', 'do', 'dot']));
</script>

<AlgoPage sectionNum="§05" sectionName="串与数组" title="Trie 字典树">
	{#snippet desc()}
		按公共前缀共享存储字符串：cat 和 car 共用 c-a 路径。双圈节点表示单词结束。
	{/snippet}
	<AlgoPlayer {engine} topicId="trie" topicName="Trie 字典树" />
</AlgoPage>
