<script lang="ts">
	import { fade } from 'svelte/transition';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { SelectEngine, type SqlTable } from '$lib/engines/sql/SelectEngine';

	// 学生表（教材风格示例数据）
	const STUDENT_TABLE: SqlTable = {
		columns: ['学号', '姓名', '专业', '成绩'],
		rows: [
			[20101, '张三', '计算机', 88],
			[20102, '李四', '软件工程', 92],
			[20103, '王五', '计算机', 76],
			[20104, '赵六', '网络工程', 85],
			[20105, '孙七', '软件工程', 63],
			[20106, '周八', '计算机', 95]
		]
	};

	const PRESETS: { name: string; sql: string }[] = [
		{
			name: '筛选成绩 ≥ 85',
			sql: 'SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85 ORDER BY 成绩 DESC'
		},
		{
			name: '按专业统计人数',
			sql: 'SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业'
		}
	];

	function createEngine(sql: string): SelectEngine {
		const e = new SelectEngine();
		e.init({ sql, table: STUDENT_TABLE });
		return e;
	}

	let engine = $state(createEngine(PRESETS[0].sql));
	let selectedPreset = $state(0);
	let customSql = $state(PRESETS[0].sql);
	let inputError = $state('');
	let showCustom = $state(false);

	const displaySql = $derived(
		showCustom ? customSql : PRESETS[Math.max(0, selectedPreset)].sql
	);

	function loadPreset(index: number) {
		selectedPreset = index;
		engine = createEngine(PRESETS[index].sql);
		inputError = '';
	}

	function applyCustomSql() {
		const sql = customSql.trim();
		if (sql.length === 0) {
			inputError = 'SQL 不能为空';
			return;
		}
		try {
			engine = createEngine(sql);
			inputError = '';
			selectedPreset = -1;
		} catch (e) {
			inputError = (e as Error).message;
		}
	}
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§04</span>
			<span class="section-name">数据查询</span>
		</div>
		<h1 class="page-title">SQL 基础查询</h1>
		<p class="page-desc">
			SELECT 语句按固定的<b>逻辑执行顺序</b>处理：<span class="mono"
				>FROM → WHERE → GROUP BY → SELECT → ORDER BY</span
			>。 先选表、再筛行、再分组、再投影列、最后排序。逐步播放，观察每一子句对结果集的影响。
		</p>
	</div>

	<div class="sql-panel">
		<div class="panel-row">
			<span class="panel-label">示例查询</span>
			<div class="view-container">
				<div class="view {showCustom ? 'hide' : ''}">
					<div class="sql-group">
						{#each PRESETS as p, i (p.name)}
							<button
								class="sql-btn {selectedPreset === i ? 'active' : ''}"
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
						bind:value={customSql}
						class="custom-input"
						placeholder="基于学生表（学号/姓名/专业/成绩），如：SELECT 姓名 FROM 学生 WHERE 专业 = '计算机'"
						onkeydown={(e) => e.key === 'Enter' && applyCustomSql()}
					/>
					<button class="apply-btn" onclick={applyCustomSql}>应用</button>
				</div>
			</div>
			<div class="view-switch">
				<button
					class="sql-btn {!showCustom ? 'active' : ''}"
					onclick={() => (showCustom = false)}
				>
					示例
				</button>
				<button class="sql-btn {showCustom ? 'active' : ''}" onclick={() => (showCustom = true)}>
					自定义
				</button>
			</div>
		</div>
		{#if !showCustom}
			<pre class="sql-code mono" transition:fade={{ duration: 150 }}>{displaySql}</pre>
		{/if}
		{#if inputError}
			<div class="input-error">{inputError}</div>
		{/if}
	</div>

	<div class="player-wrap">
		<AlgoPlayer {engine} topicId="sql-select" topicName="SQL 基础查询" />
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
		max-width: 640px;
		margin: 0;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-academic);
	}

	.sql-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 14px 20px;
		margin-bottom: 20px;
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
	}

	.sql-group {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.sql-btn {
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

	.sql-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.sql-btn.active {
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		border-color: var(--color-ink);
	}

	.sql-code {
		flex-basis: 100%;
		margin: 0;
		padding: 10px 14px;
		background: var(--color-code-bg);
		color: var(--color-ink-inverse);
		border-radius: var(--radius-sm);
		font-size: 12px;
		line-height: 1.6;
		overflow-x: auto;
	}

	.panel-row {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		flex: 1;
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

	.view-switch {
		margin-left: auto;
		display: flex;
		gap: 4px;
		flex-shrink: 0;
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
