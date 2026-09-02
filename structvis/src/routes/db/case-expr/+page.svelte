<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createCaseExprEngine } from '$lib/engines/sql/scripts/case-expr';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="CASE 表达式">
	{#snippet desc()}
		行内 <b>if-else</b>：搜索 CASE 按区间归类、简单 CASE 按值映射，配合 GROUP BY
		一步完成分类统计。每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。
	{/snippet}
	<ScriptPlayer load={createCaseExprEngine} topicId="case-expr" topicName="CASE 表达式" />
</AlgoPage>
