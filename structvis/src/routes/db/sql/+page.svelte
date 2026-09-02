<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createSelectFlowEngine } from '$lib/engines/sql/scripts/sql';
</script>

<AlgoPage sectionNum="§04" sectionName="数据查询" title="MySQL 数据查询">
	{#snippet desc()}
		SELECT 按<b>逻辑执行顺序</b>处理：<span class="mono"
			>FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY → LIMIT</span
		>。逐帧观察每个子句对结果集的影响；打开「自定义」输入你的 SQL 实时执行（需 sql.js）。
		<span class="mono">SQLite 方言演示</span>。
	{/snippet}
	<ScriptPlayer load={createSelectFlowEngine} topicId="sql" topicName="MySQL 数据查询" />
</AlgoPage>
