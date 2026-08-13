/**
 * MySQL 数据查询引擎 — SelectEngine
 *
 * 按 SQL 逻辑执行顺序（FROM → JOIN → WHERE → GROUP BY → SELECT → DISTINCT → ORDER BY → LIMIT）
 * 分步执行一条 SELECT 查询，生成中间结果表关键帧。
 * 支持：单表 / 多表 JOIN（ON 条件，逐对判定）、LIKE / IN / OR / AND、聚合函数（COUNT/SUM/AVG/MAX/MIN）、
 *       子查询（IN (SELECT ...)）、DISTINCT、LIMIT。
 * data 快照为当前可见行的行号集合；表格内容在 step.table 中。引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import { evalSqlWhere } from './sql-utils';

export interface SqlTable {
	columns: string[];
	rows: (string | number)[][];
}

export interface SelectEngineInput {
	sql: string;
	/** 表名 → 表数据（多表查询时传入所有涉及的表） */
	tables: Record<string, SqlTable>;
}

/** 聚合函数正则：COUNT/SUM/AVG/MAX/MIN(col) 或 COUNT(*)，col 可带表名前缀 */
export const AGG_RE =
	/^(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*(\*|[\u4e00-\u9fa5\w]+(?:\.[\u4e00-\u9fa5\w]+)*)\s*\)$/i;

interface ParsedQuery {
	distinct: boolean;
	select: string[];
	fromTables: string[];
	joinOns: string[];
	where: string | null;
	groupBy: string | null;
	orderBy: { col: string; desc: boolean } | null;
	limit: number | null;
	operators: { label: string; line: string }[];
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'WHERE 子句的作用是？',
		options: ['对行进行筛选', '对列进行投影', '对结果排序', '对结果分组'],
		correctAnswer: '对行进行筛选',
		hint: 'WHERE 在 FROM 之后执行，逐行判断条件',
		explanation: 'WHERE 子句逐行检查条件，只保留满足条件的行。它作用在行（记录）上，不改变列。'
	},
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'INNER JOIN ON 子句的作用是？',
		options: ['指定两表的连接条件', '指定返回列', '对结果排序', '限制返回行数'],
		correctAnswer: '指定两表的连接条件',
		hint: 'ON 后面的等式决定哪些行对匹配',
		explanation:
			'JOIN 把两张表按 ON 条件逐对匹配：只有满足条件的行对才会进入结果集，不匹配的行被丢弃。'
	}
];

/** 演示数据预设（含 sql，供头部「演示数据」弹窗使用） */
export const SELECT_PRESETS: { name: string; description: string; sql: string }[] = [
	{
		name: '筛选成绩 ≥ 85',
		description: 'WHERE 比较筛选 + 降序排序',
		sql: 'SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85 ORDER BY 成绩 DESC'
	},
	{
		name: '按专业统计人数',
		description: 'GROUP BY 分组 + COUNT 聚合',
		sql: 'SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业'
	},
	{
		name: '计算机专业学生',
		description: '等值条件筛选',
		sql: "SELECT * FROM 学生 WHERE 专业 = '计算机'"
	},
	{
		name: '成绩 80–95',
		description: 'AND 组合区间条件',
		sql: 'SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 80 AND 成绩 <= 95'
	},
	{
		name: '模糊查询姓「张」',
		description: 'LIKE 通配符匹配',
		sql: "SELECT 姓名, 专业 FROM 学生 WHERE 姓名 LIKE '张%'"
	},
	{
		name: '多值匹配 IN',
		description: 'IN 列表匹配',
		sql: "SELECT 姓名, 专业, 成绩 FROM 学生 WHERE 专业 IN ('计算机', '软件工程')"
	},
	{
		name: '分组统计最值',
		description: 'GROUP BY + MAX / MIN',
		sql: 'SELECT 专业, COUNT(*), MAX(成绩), MIN(成绩) FROM 学生 GROUP BY 专业'
	},
	{
		name: '全表聚合',
		description: 'COUNT / AVG 聚合整表',
		sql: 'SELECT COUNT(*), AVG(成绩) FROM 学生'
	},
	{
		name: '连接查询：学生选课成绩',
		description: '两表 INNER JOIN 按学号匹配',
		sql: 'SELECT 学生.姓名, 选课.成绩 FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号'
	},
	{
		name: '连接 + 筛选',
		description: 'JOIN 后按成绩过滤',
		sql: 'SELECT 学生.姓名, 选课.成绩 FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号 WHERE 选课.成绩 >= 80'
	},
	{
		name: '去重查询 DISTINCT',
		description: '消除重复行',
		sql: 'SELECT DISTINCT 专业 FROM 学生'
	},
	{
		name: '前 N 行 LIMIT',
		description: 'ORDER BY + LIMIT 取前 3',
		sql: 'SELECT 姓名, 成绩 FROM 学生 ORDER BY 成绩 DESC LIMIT 3'
	},
	{
		name: '子查询 IN',
		description: 'IN (SELECT ...) 嵌套查询',
		sql: 'SELECT 姓名 FROM 学生 WHERE 学号 IN (SELECT 学号 FROM 选课 WHERE 成绩 > 80)'
	}
];

export class SelectEngine extends EngineBase<SelectEngineInput> {
	readonly name = 'MySQL 数据查询';
	readonly renderType = 'sql-table' as const;

	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'compare',
			narration: '扫描 / 条件判定：逐行处理，判断是否满足条件。匹配的行保留，不匹配的剔除。'
		},
		{
			type: 'recurse-exit',
			narration: '当前阶段完成，结果集合变小/变形，进入到下一个 SQL 执行阶段。'
		},
		{
			type: 'recurse-enter',
			narration: '进入下一个执行阶段：分组、投影、去重、排序或截断，逐步逼近最终结果。'
		},
		{
			type: 'complete',
			narration:
				'查询执行完毕。SELECT 按 FROM → WHERE → GROUP BY → SELECT 投影 → DISTINCT → ORDER BY → LIMIT 的顺序执行。'
		}
	];

	private _tables: Record<string, SqlTable> = {};

	presets: EnginePreset[] = SELECT_PRESETS.map((p) => ({
		name: p.name,
		description: p.description
	}));

	customConfig: EngineCustomConfig = {
		title: '自定义查询',
		fields: [
			{
				key: 'sql',
				label: 'SQL 语句',
				type: 'textarea',
				placeholder: '例如：SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85',
				default: 'SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85'
			}
		]
	};

	applyPreset(name: string): void {
		const p = SELECT_PRESETS.find((x) => x.name === name);
		if (p) this.init({ sql: p.sql, tables: this._tables });
	}

	applyCustom(values: Record<string, string>): void {
		const sql = (values.sql ?? '').trim();
		if (sql.length === 0) throw new Error('SQL 不能为空');
		this.init({ sql, tables: this._tables });
	}

	init(input: SelectEngineInput): void {
		const { sql, tables } = input;
		this._tables = tables;
		// 先展开子查询（IN (SELECT ...) → IN (v1, v2, ...)）
		const expanded = this._expandSubqueries(sql, tables);
		const query = this._parse(expanded);
		this.pseudocode = query.operators.map((o) => o.line);

		this.steps = [];
		this._stepId = 0;

		const multi = query.fromTables.length > 1;
		const tableCols = query.fromTables.map((t) => tables[t].columns);

		// 列引用 → 结果表列名（多表统一带表名前缀）
		const colRef = (ref: string): string | null => {
			if (ref.includes('.')) {
				const [t, c] = ref.split('.');
				const ti = query.fromTables.indexOf(t);
				if (ti < 0) return null;
				const ci = tableCols[ti].indexOf(c);
				if (ci < 0) return null;
				return multi ? `${t}.${c}` : c;
			}
			let found: string | null = null;
			for (let ti = 0; ti < query.fromTables.length; ti++) {
				if (tableCols[ti].includes(ref)) {
					found = multi ? `${query.fromTables[ti]}.${ref}` : ref;
					break;
				}
			}
			return found;
		};

		// 规范化条件文本中的 表.列 引用
		const normCond = (text: string): string =>
			text.replace(/([\u4e00-\u9fa5\w]+)\.([\u4e00-\u9fa5\w]+)/g, (whole, t, c) =>
				query.fromTables.includes(t) ? (colRef(`${t}.${c}`) ?? whole) : whole
			);

		const opIdx = (label: string) => {
			const i = query.operators.findIndex((o) => o.label === label);
			return i < 0 ? 0 : i;
		};
		const SCAN = opIdx('SCAN');
		const JOIN_OP = opIdx('JOIN');
		const FILTER = opIdx('FILTER');
		const GROUP = opIdx('GROUP');
		const PROJECT = opIdx('PROJECT');
		const ORDER = opIdx('ORDER');
		const LIMIT = opIdx('LIMIT');

		// === 1. 读表 + JOIN ===
		let resultCols: string[];
		let resultRows: (string | number)[][];

		if (!multi) {
			const t = query.fromTables[0];
			resultCols = [...tables[t].columns];
			resultRows = tables[t].rows.map((r) => [...r]);
			this._emit(
				'compare',
				`FROM ${t}：从表中读取全部 ${resultRows.length} 条记录。`,
				{ columns: resultCols, rows: resultRows },
				[],
				[{ type: 'compare', indices: resultRows.map((_, i) => i) }],
				SCAN,
				`第一步 FROM：读取 ${t} 表的全部 ${resultRows.length} 条记录。这一步不筛选，只是把数据取出来。`
			);
		} else {
			// 每张表 SCAN 步骤
			for (const [ti, t] of query.fromTables.entries()) {
				this._emit(
					'compare',
					`FROM ${t}：读取 ${tables[t].rows.length} 条记录，参与连接。`,
					{ columns: tables[t].columns, rows: tables[t].rows.map((r) => [...r]) },
					[],
					[],
					SCAN + ti
				);
			}

			// 笛卡尔积展开
			const combos: (string | number)[][] = [[]];
			for (const t of query.fromTables) {
				const rows = tables[t].rows;
				const next: (string | number)[][] = [];
				for (const prefix of combos) {
					for (const r of rows) next.push([...prefix, ...r]);
				}
				combos.length = 0;
				combos.push(...next);
			}
			const resultColsRaw = query.fromTables.flatMap((t) =>
				tables[t].columns.map((c) => (multi ? `${t}.${c}` : c))
			);

			// 逐个组合判定 ON 条件
			const tableRowCounts = query.fromTables.map((t) => tables[t].rows.length);
			const tableStrides = query.fromTables.map((_, ti) =>
				tableRowCounts.slice(ti + 1).reduce((a, b) => a * b, 1)
			);
			const matched: (string | number)[][] = [];
			for (let i = 0; i < combos.length; i++) {
				const combo = combos[i];
				let pass = true;
				let condText = '';
				for (const on of query.joinOns) {
					condText = normCond(on);
					if (!evalSqlWhere(condText, combo, { columns: resultColsRaw, rows: [combo] })) {
						pass = false;
						break;
					}
				}
				if (pass) matched.push(combo);
				const describe = query.fromTables
					.map((t, ti) => `${t}[${Math.floor(i / tableStrides[ti]) % tableRowCounts[ti]}]`)
					.join(' ↔ ');
				this._emit(
					'compare',
					`第 ${i + 1} 对组合：${describe}${query.joinOns.length > 0 ? `，判定 ${condText}` : ''}：${pass ? '匹配 ✓ 加入结果' : '不匹配 ✗'}。`,
					{ columns: resultColsRaw, rows: [...matched] },
					[],
					pass ? [{ type: 'current', indices: [matched.length - 1] }] : [],
					JOIN_OP
				);
			}
			resultCols = resultColsRaw;
			resultRows = matched;
		}

		let current: SqlTableData = { columns: resultCols, rows: resultRows.map((r) => [...r]) };

		// === 2. WHERE ===
		if (query.where) {
			const whereNorm = normCond(query.where);
			const filtered: (string | number)[][] = [];
			for (let i = 0; i < current.rows.length; i++) {
				const row = current.rows[i];
				const pass = evalSqlWhere(whereNorm, row, current);
				if (pass) filtered.push(row);
				this._emit(
					'compare',
					`WHERE ${query.where}：第 ${i + 1} 行${pass ? '满足条件 ✓' : '不满足条件 ✗'}。`,
					current,
					[],
					pass ? [{ type: 'current', indices: [i] }] : [],
					FILTER
				);
			}
			this._emit(
				'recurse-exit',
				`WHERE 筛选完成，剩余 ${filtered.length} 条记录。`,
				{ columns: current.columns, rows: filtered },
				[],
				[{ type: 'compare', indices: filtered.map((_, i) => i) }],
				FILTER,
				`WHERE 过滤结束：只有满足条件的 ${filtered.length} 行保留下来，其余被剔除。`
			);
			current = { columns: [...current.columns], rows: filtered.map((r) => [...r]) };
		}

		// === 3. GROUP BY / 纯聚合 ===
		if (query.groupBy) {
			const groupCol = colRef(query.groupBy);
			if (groupCol) {
				const groups = this._group(current, groupCol, query.select, colRef);
				this._emit(
					'recurse-enter',
					`GROUP BY ${query.groupBy}：按 ${groupCol} 分组，共 ${groups.rows.length} 组。`,
					groups,
					[],
					[],
					GROUP
				);
				current = groups;
			}
		} else if (query.select.some((c) => AGG_RE.test(c))) {
			const aggTable = this._aggregate(current, query.select, colRef);
			this._emit(
				'recurse-enter',
				`聚合计算：对 ${query.select.join(', ')} 汇总。`,
				aggTable,
				[],
				[],
				GROUP
			);
			current = aggTable;
		}

		// === 4. SELECT（投影）===
		let projected: SqlTableData;
		if (query.select.length === 1 && query.select[0].toUpperCase() === '*') {
			projected = { columns: [...current.columns], rows: current.rows.map((r) => [...r]) };
		} else {
			const normCols: (string | null)[] = query.select.map((c) =>
				AGG_RE.test(c) ? c : colRef(c.replace(/`|"|'/g, ''))
			);
			const bad = normCols.findIndex((c) => c === null);
			if (bad >= 0) throw new Error(`列 ${query.select[bad]} 不存在`);
			const indices = normCols.map((c) =>
				AGG_RE.test(c!) ? current.columns.indexOf(c!) : current.columns.indexOf(c!)
			);
			if (indices.some((i) => i < 0)) {
				throw new Error(`列 ${query.select[indices.indexOf(-1)]} 不存在于当前结果`);
			}
			projected = {
				columns: [...normCols.map((c) => c!)],
				rows: current.rows.map((r) => indices.map((i) => r[i]))
			};
		}
		this._emit(
			'recurse-enter',
			`SELECT ${query.distinct ? 'DISTINCT ' : ''}${query.select.join(', ')}：投影出需要的列。`,
			projected,
			[],
			[],
			PROJECT,
			`SELECT 投影：把需要的列 ${query.select.join(', ')} 提取出来，表结构只剩这些字段。`
		);
		current = projected;

		// === 5. DISTINCT 去重 ===
		if (query.distinct) {
			const seen = new Set<string>();
			const unique = current.rows.filter((r) => {
				const key = JSON.stringify(r);
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
			this._emit(
				'recurse-enter',
				`DISTINCT 去重：去除重复行，剩余 ${unique.length} 行。`,
				{ columns: current.columns, rows: unique },
				[],
				[],
				PROJECT
			);
			current = { columns: [...current.columns], rows: unique };
		}

		// === 6. ORDER BY ===
		if (query.orderBy) {
			const sortCol = colRef(query.orderBy.col);
			if (sortCol) {
				const sorted = this._sort(current, { col: sortCol, desc: query.orderBy.desc });
				this._emit(
					'recurse-enter',
					`ORDER BY ${query.orderBy.col} ${query.orderBy.desc ? 'DESC' : 'ASC'}：对结果排序。`,
					sorted,
					[],
					[],
					ORDER,
					`ORDER BY 排序：按 ${query.orderBy.col} ${query.orderBy.desc ? '降序' : '升序'}排列结果行——SQL 执行顺序中，排序发生在投影之后。`
				);
				current = sorted;
			}
		}

		// === 7. LIMIT ===
		if (query.limit !== null) {
			const limited = {
				columns: [...current.columns],
				rows: current.rows.slice(0, query.limit).map((r) => [...r])
			};
			this._emit(
				'recurse-enter',
				`LIMIT ${query.limit}：只返回前 ${Math.min(query.limit, current.rows.length)} 行。`,
				limited,
				[],
				[],
				LIMIT
			);
			current = limited;
		}

		// === 8. complete ===
		this._emit(
			'complete',
			`查询完成，返回 ${current.rows.length} 行结果。`,
			current,
			[],
			[{ type: 'compare', indices: current.rows.map((_, i) => i) }],
			PROJECT,
			`查询执行完毕。记住 SELECT 的执行顺序：FROM → WHERE → GROUP BY → SELECT → DISTINCT → ORDER BY → LIMIT。`
		);

		this.totalSteps = this.steps.length;
	}

	// === 子查询展开 ===

	private _expandSubqueries(sql: string, tables: Record<string, SqlTable>): string {
		const re = /\bIN\s*\(\s*(SELECT[\s\S]*?)\s*\)/i;
		let prev: string;
		do {
			prev = sql;
			sql = sql.replace(re, (whole, sub: string) => {
				const subEngine = new SelectEngine();
				subEngine.init({ sql: sub.trim(), tables });
				const last = subEngine.steps[subEngine.steps.length - 1];
				const values = (last.table?.rows ?? [])
					.map((r) => r[0])
					.map((v) => (typeof v === 'number' ? String(v) : `'${v}'`));
				return `IN (${values.join(', ')})`;
			});
		} while (sql !== prev);
		return sql;
	}

	// === SQL 迷你解析器 ===

	private _parse(sql: string): ParsedQuery {
		const clean = sql.replace(/\s+/g, ' ').trim();
		const sel = clean.match(/^SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+(.+)$/i);
		if (!sel) throw new Error('仅支持 SELECT ... FROM ... 查询');

		const distinct = Boolean(sel[1]);
		const selectPart = sel[2].replace(/,?\s*$/i, '').replace(/\s+DISTINCT\s+$/i, '');
		const select = selectPart
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		// 按"先切尾子句"的顺序解析：LIMIT → ORDER BY → GROUP BY → WHERE → FROM
		let body = sel[3];

		let limit: number | null = null;
		const lm = body.match(/\s+LIMIT\s+(\d+)\s*$/i);
		if (lm) {
			limit = parseInt(lm[1], 10);
			body = body.slice(0, lm.index).trim();
		}

		let orderBy: { col: string; desc: boolean } | null = null;
		const om = body.match(/\s+ORDER\s+BY\s+([^\s]+)(\s+(DESC|ASC))?$/i);
		if (om) {
			orderBy = { col: om[1], desc: (om[3] ?? '').toUpperCase() === 'DESC' };
			body = body.slice(0, om.index).trim();
		}

		let groupBy: string | null = null;
		const gm = body.match(/\s+GROUP\s+BY\s+([^\s]+)$/i);
		if (gm) {
			groupBy = gm[1];
			body = body.slice(0, gm.index).trim();
		}

		let where: string | null = null;
		const wm = body.match(/\s+WHERE\s+(.+)$/i);
		if (wm) {
			where = wm[1].trim();
			body = body.slice(0, wm.index).trim();
		}

		const fromClause = body.trim();

		// FROM 解析：逗号连接 或 JOIN ... ON ...
		let fromTables: string[];
		const joinOns: string[] = [];
		if (fromClause.includes(',')) {
			fromTables = fromClause.split(',').map((s) => s.trim().replace(/`|"|'/g, ''));
		} else {
			const tokens = fromClause.split(/\s+/);
			fromTables = [tokens[0].replace(/`|"|'/g, '')];
			let i = 1;
			while (i < tokens.length) {
				const tok = tokens[i].toUpperCase();
				if (tok === 'JOIN') {
					fromTables.push(tokens[i + 1].replace(/`|"|'/g, ''));
					i += 2;
				} else if (tok === 'ON') {
					const rest = tokens.slice(i + 1);
					const ji = rest.findIndex((t) => t.toUpperCase() === 'JOIN');
					const onPart = (ji >= 0 ? rest.slice(0, ji) : rest).join(' ');
					joinOns.push(onPart);
					i += 1 + (ji >= 0 ? ji : rest.length);
				} else {
					i++;
				}
			}
		}

		// 执行计划算子链
		const operators: { label: string; line: string }[] = [];
		for (const t of fromTables) operators.push({ label: 'SCAN', line: `SCAN FROM ${t}` });
		for (const on of joinOns) operators.push({ label: 'JOIN', line: `JOIN ON ${on}` });
		if (where) operators.push({ label: 'FILTER', line: `FILTER ${where}` });
		if (groupBy) operators.push({ label: 'GROUP', line: `GROUP BY ${groupBy}` });
		else if (select.some((c) => AGG_RE.test(c)))
			operators.push({
				label: 'GROUP',
				line: `AGG ${select.filter((c) => AGG_RE.test(c)).join(', ')}`
			});
		operators.push({ label: 'PROJECT', line: `SELECT ${selectPart}` });
		if (orderBy)
			operators.push({
				label: 'ORDER',
				line: `ORDER BY ${orderBy.col} ${orderBy.desc ? 'DESC' : 'ASC'}`
			});
		if (limit !== null) operators.push({ label: 'LIMIT', line: `LIMIT ${limit}` });

		return { distinct, select, fromTables, joinOns, where, groupBy, orderBy, limit, operators };
	}

	// === 聚合 ===

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

	private _aggregate(
		table: SqlTableData,
		selectCols: string[],
		colRef: (ref: string) => string | null
	): SqlTableData {
		const columns: string[] = [];
		const values: number[] = [];
		for (const c of selectCols) {
			if (!AGG_RE.test(c)) continue;
			const m = AGG_RE.exec(c)!;
			const colName = colRef(m[2]);
			const ci = colName ? table.columns.indexOf(colName) : -1;
			columns.push(c);
			values.push(this._aggValue(c, table.rows, ci));
		}
		return { columns, rows: [values] };
	}

	private _group(
		table: SqlTableData,
		groupCol: string,
		selectCols: string[],
		colRef: (ref: string) => string | null
	): SqlTableData {
		const ci = table.columns.indexOf(groupCol);
		const groups = new Map<string, (string | number)[][]>();
		for (const row of table.rows) {
			const key = String(row[ci]);
			const bucket = groups.get(key);
			if (bucket) bucket.push(row);
			else groups.set(key, [row]);
		}
		const aggCols = selectCols.filter((c) => AGG_RE.test(c));
		const columns = [groupCol, ...aggCols];
		const rows: (string | number)[][] = [];
		for (const [key, bucket] of groups) {
			const rowVals: (string | number)[] = [key];
			for (const agg of aggCols) {
				const m = AGG_RE.exec(agg)!;
				const colName = colRef(m[2]);
				const aggCi = colName ? table.columns.indexOf(colName) : -1;
				rowVals.push(this._aggValue(agg, bucket, aggCi));
			}
			rows.push(rowVals);
		}
		return { columns, rows };
	}

	private _project(table: SqlTableData, cols: string[]): SqlTableData {
		if (cols.length === 1 && cols[0].toUpperCase() === '*') return table;
		const indices: number[] = [];
		for (const c of cols) {
			const i = table.columns.indexOf(c);
			indices.push(i < 0 ? -1 : i);
		}
		const rows = table.rows.map((r) => indices.map((i) => (i < 0 ? '' : r[i])));
		return { columns: [...cols], rows };
	}

	private _sort(table: SqlTableData, order: { col: string; desc: boolean }): SqlTableData {
		const ci = table.columns.indexOf(order.col);
		const rows = [...table.rows];
		rows.sort((a, b) => {
			const x = typeof a[ci] === 'number' ? (a[ci] as number) : parseFloat(String(a[ci]));
			const y = typeof b[ci] === 'number' ? (b[ci] as number) : parseFloat(String(b[ci]));
			const cmp = isNaN(x) || isNaN(y) ? String(a[ci]).localeCompare(String(b[ci])) : x - y;
			return order.desc ? -cmp : cmp;
		});
		return { columns: [...table.columns], rows };
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

}
