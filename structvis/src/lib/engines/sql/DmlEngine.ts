/**
 * 数据更新引擎 — DmlEngine
 *
 * 教材第 6 章：INSERT / UPDATE / DELETE 三种数据更新语句的分步执行可视化。
 * 步骤语义：
 * - init      当前表快照
 * - compare   逐行判定 WHERE 命中（current 高亮当前行）
 * - swap      应用变更后的表快照（新增行 / 修改行高亮）
 * - complete  更新完成
 * 右侧执行计划展示算子链：SCAN → FILTER(WHERE) → INSERT/UPDATE/DELETE。
 */

import type {
	AlgorithmStep,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import { evalSqlWhere } from './sql-utils';

export interface DmlEngineInput {
	sql: string;
	table: SqlTableData;
}

type DmlKind = 'insert' | 'update' | 'delete';

interface ParsedDml {
	kind: DmlKind;
	tableName: string;
	columns: string[];
	values: (string | number)[];
	setPairs: { col: string; value: string }[];
	where: string | null;
	operators: { label: string; line: string }[];
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'UPDATE 语句不带 WHERE 子句时会怎样？',
		options: ['更新表中所有行', '只更新第一行', '报语法错误', '不执行任何操作'],
		correctAnswer: '更新表中所有行',
		hint: 'WHERE 用于限定要更新的行',
		explanation:
			'UPDATE 的 WHERE 子句限定受影响的记录集；省略 WHERE 时作用于整个表的所有行，生产环境务必谨慎。'
	}
];

/** 演示数据预设（含 sql，供头部「演示数据」弹窗使用） */
export const DML_PRESETS: { name: string; description: string; sql: string }[] = [
	{
		name: '插入一条记录',
		description: 'INSERT 全列插入',
		sql: "INSERT INTO 学生 VALUES (20107, '吴九', '网络工程', 78)"
	},
	{
		name: '指定列插入',
		description: 'INSERT 指定列，其余列取默认值',
		sql: "INSERT INTO 学生 (学号, 姓名) VALUES (20108, '郑十')"
	},
	{
		name: '修改不及格成绩',
		description: 'UPDATE + WHERE 筛选后置 60',
		sql: 'UPDATE 学生 SET 成绩 = 60 WHERE 成绩 < 65'
	},
	{
		name: '批量修改',
		description: 'UPDATE 表达式更新：成绩 + 5',
		sql: "UPDATE 学生 SET 成绩 = 成绩 + 5 WHERE 专业 = '计算机'"
	},
	{
		name: '删除不及格记录',
		description: 'DELETE + WHERE 删除多行',
		sql: 'DELETE FROM 学生 WHERE 成绩 < 70'
	},
	{
		name: '删除指定学号',
		description: 'DELETE 按主键删除单行',
		sql: 'DELETE FROM 学生 WHERE 学号 = 20104'
	}
];

export class DmlEngine extends EngineBase<DmlEngineInput> {
	readonly name = '数据更新';
	readonly renderType = 'sql-table' as const;

	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	private _table: SqlTableData = { columns: [], rows: [] };

	presets: EnginePreset[] = DML_PRESETS.map((p) => ({ name: p.name, description: p.description }));

	customConfig: EngineCustomConfig = {
		title: '自定义更新语句',
		fields: [
			{
				key: 'sql',
				label: 'SQL 语句',
				type: 'textarea',
				placeholder: '例如：UPDATE 学生 SET 成绩 = 60 WHERE 成绩 < 65',
				default: 'UPDATE 学生 SET 成绩 = 60 WHERE 成绩 < 65'
			}
		]
	};

	applyPreset(name: string): void {
		const p = DML_PRESETS.find((x) => x.name === name);
		if (p) this.init({ sql: p.sql, table: this._table });
	}

	applyCustom(values: Record<string, string>): void {
		const sql = (values.sql ?? '').trim();
		if (sql.length === 0) throw new Error('SQL 不能为空');
		this.init({ sql, table: this._table });
	}

	init(input: DmlEngineInput): void {
		const { sql, table } = input;
		this._table = table;
		const q = this._parse(sql);
		this.pseudocode = q.operators.map((o) => o.line);

		this.steps = [];
		this._stepId = 0;

		const opIdx = (label: string) => {
			const i = q.operators.findIndex((o) => o.label === label);
			return i < 0 ? 0 : i;
		};
		const SCAN = opIdx('SCAN');
		const FILTER = opIdx('FILTER');
		const APPLY = opIdx('APPLY');

		const columns = [...table.columns];
		let rows = table.rows.map((r) => [...r]);

		this._emit('init', `执行更新语句：${sql}`, { columns, rows }, [], [], SCAN);

		if (q.kind === 'insert') {
			this._emit(
				'compare',
				`INSERT INTO ${q.tableName}：追加一行 ${q.values.join(' | ')}。`,
				{ columns, rows },
				[],
				[],
				FILTER
			);
			let newRow: (string | number)[];
			if (q.columns.length > 0) {
				newRow = columns.map(() => '');
				for (let k = 0; k < q.columns.length; k++) {
					const ci = columns.indexOf(q.columns[k]);
					if (ci < 0) throw new Error(`列 ${q.columns[k]} 不存在于表中`);
					newRow[ci] = q.values[k];
				}
			} else {
				if (q.values.length !== columns.length) {
					throw new Error(`VALUES 数量（${q.values.length}）与列数（${columns.length}）不匹配`);
				}
				newRow = [...q.values];
			}
			rows = [...rows, newRow];
			this._emit(
				'swap',
				`新记录已写入表尾（第 ${rows.length} 行）。`,
				{ columns, rows },
				[],
				[{ type: 'current', indices: [rows.length - 1] }],
				APPLY
			);
		} else if (q.kind === 'update') {
			const affected: number[] = [];
			for (let i = 0; i < rows.length; i++) {
				const pass = q.where === null || evalSqlWhere(q.where, rows[i], { columns, rows });
				this._emit(
					'compare',
					`第 ${i + 1} 行${pass ? '命中条件' : '不满足条件'}${q.where ? `（${q.where}）` : ''}${pass ? '，准备更新' : '，保留'}。`,
					{ columns, rows },
					[],
					pass ? [{ type: 'current', indices: [i] }] : [],
					FILTER
				);
				if (pass) affected.push(i);
			}
			for (const i of affected) {
				for (const { col, value } of q.setPairs) {
					const ci = columns.indexOf(col);
					if (ci < 0) continue;
					rows[i][ci] = this._coerce(value, rows[i][ci]);
				}
			}
			this._emit(
				'swap',
				`已更新 ${affected.length} 行：${q.setPairs.map((p) => `${p.col} = ${p.value}`).join('，')}。`,
				{ columns, rows },
				[],
				affected.map((i) => ({ type: 'current', indices: [i] })),
				APPLY
			);
		} else {
			const removed: number[] = [];
			let offset = 0;
			for (let i = 0; i < table.rows.length; i++) {
				const pass = q.where === null || evalSqlWhere(q.where, table.rows[i], table);
				this._emit(
					'compare',
					`第 ${i + 1} 行${pass ? '命中条件，准备删除 ✗' : '不满足条件，保留 ✓'}。`,
					{ columns, rows },
					[],
					pass ? [{ type: 'current', indices: [i - offset] }] : [],
					FILTER
				);
				if (pass) {
					rows.splice(i - offset, 1);
					removed.push(i);
					offset++;
				}
			}
			this._emit(
				'swap',
				`已删除 ${removed.length} 行，剩余 ${rows.length} 行。`,
				{ columns, rows },
				[],
				[],
				APPLY
			);
		}

		this._emit('complete', '数据更新完成。', { columns, rows }, [], [], APPLY);

		this.totalSteps = this.steps.length;
	}

	private _coerce(value: string, current: string | number): string | number {
		const num = parseFloat(value);
		if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(value.trim())) {
			return typeof current === 'number' ? num : value.trim();
		}
		return value.trim().replace(/^'|'$/g, '');
	}

	// === 迷你解析器 ===

	private _parse(sql: string): ParsedDml {
		const clean = sql.replace(/\s+/g, ' ').trim();

		// INSERT INTO 表 [(col1, col2)] VALUES (v1, v2)
		const im = clean.match(
			/^INSERT\s+INTO\s+([^\s(]+)\s*(?:\(([^)]*)\))?\s+VALUES\s*\((.+?)\)\s*;?$/i
		);
		if (im) {
			const columns = im[2]
				? im[2]
						.split(',')
						.map((s) => s.trim().replace(/`|"|'/g, ''))
						.filter(Boolean)
				: [];
			const values = im[3]
				.split(',')
				.map((s) => s.trim())
				.map((s) => this._coerce(s, 0));
			return {
				kind: 'insert',
				tableName: im[1],
				columns,
				values,
				setPairs: [],
				where: null,
				operators: [
					{ label: 'SCAN', line: `SCAN FROM ${im[1]}` },
					{ label: 'INSERT', line: `INSERT VALUES (${values.join(', ')})` }
				]
			};
		}

		// UPDATE 表 SET col = v [, col2 = v2] [WHERE cond]
		const um = clean.match(/^UPDATE\s+([^\s]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?\s*;?$/i);
		if (um) {
			const setPairs = um[2].split(',').map((p) => {
				const [col, val] = p.split('=').map((s) => s.trim());
				return { col: col.replace(/`|"|'/g, ''), value: val };
			});
			const where = um[3]?.trim() ?? null;
			const operators = [{ label: 'SCAN', line: `SCAN FROM ${um[1]}` }];
			if (where) operators.push({ label: 'FILTER', line: `FILTER ${where}` });
			operators.push({
				label: 'APPLY',
				line: `UPDATE SET ${setPairs.map((p) => `${p.col} = ${p.value}`).join(', ')}`
			});
			return {
				kind: 'update',
				tableName: um[1],
				columns: [],
				values: [],
				setPairs,
				where,
				operators
			};
		}

		// DELETE FROM 表 [WHERE cond]
		const dm = clean.match(/^DELETE\s+FROM\s+([^\s]+)(?:\s+WHERE\s+(.+))?\s*;?$/i);
		if (dm) {
			const where = dm[2]?.trim() ?? null;
			const operators = [{ label: 'SCAN', line: `SCAN FROM ${dm[1]}` }];
			if (where) operators.push({ label: 'FILTER', line: `FILTER ${where}` });
			operators.push({ label: 'APPLY', line: 'DELETE' });
			return {
				kind: 'delete',
				tableName: dm[1],
				columns: [],
				values: [],
				setPairs: [],
				where,
				operators
			};
		}

		throw new Error('仅支持 INSERT / UPDATE / DELETE 语句');
	}

	private _emit(
		type: StepType,
		description: string,
		table: SqlTableData,
		data: number[],
		extraHighlights: Highlight[],
		pseudocodeLine = 0
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data,
			highlights: extraHighlights,
			pseudocodeLine,
			table: {
				columns: [...table.columns],
				rows: table.rows.map((r) => [...r])
			}
		});
	}

}
