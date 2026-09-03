<script lang="ts">
	/**
	 * SQL 工作台 — /db/workbench 页面。
	 * 三栏工作台：schema 树 | SQL 编辑器 + 关卡卡 | 结果 + EXPLAIN。
	 * sql.js 真实执行（无执行器时引导重试）；过关回写掌握度。
	 */
	import { onMount } from 'svelte';
	import { recordExercise } from '$lib/stores/progress';
	import { createPageExecutor, type SqlExecutor } from '$lib/engines/sql/sql-executor';
	import { LEVELS, WORKBENCH_SEED } from '$lib/engines/sql/scripts/workbench-levels';

	let executor: SqlExecutor | null = null;
	let ready = $state(false);
	let loadError = $state('');

	let levelIdx = $state(0);
	let sql = $state('');
	let result = $state<{ columns: string[]; rows: (string | number)[][]; error?: string } | null>(
		null
	);
	let eqp = $state('');
	let verdict = $state<{ ok: boolean; reason: string } | null>(null);
	let running = $state(false);

	const level = $derived(LEVELS[levelIdx]);
	let passed = $state<number[]>([]);

	/** schema 树：seed 库的表/列（sqlite_master + pragma） */
	let schema = $state<{ table: string; columns: string[] }[]>([]);

	onMount(async () => {
		executor = await createPageExecutor();
		if (!executor) {
			loadError = 'SQL 执行器加载失败（网络不可达）——刷新重试。';
			return;
		}
		executor.script(WORKBENCH_SEED);
		schema = loadSchema();
		sql = defaultSqlFor(LEVELS[0]);
		ready = true;
	});

	function loadSchema(): { table: string; columns: string[] }[] {
		const ex = executor;
		if (!ex) return [];
		const tables = ex
			.query(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
			.rows.map((r) => String(r[0]));
		return tables.map((t) => ({
			table: t,
			columns: ex
				.query(`SELECT name FROM pragma_table_info('${t}') ORDER BY cid`)
				.rows.map((r) => String(r[0]))
		}));
	}

	function defaultSqlFor(l: (typeof LEVELS)[number]): string {
		// 关卡给出骨架提示（不直接给答案）
		const stubs: Record<number, string> = {
			1: 'SELECT 姓名, 成绩 FROM 学生\nWHERE /* 条件 */\nORDER BY /* 排序 */',
			2: 'SELECT 专业, COUNT(*) FROM 学生\nGROUP BY /* 分组键 */\nORDER BY /* 排序 */',
			3: 'SELECT 姓名 FROM 学生 s\nLEFT JOIN 选课 c ON /* 连接条件 */\nWHERE /* 反查条件 */\nORDER BY s.学号',
			4: "-- 先建索引（分号分隔可多句）\n-- CREATE INDEX idx_学生_姓名 ON 学生(姓名);\n\nSELECT * FROM 学生 WHERE 姓名 = '王五'",
			5: "UPDATE 学生 SET 成绩 = 成绩 + 5 WHERE 专业 = '软件工程';\n\nSELECT 姓名, 成绩 FROM 学生 WHERE 专业='软件工程' ORDER BY 学号",
			6: 'SELECT 姓名, 成绩, /* 窗口函数 */ FROM 学生\nORDER BY /* 名次 */',
			7: "SELECT 姓名 FROM 学生 WHERE 学号 IN (SELECT 学号 FROM 选课 WHERE 课程号='C001')\nUNION\nSELECT 姓名 FROM 学生 WHERE 学号 IN (SELECT 学号 FROM 选课 WHERE 课程号='C002')\nORDER BY 姓名",
			8: 'SELECT 专业, AVG(成绩) FROM 学生\nGROUP BY 专业\nHAVING /* 聚合条件 */\nORDER BY /* 排序 */'
		};
		return stubs[l.id] ?? '-- 写你的 SQL';
	}

	function run() {
		if (!executor || !ready) return;
		verdict = null;
		running = true;
		try {
			const r = executor.query(sql);
			result = r.error ? { columns: [], rows: [], error: r.error } : r;
			// EXPLAIN：取最后一条语句的计划（多语句时）
			const eq = executor.query(
				'EXPLAIN QUERY PLAN ' +
					sql
						.split(';')
						.map((s) => s.trim())
						.filter(Boolean)
						.pop()
			);
			eqp = eq.error ? '' : eq.rows.map((r2) => r2.map(String).join(' ')).join('\n');
		} finally {
			running = false;
		}
	}

	function submit() {
		if (!executor || !level) return;
		if (!result || result.error) {
			verdict = { ok: false, reason: '先成功运行 SQL（当前有执行错误）再提交。' };
			return;
		}
		verdict = level.judge({
			columns: result.columns,
			rows: result.rows,
			eqp,
			queryTable: (q) => executor!.query(q)
		});
		if (verdict.ok && !passed.includes(level.id)) {
			recordExercise(level.topicId, true);
			passed = [...passed, level.id];
		}
	}

	function pickLevel(i: number) {
		levelIdx = i;
		result = null;
		eqp = '';
		verdict = null;
		sql = defaultSqlFor(LEVELS[i]);
	}

	function resetDb() {
		if (!executor) return;
		executor.script(WORKBENCH_SEED);
		schema = loadSchema();
		result = null;
		eqp = '';
		verdict = { ok: true, reason: '数据库已重置到初始状态。' };
	}

	function onKey(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			run();
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<div class="mx-auto max-w-7xl px-5 pb-28">
	<header class="wb-head">
		<div>
			<h1 class="wb-title">SQL 工作台</h1>
			<p class="wb-sub">亲手写 SQL · sql.js 真实执行 · 过关点亮掌握度（Ctrl+Enter 运行）</p>
		</div>
		<div class="wb-passed">{passed.length} / {LEVELS.length} 关</div>
	</header>

	{#if loadError}
		<div class="wb-error" role="alert">{loadError}</div>
	{:else if !ready}
		<div class="wb-loading">正在装载 SQLite 执行器……</div>
	{:else}
		<div class="wb-grid">
			<!-- ═══ 左栏：关卡列表 + schema 树 ═══ -->
			<aside class="wb-side">
				<nav class="level-list" aria-label="关卡列表">
					{#each LEVELS as l, i (l.id)}
						<button
							class="level-item"
							class:active={i === levelIdx}
							class:passed={passed.includes(l.id)}
							onclick={() => pickLevel(i)}
						>
							<span class="level-badge">{passed.includes(l.id) ? '✓' : l.id}</span>
							{l.title.split('·')[1]?.trim() ?? l.title}
						</button>
					{/each}
				</nav>
				<div class="schema liquid">
					<h3 class="schema-label">Schema</h3>
					{#each schema as s (s.table)}
						<div class="schema-table">
							<span class="schema-name">{s.table}</span>
							<span class="schema-cols">{s.columns.join(' · ')}</span>
						</div>
					{/each}
					<button class="btn btn-ghost btn-sm" onclick={resetDb}>↺ 重置数据库</button>
				</div>
			</aside>

			<!-- ═══ 中栏：任务卡 + 编辑器 ═══ -->
			<section class="wb-main">
				<div class="task-card liquid">
					<div class="task-head">
						<span class="task-title">{level.title}</span>
						<span class="task-topic">{level.topicId}</span>
					</div>
					<p class="task-body">{level.task}</p>
					<p class="task-hint">提示：{level.hint}</p>
				</div>

				<div class="editor liquid">
					<textarea
						class="sql-input"
						spellcheck="false"
						rows="8"
						bind:value={sql}
						placeholder="-- 写你的 SQL，Ctrl+Enter 运行"
						aria-label="SQL 编辑器"></textarea>
					<div class="editor-actions">
						<button class="btn btn-ghost btn-sm" onclick={run} disabled={running}>▶ 运行</button>
						<button
							class="btn btn-accent btn-sm"
							onclick={submit}
							disabled={!result || !!result.error}
						>
							提交判定
						</button>
					</div>
				</div>

				{#if verdict}
					<div class="verdict liquid" class:ok={verdict.ok} class:bad={!verdict.ok} role="status">
						{verdict.ok ? '✓ ' : '✗ '}{verdict.reason}
					</div>
				{/if}
			</section>

			<!-- ═══ 右栏：结果 + EXPLAIN ═══ -->
			<section class="wb-out">
				<div class="result-panel liquid">
					<h3 class="out-label">结果</h3>
					{#if result?.error}
						<pre class="sql-error">{result.error}</pre>
					{:else if result && result.rows.length > 0}
						<table class="result-table">
							<thead>
								<tr
									>{#each result.columns as c (c)}<th>{c}</th>{/each}</tr
								>
							</thead>
							<tbody>
								{#each result.rows as row (row.join('|'))}
									<tr
										>{#each row as cell (cell)}<td>{cell}</td>{/each}</tr
									>
								{/each}
							</tbody>
						</table>
					{:else}
						<p class="out-empty">{result ? '（0 行）' : '运行后在此查看结果'}</p>
					{/if}
				</div>
				<div class="eqp-panel liquid">
					<h3 class="out-label">EXPLAIN QUERY PLAN</h3>
					<pre class="eqp-text">{eqp || '—'}</pre>
				</div>
			</section>
		</div>
	{/if}
</div>

<style>
	.wb-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		padding: 28px 0 16px;
	}

	.wb-title {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		margin: 0;
	}

	.wb-sub {
		font-size: 13px;
		color: var(--color-ink-2);
		margin: 4px 0 0;
	}

	.wb-passed {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--color-accent-text);
		font-weight: 600;
	}

	.wb-grid {
		display: grid;
		grid-template-columns: 230px 1fr 1fr;
		gap: 14px;
		align-items: start;
	}

	@media (max-width: 1023px) {
		.wb-grid {
			grid-template-columns: 1fr;
		}
	}

	/* 左栏 */
	.level-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.level-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 12px;
		border: none;
		border-radius: 10px;
		background: transparent;
		font-size: 13px;
		color: var(--color-ink-2);
		text-align: left;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.level-item:hover {
		background: var(--color-subtle);
		color: var(--color-ink);
	}

	.level-item.active {
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		color: var(--color-accent-text);
		font-weight: 600;
	}

	.level-item.passed .level-badge {
		background: var(--color-success);
		color: #fff;
	}

	.level-badge {
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--color-line-regular);
		color: var(--color-ink-2);
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.schema {
		margin-top: 12px;
		padding: 14px;
		border-radius: 14px;
	}

	.schema-label,
	.out-label {
		font-family: var(--font-mono);
		font-size: 10.5px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
		margin: 0 0 8px;
	}

	.schema-table {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-bottom: 10px;
	}

	.schema-name {
		font-family: var(--font-mono);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--color-academic);
	}

	.schema-cols {
		font-size: 11px;
		color: var(--color-ink-3);
	}

	/* 中栏 */
	.task-card {
		padding: 18px 20px;
		border-radius: 16px;
	}

	.task-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.task-title {
		font-family: var(--font-display);
		font-size: 17px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.task-topic {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-ink-3);
	}

	.task-body {
		font-size: 13.5px;
		line-height: 1.65;
		color: var(--color-ink-2);
		margin: 0 0 6px;
	}

	.task-hint {
		font-size: 12px;
		color: var(--color-accent-text);
		margin: 0;
	}

	.editor {
		margin-top: 12px;
		padding: 12px;
		border-radius: 16px;
	}

	.sql-input {
		width: 100%;
		border: none;
		outline: none;
		background: transparent;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.6;
		color: var(--color-ink);
		resize: vertical;
	}

	.editor-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid var(--color-line-hair);
	}

	.verdict {
		margin-top: 12px;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 13.5px;
		line-height: 1.5;
	}

	.verdict.ok {
		border-color: color-mix(in srgb, var(--color-success) 50%, transparent);
		color: var(--color-success);
	}

	.verdict.bad {
		border-color: color-mix(in srgb, var(--color-danger) 50%, transparent);
		color: var(--color-danger);
	}

	/* 右栏 */
	.wb-out {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.result-panel,
	.eqp-panel {
		padding: 14px 16px;
		border-radius: 14px;
	}

	.result-table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.result-table th {
		text-align: left;
		padding: 6px 10px;
		border-bottom: 1px solid var(--color-line-regular);
		color: var(--color-ink-2);
		font-weight: 600;
	}

	.result-table td {
		padding: 5px 10px;
		border-bottom: 1px solid var(--color-line-hair);
		color: var(--color-ink);
	}

	.out-empty {
		font-size: 12.5px;
		color: var(--color-ink-3);
	}

	.sql-error,
	.eqp-text {
		font-family: var(--font-mono);
		font-size: 12px;
		white-space: pre-wrap;
		word-break: break-all;
		margin: 0;
	}

	.sql-error {
		color: var(--color-danger);
	}

	.eqp-text {
		color: var(--color-ink-2);
	}

	.wb-loading,
	.wb-error {
		padding: 60px 0;
		text-align: center;
		color: var(--color-ink-2);
	}

	.wb-error {
		color: var(--color-danger);
	}
</style>
