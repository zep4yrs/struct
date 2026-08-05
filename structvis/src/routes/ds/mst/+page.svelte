<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MstEngine, type MstMode } from '$lib/engines/algorithm/graph/MstEngine';

	const DEFAULT_LABELS = ['0', '1', '2', '3', '4'];
	const DEFAULT_EDGES: [number, number, number][] = [
		[0, 1, 2],
		[0, 3, 6],
		[1, 2, 3],
		[1, 3, 8],
		[1, 4, 5],
		[2, 4, 7],
		[3, 4, 9]
	];

	function createEngine(mode: MstMode): MstEngine {
		const e = new MstEngine();
		e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES, mode, start: 0 });
		return e;
	}

	let engine = $state(createEngine('prim'));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§06</span>
			<span class="section-name">图状结构</span>
		</div>
		<h1 class="page-title">最小生成树</h1>
		<p class="page-desc">
			用 n-1 条边连通全部 n 个顶点且总权最小的树，就是最小生成树（MST）。Prim 从一个顶点
			逐步扩张树，Kruskal 把边按权从小到大挑选、成环即弃。观察边权数字与颜色变化，对比两种
			算法的贪心策略。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="mst" topicName="最小生成树" />
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
