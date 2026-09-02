<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { ScheduleEngine } from '$lib/engines/db/ScheduleEngine';

	function createEngine(): ScheduleEngine {
		const e = new ScheduleEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="可串行化调度">
	{#snippet desc()}
		逐个执行调度 S 的操作，标出<b>冲突对</b>（同数据 · 不同事务 · 至少一个写），
		再交换非冲突相邻操作，把 S 化成等价串行 T1→T2——这就是冲突可串行化。
		<span class="mono">概念状态机演示</span>（非 SQL 执行）。
	{/snippet}
	<AlgoPlayer {engine} topicId="serial-schedule" topicName="可串行化调度" />
</AlgoPage>
