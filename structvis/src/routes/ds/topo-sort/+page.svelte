<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { TopoSortEngine } from '$lib/engines/algorithm/graph/TopoSortEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4', '5'];
	const DEFAULT_EDGES: [number, number][] = [
		[0, 1],
		[0, 2],
		[1, 3],
		[1, 4],
		[2, 4],
		[2, 5],
		[3, 5]
	];

	function createEngine(): TopoSortEngine {
		const e = new TopoSortEngine();
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
		<h1 class="page-title">拓扑排序</h1>
		<p class="page-desc">
			Kahn 算法：反复输出入度为 0 的顶点并删除其出边，直到全部顶点排成线性序列。适用于选课
			依赖、工程工序等有向无环图（DAG）；顶点下方的数字实时显示当前入度，若序列排不满则说明
			图中存在环。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="topo-sort" topicName="拓扑排序" />
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
