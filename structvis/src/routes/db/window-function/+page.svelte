<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createWindowFunctionFlowEngine } from '$lib/engines/sql/scripts/window-function';
</script>

<AlgoPage sectionNum="§12" sectionName="高级查询" title="窗口函数">
	{#snippet desc()}
		窗口函数（<span class="mono">ROW_NUMBER / RANK / SUM ... OVER</span>）在<b>不折叠行数</b
		>的前提下，按分区逐行计算：<span class="mono">PARTITION BY</span> 分组、<span class="mono"
			>ORDER BY</span
		>
		定序。对照 GROUP BY 折叠语义，看清「排名 / 累计」类报表的实现原理。 每帧都是真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer
		load={createWindowFunctionFlowEngine}
		topicId="window-function"
		topicName="窗口函数"
	/>
</AlgoPage>
