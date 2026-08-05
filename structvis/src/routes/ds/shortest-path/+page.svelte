<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { DijkstraEngine } from '$lib/engines/algorithm/graph/DijkstraEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4'];
	const DEFAULT_EDGES: [number, number, number][] = [
		[0, 1, 10],
		[0, 3, 5],
		[1, 2, 1],
		[1, 3, 2],
		[2, 4, 4],
		[3, 1, 3],
		[3, 2, 9],
		[3, 4, 2],
		[4, 0, 7],
		[4, 2, 6]
	];

	function createEngine(): DijkstraEngine {
		const e = new DijkstraEngine();
		e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES, directed: true, start: 0 });
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
		<h1 class="page-title">最短路径</h1>
		<p class="page-desc">
			Dijkstra 算法求解单源最短路径：每轮确定一个距离已最小（dist）的顶点，再用它松弛全部
			出边，不断修正其余顶点的 dist。顶点下方的数字实时显示当前 dist，深色边构成最短路径树。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="shortest-path" topicName="最短路径" />
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
