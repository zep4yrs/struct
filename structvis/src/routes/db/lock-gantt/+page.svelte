<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LockGanttEngine } from '$lib/engines/db/LockGanttEngine';

	function createEngine(): LockGanttEngine {
		const e = new LockGanttEngine();
		e.init();
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="SQL 实验" title="锁等待与死锁甘特图">
	{#snippet desc()}
		两事务、两个资源、相反的加锁顺序——<b>循环等待</b>如何在时间轴上形成死锁， InnoDB 又如何选 victim
		回滚解环。加锁顺序一致、事务短小是预防关键。
		<span class="mono">概念状态机演示</span>（非 SQL 执行）。
	{/snippet}
	<AlgoPlayer {engine} topicId="lock-gantt" topicName="锁等待与死锁甘特图" />
</AlgoPage>
