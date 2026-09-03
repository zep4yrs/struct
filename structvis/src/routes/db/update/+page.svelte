<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createDmlFlowEngine } from '$lib/engines/sql/scripts/update';
</script>

<AlgoPage sectionNum="§07" sectionName="数据更新" title="数据更新">
	{#snippet desc()}
		<b>UPDATE / INSERT / DELETE</b> 三大 DML 逐帧真实执行：每帧 = 变更语句 + 验证查询，
		数据状态在帧间真实演化（前一帧的 UPDATE 是后一帧查询的输入）。 漏写 WHERE
		的后果，在帧里看得明明白白（<span class="mono">SQLite 方言演示</span>）。
	{/snippet}
	<ScriptPlayer load={createDmlFlowEngine} topicId="update" topicName="数据更新" />
</AlgoPage>
