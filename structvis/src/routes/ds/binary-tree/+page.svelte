<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		BinaryTreeEngine,
		type TraversalMode
	} from '$lib/engines/algorithm/binarytree/BinaryTreeEngine';

	function createEngine(mode: TraversalMode, tree: number[]): BinaryTreeEngine {
		const e = new BinaryTreeEngine();
		e.init({ tree, mode });
		return e;
	}

	let engine = $state(createEngine('preorder', [10, 5, 15, 3, 7, 12, 20]));
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§05</span>
			<span class="section-name">树形结构</span>
		</div>
		<h1 class="page-title">二叉树遍历</h1>
		<p class="page-desc">
			遍历是二叉树最重要的基本操作：按某种顺序不重复地访问每个节点。前序、中序、后序为
			深度优先（递归），层序为广度优先（队列）。对如下二叉树，尝试推演四种遍历的访问序列。
		</p>
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="binary-tree" topicName="二叉树遍历" />
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
