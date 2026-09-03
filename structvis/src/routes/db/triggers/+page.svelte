<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createTriggerFlowEngine } from '$lib/engines/sql/scripts/triggers';
</script>

<AlgoPage sectionNum="§09" sectionName="编程接口" title="触发器">
	{#snippet desc()}
		<b>CREATE TRIGGER</b>：把「插入选课 → 自动写日志」挂到数据库里，应用层零代码。 逐帧验证 AFTER
		时机、NEW 行引用与 FOR EACH ROW 行级粒度。 每帧都是真实执行的 SQL（<span class="mono"
			>SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer load={createTriggerFlowEngine} topicId="triggers" topicName="触发器" />
</AlgoPage>
