/**
 * SQL 基础查询引擎 — SelectEngine
 *
 * 按 SQL 逻辑执行顺序（FROM → WHERE → GROUP BY → SELECT → ORDER BY）
 * 分步执行一条 SELECT 查询，生成中间结果表关键帧。
 * data 快照为当前可见的原始行号集合；表格内容在 step.table 中。
 * 引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	Highlight,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';

export interface SqlTable {
	columns: string[];
	rows: (string | number)[][];
}

export interface SelectEngineInput {
	sql: string;
	table: SqlTable;
}

interface ParsedQuery {
	select: string[]; // 投影列
	from: string;
	where: string | null;
	groupBy: string | null;
	orderBy: { col: string; desc: boolean } | null;
	subclauses: { label: string; line: string }[]; // 伪代码展示顺序
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
	}
];

export class SelectEngine implements AlgorithmEngine<SelectEngineInput> {
	readonly name = 'SQL 基础查询';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = [];
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	private _stepId = 0;

	init(input: SelectEngineInput): void {
		const { sql, table } = input;
		const query = this._parse(sql);
		this.pseudocode = query.subclauses.map((s) => s.line);

		this.steps = [];
		this._stepId = 0;

		const allRows = table.rows.map((_, i) => i);
		this._currentRows = [...allRows];
		this._currentTable = { columns: [...table.columns], rows: table.rows.map((r) => [...r]) };

		this._emit('init', `执行查询：${sql}`, table, allRows, [], 0);

		// 1. FROM
		this._emit(
			'compare',
			`FROM ${query.from}：从表中读取全部 ${table.rows.length} 条记录。`,
			table,
			allRows,
			[{ type: 'compare', indices: allRows }],
			1
		);

		// 2. WHERE
		if (query.where) {
			const filtered: number[] = [];
			for (const idx of allRows) {
				const row = table.rows[idx];
				const pass = this._evalWhere(query.where, row, table);
				if (pass) filtered.push(idx);
				this._emit(
					'compare',
					`WHERE ${query.where}：第 ${idx + 1} 行${pass ? '满足条件 ✓' : '不满足条件 ✗'}。`,
					table,
					[...filtered, idx],
					pass ? [{ type: 'current' as const, indices: [idx] }] : [],
					2
				);
			}
			this._emit(
				'recurse-exit',
				`WHERE 筛选完成，剩余 ${filtered.length} 条记录。`,
				table,
				filtered,
				[{ type: 'compare', indices: filtered }],
				2
			);
			this._currentRows = filtered;
			this._currentTable = {
				columns: [...table.columns],
				rows: filtered.map((i) => table.rows[i].map((c) => c))
			};
		}

		// 3. GROUP BY
		if (query.groupBy) {
			const groups = this._group(table, this._currentRows, query.groupBy);
			this._emit(
				'recurse-enter',
				`GROUP BY ${query.groupBy}：按 ${query.groupBy} 分组，共 ${groups.rows.length} 组。`,
				groups,
				this._currentRows,
				[],
				3
			);
			this._currentTable = groups;
		}

		// 4. SELECT
		const projected = this._project(this._currentTable, query.select);
		this._emit(
			'recurse-enter',
			`SELECT ${query.select.join(', ')}：投影出需要的列。`,
			projected,
			this._currentRows,
			[],
			4
		);
		this._currentTable = projected;

		// 5. ORDER BY
		if (query.orderBy) {
			const sorted = this._sort(this._currentTable, query.orderBy);
			this._emit(
				'recurse-enter',
				`ORDER BY ${query.orderBy.col} ${query.orderBy.desc ? 'DESC' : 'ASC'}：对结果排序。`,
				sorted,
				this._currentRows,
				[],
				5
			);
			this._currentTable = sorted;
		}

		// 6. complete
		this._emit(
			'complete',
			`查询完成，返回 ${this._currentTable.rows.length} 行结果。`,
			this._currentTable,
			this._currentRows,
			[{ type: 'compare', indices: this._currentRows }],
			4
		);

		this.totalSteps = this.steps.length;
	}

	private _currentRows: number[] = [];
	private _currentTable: SqlTableData = { columns: [], rows: [] };

	// === SQL 迷你解析器 ===

	private _parse(sql: string): ParsedQuery {
		const clean = sql.replace(/\s+/g, ' ').trim();
		const sel = clean.match(/^SELECT\s+(.+?)\s+FROM\s+(.+)$/i);
		if (!sel) throw new Error('仅支持 SELECT ... FROM ... 查询');

		const selectPart = sel[1].replace(/,?\s*$/i, '');
		const select = selectPart
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		// 按"先切尾子句"的顺序解析：ORDER BY → GROUP BY → WHERE → FROM
		let body = sel[2];

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

		const from = body.trim();

		const subclauses: { label: string; line: string }[] = [
			{ label: 'SELECT', line: `SELECT ${selectPart}` },
			{ label: 'FROM', line: `FROM ${from}` }
		];
		if (where) subclauses.push({ label: 'WHERE', line: `WHERE ${where}` });
		if (groupBy) subclauses.push({ label: 'GROUP BY', line: `GROUP BY ${groupBy}` });
		subclauses.push({ label: 'SELECT', line: `SELECT ${selectPart}` });
		if (orderBy)
			subclauses.push({
				label: 'ORDER BY',
				line: `ORDER BY ${orderBy.col} ${orderBy.desc ? 'DESC' : 'ASC'}`
			});

		return { select, from, where, groupBy, orderBy, subclauses };
	}

	private _evalWhere(cond: string, row: (string | number)[], table: SqlTable): boolean {
		const parts = cond.split(/\s+AND\s+/i);
		return parts.every((p) => this._evalCond(p, row, table));
	}

	private _evalCond(cond: string, row: (string | number)[], table: SqlTable): boolean {
		const m = cond.match(/^\s*([^\s<>!=]+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+?)\s*$/i);
		if (!m) return false;
		const [, colRaw, op, valRaw] = m;
		const col = colRaw.replace(/`|"|'/g, '');
		const ci = table.columns.indexOf(col);
		if (ci < 0) return false;
		const cell = row[ci];
		const val = valRaw.replace(/^'|'$/g, '');
		const a = typeof cell === 'number' ? cell : parseFloat(String(cell));
		const b = parseFloat(val);
		if (isNaN(a) || isNaN(b)) {
			const sa = String(cell);
			const sb = String(val);
			switch (op) {
				case '=':
					return sa === sb;
				case '<>':
				case '!=':
					return sa !== sb;
				default:
					return false;
			}
		}
		switch (op) {
			case '>=':
				return a >= b;
			case '<=':
				return a <= b;
			case '>':
				return a > b;
			case '<':
				return a < b;
			case '=':
				return a === b;
			case '<>':
			case '!=':
				return a !== b;
		}
		return false;
	}

	private _group(table: SqlTable, rowIdx: number[], col: string): SqlTableData {
		const ci = table.columns.indexOf(col);
		const groups = new Map<string, number[]>();
		for (const idx of rowIdx) {
			const key = String(table.rows[idx][ci]);
			const bucket = groups.get(key);
			if (bucket) {
				bucket.push(idx);
			} else {
				groups.set(key, [idx]);
			}
		}
		const columns = [col, 'COUNT(*)'];
		const rows: (string | number)[][] = [];
		for (const [key, idxs] of groups) {
			rows.push([key, idxs.length]);
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
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...data],
			highlights,
			pseudocodeLine,
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
