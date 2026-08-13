import { describe, it, expect } from 'vitest';
import { WindowFunctionEngine, type WindowFunctionInput } from './WindowFunctionEngine';
import type { SqlTableData } from '../algorithm/types';

const STUDENT: SqlTableData = {
	columns: ['学号', '专业', '成绩'],
	rows: [
		[20101, '计算机', 88],
		[20102, '软件工程', 92],
		[20103, '计算机', 76],
		[20104, '网络工程', 85],
		[20105, '软件工程', 63]
	]
};

function run(sql: string): ReturnType<WindowFunctionEngine['getCurrentStep']> & { steps: number; last: ReturnType<WindowFunctionEngine['getCurrentStep']> } {
	const e = new WindowFunctionEngine();
	e.init({ sql, table: STUDENT });
	const last = e.steps[e.steps.length - 1];
	return { steps: e.totalSteps, last } as never;
}

describe('WindowFunctionEngine', () => {
	it('ROW_NUMBER：按专业分区、组内按成绩降序编号', () => {
		const e = new WindowFunctionEngine();
		e.init({
			sql: 'SELECT 学号, 专业, 成绩, ROW_NUMBER() OVER (PARTITION BY 专业 ORDER BY 成绩 DESC) AS 排名 FROM 学生',
			table: STUDENT
		});
		expect(e.totalSteps).toBeGreaterThan(3);
		const last = e.steps[e.steps.length - 1]!;
		const table = last.table!;
		expect(table.columns).toContain('排名');
		// 计算机组：88 → 1，76 → 2；软件工程组：92 → 1，63 → 2
		const byId = new Map(table.rows.map((r) => [r[0], r[3]]));
		expect(byId.get(20101)).toBe(1);
		expect(byId.get(20103)).toBe(2);
		expect(byId.get(20102)).toBe(1);
		expect(byId.get(20105)).toBe(2);
		expect(byId.get(20104)).toBe(1);
	});

	it('RANK：并列同名次且名次跳跃', () => {
		const table: SqlTableData = { columns: ['学号', '成绩'], rows: [[1, 90], [2, 90], [3, 80]] };
		const e = new WindowFunctionEngine();
		e.init({ sql: 'SELECT 学号, 成绩, RANK() OVER (ORDER BY 成绩 DESC) AS rk FROM t', table });
		const last = e.steps[e.steps.length - 1]!;
		const rk = new Map(last.table!.rows.map((r) => [r[0], r[2]]));
		expect(rk.get(1)).toBe(1);
		expect(rk.get(2)).toBe(1); // 并列
		expect(rk.get(3)).toBe(3); // 跳过 2
	});

	it('SUM：组内累计', () => {
		const e = new WindowFunctionEngine();
		e.init({ sql: 'SELECT 学号, 成绩, SUM(成绩) OVER (ORDER BY 学号) AS acc FROM t', table: { columns: ['学号', '成绩'], rows: [[1, 10], [2, 20], [3, 30]] } });
		const last = e.steps[e.steps.length - 1]!;
		const acc = last.table!.rows.map((r) => r[2]);
		expect(acc).toEqual([10, 30, 60]);
	});

	it('非法 SQL 抛错：未知函数/缺 FROM', () => {
		const e = new WindowFunctionEngine();
		expect(() => e.init({ sql: 'SELECT AVG(x) OVER () FROM t', table: STUDENT })).toThrow('仅支持');
		expect(() => e.init({ sql: 'SELECT ROW_NUMBER() OVER ()', table: STUDENT })).toThrow('FROM');
	});
});
