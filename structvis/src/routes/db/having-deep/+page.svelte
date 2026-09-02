<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createHavingDeepEngine } from '$lib/engines/sql/scripts/having-deep';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="WHERE 与 HAVING">
	{#snippet desc()}
		<b>WHERE 筛行、HAVING 筛组</b>——一条查询的执行顺序是 FROM → WHERE → GROUP BY → HAVING → SELECT →
		ORDER BY。逐帧观察分组前后的两次过滤各自丢掉了什么。
		<span class="mono">SQLite 方言演示</span>。
	{/snippet}
	<ScriptPlayer load={createHavingDeepEngine} topicId="having-deep" topicName="WHERE 与 HAVING" />
</AlgoPage>
