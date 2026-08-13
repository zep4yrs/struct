<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		StackQueueEngine,
		type StackQueueEngineInput
	} from '$lib/engines/algorithm/stackqueue/StackQueueEngine';

	function createEngine(input: StackQueueEngineInput): StackQueueEngine {
		const e = new StackQueueEngine();
		e.init(input);
		return e;
	}

	let engine = $state(
		createEngine({ structure: 'stack', values: [12, 99, 37, 8], operation: 'push', target: 66 })
	);
</script>

<AlgoPage sectionNum="§03" sectionName="线性结构" title="栈和队列">
	{#snippet desc()}
		栈是后进先出（LIFO），只在栈顶压入/弹出；队列是先进先出（FIFO），从队尾入队、队头出队。
		切换结构与操作，观察元素在容器中的进出规律。
	{/snippet}
	<AlgoPlayer {engine} topicId="stack-queue" topicName="栈和队列" />
</AlgoPage>
