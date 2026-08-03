<script lang="ts">
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

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§03</span>
			<span class="section-name">线性结构</span>
		</div>
		<h1 class="page-title">栈和队列</h1>
		<p class="page-desc">
			栈是后进先出（LIFO），只在栈顶压入/弹出；队列是先进先出（FIFO），从队尾入队、队头出队。
			切换结构与操作，观察元素在容器中的进出规律。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="stack-queue" topicName="栈和队列" />
	</div>
</div>

<style>
	.page {
		max-width: min(1440px, 100%);
		margin: 0 auto;
		padding: 48px 32px 64px;
		min-height: calc(100vh - 48px);
		display: flex;
		flex-direction: column;
	}

	.player-wrap {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 32px;
		margin-bottom: 32px;
	}

	.section-header {
		margin-bottom: 32px;
	}

	.section-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.section-label::before {
		content: '';
		width: 24px;
		height: 1px;
		background: var(--color-line-regular);
	}

	.section-num {
		color: var(--color-accent);
		font-weight: 500;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 500;
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin: 0 0 8px 0;
		color: var(--color-ink);
	}

	.page-desc {
		font-size: 14px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 620px;
		margin: 0;
	}
</style>
