<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createViewUpdateEngine } from '$lib/engines/sql/scripts/view-update';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="视图更新限制">
	{#snippet desc()}
		视图是<b>虚表</b>：默认只读，写入被拒绝；挂上 INSTEAD OF
		触发器后经视图插入，数据真正落在基础表。MySQL 的
		<span class="mono">WITH CHECK OPTION</span> 方言差异见各帧对照说明。 每帧都是真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer load={createViewUpdateEngine} topicId="view-update" topicName="视图更新限制" />
</AlgoPage>
