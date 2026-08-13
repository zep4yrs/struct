<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ErEngine, getErPresets } from '$lib/engines/db/ErEngine';

	const PRESETS = getErPresets();

	function createEngine(preset: string): ErEngine {
		const e = new ErEngine();
		e.init({ preset });
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].name));
</script>

<AlgoPage sectionNum="§07" sectionName="数据库设计" title="E-R 模型">
	{#snippet desc()}
		E-R 图是概念结构设计的核心工具：<b>矩形</b>表示实体、<b>椭圆</b>表示属性、<b>菱形</b>表示联系，
		连线旁标注基数（1:1 / 1:n / m:n）。最后按转换规则把 E-R
		图映射为关系模式。逐步播放，看每个设计决策如何影响最终表结构。
	{/snippet}
	<AlgoPlayer {engine} topicId="er" topicName="E-R 模型" />
</AlgoPage>
