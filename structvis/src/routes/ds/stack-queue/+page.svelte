<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		StackQueueEngine,
		type StackQueueEngineInput,
		type StackQueueStructure
	} from '$lib/engines/algorithm/stackqueue/StackQueueEngine';

	const PRESETS: Record<'stack' | 'queue', { name: string; input: StackQueueEngineInput }[]> = {
		stack: [
			{
				name: '压栈 66',
				input: { structure: 'stack', values: [12, 99, 37, 8], operation: 'push', target: 66 }
			},
			{
				name: '出栈 8（栈顶）',
				input: { structure: 'stack', values: [12, 99, 37, 8], operation: 'pop', target: 8 }
			},
			{
				name: '出栈 66（错误示例）',
				input: { structure: 'stack', values: [12, 99, 37, 8], operation: 'pop', target: 66 }
			}
		],
		queue: [
			{
				name: '入队 66',
				input: { structure: 'queue', values: [12, 99, 37, 8], operation: 'enqueue', target: 66 }
			},
			{
				name: '出队 12（队头）',
				input: { structure: 'queue', values: [12, 99, 37, 8], operation: 'dequeue', target: 12 }
			}
		]
	};

	function createEngine(input: StackQueueEngineInput): StackQueueEngine {
		const e = new StackQueueEngine();
		e.init(input);
		return e;
	}

	let structure = $state<StackQueueStructure>('stack');
	let engine = $state(createEngine(PRESETS.stack[0].input));
	let selectedPreset = $state(0);
	let showCustom = $state(false);

	let customValues = $state('12, 99, 37, 8');
	let customOp = $state<'push' | 'pop'>('push');
	let customTarget = $state('66');
	let inputError = $state('');

	function switchStructure(s: StackQueueStructure) {
		if (s === structure) return;
		structure = s;
		showCustom = false;
		customOp = 'push';
		customTarget = '66';
		selectedPreset = 0;
		inputError = '';
		engine = createEngine(PRESETS[s][0].input);
	}

	function loadPreset(index: number) {
		selectedPreset = index;
		engine = createEngine(PRESETS[structure][index].input);
		inputError = '';
	}

	function applyCustomInput() {
		try {
			const values = customValues
				.split(/[,，\s]+/)
				.map((s) => s.trim())
				.filter((s) => s.length > 0)
				.map((s) => {
					const n = parseInt(s, 10);
					if (isNaN(n)) throw new Error(`"${s}" 不是有效数字`);
					return n;
				});

			if (values.length < 1) {
				throw new Error('至少需要 1 个元素');
			}
			if (values.length > 12) {
				throw new Error('最多支持 12 个元素');
			}

			const target = parseInt(customTarget, 10);
			if (isNaN(target)) {
				throw new Error('目标参数必须是数字');
			}

			const isStack = structure === 'stack';
			const headLabel = isStack ? '栈顶' : '队头';
			if (customOp === 'pop') {
				if (values.length === 0) {
					throw new Error(`${isStack ? '栈' : '队'}为空，无法取出元素`);
				}
				const head = isStack ? values[values.length - 1] : values[0];
				if (head !== target) {
					throw new Error(`当前${headLabel}元素是 ${head}，与目标 ${target} 不一致`);
				}
			}

			inputError = '';
			selectedPreset = -1;
			engine = createEngine({
				structure,
				values,
				operation: customOp === 'push' ? (isStack ? 'push' : 'enqueue') : (isStack ? 'pop' : 'dequeue'),
				target
			});
		} catch (e) {
			inputError = (e as Error).message;
		}
	}
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§03</span>
			<span class="section-name">线性结构</span>
		</div>
		<h1 class="page-title">栈和队列</h1>
		<p class="page-desc">
			栈是后进先出（LIFO），只在栈顶压入/弹出；队列是先进先出（FIFO），从队尾入队、队头出队。
			切换结构与操作，观察元素在容器中的进出规律。
		</p>
	</div>

	<div class="op-panel">
		<div class="panel-row">
			<span class="panel-label">操作演示</span>
			<div class="op-group">
				<button
					class="op-btn {structure === 'stack' ? 'active' : ''}"
					onclick={() => switchStructure('stack')}
				>
					栈
				</button>
				<button
					class="op-btn {structure === 'queue' ? 'active' : ''}"
					onclick={() => switchStructure('queue')}
				>
					队列
				</button>
			</div>
			<div class="view-container">
				<div class="view {showCustom ? 'hide' : ''}">
					<div class="op-group">
						{#each PRESETS[structure] as p, i (p.name)}
							<button
								class="op-btn {selectedPreset === i ? 'active' : ''}"
								onclick={() => loadPreset(i)}
							>
								{p.name}
							</button>
						{/each}
					</div>
				</div>
				<div class="view {showCustom ? '' : 'hide'}">
					<input
						type="text"
						bind:value={customValues}
						class="custom-input"
						placeholder="元素值，逗号分隔，如：12, 99, 37, 8"
					/>
					<div class="op-switch">
						<button
							class="op-btn {customOp === 'push' ? 'active' : ''}"
							onclick={() => (customOp = 'push')}
						>
							{structure === 'stack' ? '压栈' : '入队'}
						</button>
						<button
							class="op-btn {customOp === 'pop' ? 'active' : ''}"
							onclick={() => (customOp = 'pop')}
						>
							{structure === 'stack' ? '出栈' : '出队'}
						</button>
					</div>
					<input
						type="text"
						bind:value={customTarget}
						class="custom-input num-input"
						placeholder={customOp === 'push'
							? structure === 'stack'
								? '压入的值'
								: '入队的值'
							: structure === 'stack'
								? '要取出的栈顶值'
								: '要取出的队头值'}
					/>
					<button class="apply-btn" onclick={applyCustomInput}>应用</button>
				</div>
			</div>
			<div class="view-switch">
				<button
					class="op-btn {!showCustom ? 'active' : ''}"
					onclick={() => (showCustom = false)}
				>
					示例
				</button>
				<button class="op-btn {showCustom ? 'active' : ''}" onclick={() => (showCustom = true)}>
					自定义
				</button>
			</div>
		</div>
		{#if inputError}
			<div class="input-error">{inputError}</div>
		{/if}
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="stack-queue" topicName="栈和队列" />
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

	.op-panel {
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

	.op-group {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.op-btn {
		padding: 5px 14px;
		font-size: 12px;
		font-family: var(--font-body);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-ink-2);
		cursor: pointer;
		transition: all 120ms var(--ease-out);
	}

	.op-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.op-btn.active {
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		border-color: var(--color-ink);
	}

	.op-switch {
		display: flex;
		gap: 4px;
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
		min-width: 160px;
		max-width: 300px;
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

	.num-input {
		flex: none;
		min-width: 150px;
		max-width: 180px;
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
