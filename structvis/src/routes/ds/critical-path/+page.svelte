<script lang="ts">
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

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§06</span>
			<span class="section-name">图状结构</span>
		</div>
		<h1 class="page-title">关键路径</h1>
		<p class="page-desc">
			AOE 网络中顶点是事件、边是活动、边权是耗时。按拓扑序算最早发生时间 ve、逆拓扑序算 最晚发生时间
			vl，再比较每个活动的 e 与 l：相等者即关键活动。关键路径决定工程总工期，
			其上任何活动延误都会拖慢整个工程。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="critical-path" topicName="关键路径" />
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
