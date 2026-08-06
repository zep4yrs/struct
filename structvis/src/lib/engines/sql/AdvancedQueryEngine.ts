/**
 * 高级查询引擎 — AdvancedQueryEngine
 *
 * 教材第 2 章延伸：HAVING / 外连接 / UNION / EXISTS 四类高级子句的分步可视化。
 * 按 SQL 关键词自动 dispatch 到四类执行路径：
 * - HAVING   ：分组后过滤分组（WHERE 筛行、HAVING 筛组，执行时机在 GROUP BY 之后）
 * - LEFT JOIN：外连接——左表全部保留，右表无匹配补 NULL
 * - UNION    ：两个查询结果合并（UNION 去重 / UNION ALL 不去重）
 * - EXISTS   ：相关子查询——对外层每一行执行一次子查询，非空即保留
 * 表格内容在 step.table 中；data 快照为当前可见行的行号集合。引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { AGG_RE, SelectEngine, type SqlTable } from './SelectEngine';
import { evalSqlWhere } from './sql-utils';

export interface AdvancedQueryInput {
	/** 高级查询 SQL 语句 */
	sql: string;
	/** 表名 → 表数据（查询涉及的所有表） */
	tables: Record<string, SqlTable>;
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'WHERE 与 HAVING 的过滤时机分别是什么？',
		options: [
			'WHERE 筛行，HAVING 筛分组',
			'WHERE 筛分组，HAVING 筛行',
			'两者都在分组前执行',
			'两者等价，可互换'
		],
		correctAnswer: 'WHERE 筛行，HAVING 筛分组',
		hint: '回忆 SQL 执行顺序：FROM → WHERE → GROUP BY → HAVING',
		explanation:
			'WHERE 在分组之前逐行筛选；HAVING 在 GROUP BY 之后对分组（聚合结果）筛选，因此 HAVING 条件常引用聚合函数如 COUNT(*) > 2。'
	},
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'LEFT JOIN 与 INNER JOIN 的关键区别是？',
		options: [
			'LEFT JOIN 保留左表全部行，右表无匹配补 NULL',
			'LEFT JOIN 只返回匹配行',
			'LEFT JOIN 保留右表全部行',
			'两者结果完全相同'
		],
		correctAnswer: 'LEFT JOIN 保留左表全部行，右表无匹配补 NULL',
		hint: '左表是主表，不能被丢弃',
		explanation:
			'INNER JOIN 只保留两边都匹配的行；LEFT JOIN 以左表为主——左表的每一行都出现在结果中，右表没有匹配行时对应列填 NULL。'
	},
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'UNION 与 UNION ALL 的区别是？',
		options: [
			'UNION 自动去重，UNION ALL 不去重',
			'UNION ALL 自动去重',
			'UNION 要求两表列名相同',
			'两者没有区别'
		],
		correctAnswer: 'UNION 自动去重，UNION ALL 不去重',
		hint: 'UNION 默认消除重复行',
		explanation:
			'UNION 合并两个查询结果并消除重复行（有排序开销）；UNION ALL 直接拼接保留全部行，性能更高，适用于已知无重复的场景。'
	},
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'EXISTS 子查询是如何执行的？',
		options: [
			'对每一行都执行一次子查询，非空则保留',
			'只执行一次子查询',
			'先合并再筛选',
			'EXISTS 只能用于 IN'
		],
		correctAnswer: '对每一行都执行一次子查询，非空则保留',
		hint: 'EXISTS 是相关子查询的典型场景',
		explanation:
			'EXISTS 子查询引用外层表的列（如 选课.学号 = 学生.学号），因此外层有多少行，子查询就执行多少次；子查询结果非空即返回 TRUE，该行保留。'
	}
];

/** 演示数据预设（含 sql，供头部「演示数据」弹窗使用） */
export const ADVANCED_PRESETS: { name: string; description: string; sql: string }[] = [
	{
		name: 'HAVING 筛选分组',
		description: '分组后按聚合值过滤：人数 ≥ 2 的专业',
		sql: 'SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业 HAVING COUNT(*) >= 2'
	},
	{
		name: 'HAVING 平均分',
		description: '按学号分组后筛平均分 ≥ 80',
		sql: 'SELECT 学号, AVG(成绩) FROM 选课 GROUP BY 学号 HAVING AVG(成绩) >= 80'
	},
	{
		name: '左连接保留全部学生',
		description: 'LEFT JOIN：未选课的学生补 NULL',
		sql: 'SELECT 学生.学号, 学生.姓名, 选课.课程号, 选课.成绩 FROM 学生 LEFT JOIN 选课 ON 学生.学号 = 选课.学号'
	},
	{
		name: 'UNION 合并优秀名单',
		description: '两个查询结果合并并去重',
		sql: 'SELECT 学号 FROM 学生 WHERE 成绩 >= 85 UNION SELECT 学号 FROM 选课 WHERE 成绩 >= 85'
	},
	{
		name: 'EXISTS 选了课的学生',
		description: '相关子查询：子查询非空即保留',
		sql: 'SELECT 学号, 姓名 FROM 学生 WHERE EXISTS (SELECT 1 FROM 选课 WHERE 选课.学号 = 学生.学号)'
	},
	{
		name: 'NOT EXISTS 未选课的学生',
		description: '相关子查询取反',
		sql: 'SELECT 学号, 姓名 FROM 学生 WHERE NOT EXISTS (SELECT 1 FROM 选课 WHERE 选课.学号 = 学生.学号)'
	}
];

type QueryMode = 'having' | 'left-join' | 'union' | 'exists';

export class AdvancedQueryEngine implements AlgorithmEngine<AdvancedQueryInput> {
	readonly name = '高级查询';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = [];
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'compare',
			narration: '高级子句的执行时机与 WHERE 不同：HAVING 在分组后筛组、外连接保留主表全部行。'
		},
		{
			type: 'recurse-enter',
			narration: '逐个处理：或逐组判定 HAVING、或逐行找右表匹配、或逐行执行相关子查询。'
		},
		{
			type: 'complete',
			narration:
				'查询执行完毕。记住：HAVING 筛组、LEFT JOIN 留左、UNION 并集去重、EXISTS 逐行判存在。'
		}
	];

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	private _stepId = 0;
	private _tables: Record<string, SqlTable> = {};

	presets: EnginePreset[] = ADVANCED_PRESETS.map((p) => ({
		name: p.name,
		description: p.description
	}));

	customConfig: EngineCustomConfig = {
		title: '自定义高级查询',
		fields: [
			{
				key: 'sql',
				label: 'SQL 语句',
				type: 'textarea',
				placeholder: '例如：SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业 HAVING COUNT(*) >= 2',
				default: 'SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业 HAVING COUNT(*) >= 2'
			}
		]
	};

	applyPreset(name: string): void {
		const p = ADVANCED_PRESETS.find((x) => x.name === name);
		if (p) this.init({ sql: p.sql, tables: this._tables });
	}

	applyCustom(values: Record<string, string>): void {
		const sql = (values.sql ?? '').trim();
		if (sql.length === 0) throw new Error('SQL 不能为空');
		this.init({ sql, tables: this._tables });
	}

	init(input: AdvancedQueryInput): void {
		const { sql, tables } = input;
		this._tables = tables;
		const clean = sql.replace(/\s+/g, ' ').trim();
		const mode = this._detectMode(clean);

		this.steps = [];
		this._stepId = 0;

		switch (mode) {
			case 'having':
				this._buildHaving(clean, tables);
				break;
			case 'left-join':
				this._buildLeftJoin(clean, tables);
				break;
			case 'union':
				this._buildUnion(clean, tables);
				break;
			case 'exists':
				this._buildExists(clean, tables);
				break;
		}

		this.totalSteps = this.steps.length;
	}

	// === 模式识别 ===

	private _detectMode(sql: string): QueryMode {
		if (/\bUNION\s+(ALL\s+)?\b/i.test(sql)) return 'union';
		if (/\bLEFT\s+JOIN\b/i.test(sql)) return 'left-join';
		if (/\bEXISTS\s*\(/i.test(sql)) return 'exists';
		if (/\bHAVING\b/i.test(sql)) return 'having';
		throw new Error(
			'仅支持四类高级查询：HAVING 分组筛选 / LEFT JOIN 外连接 / UNION 合并 / EXISTS 相关子查询'
		);
	}

	// === HAVING 模式 ===

	private _buildHaving(sql: string, tables: Record<string, SqlTable>): void {
		const hm = sql.match(/\s+HAVING\s+(.+)$/i);
		if (!hm) throw new Error('HAVING 子句缺失');
		const havingCond = hm[1].trim();
		const withoutHaving = sql.slice(0, hm.index).trim();

		const sel = withoutHaving.match(/^SELECT\s+(.+?)\s+FROM\s+(.+)$/i);
		if (!sel) throw new Error('仅支持 SELECT ... FROM ... 查询');
		const selectCols = sel[1]
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		let body = sel[2].trim();

		// 解析 WHERE / GROUP BY（HAVING 之后不允许 ORDER BY / LIMIT）
		let where: string | null = null;
		const wm = body.match(/\s+WHERE\s+(.+?)\s+GROUP\s+BY\s+([^\s]+)$/i);
		const gm = body.match(/\s+GROUP\s+BY\s+([^\s]+)$/i);
		if (wm) {
			where = wm[1].trim();
			body = body.slice(0, wm.index).trim();
		} else if (gm) {
			body = body.slice(0, gm.index).trim();
		}
		const groupColRaw = wm ? wm[2] : gm ? gm[1] : null;
		if (!groupColRaw) throw new Error('HAVING 必须与 GROUP BY 搭配使用');

		const tableName = body.split(/\s+/)[0].replace(/`|"|'/g, '');
		const table = tables[tableName];
		if (!table) throw new Error(`表 ${tableName} 不存在`);

		this.pseudocode = [
			`SELECT ${selectCols.join(', ')} FROM ${tableName} GROUP BY ${groupColRaw}`,
			`GROUP BY ${groupColRaw}：分组并聚合统计`,
			`HAVING ${havingCond}：对分组结果筛选`,
			`SELECT 投影：输出 ${selectCols.join(', ')}`,
			`返回结果`
		];

		// 1. FROM 读表
		this._emit(
			'compare',
			`FROM ${tableName}：读取全部 ${table.rows.length} 条记录。`,
			table,
			[],
			[{ type: 'compare', indices: table.rows.map((_, i) => i) }],
			0
		);

		// 2. WHERE 筛行（可选）
		let rows: (string | number)[][] = table.rows.map((r) => [...r]);
		const tableData: SqlTableData = { columns: [...table.columns], rows };
		if (where) {
			const filtered: (string | number)[][] = [];
			for (let i = 0; i < rows.length; i++) {
				const pass = evalSqlWhere(where, rows[i], tableData);
				if (pass) filtered.push(rows[i]);
				this._emit(
					'compare',
					`WHERE ${where}：第 ${i + 1} 行${pass ? '满足条件 ✓' : '不满足条件 ✗'}。`,
					tableData,
					[],
					pass ? [{ type: 'current', indices: [i] }] : [],
					0
				);
			}
			rows = filtered;
			this._emit(
				'recurse-exit',
				`WHERE 筛选完成，剩余 ${rows.length} 条记录。`,
				{ columns: [...table.columns], rows: rows.map((r) => [...r]) },
				[],
				[],
				0
			);
		}

		// 3. GROUP BY 分组 + 聚合
		const groupCol = this._colRef(groupColRaw, table.columns, false);
		if (groupCol === null) throw new Error(`分组列 ${groupColRaw} 不存在`);
		const grouped = this._group(rows, table.columns, groupCol, selectCols);
		this._emit(
			'recurse-enter',
			`GROUP BY ${groupCol}：按 ${groupCol} 分组，共 ${grouped.rows.length} 组。`,
			grouped,
			[],
			[],
			1
		);

		// 4. HAVING 筛组
		const passing: (string | number)[][] = [];
		const rejected: (string | number)[][] = [];
		for (const g of grouped.rows) {
			const pass = evalSqlWhere(havingCond, g, grouped);
			if (pass) passing.push(g);
			else rejected.push(g);
			this._emit(
				'compare',
				`HAVING ${havingCond}：组 [${g.join(', ')}]${pass ? ' 满足条件 ✓' : ' 不满足条件 ✗'}。`,
				grouped,
				[],
				pass ? [{ type: 'current', indices: [grouped.rows.indexOf(g)] }] : [],
				2
			);
		}
		this._emit(
			'recurse-exit',
			`HAVING 筛选完成：保留 ${passing.length} 组，剔除 ${rejected.length} 组。`,
			{ columns: [...grouped.columns], rows: [...passing.map((r) => [...r])] },
			[],
			[],
			2,
			`HAVING 与 WHERE 的区别：WHERE 在分组前逐行筛，HAVING 在分组后按聚合结果筛——所以 HAVING 条件里可以写 COUNT(*) / AVG(...) 这类聚合表达式。`
		);

		// 5. SELECT 投影
		const projected = this._project(
			{ columns: [...grouped.columns], rows: [...passing.map((r) => [...r])] },
			selectCols
		);
		this._emit(
			'recurse-enter',
			`SELECT ${selectCols.join(', ')}：投影出需要的列。`,
			projected,
			[],
			[],
			3
		);

		// 6. complete
		this._emit(
			'complete',
			`查询完成，返回 ${projected.rows.length} 行结果。`,
			projected,
			[],
			[{ type: 'compare', indices: projected.rows.map((_, i) => i) }],
			4,
			`执行顺序：FROM → WHERE（筛行）→ GROUP BY（分组）→ HAVING（筛组）→ SELECT（投影）。`
		);
	}

	// === LEFT JOIN 模式 ===

	private _buildLeftJoin(sql: string, tables: Record<string, SqlTable>): void {
		const m = sql.match(
			/^SELECT\s+(.+?)\s+FROM\s+([\u4e00-\u9fa5\w]+)\s+LEFT\s+JOIN\s+([\u4e00-\u9fa5\w]+)\s+ON\s+(.+)$/i
		);
		if (!m) throw new Error('仅支持 SELECT ... FROM 左表 LEFT JOIN 右表 ON 条件 查询');
		const selectCols = m[1]
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		const leftName = m[2];
		const rightName = m[3];
		const onCond = m[4].trim();

		const left = tables[leftName];
		const right = tables[rightName];
		if (!left) throw new Error(`表 ${leftName} 不存在`);
		if (!right) throw new Error(`表 ${rightName} 不存在`);

		this.pseudocode = [
			`SELECT ${selectCols.join(', ')} FROM ${leftName} LEFT JOIN ${rightName} ON ${onCond}`,
			`逐行扫描 ${leftName}，在 ${rightName} 中找 ON 匹配行`,
			`无匹配：${leftName} 行保留，${rightName} 列补 NULL`,
			`SELECT 投影：输出 ${selectCols.join(', ')}`,
			`返回结果`
		];

		const allCols = [
			...left.columns.map((c) => `${leftName}.${c}`),
			...right.columns.map((c) => `${rightName}.${c}`)
		];
		const leftColRefs = left.columns.map((c) => `${leftName}.${c}`);
		const rightColRefs = right.columns.map((c) => `${rightName}.${c}`);

		// 1. FROM 左表
		this._emit(
			'compare',
			`FROM ${leftName}：左表是主表，读取 ${left.rows.length} 条记录——之后每一行都必须出现在结果中。`,
			left,
			[],
			[{ type: 'compare', indices: left.rows.map((_, i) => i) }],
			0
		);

		// 2. 逐左行匹配
		const matched: (string | number)[][] = [];
		const unmatchedLeft: (string | number)[][] = [];
		for (let li = 0; li < left.rows.length; li++) {
			const lrow = left.rows[li];
			const hits: (string | number)[][] = [];
			for (const rrow of right.rows) {
				const combo = [...lrow, ...rrow];
				if (evalSqlWhere(onCond, combo, { columns: allCols, rows: [combo] })) {
					hits.push(combo);
				}
			}
			if (hits.length > 0) {
				matched.push(...hits);
				this._emit(
					'compare',
					`第 ${li + 1} 行（${lrow.join(', ')}）：在 ${rightName} 找到 ${hits.length} 条匹配 ✓。`,
					{ columns: [...allCols], rows: [...matched.map((r) => [...r])] },
					[],
					[
						{
							type: 'current',
							indices: matched.slice(-hits.length).map((_, i) => matched.length - hits.length + i)
						}
					],
					1
				);
			} else {
				unmatchedLeft.push(lrow);
				this._emit(
					'compare',
					`第 ${li + 1} 行（${lrow.join(', ')}）：在 ${rightName} 无匹配 ✗——左表行仍保留，右表列补 NULL。`,
					{ columns: [...allCols], rows: [...matched.map((r) => [...r])] },
					[],
					[],
					2
				);
			}
		}

		// 3. 补 NULL 形成完整结果
		const nulls = right.columns.map(() => null);
		const full: (string | number | null)[][] = [
			...matched.map((r) => [...r]),
			...unmatchedLeft.map((r) => [...r, ...nulls])
		];
		this._emit(
			'swap',
			`外连接结果：${leftName} 全部 ${left.rows.length} 行都在，${unmatchedLeft.length} 行无匹配补 NULL，共 ${full.length} 行。`,
			{ columns: [...allCols], rows: full.map((r) => r as (string | number)[]) },
			[],
			[{ type: 'current', indices: unmatchedLeft.length > 0 ? [matched.length] : [] }],
			2,
			`LEFT JOIN 的语义：以左表为基准，左表每一行都保留；右表匹配的行拼接在其后，无匹配则填 NULL。右连接（RIGHT JOIN）对称，全外连接（FULL JOIN）两边都保留。`
		);

		// 4. SELECT 投影
		const projIn = { columns: [...allCols], rows: full.map((r) => r as (string | number)[]) };
		const projected = this._project(projIn, selectCols);
		this._emit(
			'recurse-enter',
			`SELECT ${selectCols.join(', ')}：投影出需要的列。`,
			projected,
			[],
			[],
			3
		);

		// 5. complete
		this._emit(
			'complete',
			`查询完成，返回 ${projected.rows.length} 行结果。`,
			projected,
			[],
			[{ type: 'compare', indices: projected.rows.map((_, i) => i) }],
			4,
			`外连接的用途：找出「没有匹配」的行——例如统计未选课的学生、未发货的订单。NULL 行就是左表存在而右表缺失的数据。`
		);
	}

	// === UNION 模式 ===

	private _buildUnion(sql: string, tables: Record<string, SqlTable>): void {
		const um = sql.match(/^SELECT\s+([\s\S]+?)\s+UNION\s+(ALL\s+)?(SELECT[\s\S]+)$/i);
		if (!um) throw new Error('仅支持 SELECT ... UNION [ALL] SELECT ... 查询');
		const leftSql = `SELECT ${um[1].trim()}`;
		const rightSql = um[3].trim();
		const all = Boolean(um[2]);

		this.pseudocode = [
			`左查询：${leftSql}`,
			`右查询：${rightSql}`,
			`UNION${all ? ' ALL' : ''}：合并两个结果${all ? '' : '并去重'}`,
			`返回结果`
		];

		const run = (q: string): SqlTableData => {
			const sub = new SelectEngine();
			sub.init({ sql: q, tables });
			return sub.steps[sub.steps.length - 1]?.table ?? { columns: [], rows: [] };
		};

		// 1. 左查询
		const leftResult = run(leftSql);
		this._emit(
			'recurse-enter',
			`执行左查询：${leftSql}，返回 ${leftResult.rows.length} 行。`,
			leftResult,
			[],
			[{ type: 'compare', indices: leftResult.rows.map((_, i) => i) }],
			0
		);

		// 2. 右查询
		const rightResult = run(rightSql);
		this._emit(
			'recurse-enter',
			`执行右查询：${rightSql}，返回 ${rightResult.rows.length} 行。`,
			rightResult,
			[],
			[{ type: 'compare', indices: rightResult.rows.map((_, i) => i) }],
			1
		);

		// 3. 合并
		const cols = [...leftResult.columns];
		let merged: (string | number)[][] = [
			...leftResult.rows.map((r) => [...r]),
			...rightResult.rows.map((r) => [...r])
		];
		let desc: string;
		if (all) {
			desc = `UNION ALL 直接拼接：左 ${leftResult.rows.length} 行 + 右 ${rightResult.rows.length} 行 = ${merged.length} 行（不去重）。`;
		} else {
			const before = merged.length;
			const seen = new Set<string>();
			merged = merged.filter((r) => {
				const key = JSON.stringify(r);
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
			desc = `UNION 合并并去重：拼接 ${before} 行，消除重复行后剩余 ${merged.length} 行。`;
		}
		this._emit(
			'swap',
			desc,
			{ columns: cols, rows: merged.map((r) => [...r]) },
			[],
			[{ type: 'compare', indices: merged.map((_, i) => i) }],
			2,
			`UNION 要求两个查询的列数一致、语义对应。UNION 默认去重需要额外排序开销；确定无重复时用 UNION ALL 更高效。`
		);

		// 4. complete
		this._emit(
			'complete',
			`查询完成，返回 ${merged.length} 行结果。`,
			{ columns: cols, rows: merged.map((r) => [...r]) },
			[],
			[{ type: 'compare', indices: merged.map((_, i) => i) }],
			3
		);
	}

	// === EXISTS 模式 ===

	private _buildExists(sql: string, tables: Record<string, SqlTable>): void {
		const m = sql.match(
			/^SELECT\s+(.+?)\s+FROM\s+([\u4e00-\u9fa5\w]+)\s+WHERE\s+((NOT\s+)?EXISTS\s*\(\s*(SELECT[\s\S]+?)\s*\))\s*$/i
		);
		if (!m) throw new Error('仅支持 SELECT ... FROM 表 WHERE [NOT] EXISTS (SELECT ...) 查询');
		const selectCols = m[1]
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		const tableName = m[2];
		const notExists = Boolean(m[4]);
		const subSql = m[5].trim();

		const table = tables[tableName];
		if (!table) throw new Error(`表 ${tableName} 不存在`);

		this.pseudocode = [
			`SELECT ${selectCols.join(', ')} FROM ${tableName}`,
			`WHERE ${notExists ? 'NOT ' : ''}EXISTS (${subSql})：逐行执行相关子查询`,
			`子查询结果非空 → ${notExists ? '剔除' : '保留'}该行`,
			`SELECT 投影：输出 ${selectCols.join(', ')}`,
			`返回结果`
		];

		// 1. FROM 主表
		this._emit(
			'compare',
			`FROM ${tableName}：主表 ${table.rows.length} 条记录。EXISTS 是相关子查询——每一行都要执行一次子查询。`,
			table,
			[],
			[{ type: 'compare', indices: table.rows.map((_, i) => i) }],
			0
		);

		// 2. 逐行执行子查询
		const kept: (string | number)[][] = [];
		for (let i = 0; i < table.rows.length; i++) {
			const row = table.rows[i];
			const bound = this._bindSubquery(subSql, tableName, table, row);
			const nonEmpty = this._subqueryNonEmpty(bound, tables);
			const pass = notExists ? !nonEmpty : nonEmpty;
			if (pass) kept.push(row);
			this._emit(
				'compare',
				`第 ${i + 1} 行（${row.join(', ')}）：执行子查询 ${bound} → ${nonEmpty ? '非空' : '空'}，${pass ? '保留 ✓' : '剔除 ✗'}。`,
				{ columns: [...table.columns], rows: [...kept.map((r) => [...r])] },
				[],
				pass ? [{ type: 'current', indices: [kept.length - 1] }] : [],
				1
			);
		}
		this._emit(
			'recurse-exit',
			`EXISTS 判定完成：保留 ${kept.length} 行。`,
			{ columns: [...table.columns], rows: kept.map((r) => [...r]) },
			[],
			[{ type: 'compare', indices: kept.map((_, i) => i) }],
			2,
			`EXISTS 只关心子查询是否返回行，不关心返回什么列——子查询常写 SELECT 1 以节省开销。`
		);

		// 3. 投影
		const projected = this._project(
			{ columns: [...table.columns], rows: kept.map((r) => [...r]) },
			selectCols
		);
		this._emit(
			'recurse-enter',
			`SELECT ${selectCols.join(', ')}：投影出需要的列。`,
			projected,
			[],
			[],
			3
		);

		// 4. complete
		this._emit(
			'complete',
			`查询完成，返回 ${projected.rows.length} 行结果。`,
			projected,
			[],
			[{ type: 'compare', indices: projected.rows.map((_, i) => i) }],
			4,
			`EXISTS 与 IN 等价（EXISTS 处理 NULL 更稳）；NOT EXISTS 常用于「没有选课的学生」这类补集查询。`
		);
	}

	// === 工具 ===

	/** 把相关子查询里的 外层表.列 引用替换为当前行的字面值 */
	private _bindSubquery(
		subSql: string,
		outerTable: string,
		table: SqlTable,
		row: (string | number)[]
	): string {
		let bound = subSql;
		for (let ci = 0; ci < table.columns.length; ci++) {
			const col = table.columns[ci];
			const ref = new RegExp(`${outerTable}\\.${col}`, 'g');
			const val = typeof row[ci] === 'number' ? String(row[ci]) : `'${row[ci]}'`;
			bound = bound.replace(ref, val);
		}
		return bound;
	}

	/** 判定绑定后的子查询是否非空（SELECT 1 常量列不走 SelectEngine，直接对子查询表求 WHERE） */
	private _subqueryNonEmpty(boundSql: string, tables: Record<string, SqlTable>): boolean {
		const m = boundSql.match(
			/^SELECT\s+[\s\S]+?\s+FROM\s+([\u4e00-\u9fa5\w]+)(?:\s+WHERE\s+(.+))?$/i
		);
		if (!m) return false;
		const table = tables[m[1]];
		if (!table) return false;
		const where = m[2];
		if (!where) return table.rows.length > 0;
		const data: SqlTable = { columns: [...table.columns], rows: table.rows };
		const normed = where.replace(/([\u4e00-\u9fa5\w]+)\.([\u4e00-\u9fa5\w]+)/g, (whole, t, c) =>
			t === m[1] ? c : whole
		);
		return table.rows.some((row) => evalSqlWhere(normed, row, data));
	}

	private _colRef(ref: string, cols: string[], multi: boolean): string | null {
		if (ref.includes('.')) {
			const c = ref.split('.')[1];
			return cols.includes(c) ? (multi ? ref : c) : null;
		}
		return cols.includes(ref) ? ref : null;
	}

	/** 分组 + 聚合（同 SelectEngine 语义） */
	private _group(
		rows: (string | number)[][],
		tableCols: string[],
		groupCol: string,
		selectCols: string[]
	): SqlTableData {
		const gci = tableCols.indexOf(groupCol);
		const groups = new Map<string, (string | number)[][]>();
		for (const row of rows) {
			const key = String(row[gci]);
			const bucket = groups.get(key);
			if (bucket) bucket.push(row);
			else groups.set(key, [row]);
		}
		const aggCols = selectCols.filter((c) => AGG_RE.test(c));
		const columns = [groupCol, ...aggCols];
		const out: (string | number)[][] = [];
		for (const [key, bucket] of groups) {
			const vals: (string | number)[] = [key];
			for (const agg of aggCols) {
				const m = AGG_RE.exec(agg)!;
				const colName = m[2] === '*' ? '' : (m[2].split('.')[1] ?? m[2]);
				const ci = colName === '' ? -1 : tableCols.indexOf(colName);
				vals.push(this._aggValue(agg, bucket, ci));
			}
			out.push(vals);
		}
		return { columns, rows: out };
	}

	private _aggValue(agg: string, rows: (string | number)[][], ci: number): number {
		const [, fn, target] = agg.match(AGG_RE)!;
		if (fn.toUpperCase() === 'COUNT') return rows.length;
		const vals = rows
			.map((r) => (target === '*' ? NaN : parseFloat(String(r[ci]))))
			.filter((v) => !isNaN(v));
		if (vals.length === 0) return 0;
		switch (fn.toUpperCase()) {
			case 'SUM':
				return vals.reduce((a, b) => a + b, 0);
			case 'AVG':
				return vals.reduce((a, b) => a + b, 0) / vals.length;
			case 'MAX':
				return Math.max(...vals);
			case 'MIN':
				return Math.min(...vals);
		}
		return 0;
	}

	/** 投影（同 SelectEngine 语义，支持 * 与带表前缀引用、聚合表达式列名直通） */
	private _project(table: SqlTableData, cols: string[]): SqlTableData {
		if (cols.length === 1 && cols[0].toUpperCase() === '*') {
			return { columns: [...table.columns], rows: table.rows.map((r) => [...r]) };
		}
		const indices: number[] = [];
		for (const c of cols) {
			let col: string | null = AGG_RE.test(c)
				? c
				: table.columns.includes(c)
					? c
					: this._colRef(c.replace(/`|"|'/g, ''), table.columns, false);
			if (col === null) throw new Error(`列 ${c} 不存在`);
			const i = table.columns.indexOf(col);
			if (i < 0) throw new Error(`列 ${c} 不存在于当前结果`);
			indices.push(i);
		}
		return {
			columns: [...cols],
			rows: table.rows.map((r) => indices.map((i) => r[i]))
		};
	}

	// === 步骤生成 ===

	private _emit(
		type: StepType,
		description: string,
		table: SqlTableData,
		data: number[],
		highlights: Highlight[],
		pseudocodeLine: number,
		presenterNote?: string
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...data],
			highlights,
			pseudocodeLine,
			presenterNote,
			table: {
				columns: [...table.columns],
				rows: table.rows.map((r) => [...r])
			}
		});
	}

	getCurrentStep(): AlgorithmStep {
		return this.steps[Math.min(Math.floor(this.playbackPos), this.steps.length - 1)];
	}

	getProgress(): number {
		return this.playbackPos;
	}

	setProgress(pos: number): void {
		this.playbackPos = pos;
	}

	reset(): void {
		this.playbackPos = 0;
	}
}
