<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createProcedureFlowEngine } from '$lib/engines/sql/scripts/procedures';
</script>

<AlgoPage sectionNum="§10" sectionName="编程接口" title="存储过程">
	{#snippet desc()}
		<b>存储过程</b>与<b>游标</b>的语法语义：CREATE PROCEDURE 封装、CALL 调用、 IN/OUT
		参数、游标逐行处理的生命周期。
		<span class="mono">语法演示帧</span>——SQLite 不支持存储过程，帧 SQL 为 MySQL 方言展示。
	{/snippet}
	<ScriptPlayer load={createProcedureFlowEngine} topicId="procedures" topicName="存储过程" />
</AlgoPage>
