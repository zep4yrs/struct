<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { LockDeadlockEngine } from '$lib/engines/db/LockDeadlockEngine';

	function createEngine(): LockDeadlockEngine {
		const e = new LockDeadlockEngine();
		e.init([0]);
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§08" sectionName="事务进阶" title="锁机制与死锁">
	{#snippet desc()}
		两个事务交叉更新两行：<span class="mono">循环等待</span>形成死锁——InnoDB
		等待图检测并回滚代价小的一方。
	{/snippet}
	<AlgoPlayer {engine} topicId="lock-deadlock" topicName="锁机制与死锁" />
</AlgoPage>
