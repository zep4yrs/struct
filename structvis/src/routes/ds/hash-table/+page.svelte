<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { HashTableEngine } from '$lib/engines/algorithm/hash/HashTableEngine';

	const DEFAULT_KEYS = [22, 41, 53, 46, 30, 13, 1, 67];
	const DEFAULT_SIZE = 11;

	function createEngine(): HashTableEngine {
		const e = new HashTableEngine();
		e.init({ keys: DEFAULT_KEYS, mode: 'construct', size: DEFAULT_SIZE });
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
		<h1 class="page-title">哈希表</h1>
		<p class="page-desc">
			除留余数法 H(key) = key mod m 把关键字直接映射到槽位，期望一次存取。冲突不可避免：
			线性探测沿后继槽位找空位（开放定址），链地址法则把同义词挂成链表。装填因子 α = n/m
			决定冲突频率，也决定平均查找长度。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="hash-table" topicName="哈希表" />
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
