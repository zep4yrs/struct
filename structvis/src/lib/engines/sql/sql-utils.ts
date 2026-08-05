/**
 * SQL 条件求值工具 — 供 SelectEngine / DmlEngine 共用。
 * 支持比较（= <> < > <= >=）、LIKE（% _ 通配）、IN（值列表）、AND/OR 组合。
 */

import type { SqlTable } from './SelectEngine';

/** 求值一条 WHERE 条件（支持 AND / OR 组合） */
export function evalSqlWhere(cond: string, row: (string | number)[], table: SqlTable): boolean {
	const orParts = cond.split(/\s+OR\s+/i);
	return orParts.some((p) => p.split(/\s+AND\s+/i).every((c) => evalSqlCond(c.trim(), row, table)));
}

function evalSqlCond(cond: string, row: (string | number)[], table: SqlTable): boolean {
	// col IN (v1, v2, ...)
	const inMatch = cond.match(/^\s*([^\s]+)\s+IN\s*\(\s*(.+?)\s*\)\s*$/i);
	if (inMatch) {
		const col = inMatch[1].replace(/`|"|'/g, '');
		const ci = table.columns.indexOf(col);
		if (ci < 0) return false;
		const cell = String(row[ci]);
		const list = inMatch[2]
			.split(',')
			.map((s) => s.trim().replace(/^'|'$/g, ''))
			.map((s) => s.replace(/^"|"$/g, ''));
		return list.includes(cell);
	}

	// col LIKE pattern
	const likeMatch = cond.match(/^\s*([^\s]+)\s+LIKE\s+(.+?)\s*$/i);
	if (likeMatch) {
		const col = likeMatch[1].replace(/`|"|'/g, '');
		const ci = table.columns.indexOf(col);
		if (ci < 0) return false;
		const pattern = likeMatch[2].replace(/^'|'$/g, '');
		const escaped = pattern
			.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			.replace(/%/g, '.*')
			.replace(/_/g, '.');
		return new RegExp(`^${escaped}$`, 'i').test(String(row[ci]));
	}

	const m = cond.match(/^\s*([^\s<>!=]+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+?)\s*$/i);
	if (!m) return false;
	const [, colRaw, op, valRaw] = m;
	const col = colRaw.replace(/`|"|'/g, '');
	const ci = table.columns.indexOf(col);
	if (ci < 0) return false;
	const cell = row[ci];
	// 右侧可能是另一列（如 JOIN ON 学生.学号 = 选课.学号），也可能是字面值
	const valCol = table.columns.indexOf(valRaw.replace(/^'|'$/g, ''));
	const val: string | number = valCol >= 0 ? row[valCol] : valRaw.replace(/^'|'$/g, '');
	const a = typeof cell === 'number' ? cell : parseFloat(String(cell));
	const b = typeof val === 'number' ? val : parseFloat(String(val));
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
