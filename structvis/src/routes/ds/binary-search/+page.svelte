<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BinarySearchEngine } from '$lib/engines/algorithm/search/BinarySearchEngine';

	const DEFAULT_DATA = [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92];
	const DEFAULT_TARGET = 21;

	function createEngine(): BinarySearchEngine {
		const e = new BinarySearchEngine();
		e.init({ data: DEFAULT_DATA, target: DEFAULT_TARGET });
		return e;
	}

	let engine = $state(createEngine());
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§05</span>
			<span class="section-name">查找</span>
		</div>
		<h1 class="page-title">二分查找</h1>
		<p class="page-desc">
			折半查找针对有序表：每轮取区间中点与目标比较，相等即命中；目标小于中点就只查左半，
			大于则只查右半，查找区间每轮缩小一半。比较 ⌈log₂(n+1)⌉ 次以内必然出结果。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="binary-search" topicName="二分查找" />
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
