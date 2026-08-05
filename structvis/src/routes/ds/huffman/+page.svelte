<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { HuffmanEngine } from '$lib/engines/algorithm/huffman/HuffmanEngine';

	function createEngine(): HuffmanEngine {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		return e;
	}

	let engine = $state(createEngine());
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§06</span>
			<span class="section-name">树状结构</span>
		</div>
		<h1 class="page-title">哈夫曼树</h1>
		<p class="page-desc">
			带权叶子构成森林，每轮取权值最小的两棵树合并（根权为两权之和），n 个叶子合并 n-1 次后
			只剩一棵树——哈夫曼树。它让带权路径长度 WPL 最小：权大的叶子离根近、权小的离根远，
			是哈夫曼编码（前缀编码）的基础。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="huffman" topicName="哈夫曼树" />
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
