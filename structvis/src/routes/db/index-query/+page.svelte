<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { IndexQueryEngine } from '$lib/engines/db/IndexQueryEngine';

	function createEngine(): IndexQueryEngine {
		const e = new IndexQueryEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="索引查询与回表">
	{#snippet desc()}
		InnoDB 取数的完整链路：<b>二级索引定位 → 叶内取主键 → 回聚簇索引拿整行</b>。
		理解「回表」，才理解为什么覆盖索引、最左前缀是优化核心。
		<span class="mono">概念状态机演示</span>（非 SQL 执行）。
	{/snippet}
	<AlgoPlayer {engine} topicId="index-query" topicName="索引查询与回表" />
</AlgoPage>
