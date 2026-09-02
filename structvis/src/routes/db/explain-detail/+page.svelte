<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createExplainDetailEngine } from '$lib/engines/sql/scripts/explain-detail';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="EXPLAIN 详解">
	{#snippet desc()}
		逐帧读懂 <b>QUERY PLAN</b>：SCAN 与 SEARCH、连接的嵌套循环内外层、子查询的 id/parent
		层级树——最后总结出「读计划三步法」。
		<span class="mono">SQLite 方言演示</span>。
	{/snippet}
	<ScriptPlayer
		load={createExplainDetailEngine}
		topicId="explain-detail"
		topicName="EXPLAIN 详解"
	/>
</AlgoPage>
