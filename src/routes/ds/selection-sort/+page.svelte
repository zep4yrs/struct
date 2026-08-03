<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { SelectionSortEngine } from '$lib/engines/algorithm/basicsort/SelectionSortEngine';

	function createEngine(values: number[]): SelectionSortEngine {
		const e = new SelectionSortEngine();
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
		<h1 class="page-title">简单选择排序</h1>
		<p class="page-desc">
			每轮在无序区扫描一遍选出最小元素，与无序区第一个位置交换，使有序前缀从左向右扩展。
			比较次数固定 O(n²)，交换次数最多 n-1 次，是不稳定排序。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="selection-sort" topicName="简单选择排序" />
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
