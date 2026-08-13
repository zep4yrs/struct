<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { CriticalPathEngine } from '$lib/engines/algorithm/graph/CriticalPathEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4', '5'];
	const DEFAULT_EDGES: [number, number, number][] = [
		[0, 1, 3],
		[0, 2, 2],
		[1, 3, 4],
		[1, 4, 2],
		[2, 4, 3],
		[3, 5, 2],
		[4, 5, 1]
	];

	function createEngine(): CriticalPathEngine {
		const e = new CriticalPathEngine();
		e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§06" sectionName="图状结构" title="关键路径">
	{#snippet desc()}
		AOE 网络中顶点是事件、边是活动、边权是耗时。按拓扑序算最早发生时间 ve、逆拓扑序算 最晚发生时间
			vl，再比较每个活动的 e 与 l：相等者即关键活动。关键路径决定工程总工期，
			其上任何活动延误都会拖慢整个工程。
	{/snippet}
	<AlgoPlayer {engine} topicId="critical-path" topicName="关键路径" />
</AlgoPage>