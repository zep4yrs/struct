import { describe, it, expect } from 'vitest';
import { ExplainEngine } from './ExplainEngine';
import type { SqlTableData } from '../algorithm/types';

const STUDENT: SqlTableData = {
	columns: ['学号', '姓名', '专业', '成绩'],
	rows: [
		[20101, '张三', '计算机', 88],
		[20102, '李四', '软件工程', 92],
		[20103, '王五', '计算机', 76],
		[20104, '赵六', '网络工程', 85],
		[20105, '孙七', '软件工程', 63]
	]
};

function lastStep(e: ExplainEngine) {
	return e.steps[e.steps.length - 1]!;
}

describe('ExplainEngine 执行计划与索引选择', () => {
	it('等值查询走索引：选择索引查找，返回命中行', () => {
		const e = new ExplainEngine();
		e.init({ sql: 'SELECT * FROM 学生 WHERE 学号 = 20103', table: STUDENT, indexedCols: ['学号'] });
		const last = lastStep(e);
		expect(last.description).toContain('索引查找');
		expect(last.table!.rows).toHaveLength(1);
		expect(last.table!.rows[0]![0]).toBe(20103);
	});

	it('范围查询走索引：命中多行', () => {
		const e = new ExplainEngine();
		e.init({ sql: 'SELECT * FROM 学生 WHERE 成绩 >= 85', table: STUDENT, indexedCols: ['成绩'] });
		const last = lastStep(e);
		expect(last.table!.rows).toHaveLength(3);
	});

	it('无索引列：全表扫描，结果正确', () => {
		const e = new ExplainEngine();
		e.init({ sql: "SELECT * FROM 学生 WHERE 专业 = '计算机'", table: STUDENT, indexedCols: ['学号'] });
		const last = lastStep(e);
		expect(last.description).toContain('全表扫描');
		expect(last.table!.rows).toHaveLength(2);
	});

	it('非法 SQL 抛错：无 WHERE / 列不存在', () => {
		const e = new ExplainEngine();
		expect(() => e.init({ sql: 'SELECT * FROM 学生', table: STUDENT, indexedCols: ['学号'] })).toThrow('WHERE');
		expect(() => e.init({ sql: 'SELECT * FROM 学生 WHERE 不存在列 = 1', table: STUDENT, indexedCols: ['学号'] })).toThrow('不存在');
	});
});
