<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { QuickSortEngine } from '$lib/engines/algorithm/quicksort/QuickSortEngine';

	function createEngine(data: number[]): QuickSortEngine {
		const e = new QuickSortEngine();
		e.init(data);
		return e;
	}

	let engine = $state(createEngine([6, 2, 8, 5, 1, 9, 3, 7]));
</script>

<div class="page">
	<!-- Section header -->
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§01</span>
			<span class="section-name">排序算法</span>
		</div>
		<h1 class="page-title">快速排序</h1>
		<p class="page-desc">
			分治策略的经典算法。选择一个基准元素（pivot），将数组分为小于和大于基准的两部分，递归排序。
			平均时间复杂度 <span class="mono">O(n log n)</span>。
		</p>
	</div>

	<!-- Visualization player -->
	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="quick-sort" topicName="快速排序" />
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

	/* Section header */
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
		max-width: 560px;
		margin: 0;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-academic);
	}
</style>
