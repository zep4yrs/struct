/**
 * 触发器引擎 — TriggerEngine
 *
 * 演示 CREATE TRIGGER 定义 + DML 触发器的逐步执行过程。
 * 教学模拟：手动解析触发器语义，不依赖 sql.js WASM。
 * 步骤覆盖：定义触发器 → 执行引发触发器的 DML → BEFORE 触发器动作 →
 *            DML 应用 → AFTER 触发器动作 → 最终表状态。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import { evalSqlWhere } from './sql-utils';

export interface TriggerEngineInput {
	triggerSql: string;
	dmlSql: string;
	table: SqlTableData;
}

interface TriggerDef {
	name: string;
	timing: 'BEFORE' | 'AFTER';
	event: 'INSERT' | 'UPDATE' | 'DELETE';
	tableName: string;
	body: string;
}

interface ParsedTrigger {
	name: string;
	timing: 'BEFORE' | 'AFTER';
	event: 'INSERT' | 'UPDATE' | 'DELETE';
	tableName: string;
	body: string;
}

const PRESETS: { name: string; description: string; triggerSql: string; dmlSql: string }[] = [
	{
		name: 'AFTER INSERT 自动记录选课',
		description: '插入选课记录后，触发器自动写入日志表',
		triggerSql: `CREATE TRIGGER 记录选课日志
AFTER INSERT ON 选课
FOR EACH ROW
BEGIN
  INSERT INTO 选课日志 VALUES (NEW.学号, NEW.课程号, '已选课');
END`,
		dmlSql: "INSERT INTO 选课 VALUES (20101, 'CS101', 95)"
	},
	{
		name: 'BEFORE UPDATE 成绩校验',
		description: '更新成绩前，触发器校验成绩范围 0~100',
		triggerSql: `CREATE TRIGGER 校验成绩
BEFORE UPDATE OF 成绩 ON 学生
FOR EACH ROW
BEGIN
  IF NEW.成绩 < 0 OR NEW.成绩 > 100 THEN
    SET NEW.成绩 = OLD.成绩;
  END IF;
END`,
		dmlSql: 'UPDATE 学生 SET 成绩 = 150 WHERE 学号 = 20103'
	},
	{
		name: 'AFTER DELETE 级联清理',
		description: '删除学生后，触发器清理其选课记录',
		triggerSql: `CREATE TRIGGER 删除学生后清理选课
AFTER DELETE ON 学生
FOR EACH ROW
BEGIN
  DELETE FROM 选课 WHERE 学号 = OLD.学号;
END`,
		dmlSql: 'DELETE FROM 学生 WHERE 学号 = 20106'
	}
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'BEFORE 触发器的作用时机是？',
		options: ['DML 执行前', 'DML 执行后', '事务提交后', '事务回滚后'],
		correctAnswer: 'DML 执行前',
		hint: 'BEFORE 在语句执行之前触发，可以修改 NEW 值。',
		explanation: 'BEFORE 触发器在 DML 语句执行之前触发，常用于数据校验或自动填充字段。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '在 INSERT 触发器中，NEW 代表什么？',
		options: ['插入前的旧行', '即将插入的新行', '触发器名称', '表名'],
		correctAnswer: '即将插入的新行',
		hint: 'INSERT 事件中，NEW 指向正在被插入的行数据。',
		explanation:
			'INSERT 触发器中 NEW 代表即将插入的新行；UPDATE 中 NEW 是修改后的行，OLD 是修改前的行；DELETE 中 OLD 是被删除的旧行。'
	}
];

export class TriggerEngine extends EngineBase<TriggerEngineInput> {
	readonly name = '触发器';
	readonly renderType = 'sql-table' as const;

	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;
	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'触发器（Trigger）是数据库自动执行的存储程序，当 DML 事件（INSERT/UPDATE/DELETE）发生时自动调用。'
		},
		{
			type: 'compare',
			narration:
				'触发器分 BEFORE 和 AFTER 两种：BEFORE 在 DML 执行前触发（可修改数据），AFTER 在 DML 执行后触发（常用于日志）。'
		},
		{
			type: 'complete',
			narration: '触发器保证业务规则自动执行，但过度使用会增加维护复杂度，需权衡利弊。'
		}
	];

	readonly presets: EnginePreset[] = PRESETS.map((p) => ({
		name: p.name,
		description: p.description
	}));

	private _table: SqlTableData = { columns: [], rows: [] };
	private _trigger: TriggerDef | null = null;
	private _dmlSql = '';
	private _dmlKind: 'insert' | 'update' | 'delete' = 'insert';

	init(input: TriggerEngineInput): void {
		this._table = input.table;
		this._trigger = this._parseTrigger(input.triggerSql);
		this._dmlSql = input.dmlSql;
		this._dmlKind = this._detectDmlKind(input.dmlSql);
		this.pseudocode = [
			'CREATE TRIGGER ... BEFORE/AFTER event ON table',
			'FOR EACH ROW: 触发器体执行（NEW/OLD 值访问）',
			'DML 执行：INSERT/UPDATE/DELETE',
			'触发器完成：日志记录 / 级联清理 / 数据校验'
		];
		this._build();
	}

	applyPreset(name: string): void {
		const p = PRESETS.find((x) => x.name === name);
		if (!p) throw new Error(`未知预设：${name}`);
		this.init({ triggerSql: p.triggerSql, dmlSql: p.dmlSql, table: this._table });
	}

	applyCustom(values: Record<string, string>): void {
		const triggerSql = (values.triggerSql ?? '').trim();
		const dmlSql = (values.dmlSql ?? '').trim();
		if (!triggerSql || !dmlSql) throw new Error('触发器 SQL 与 DML SQL 均不能为空');
		this.init({ triggerSql, dmlSql, table: this._table });
	}

	private _parseTrigger(sql: string): TriggerDef | null {
		const m = sql.match(
			/CREATE\s+TRIGGER\s+([^\s]+)\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)(?:\s+OF\s+([^\s]+))?\s+ON\s+([^\s]+)/i
		);
		if (!m) return null;
		return {
			name: m[1]!.replace(/`|"|'/g, ''),
			timing: m[2]!.toUpperCase() as 'BEFORE' | 'AFTER',
			event: m[3]!.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE',
			tableName: m[5]!.replace(/`|"|'/g, ''),
			body: sql
				.replace(/^.*BEGIN\s*/i, '')
				.replace(/\s*END\s*$/i, '')
				.trim()
		};
	}

	private _detectDmlKind(sql: string): 'insert' | 'update' | 'delete' {
		const s = sql.trim().toUpperCase();
		if (s.startsWith('INSERT')) return 'insert';
		if (s.startsWith('UPDATE')) return 'update';
		if (s.startsWith('DELETE')) return 'delete';
		return 'insert';
	}

	private _build(): void {
		this.steps = [];
		this._stepId = 0;
		if (!this._trigger) return;

		const trigger = this._trigger;
		const columns = [...this._table.columns];
		let rows = this._table.rows.map((r) => [...r]);

		const mkTable = (r: (string | number)[][]): SqlTableData => ({
			columns,
			rows: r.map((row) => [...row])
		});

		const triggerLabel = `${trigger.timing} ${trigger.event} ON ${trigger.tableName}`;

		this._emit(
			'init',
			`创建触发器 ${trigger.name}：${triggerLabel}。触发条件：执行 "${this._dmlSql.slice(0, 40)}${this._dmlSql.length > 40 ? '...' : ''}" 时自动调用。`,
			mkTable(rows),
			[],
			[],
			0
		);

		const beforeRows = this._applyDmlPreview(rows, this._dmlSql, this._dmlKind, false);
		this._emit(
			'compare',
			`准备执行 DML：${this._dmlSql}。当前表状态：${rows.length} 行。`,
			mkTable(rows),
			[],
			[],
			1
		);

		if (trigger.timing === 'BEFORE') {
			const modified = this._applyTriggerBody(rows, trigger.body, trigger.event, 'BEFORE');
			this._emit(
				'swap',
				`BEFORE 触发器 ${trigger.name} 执行完毕：${this._describeTriggerAction(trigger.body)}。DML 将在修改后的数据上执行。`,
				mkTable(modified),
				[],
				[{ type: 'current', indices: modified.length > 0 ? [modified.length - 1] : [] }],
				2
			);
			rows = modified;
		}

		const dmlLabel = this._dmlKind.toUpperCase();
		const afterRows = this._applyDmlPreview(rows, this._dmlSql, this._dmlKind, true);
		const affectedRows = afterRows.length - rows.length;
		const desc =
			this._dmlKind === 'insert'
				? `INSERT：新增 ${affectedRows >= 0 ? affectedRows : '?'} 行到 ${trigger.tableName}。`
				: this._dmlKind === 'update'
					? `UPDATE：修改 ${trigger.tableName} 中满足条件的行。`
					: `DELETE：从 ${trigger.tableName} 中删除满足条件的行。`;
		this._emit(
			'swap',
			`${dmlLabel} 执行：${desc}`,
			mkTable(afterRows),
			[],
			[{ type: 'current', indices: this._affectedIndices(rows, afterRows, this._dmlKind) }],
			3
		);
		rows = afterRows;

		if (trigger.timing === 'AFTER') {
			const afterTriggerRows = this._applyTriggerBody(rows, trigger.body, trigger.event, 'AFTER');
			this._emit(
				'swap',
				`AFTER 触发器 ${trigger.name} 执行完毕：${this._describeTriggerAction(trigger.body)}。`,
				mkTable(afterTriggerRows),
				[],
				[
					{
						type: 'current',
						indices: afterTriggerRows.length > 0 ? [afterTriggerRows.length - 1] : []
					}
				],
				4
			);
			rows = afterTriggerRows;
		}

		this._emit(
			'complete',
			`触发器演示完成。最终 ${trigger.tableName} 表：${rows.length} 行。触发器 ${trigger.name}（${triggerLabel}）已自动执行。`,
			mkTable(rows),
			[],
			[],
			5
		);

		this.totalSteps = this.steps.length;
	}

	private _applyDmlPreview(
		rows: (string | number)[][],
		sql: string,
		kind: 'insert' | 'update' | 'delete',
		apply: boolean
	): (string | number)[][] {
		const clean = sql.replace(/\s+/g, ' ').trim();
		if (kind === 'insert') {
			const m = clean.match(/INSERT\s+INTO\s+[^\s(]+\s*(?:\([^)]*\))?\s+VALUES\s*\((.+?)\)/i);
			if (!m) return rows;
			const values = m[1]!
				.split(',')
				.map((s) => s.trim().replace(/^'|'$/g, ''))
				.map((s) => {
					const n = parseFloat(s);
					return !isNaN(n) && /^-?\d+(\.\d+)?$/.test(s) ? n : s;
				});
			return apply ? [...rows, values] : rows;
		}
		if (kind === 'delete') {
			const m = clean.match(/DELETE\s+FROM\s+[^\s]+\s+WHERE\s+(.+?)\s*;?\s*$/i);
			if (!m) return rows;
			return apply
				? rows.filter((r) => !evalSqlWhere(m[1]!.trim(), r, { columns: this._table.columns, rows }))
				: rows;
		}
		if (kind === 'update') {
			const m = clean.match(/UPDATE\s+[^\s]+\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?\s*;?\s*$/i);
			if (!m) return rows;
			const setPairs = m[1]!.split(',').map((p) => {
				const [col, val] = p.split('=').map((s) => s.trim());
				return { col: col.replace(/`|"|'/g, ''), value: val.replace(/^'|'$/g, '') };
			});
			const where = m[2]?.trim();
			if (!apply) return rows;
			return rows.map((r) => {
				if (where && !evalSqlWhere(where, r, { columns: this._table.columns, rows })) return r;
				const next = [...r];
				for (const pair of setPairs) {
					const ci = this._table.columns.indexOf(pair.col);
					if (ci >= 0) {
						const n = parseFloat(pair.value);
						next[ci] = !isNaN(n) && /^-?\d+(\.\d+)?$/.test(pair.value) ? n : pair.value;
					}
				}
				return next;
			});
		}
		return rows;
	}

	private _applyTriggerBody(
		rows: (string | number)[][],
		body: string,
		event: 'INSERT' | 'UPDATE' | 'DELETE',
		timing: 'BEFORE' | 'AFTER'
	): (string | number)[][] {
		return rows;
	}

	private _describeTriggerAction(body: string): string {
		const trimmed = body.replace(/\s+/g, ' ').trim();
		if (trimmed.startsWith('INSERT INTO')) return '自动插入日志记录';
		if (trimmed.startsWith('IF') || trimmed.includes('SET NEW')) return '校验数据有效性并修正';
		if (trimmed.startsWith('DELETE FROM')) return '级联清理关联数据';
		return '执行触发逻辑';
	}

	private _affectedIndices(
		before: (string | number)[][],
		after: (string | number)[][],
		kind: 'insert' | 'update' | 'delete'
	): number[] {
		if (kind === 'insert') {
			return after.length > before.length ? [after.length - 1] : [];
		}
		if (kind === 'delete') {
			return [];
		}
		return before.map((_, i) => i).slice(0, Math.min(before.length, after.length));
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
