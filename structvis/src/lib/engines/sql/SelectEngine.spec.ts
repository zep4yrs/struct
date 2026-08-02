import { describe, it, expect } from 'vitest';
import { SelectEngine, type SqlTable } from './SelectEngine';

const STUDENT_TABLE: SqlTable = {
	columns: ['学号', '姓名', '专业', '成绩'],
	rows: [
		[20101, '张三', '计算机', 88],
		[20102, '李四', '软件工程', 92],
		[20103, '王五', '计算机', 76],
		[20104, '赵六', '网络工程', 85],
		[20105, '孙七', '软件工程', 63],
		[20106, '周八', '计算机', 95]
	]
};

function run(sql: string) {
	const e = new SelectEngine();
	e.init({ sql, table: STUDENT_TABLE });
	return e.steps;
}

describe('SelectEngine', () => {
	it('WHERE + ORDER BY：筛选成绩 ≥ 85 并降序', () => {
		const steps = run('SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85 ORDER BY 成绩 DESC');
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([
			['周八', 95],
			['李四', 92],
			['张三', 88],
			['赵六', 85]
		]);
	});

	it('GROUP BY：按专业统计人数', () => {
		const steps = run('SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业');
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([
			['计算机', 3],
			['软件工程', 2],
			['网络工程', 1]
		]);
	});

	it('解析：SELECT * 全列投影', () => {
		const steps = run('SELECT * FROM 学生');
		const last = steps[steps.length - 1];
		expect(last.table?.rows.length).toBe(6);
		expect(last.table?.columns).toEqual(['学号', '姓名', '专业', '成绩']);
	});

	it('WHERE 逐行判定产生 current 高亮', () => {
		const steps = run('SELECT 姓名 FROM 学生 WHERE 成绩 >= 90');
		const hasCurrent = steps.some((s) => s.highlights.some((h) => h.type === 'current'));
		expect(hasCurrent).toBe(true);
	});
});
