<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { QuickSortEngine } from '$lib/engines/algorithm/quicksort/QuickSortEngine';

	const presets = [
		{ name: '随机 8 个', data: [6, 2, 8, 5, 1, 9, 3, 7] },
		{ name: '逆序 8 个', data: [9, 8, 7, 6, 5, 4, 3, 2] },
		{ name: '基本有序', data: [1, 2, 4, 3, 5, 7, 6, 8] },
		{ name: '随机 12 个', data: [9, 4, 7, 2, 8, 1, 6, 3, 5, 11, 10, 12] }
	];

	function createEngine(data: number[]): QuickSortEngine {
		const e = new QuickSortEngine();
		e.init(data);
		return e;
	}

	let engine = $state(createEngine(presets[0].data));
	let selectedPreset = $state(0);
	let customInput = $state('6, 2, 8, 5, 1, 9, 3, 7');
	let inputError = $state('');

	function loadPreset(index: number) {
		selectedPreset = index;
		const data = presets[index].data;
		customInput = data.join(', ');
		engine = createEngine(data);
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

			if (data.length < 2) {
				throw new Error('至少需要 2 个元素');
			}
			if (data.length > 20) {
				throw new Error('最多支持 20 个元素');
			}

			inputError = '';
			selectedPreset = -1;
			engine = createEngine(data);
		} catch (e) {
			inputError = (e as Error).message;
		}
	}
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

	<!-- Data controls -->
	<div class="data-panel">
		<div class="panel-row">
			<span class="panel-label">示例数据</span>
			<div class="preset-group">
				{#each presets as preset, i (preset.name)}
					<button
						class="preset-btn {selectedPreset === i ? 'active' : ''}"
						onclick={() => loadPreset(i)}
					>
						{preset.name}
					</button>
				{/each}
			</div>
		</div>
		<div class="panel-row">
			<span class="panel-label">自定义</span>
			<div class="custom-group">
				<input
					type="text"
					bind:value={customInput}
					class="custom-input"
					placeholder="输入数字，用逗号分隔，如：6, 2, 8, 5, 1, 9, 3, 7"
					onkeydown={(e) => e.key === 'Enter' && applyCustomInput()}
				/>
				<button class="apply-btn" onclick={applyCustomInput}>应用</button>
			</div>
		</div>
		{#if inputError}
			<div class="input-error">{inputError}</div>
		{/if}
	</div>

	<!-- Visualization player -->
	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="quick-sort" topicName="快速排序" />
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

	/* Data panel */
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

	.preset-group {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.preset-btn {
		padding: 5px 12px;
		font-size: 12px;
		font-family: var(--font-body);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-ink-2);
		cursor: pointer;
		transition: all 120ms var(--ease-out);
	}

	.preset-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.preset-btn.active {
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		border-color: var(--color-ink);
	}

	.custom-group {
		display: flex;
		gap: 8px;
		flex: 1;
		min-width: 280px;
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
