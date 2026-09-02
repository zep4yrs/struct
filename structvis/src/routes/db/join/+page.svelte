<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createJoinFlowEngine } from '$lib/engines/sql/scripts/join';
</script>

<AlgoPage sectionNum="§02" sectionName="数据库查询" title="SQL 内连接 JOIN">
	{#snippet desc()}
		拿左表每一行去右表匹配连接条件，匹配成功的行对合并进结果表——这就是<b>嵌套循环连接</b>。
		观察结果表如何生长、不匹配的行（赵六、周八）如何被丢弃。 每帧都是真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer load={createJoinFlowEngine} topicId="join" topicName="SQL 内连接 JOIN" />
</AlgoPage>
