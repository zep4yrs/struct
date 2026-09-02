<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import ScriptPlayer from '$lib/components/player/ScriptPlayer.svelte';
	import { createUnionSetEngine } from '$lib/engines/sql/scripts/union-set';
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="SQL 集合运算">
	{#snippet desc()}
		UNION 并 · INTERSECT 交 · EXCEPT 差——三个对<b>行集合</b>的直接运算。每帧都是一条真实执行的 SQL（<span
			class="mono">SQLite 方言演示</span
		>），观察两张报名表如何合并、求交、做差。
	{/snippet}
	<ScriptPlayer load={createUnionSetEngine} topicId="union-set" topicName="SQL 集合运算" />
</AlgoPage>
