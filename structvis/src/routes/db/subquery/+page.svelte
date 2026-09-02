<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createSubqueryFlowEngine } from '$lib/engines/sql/scripts/subquery';
</script>

<AlgoPage sectionNum="§05" sectionName="数据库查询" title="SQL 子查询">
	{#snippet desc()}
		先执行子查询得到平均分，外层再用它过滤——<b>非相关子查询</b>的标准执行顺序； 再到 IN
		集合判断与三种子查询形态对照。 每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer load={createSubqueryFlowEngine} topicId="subquery" topicName="SQL 子查询" />
</AlgoPage>
