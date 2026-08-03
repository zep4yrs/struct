/**
 * CREATE TABLE 解析与校验 — 建表练习页的纯逻辑层。
 * 支持：列定义（名称、类型、主键/非空/唯一约束）、表级 FOREIGN KEY。
 */

export interface ColumnDef {
	name: string;
	type: string;
	primaryKey: boolean;
	notNull: boolean;
	unique: boolean;
}

export interface ForeignKeyDef {
	column: string;
	refTable: string;
	refColumn: string;
}

export interface CreateTableResult {
	tableName: string;
	columns: ColumnDef[];
	foreignKeys: ForeignKeyDef[];
}

export interface CreateTableError {
	message: string;
}

/** 支持的列类型（教材范围） */
const VALID_TYPES = [
	'INT',
	'INTEGER',
	'SMALLINT',
	'BIGINT',
	'VARCHAR',
	'CHAR',
	'TEXT',
	'DATE',
	'DATETIME',
	'DECIMAL',
	'FLOAT',
	'DOUBLE',
	'BOOLEAN'
];

/**
 * 解析一条 CREATE TABLE 语句。
 * 失败时抛出 CreateTableError（message 为教学化错误提示）。
 */
export function parseCreateTable(sql: string): CreateTableResult {
	const clean = sql
		.replace(/\s+/g, ' ')
		.replace(/;\s*$/, '')
		.trim();

	const m = clean.match(/^CREATE\s+TABLE\s+([^\s(]+)\s*\((.*)\)\s*$/is);
	if (!m) throw err('语句应以 CREATE TABLE 表名 (…) 开头');
	if (!m[1].trim()) throw err('缺少表名');

	const tableName = m[1].trim().replace(/`|"|'/g, '');
	const body = m[2].trim();
	if (!body) throw err('表定义不能为空');

	// 拆分顶层定义项（处理括号嵌套，如 VARCHAR(20)）
	const items = splitTopLevel(body, ',');
	if (items.length === 0) throw err('表定义不能为空');

	const columns: ColumnDef[] = [];
	const foreignKeys: ForeignKeyDef[] = [];

	for (const raw of items) {
		const item = raw.trim();
		if (!item) continue;

		// 表级外键：FOREIGN KEY (col) REFERENCES 表(col)
		const fkMatch = item.match(
			/^FOREIGN\s+KEY\s*\(\s*([^\s]+)\s*\)\s*REFERENCES\s+([^\s(]+)\s*\(\s*([^\s]+)\s*\)$/i
		);
		if (fkMatch) {
			foreignKeys.push({
				column: stripQuotes(fkMatch[1]),
				refTable: stripQuotes(fkMatch[2]),
				refColumn: stripQuotes(fkMatch[3])
			});
			continue;
		}

		// 列定义：名称 类型 [约束...]
		const colMatch = item.match(/^([^\s]+)\s+([^\s]+)(\s+.*)?$/);
		if (!colMatch) throw err(`无法识别的定义项：${item}`);
		const name = stripQuotes(colMatch[1]);
		const typeRaw = colMatch[2].toUpperCase();
		const typeBase = typeRaw.replace(/\(.*\)$/, '');
		const rest = (colMatch[3] ?? '').toUpperCase();

		if (!VALID_TYPES.includes(typeBase)) {
			throw err(`未知数据类型：${colMatch[2]}（支持 ${VALID_TYPES.join('/')} 等）`);
		}
		if (/^VARCHAR|CHAR$/.test(typeBase) && !/\((\d+)\)/.test(typeRaw)) {
			throw err(`${typeBase} 类型需要指定长度，如 ${typeBase}(20)`);
		}

		columns.push({
			name,
			type: typeRaw,
			primaryKey: /\bPRIMARY\s+KEY\b/.test(rest),
			notNull: /\bNOT\s+NULL\b/.test(rest),
			unique: /\bUNIQUE\b/.test(rest)
		});
	}

	if (columns.length === 0) throw err('至少需要一个列定义');

	const pkCount = columns.filter((c) => c.primaryKey).length;
	if (pkCount > 1) throw err('暂不支持复合主键：请只给一个列加 PRIMARY KEY');

	for (const fk of foreignKeys) {
		if (!columns.some((c) => c.name === fk.column)) {
			throw err(`外键列 ${fk.column} 不存在于本表中`);
		}
	}

	return { tableName, columns, foreignKeys };
}

function stripQuotes(s: string): string {
	return s.replace(/`|"|'/g, '');
}

function err(message: string): CreateTableError {
	return { message };
}

/** 按顶层逗号拆分（跳过括号内的逗号，如 VARCHAR(20) 或 (a, b)） */
function splitTopLevel(body: string, sep: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let current = '';
	for (const ch of body) {
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === sep && depth === 0) {
			out.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	if (current.trim()) out.push(current);
	return out;
}
