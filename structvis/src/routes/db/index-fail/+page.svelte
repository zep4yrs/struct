<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createIndexFailEngine } from '$lib/engines/sql/scripts/index-fail';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="索引失效实验">
	{#snippet desc()}
		<b>EXPLAIN QUERY PLAN 真实输出</b>对照五种失效场景：函数包裹列、LIKE 前导
		<span class="mono">%</span>、OR 无索引侧、跳过最左前缀。看计划说话，不靠感觉加索引。
		<span class="mono">SQLite 方言演示</span>，MySQL EXPLAIN 对照见各帧说明。
	{/snippet}
	<ScriptPlayer load={createIndexFailEngine} topicId="index-fail" topicName="索引失效实验" />
</AlgoPage>
