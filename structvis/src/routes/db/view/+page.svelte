<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createViewFlowEngine } from '$lib/engines/sql/scripts/view';
</script>

<AlgoPage sectionNum="§06" sectionName="索引与视图" title="视图创建与使用">
	{#snippet desc()}
		<b>CREATE VIEW</b> 把一条 SELECT 保存为<b>虚拟表</b>：不存数据、只存定义。
		逐帧观察——查询视图、基表更新后视图自动反映、数据字典里的视图真身、DROP VIEW。 每帧都是真实执行的
		SQL（<span class="mono">SQLite 方言演示</span>）。
	{/snippet}
	<ScriptPlayer load={createViewFlowEngine} topicId="view" topicName="视图创建与使用" />
</AlgoPage>
