import { describe, it, expect } from 'vitest';
import { parseCreateTable } from './create-table';

describe('parseCreateTable', () => {
	it('解析列定义与主键/非空/唯一约束', () => {
		const r = parseCreateTable(
			'CREATE TABLE 学生 (学号 INT PRIMARY KEY, 姓名 VARCHAR(20) NOT NULL, 邮箱 VARCHAR(50) UNIQUE)'
		);
		expect(r.tableName).toBe('学生');
		expect(r.columns).toHaveLength(3);
		expect(r.columns[0]).toMatchObject({ name: '学号', type: 'INT', primaryKey: true });
		expect(r.columns[1]).toMatchObject({ name: '姓名', notNull: true, primaryKey: false });
		expect(r.columns[2]).toMatchObject({ name: '邮箱', unique: true });
	});

	it('解析表级外键', () => {
		const r = parseCreateTable(
			'CREATE TABLE 选课 (学号 INT, 课程号 VARCHAR(10), FOREIGN KEY (学号) REFERENCES 学生(学号))'
		);
		expect(r.foreignKeys).toEqual([{ column: '学号', refTable: '学生', refColumn: '学号' }]);
	});

	it('多行语句（含换行与缩进）', () => {
		const r = parseCreateTable(`CREATE TABLE 课程 (
  课程号 VARCHAR(10) PRIMARY KEY,
  课程名 VARCHAR(30) NOT NULL
)`);
		expect(r.columns.map((c) => c.name)).toEqual(['课程号', '课程名']);
	});

	it('未知类型报错', () => {
		expect(() => parseCreateTable('CREATE TABLE t (a SUPERTYPE)')).toThrowError(/未知数据类型/);
	});

	it('VARCHAR 缺少长度报错', () => {
		expect(() => parseCreateTable('CREATE TABLE t (a VARCHAR)')).toThrowError(
			/VARCHAR 类型需要指定长度/
		);
	});

	it('复合主键报错', () => {
		expect(() =>
			parseCreateTable('CREATE TABLE t (a INT PRIMARY KEY, b INT PRIMARY KEY)')
		).toThrowError(/复合主键/);
	});

	it('外键列不存在报错', () => {
		expect(() =>
			parseCreateTable('CREATE TABLE t (a INT, FOREIGN KEY (b) REFERENCES s(c))')
		).toThrowError(/外键列 b 不存在/);
	});

	it('非 CREATE TABLE 语句报错', () => {
		expect(() => parseCreateTable('DROP TABLE t')).toThrowError(/CREATE TABLE/);
	});
});
