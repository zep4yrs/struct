<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		BinaryTreeEngine,
		type TraversalMode
	} from '$lib/engines/algorithm/binarytree/BinaryTreeEngine';

	const DEFAULT_TREE = [10, 5, 15, 3, 7, 12, 20];

	const modes: { id: TraversalMode; name: string }[] = [
		{ id: 'preorder', name: '前序' },
		{ id: 'inorder', name: '中序' },
		{ id: 'postorder', name: '后序' },
		{ id: 'levelorder', name: '层序' }
	];

	function createEngine(mode: TraversalMode, tree: number[]): BinaryTreeEngine {
		const e = new BinaryTreeEngine();
		e.init({ tree, mode });
		return e;
	}

	function traversal(tree: number[], mode: TraversalMode): number[] {
		const out: number[] = [];
		if (mode === 'levelorder') {
			for (const v of tree) if (v !== -1) out.push(v);
			return out;
		}
		const dfs = (i: number) => {
			if (i >= tree.length || tree[i] === -1) return;
			if (mode === 'preorder') out.push(tree[i]);
			dfs(2 * i + 1);
			if (mode === 'inorder') out.push(tree[i]);
			dfs(2 * i + 2);
			if (mode === 'postorder') out.push(tree[i]);
		};
		dfs(0);
		return out;
	}

	let mode = $state<TraversalMode>('preorder');
	let tree = $state([...DEFAULT_TREE]);
	let engine = $state(createEngine('preorder', DEFAULT_TREE));
	let customInput = $state(DEFAULT_TREE.join(', '));
	let inputError = $state('');
	let showCustom = $state(false);

	const seq = $derived(traversal(tree, mode).join(' · '));

	function switchMode(m: TraversalMode) {
		mode = m;
		engine = createEngine(m, tree);
	}

	function applyCustomInput() {
		try {
			const data = customInput
				.split(/[,，\s]+/)
				.map((s) => s.trim())
				.filter((s) => s.length > 0)
				.map((s) => {
					const n = parseInt(s, 10);
					if (isNaN(n)) throw new Error(`"${s}" 不是有效数字`);
					return n;
				});

			if (data.length < 1) {
				throw new Error('至少需要 1 个节点');
			}
			if (data.length > 31) {
				throw new Error('最多支持 31 个节点');
			}
			if (data[0] === -1) {
				throw new Error('根节点不能为空');
			}

			inputError = '';
			tree = data;
			engine = createEngine(mode, data);
		} catch (e) {
			inputError = (e as Error).message;
		}
	}
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

	<div class="mode-panel">
		<div class="mode-tabs">
			{#each modes as m (m.id)}
				<button class="mode-btn {mode === m.id ? 'active' : ''}" onclick={() => switchMode(m.id)}>
					{m.name}
				</button>
			{/each}
		</div>
		<div class="seq-hint">
			<span class="seq-label">参考序列</span>
			<span class="seq-value mono">{seq}</span>
		</div>
	</div>

	<div class="data-panel">
		<div class="panel-row">
			<span class="panel-label">示例树</span>
			<div class="view-container">
				<div class="view {showCustom ? 'hide' : ''}">
					<span class="preset-value mono">{DEFAULT_TREE.join(' · ')}</span>
				</div>
				<div class="view {showCustom ? '' : 'hide'}">
					<input
						type="text"
						bind:value={customInput}
						class="custom-input"
						placeholder="层序序列，-1 表示空节点，如：10, 5, 15, -1, -1, 12, 20"
						onkeydown={(e) => e.key === 'Enter' && applyCustomInput()}
					/>
					<button class="apply-btn" onclick={applyCustomInput}>应用</button>
				</div>
			</div>
			<div class="view-switch">
				<button
					class="mode-btn {!showCustom ? 'active' : ''}"
					onclick={() => (showCustom = false)}
				>
					示例
				</button>
				<button class="mode-btn {showCustom ? 'active' : ''}" onclick={() => (showCustom = true)}>
					自定义
				</button>
			</div>
		</div>
		{#if inputError}
			<div class="input-error">{inputError}</div>
		{/if}
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="binary-tree" topicName="二叉树遍历" />
	</div>
</div>

<style>
	.page {
		max-width: 1100px;
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

	.mono {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-academic);
	}

	.mode-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 14px 20px;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		gap: 24px;
		flex-wrap: wrap;
	}

	.mode-tabs {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.mode-btn {
		padding: 5px 16px;
		font-size: 12px;
		font-family: var(--font-body);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-ink-2);
		cursor: pointer;
		transition: all 120ms var(--ease-out);
	}

	.mode-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.mode-btn.active {
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		border-color: var(--color-ink);
	}

	.seq-hint {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 240px;
	}

	.seq-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
		flex-shrink: 0;
	}

	.seq-value {
		font-size: 13px;
		color: var(--color-ink-2);
	}

	.data-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 16px 20px;
		margin-bottom: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.panel-row {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.panel-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
		flex-shrink: 0;
		width: 64px;
	}

	.preset-value {
		font-size: 13px;
		color: var(--color-ink-2);
	}

	.view-container {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		position: relative;
	}

	.view {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: opacity 150ms ease-out;
	}

	.view.hide {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.view-switch {
		margin-left: auto;
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.custom-input {
		flex: 1;
		padding: 5px 12px;
		font-family: var(--font-mono);
		font-size: 12px;
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		background: var(--color-paper);
		color: var(--color-ink);
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.custom-input:focus {
		border-color: var(--color-ink);
	}

	.apply-btn {
		padding: 5px 14px;
		font-size: 12px;
		font-weight: 500;
		border: 1px solid var(--color-ink);
		border-radius: var(--radius-sm);
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		cursor: pointer;
		transition: all 120ms var(--ease-out);
	}

	.apply-btn:hover {
		background: #333;
		border-color: #333;
	}

	.input-error {
		font-size: 12px;
		color: var(--color-danger);
		font-family: var(--font-mono);
		padding-left: 80px;
	}
</style>
