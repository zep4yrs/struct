<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { UnionFindEngine } from '$lib/engines/algorithm/unionfind/UnionFindEngine';

	function createEngine(): UnionFindEngine {
		const e = new UnionFindEngine();
		e.init(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="动态规划" title="并查集 Union-Find">
	{#snippet desc()}
		森林结构管理不相交集合：find 沿父链找根并路径压缩，union 按秩合并小树挂大树。
	{/snippet}
	<AlgoPlayer {engine} topicId="union-find" topicName="并查集" />
</AlgoPage>
