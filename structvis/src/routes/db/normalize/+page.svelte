<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { NormalizeEngine, getNormalizePresets } from '$lib/engines/db/NormalizeEngine';

	const PRESETS = getNormalizePresets();

	function createEngine(preset: string): NormalizeEngine {
		const e = new NormalizeEngine();
		e.init({ preset });
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].name));
</script>

<AlgoPage sectionNum="§07" sectionName="数据库设计" title="关系规范化">
	{#snippet desc()}
		范式判定按固定流程进行：<b>1NF</b>（属性原子性）→ <b>2NF</b>（消除非主属性对候选键的<b
				>部分依赖</b
			>）→
			<b>3NF</b>（消除<b>传递依赖</b>）→
			<b>BCNF</b>（决定因素均为候选键）。违规的函数依赖标红，分解后标绿消除。
			逐步播放，看每个范式的判定依据与分解方法。
	{/snippet}
	<AlgoPlayer {engine} topicId="normalize" topicName="关系规范化" />
</AlgoPage>