<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { MergeSortEngine } from '$lib/engines/algorithm/basicsort/MergeSortEngine';

	function createEngine(values: number[]): MergeSortEngine {
		const e = new MergeSortEngine();
		e.init(values);
		return e;
	}

	let engine = $state(createEngine([5, 2, 8, 1, 9]));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§01</span>
			<span class="section-name">排序算法</span>
		</div>
		<h1 class="page-title">归并排序</h1>
		<p class="page-desc">
			分治思想的代表：子序列从长度 1 开始两两合并，合并时逐对比较头部、较小者先入辅助数组，
			每轮子序列长度翻倍，直到整个数组有序。稳定排序，时间复杂度 O(n log n)，需 O(n) 辅助空间。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="merge-sort" topicName="归并排序" />
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
