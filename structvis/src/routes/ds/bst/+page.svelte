<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { BstEngine } from '$lib/engines/algorithm/bst/BstEngine';

	const DEFAULT_TREE = [10, 5, 15, 3, 7, 12, 20];

	function createEngine(): BstEngine {
		const e = new BstEngine();
		e.init({ tree: DEFAULT_TREE, mode: 'search', target: 12 });
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
		<h1 class="page-title">二叉搜索树</h1>
		<p class="page-desc">
			二叉搜索树让每个结点都满足"左子树 ＜ 根 ＜ 右子树"，于是查找、插入、删除都能沿路径下行。
			查找比目标小就向左、大就向右；插入的新结点总是叶子；
			删除按三种情况处理——叶子直接摘、单孩子用孩子顶替、双孩子用中序后继替换。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="bst" topicName="二叉搜索树" />
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
