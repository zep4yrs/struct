<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { InsertionSortEngine } from '$lib/engines/algorithm/basicsort/InsertionSortEngine';

	function createEngine(values: number[]): InsertionSortEngine {
		const e = new InsertionSortEngine();
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
		<h1 class="page-title">直接插入排序</h1>
		<p class="page-desc">
			维护一个"已有序前缀"：每轮取出无序区第一个元素，与前面从后向前比较，
			较大者逐个后移，直到找到合适位置插入。稳定排序，时间复杂度 O(n²)， 数据基本有序时接近 O(n)。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="insertion-sort" topicName="直接插入排序" />
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
