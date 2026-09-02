<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createSqlFunctionsEngine } from '$lib/engines/sql/scripts/sql-functions';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="SQL 函数演练">
	{#snippet desc()}
		字符串 / 数值 / 日期 / NULL 四组常用函数，在真实数据上逐帧演练：
		<span class="mono">UPPER · SUBSTR · INSTR · ROUND · strftime · COALESCE</span>。
		<span class="mono">SQLite 方言演示</span>，MySQL 差异见各帧说明。
	{/snippet}
	<ScriptPlayer load={createSqlFunctionsEngine} topicId="sql-functions" topicName="SQL 函数演练" />
</AlgoPage>
