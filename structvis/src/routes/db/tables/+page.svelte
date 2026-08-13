<script lang="ts">
	import { parseCreateTable, type CreateTableResult } from '$lib/engines/sql/create-table';

	const PRESETS: { name: string; sql: string }[] = [
		{
			name: '学生表',
			sql: `CREATE TABLE 学生 (
  学号 INT PRIMARY KEY,
  姓名 VARCHAR(20) NOT NULL,
  专业 VARCHAR(20) NOT NULL,
  入学日期 DATE
)`
		},
		{
			name: '课程表',
			sql: `CREATE TABLE 课程 (
  课程号 VARCHAR(10) PRIMARY KEY,
  课程名 VARCHAR(30) NOT NULL,
  学分 INT NOT NULL,
  学时 INT
)`
		},
		{
			name: '选课表（含外键）',
			sql: `CREATE TABLE 选课 (
  学号 INT NOT NULL,
  课程号 VARCHAR(10) NOT NULL,
  成绩 INT,
  FOREIGN KEY (学号) REFERENCES 学生(学号),
  FOREIGN KEY (课程号) REFERENCES 课程(课程号)
)`
		}
	];

	// 预校验预设，保证示例可展示
	const presetResults = PRESETS.map((p) => parseCreateTable(p.sql));

	let selectedPreset = $state(0);
	let customSql = $state(PRESETS[0].sql);
	let showCustom = $state(false);
	let error = $state('');
	let result = $state<CreateTableResult | null>(presetResults[0]);

	// selectedPreset 可为 -1（自定义解析成功后），切回示例视图时由按钮重置为 0；此处再加守卫双保险
	const displaySql = $derived(showCustom ? customSql : (PRESETS[selectedPreset]?.sql ?? customSql));

	function loadPreset(index: number) {
		selectedPreset = index;
		error = '';
		result = presetResults[index];
	}

	function applyCustom() {
		const sql = customSql.trim();
		if (sql.length === 0) {
			error = '建表语句不能为空';
			result = null;
			return;
		}
		try {
			result = parseCreateTable(sql);
			error = '';
			selectedPreset = -1;
		} catch (e) {
			error = (e as { message?: string }).message ?? '语句解析失败';
			result = null;
		}
	}
</script>

<div class="page">
	<div class="section-header">
		<div class="section-label">
			<span class="section-num">§04</span>
			<span class="section-name">数据库基础</span>
		</div>
		<h1 class="page-title">建表练习</h1>
		<p class="page-desc">
			<b>CREATE TABLE</b> 定义表的结构：列名、数据类型与约束（主键 / 非空 / 唯一 / 外键）。 选择示例或输入自己的建表语句，系统即时解析并展示表结构，错误会给出教学提示。
		</p>
	</div>

	<div class="op-panel">
		<div class="panel-row">
			<span class="panel-label">建表语句</span>
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
					<textarea
						bind:value={customSql}
						class="custom-input"
						rows="4"
						placeholder="如：CREATE TABLE 学生 (学号 INT PRIMARY KEY, 姓名 VARCHAR(20) NOT NULL)"
						onkeydown={(e) => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && applyCustom()}
					></textarea>
					<button class="apply-btn" onclick={applyCustom}>解析</button>
				</div>
			</div>
			<div class="view-switch">
				<button
					class="op-btn {!showCustom ? 'active' : ''}"
					onclick={() => {
						// 自定义解析成功后 selectedPreset=-1，切回示例时复位到第 0 个并重载解析结果
						// （否则 PRESETS[-1] 越界崩溃，且 schema 区仍显示自定义表）
						if (selectedPreset < 0) loadPreset(0);
						showCustom = false;
					}}
				>
					示例
				</button>
				<button class="op-btn {showCustom ? 'active' : ''}" onclick={() => (showCustom = true)}>
					自定义
				</button>
			</div>
		</div>
		{#if !showCustom}
			<pre class="sql-block mono">{displaySql}</pre>
		{/if}
		{#if error}
			<div class="error-box">
				<span class="error-icon">✗</span>
				<span>{error}</span>
			</div>
		{/if}
	</div>

	{#if result}
		<div class="schema-area">
			<div class="schema-table">
				<div class="schema-head">
					<span class="schema-name mono">{result.tableName}</span>
					<span class="schema-meta"
						>共 {result.columns.length} 列{result.foreignKeys.length > 0
							? ` · ${result.foreignKeys.length} 个外键`
							: ''}</span
					>
				</div>
				<div class="col-list">
					{#each result.columns as col, i (col.name)}
						<div class="col-card">
							<div class="col-order mono">{String(i + 1).padStart(2, '0')}</div>
							<div class="col-main">
								<div class="col-name mono">{col.name}</div>
								<div class="col-type mono">{col.type}</div>
							</div>
							<div class="col-tags">
								{#if col.primaryKey}
									<span class="tag tag-pk">PK 主键</span>
								{/if}
								{#if col.notNull}
									<span class="tag tag-nn">NN 非空</span>
								{/if}
								{#if col.unique}
									<span class="tag tag-uq">UQ 唯一</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				{#if result.foreignKeys.length > 0}
					<div class="fk-list">
						{#each result.foreignKeys as fk, i (i)}
							<div class="fk-row mono">
								<span class="tag tag-fk">FK 外键</span>
								<span class="fk-text"
									>{result.tableName}.{fk.column} → {fk.refTable}.{fk.refColumn}</span
								>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="legend">
				<div class="legend-title">约束图例</div>
				<div class="legend-item"><span class="tag tag-pk">PK</span> 主键：唯一标识一行</div>
				<div class="legend-item"><span class="tag tag-nn">NN</span> 非空：不允许 NULL</div>
				<div class="legend-item"><span class="tag tag-uq">UQ</span> 唯一：值不重复</div>
				<div class="legend-item">
					<span class="tag tag-fk">FK</span> 外键：引用其他表的主键
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: min(1440px, 100%);
		margin: 0 auto;
		padding: 48px 32px 64px;
		min-height: calc(100vh - 48px);
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
	}

	.op-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 16px 20px;
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
		width: 56px;
	}

	.op-group {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.op-btn {
		padding: 5px 12px;
		font-size: 12px;
		font-family: var(--font-body);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-ink-2);
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
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
		min-width: 200px;
		max-width: 420px;
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
		transition:
			background-color 120ms var(--ease-out),
			border-color 120ms var(--ease-out);
	}

	.apply-btn:hover {
		background: #333;
		border-color: #333;
	}

	.sql-block {
		margin: 0;
		padding: 10px 14px;
		background: var(--color-code-bg);
		color: var(--color-ink-inverse);
		border-radius: var(--radius-sm);
		font-size: 12px;
		line-height: 1.6;
		white-space: pre;
		overflow-x: auto;
	}

	.error-box {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--color-danger);
		font-family: var(--font-mono);
		padding: 8px 12px;
		background: rgba(220, 38, 38, 0.06);
		border: 1px solid rgba(220, 38, 38, 0.2);
		border-radius: var(--radius-sm);
	}

	.error-icon {
		font-weight: 700;
	}

	.schema-area {
		margin-top: 24px;
		display: flex;
		gap: 24px;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.schema-table {
		flex: 1;
		min-width: 360px;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.schema-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 20px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.schema-name {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.schema-meta {
		font-size: 12px;
		color: var(--color-ink-3);
		font-family: var(--font-mono);
	}

	.col-list {
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.col-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		transition: background-color 120ms ease-out;
	}

	.col-card:hover {
		background: var(--color-subtle);
	}

	.col-order {
		font-size: 11px;
		color: var(--color-ink-3);
		flex-shrink: 0;
	}

	.col-main {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	.col-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.col-type {
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.col-tags {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.tag {
		font-size: 10px;
		font-family: var(--font-mono);
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid transparent;
		white-space: nowrap;
	}

	.tag-pk {
		color: var(--color-accent);
		border-color: var(--color-accent);
		background: rgba(217, 119, 6, 0.08);
	}

	.tag-nn {
		color: var(--color-academic);
		border-color: var(--color-academic);
		background: rgba(27, 73, 101, 0.08);
	}

	.tag-uq {
		color: var(--color-success);
		border-color: var(--color-success);
		background: rgba(34, 120, 92, 0.08);
	}

	.tag-fk {
		color: var(--color-danger);
		border-color: var(--color-danger);
		background: rgba(220, 38, 38, 0.08);
	}

	.fk-list {
		border-top: 1px solid var(--color-line-hair);
		padding: 10px 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.fk-row {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.legend {
		width: 220px;
		background: var(--color-surface);
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.legend-title {
		font-size: 11px;
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
		margin-bottom: 4px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--color-ink-2);
		line-height: 1.5;
	}
</style>
