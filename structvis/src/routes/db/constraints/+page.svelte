<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createConstraintsEngine } from '$lib/engines/sql/scripts/constraints';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="约束体系">
	{#snippet desc()}
		<b>PK · NOT NULL · UNIQUE · CHECK · 外键级联</b>五大约束操作台： 用 INSERT OR IGNORE + changes()
		观察每条约束是否真的把坏数据拦下。 每帧都是真实执行的 SQL（<span class="mono"
			>SQLite 方言演示</span
		>）。
	{/snippet}
	<ScriptPlayer load={createConstraintsEngine} topicId="constraints" topicName="约束体系" />
</AlgoPage>
