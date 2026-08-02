<script lang="ts">
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		SinglyLinkedListEngine,
		type ListEngineInput
	} from '$lib/engines/algorithm/linkedlist/SinglyLinkedListEngine';

	const PRESETS: { name: string; input: ListEngineInput }[] = [
		{
			name: '插入 66 到第 3 位',
			input: { values: [12, 99, 37, 8], operation: 'insert', target: 3, value: 66 }
		},
		{
			name: '删除节点 37',
			input: { values: [12, 99, 37, 8], operation: 'delete', target: 37 }
		}
	];

	function createEngine(input: ListEngineInput): SinglyLinkedListEngine {
		const e = new SinglyLinkedListEngine();
		e.init(input);
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].input));
	let selectedPreset = $state(0);
	let showCustom = $state(false);

	let customValues = $state('12, 99, 37, 8');
	let customOp = $state<'insert' | 'delete'>('insert');
	let customTarget = $state('3');
	let customValue = $state('66');
	let inputError = $state('');

	function loadPreset(index: number) {
		selectedPreset = index;
		engine = createEngine(PRESETS[index].input);
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
				throw new Error('至少需要 1 个节点');
			}
			if (values.length > 12) {
				throw new Error('最多支持 12 个节点');
			}

			const target = parseInt(customTarget, 10);
			if (isNaN(target)) {
				throw new Error('目标参数必须是数字');
			}

			let input: ListEngineInput;
			if (customOp === 'insert') {
				if (target < 1 || target > values.length + 1) {
					throw new Error(`插入位置需在 1 ~ ${values.length + 1} 之间`);
				}
				const value = parseInt(customValue, 10);
				if (isNaN(value)) {
					throw new Error('插入值必须是数字');
				}
				input = { values, operation: 'insert', target, value };
			} else {
				if (!values.includes(target)) {
					throw new Error(`列表中不存在节点 ${target}`);
				}
				input = { values, operation: 'delete', target };
			}

			inputError = '';
			selectedPreset = -1;
			engine = createEngine(input);
		} catch (e) {
			inputError = (e as Error).message;
		}
	}
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§02</span>
			<span class="section-name">线性结构</span>
		</div>
		<h1 class="page-title">单链表基本操作</h1>
		<p class="page-desc">
			链表用指针链接节点，插入与删除只需要修改前驱的 next 指针，无需移动其他元素。
			关键思想：插入先找前驱，删除先遍历定位。观察下方动画中 <span class="mono">p</span> 指针的移动规律。
		</p>
	</div>

	<div class="op-panel">
		<div class="panel-row">
			<span class="panel-label">操作演示</span>
			<div class="view-container">
				<div class="view {showCustom ? 'hide' : ''}">
					<div class="op-group">
						{#each PRESETS as p, i (p.name)}
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
						placeholder="节点值，逗号分隔，如：12, 99, 37, 8"
					/>
					<div class="op-switch">
						<button
							class="op-btn {customOp === 'insert' ? 'active' : ''}"
							onclick={() => (customOp = 'insert')}
						>
							插入
						</button>
						<button
							class="op-btn {customOp === 'delete' ? 'active' : ''}"
							onclick={() => (customOp = 'delete')}
						>
							删除
						</button>
					</div>
					{#if customOp === 'insert'}
						<input
							type="text"
							bind:value={customTarget}
							class="custom-input num-input"
							placeholder="插入位置（1 起）"
						/>
						<input
							type="text"
							bind:value={customValue}
							class="custom-input num-input"
							placeholder="插入的值"
						/>
					{:else}
						<input
							type="text"
							bind:value={customTarget}
							class="custom-input num-input"
							placeholder="要删除的节点值"
						/>
					{/if}
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
		<AlgoPlayer {engine} topicId="linear-list" topicName="单链表基本操作" />
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
		min-width: 130px;
		max-width: 160px;
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
