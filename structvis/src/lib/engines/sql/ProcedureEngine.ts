/**
 * 存储过程引擎 — ProcedureEngine
 *
 * 教学级存储过程模拟器：解析简化语法，逐步执行并展示调用栈、变量值与控制流。
 * 不支持完整 MySQL 语法，仅覆盖教学核心场景。
 *
 * 支持语法：
 *   CREATE PROCEDURE name(params)
 *   BEGIN
 *     DECLARE var INT DEFAULT 0;
 *     SET var = expr;
 *     SELECT col INTO var FROM table WHERE ...;
 *     IF cond THEN ... ELSEIF ... ELSE ... END IF;
 *     WHILE cond DO ... END WHILE;
 *     CALL inner_proc(args);
 *   END
 */

import type {
	DemoScriptItem,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';

/**
 * 安全算术表达式求值器 — 替代 new Function 动态执行。
 * 仅支持：数字（含小数）、变量名、+ - * / ( ) 与一元正负号。
 * 不支持函数调用、字符串字面量、逗号、成员访问等任何可执行构造。
 * 解析或求值失败返回 null（调用方回退原样文本）。
 */
function evalArithmeticSafe(
	expr: string,
	lookup: (name: string) => string | number | undefined
): number | null {
	const src = expr.trim();
	let pos = 0;

	function peek(): string {
		return src[pos] ?? '';
	}
	function next(): string {
		return src[pos++] ?? '';
	}
	function skipWs(): void {
		while (pos < src.length && /\s/.test(src[pos])) pos++;
	}
	function parseNumber(): number | null {
		const m = /^-?\d+(\.\d+)?/.exec(src.slice(pos));
		if (!m) return null;
		pos += m[0].length;
		return parseFloat(m[0]);
	}
	function parseIdent(): string | null {
		const m = /^[a-zA-Z_]\w*/.exec(src.slice(pos));
		if (!m) return null;
		pos += m[0].length;
		return m[0];
	}
	function parseFactor(): number | null {
		skipWs();
		const ch = peek();
		if (ch === '(') {
			next();
			const v = parseExpr();
			skipWs();
			if (v === null || peek() !== ')') return null;
			next();
			return v;
		}
		if (ch === '+' || ch === '-') {
			next();
			const v = parseFactor();
			return v === null ? null : ch === '-' ? -v : v;
		}
		if (/[0-9.]/.test(ch)) return parseNumber();
		const ident = parseIdent();
		if (ident !== null) {
			const raw = lookup(ident);
			if (raw === undefined) return null;
			const num = typeof raw === 'number' ? raw : Number(raw);
			return Number.isFinite(num) ? num : null;
		}
		return null;
	}
	function parseTerm(): number | null {
		let v = parseFactor();
		if (v === null) return null;
		for (;;) {
			skipWs();
			const ch = peek();
			if (ch !== '*' && ch !== '/') break;
			next();
			const rhs = parseFactor();
			if (rhs === null) return null;
			if (ch === '/') {
				if (rhs === 0) return null; // 除零视为非法，回退原样文本
				v = v / rhs;
			} else {
				v = v * rhs;
			}
		}
		return v;
	}
	function parseExpr(): number | null {
		let v = parseTerm();
		if (v === null) return null;
		for (;;) {
			skipWs();
			const ch = peek();
			if (ch !== '+' && ch !== '-') break;
			next();
			const rhs = parseTerm();
			if (rhs === null) return null;
			v = ch === '+' ? v + rhs : v - rhs;
		}
		return v;
	}

	const result = parseExpr();
	if (result === null) return null;
	skipWs();
	return pos === src.length ? result : null;
}

export type ProcedureInput = {
	name: string;
	params: { name: string; type: string }[];
	body: string;
	callArgs: (string | number)[];
};

interface ProcedureVar {
	name: string;
	type: string;
	value: string | number;
}

interface ProcedureFrame {
	procedureName: string;
	vars: Record<string, ProcedureVar>;
	programCounter: number;
	lines: string[];
	callStackText: string;
}

const PRESETS: {
	name: string;
	description: string;
	body: string;
	callArgs: (string | number)[];
}[] = [
	{
		name: '计算员工平均工资',
		description: 'DECLARE + SET + SELECT INTO + 简单算术',
		body: `DECLARE 总工资 INT DEFAULT 0;
DECLARE 平均工资 DECIMAL(10,2) DEFAULT 0;
DECLARE 人数 INT DEFAULT 0;

SELECT SUM(工资) INTO 总工资 FROM 员工;
SELECT COUNT(*) INTO 人数 FROM 员工;
SET 平均工资 = 总工资 / 人数;
SELECT 平均工资 AS 结果;`,
		callArgs: []
	},
	{
		name: '按职称分类涨工资',
		description: 'IF / ELSEIF / ELSE 分支 + 变量更新',
		body: `DECLARE 职称 VARCHAR(20) DEFAULT '工程师';
DECLARE 涨幅 INT DEFAULT 0;

SET 职称 = '高级工程师';

IF 职称 = '工程师' THEN
  SET 涨幅 = 500;
ELSEIF 职称 = '高级工程师' THEN
  SET 涨幅 = 800;
ELSE
  SET 涨幅 = 300;
END IF;

SELECT 职称, 涨幅 AS 涨工资额;`,
		callArgs: []
	},
	{
		name: '累加求 1~N 和',
		description: 'WHILE 循环 + 变量累加',
		body: `DECLARE N INT DEFAULT 5;
DECLARE i INT DEFAULT 1;
DECLARE 总和 INT DEFAULT 0;

WHILE i <= N DO
  SET 总和 = 总和 + i;
  SET i = i + 1;
END WHILE;

SELECT N, 总和 AS 结果;`,
		callArgs: []
	},
	{
		name: '内层过程调用',
		description: 'CALL 嵌套过程演示调用栈',
		body: `DECLARE x INT DEFAULT 10;
DECLARE y INT DEFAULT 20;
DECLARE 结果 INT DEFAULT 0;

SET 结果 = x + y;

CALL 打印结果(结果);

SELECT 结果 AS 最终值;`,
		callArgs: []
	}
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'DECLARE 语句的作用是什么？',
		options: ['声明局部变量', '给变量赋值', '调用存储过程', '定义游标'],
		correctAnswer: '声明局部变量',
		hint: 'DECLARE 在存储过程体内声明局部变量并可选指定默认值。',
		explanation:
			'DECLARE 用于在存储过程体内声明局部变量，必须放在过程体的开头（任何其他语句之前）。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: 'WHILE 循环在什么条件下继续执行？',
		options: ['条件为 TRUE', '条件为 FALSE', '循环次数固定', '直到 BREAK'],
		correctAnswer: '条件为 TRUE',
		hint: 'WHILE 先判断条件，为真时执行循环体。',
		explanation:
			'WHILE 循环在执行前先评估条件，只有条件为 TRUE 时才进入循环体；条件为 FALSE 时退出循环。'
	}
];

interface Stmt {
	type:
		| 'declare'
		| 'set'
		| 'selectInto'
		| 'if'
		| 'elseif'
		| 'else'
		| 'endif'
		| 'while'
		| 'endwhile'
		| 'call'
		| 'select';
	text: string;
	indent: number;
	branches?: string[][];
	condition?: string;
}

export class ProcedureEngine extends EngineBase<ProcedureInput> {
	readonly name = '存储过程';
	readonly renderType = 'pseudocode' as const;

	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;
	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'存储过程（Stored Procedure）是预编译的 SQL 语句集，带参数、变量、控制流，可重复调用。'
		},
		{
			type: 'compare',
			narration:
				'调用存储过程时，数据库执行过程体：先声明变量，再逐语句执行，分支和循环改变执行顺序。'
		},
		{
			type: 'complete',
			narration: '存储过程把业务逻辑封装在数据库层，减少网络往返，但调试比应用层代码复杂。'
		}
	];

	readonly presets: EnginePreset[] = PRESETS.map((p) => ({
		name: p.name,
		description: p.description
	}));

	init(input: ProcedureInput): void {
		this.pseudocode = input.body.split('\n').filter((l) => l.trim().length > 0);
		this._build(input);
	}

	applyPreset(name: string): void {
		const p = PRESETS.find((x) => x.name === name);
		if (!p) throw new Error(`未知预设：${name}`);
		this.init({
			name: p.name,
			params: [],
			body: p.body,
			callArgs: p.callArgs
		});
	}

	applyCustom(values: Record<string, string>): void {
		const body = (values.body ?? '').trim();
		if (!body) throw new Error('过程体不能为空');
		this.init({ name: '自定义', params: [], body, callArgs: [] });
	}

	private _build(input: ProcedureInput): void {
		this.steps = [];
		this._stepId = 0;
		const lines = input.body.split('\n').filter((l) => l.trim().length > 0);
		const parsed = this._parseBody(lines);

		const frame: ProcedureFrame = {
			procedureName: input.name,
			vars: {},
			programCounter: 0,
			lines,
			callStackText: input.name
		};

		const mkSnapshot = () =>
			Object.values(frame.vars)
				.map((v) => `${v.name} = ${v.value}`)
				.join('；');

		const mkCallStack = () => frame.callStackText;

		this._emit(
			'init',
			`调用存储过程 ${input.name}(${input.callArgs.join(', ')})。进入过程体，初始化局部变量。`,
			[],
			[],
			[],
			0
		);

		for (let i = 0; i < parsed.length; i++) {
			const stmt = parsed[i]!;
			const desc = this._executeStmt(frame, stmt, mkSnapshot);
			this._emit('compare', desc, [], [], [{ type: 'current', indices: [i] }], i + 1);
		}

		this._emit(
			'complete',
			`存储过程 ${input.name} 执行完毕。最终变量：${mkSnapshot()}。调用栈：${mkCallStack()}。`,
			[],
			[],
			[],
			parsed.length + 1
		);

		this.totalSteps = this.steps.length;
	}

	private _parseBody(lines: string[]): Stmt[] {
		const stmts: Stmt[] = [];
		for (const raw of lines) {
			const text = raw.trim();
			if (text.length === 0) continue;
			const indent = raw.length - raw.trimStart().length;
			const upper = text.toUpperCase();
			if (upper.startsWith('DECLARE')) {
				const m = text.match(
					/DECLARE\s+([^\s]+)\s+(INT|DECIMAL|VARCHAR\([^)]+\)|DATE)\s*(?:DEFAULT\s+(.+))?/i
				);
				stmts.push({
					type: 'declare',
					text,
					indent,
					branches: m ? [[m[1]!, m[2]!, m[3] ?? '']] : []
				});
			} else if (upper.startsWith('SET')) {
				const expr = text.replace(/^SET\s+/i, '').trim();
				stmts.push({ type: 'set', text, indent, branches: [[expr]] });
			} else if (upper.startsWith('SELECT') && upper.includes('INTO')) {
				const m = text.match(
					/SELECT\s+(.+?)\s+INTO\s+([^\s]+)\s+FROM\s+([^\s]+)(?:\s+WHERE\s+(.+))?/i
				);
				stmts.push({
					type: 'selectInto',
					text,
					indent,
					branches: m ? [[m[1]!, m[2]!, m[3]!, m[4] ?? '']] : []
				});
			} else if (upper.startsWith('IF')) {
				const cond = text
					.replace(/^IF\s+/i, '')
					.replace(/\s+THEN\s*$/i, '')
					.trim();
				stmts.push({ type: 'if', text, indent, condition: cond, branches: [[cond]] });
			} else if (upper.startsWith('ELSEIF')) {
				const cond = text
					.replace(/^ELSEIF\s+/i, '')
					.replace(/\s+THEN\s*$/i, '')
					.trim();
				stmts.push({ type: 'elseif', text, indent, condition: cond, branches: [[cond]] });
			} else if (upper === 'ELSE') {
				stmts.push({ type: 'else', text, indent, branches: [[]] });
			} else if (upper === 'END IF') {
				stmts.push({ type: 'endif', text, indent, branches: [[]] });
			} else if (upper.startsWith('WHILE')) {
				const cond = text
					.replace(/^WHILE\s+/i, '')
					.replace(/\s+DO\s*$/i, '')
					.trim();
				stmts.push({ type: 'while', text, indent, condition: cond, branches: [[cond]] });
			} else if (upper === 'END WHILE') {
				stmts.push({ type: 'endwhile', text, indent, branches: [[]] });
			} else if (upper.startsWith('CALL')) {
				const m = text.match(/CALL\s+([^\s(]+)(?:\(([^)]*)\))?/i);
				const args = m?.[2]?.split(',').map((s) => s.trim()) ?? [];
				stmts.push({ type: 'call', text, indent, branches: [args] });
			} else if (upper.startsWith('SELECT')) {
				const m = text.match(/SELECT\s+(.+?)\s+AS\s+(\S+)/i);
				stmts.push({
					type: 'select',
					text,
					indent,
					branches: m ? [[m[1]!, m[2]!]] : [[text]]
				});
			}
		}
		return stmts;
	}

	private _executeStmt(frame: ProcedureFrame, stmt: Stmt, mkSnapshot: () => string): string {
		switch (stmt.type) {
			case 'declare': {
				const parts = stmt.branches?.[0] ?? [];
				const [name, , defaultVal] = parts;
				const rawDefault = String(defaultVal ?? '')
					.trim()
					.replace(/;+$/, '');
				const cleanDefault = rawDefault.replace(/^['"]|['"]$/g, '');
				const n = parseFloat(cleanDefault);
				frame.vars[name!] = {
					name: name!,
					type: 'INT',
					value: !isNaN(n) && cleanDefault !== '' ? n : cleanDefault
				};
				return `DECLARE ${name} ${parts[1] ?? 'INT'}${rawDefault !== '' ? ` DEFAULT ${rawDefault}` : ''}。当前变量：${mkSnapshot()}`;
			}
			case 'set': {
				const expr = String(stmt.condition ?? '').trim();
				const m = expr.match(/^([^\s=]+)\s*=\s*(.+)$/);
				if (m) {
					const varName = m[1]!.trim();
					const valExpr = m[2]!.trim();
					const val = this._evalExpr(frame, valExpr);
					frame.vars[varName] = { name: varName, type: 'INT', value: val };
				}
				return `SET ${expr}。当前变量：${mkSnapshot()}`;
			}
			case 'selectInto': {
				const parts = stmt.branches?.[0] ?? [];
				const [col, varName] = parts;
				let val: string | number = 0;
				if (col === '工资' || col === '成绩' || col === '涨幅') val = 5000;
				else if (col === '总工资' || col === '结果' || col === '最终值') val = 100;
				else if (col === '人数' || col === 'N') val = 5;
				frame.vars[varName!] = { name: varName!, type: 'INT', value: val };
				return `SELECT ${col} INTO ${varName}。当前变量：${mkSnapshot()}`;
			}
			case 'if': {
				const cond = stmt.condition ?? '';
				const result = this._evalCondition(frame, cond);
				return `IF ${cond} THEN → 条件为 ${result ? 'TRUE' : 'FALSE'}。${result ? '执行 THEN 分支。' : '跳过 THEN 分支。'} 当前变量：${mkSnapshot()}`;
			}
			case 'elseif': {
				const cond = stmt.condition ?? '';
				const result = this._evalCondition(frame, cond);
				return `ELSEIF ${cond} THEN → 条件为 ${result ? 'TRUE' : 'FALSE'}。${result ? '执行 ELSEIF 分支。' : '跳过 ELSEIF 分支。'} 当前变量：${mkSnapshot()}`;
			}
			case 'else': {
				return `ELSE → 执行 ELSE 分支。当前变量：${mkSnapshot()}`;
			}
			case 'endif': {
				return `END IF → 条件分支结束。当前变量：${mkSnapshot()}`;
			}
			case 'while': {
				const cond = stmt.condition ?? '';
				const result = this._evalCondition(frame, cond);
				return `WHILE ${cond} DO → 条件为 ${result ? 'TRUE' : 'FALSE'}。${result ? '进入循环体。' : '退出循环。'} 当前变量：${mkSnapshot()}`;
			}
			case 'endwhile': {
				return `END WHILE → 循环结束。当前变量：${mkSnapshot()}`;
			}
			case 'call': {
				const args = stmt.branches?.[0] ?? [];
				const argStr = args.map((a) => String(this._evalExpr(frame, a))).join(', ');
				frame.callStackText += ` → ${stmt.text.replace(/^CALL\s+/i, '').split('(')[0]}`;
				return `CALL ${stmt.text.replace(/^CALL\s+/i, '')}(${argStr})。调用栈：${frame.callStackText}。当前变量：${mkSnapshot()}`;
			}
			case 'select': {
				const parts = stmt.branches?.[0] ?? [];
				return `SELECT ${parts.join(' ')}。当前变量：${mkSnapshot()}`;
			}
			default:
				return stmt.text;
		}
	}

	private _evalExpr(frame: ProcedureFrame, expr: string): string | number {
		const trimmed = expr.trim();
		if (/^['"]/.test(trimmed)) {
			return trimmed.replace(/^['"]|['"]$/g, '');
		}
		const n = parseFloat(trimmed);
		if (!isNaN(n) && /^-?\d+(\.\d+)?$/.test(trimmed)) return n;
		if (
			trimmed.includes('+') ||
			trimmed.includes('-') ||
			trimmed.includes('*') ||
			trimmed.includes('/')
		) {
			// 仅允许四则运算与变量引用；解析/求值失败回退原样文本（不再执行任意 JS）
			const result = evalArithmeticSafe(trimmed, (name) => {
				const v = frame.vars[name];
				return v !== undefined ? v.value : undefined;
			});
			return result !== null ? result : trimmed;
		}
		const v = frame.vars[trimmed];
		return v !== undefined ? v.value : trimmed;
	}

	private _evalCondition(frame: ProcedureFrame, cond: string): boolean {
		const m = cond.match(/^(.+?)\s*(=|!=|>|<|>=|<=)\s*(.+)$/);
		if (!m) return false;
		const left = this._evalExpr(frame, m[1]!.trim());
		const right = this._evalExpr(frame, m[3]!.trim());
		const op = m[2]!.trim();
		const ls = String(left);
		const rs = String(right);
		switch (op) {
			case '=':
				return ls === rs;
			case '!=':
				return ls !== rs;
			case '>':
				return Number(left) > Number(right);
			case '<':
				return Number(left) < Number(right);
			case '>=':
				return Number(left) >= Number(right);
			case '<=':
				return Number(left) <= Number(right);
			default:
				return false;
		}
	}

	private _emit(
		type: StepType,
		description: string,
		data: number[],
		highlights: Highlight[],
		extraHighlights: Highlight[],
		pseudocodeLine = 0
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data,
			highlights: [...highlights, ...extraHighlights],
			pseudocodeLine
		});
	}
}
