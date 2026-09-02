<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createJoinVariantsEngine } from '$lib/engines/sql/scripts/join-variants';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="JOIN 家族">
	{#snippet desc()}
		INNER / LEFT 的进阶全家福：<b>RIGHT · FULL OUTER · CROSS · 自连接</b>。
		用一张互不匹配的员工-部门表，逐帧看清每种连接各自保留了谁、谁被补了 NULL。 每帧都是真实执行的
		SQL（<span class="mono">SQLite 方言演示</span>）。
	{/snippet}
	<ScriptPlayer load={createJoinVariantsEngine} topicId="join-variants" topicName="JOIN 家族" />
</AlgoPage>
