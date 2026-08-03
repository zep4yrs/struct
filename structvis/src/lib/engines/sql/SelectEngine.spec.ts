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

const COURSE_TABLE: SqlTable = {
	columns: ['课程号', '课程名', '学分'],
	rows: [
		['C001', '数据库原理', 4],
		['C002', '数据结构', 3],
		['C003', '计算机网络', 3]
	]
};

const SCORE_TABLE: SqlTable = {
	columns: ['学号', '课程号', '成绩'],
	rows: [
		[20101, 'C001', 90],
		[20101, 'C002', 85],
		[20102, 'C001', 95],
		[20103, 'C002', 78],
		[20105, 'C001', 60]
	]
};

const TABLES = { 学生: STUDENT_TABLE, 课程: COURSE_TABLE, 选课: SCORE_TABLE };

function run(sql: string) {
	const e = new SelectEngine();
	e.init({ sql, tables: TABLES });
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

	it('AND 组合条件', () => {
		const steps = run('SELECT 姓名 FROM 学生 WHERE 成绩 >= 80 AND 成绩 <= 95');
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([
			['张三'],
			['李四'],
			['赵六'],
			['周八']
		]);
	});

	it('OR 组合条件', () => {
		const steps = run("SELECT 姓名 FROM 学生 WHERE 专业 = '计算机' OR 成绩 >= 90");
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([['张三'], ['李四'], ['王五'], ['周八']]);
	});

	it('LIKE 模糊匹配（% 通配）', () => {
		const steps = run("SELECT 姓名 FROM 学生 WHERE 姓名 LIKE '张%'");
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([['张三']]);
	});

	it('IN 多值匹配', () => {
		const steps = run("SELECT 姓名 FROM 学生 WHERE 专业 IN ('计算机', '网络工程')");
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([['张三'], ['王五'], ['赵六'], ['周八']]);
	});

	it('GROUP BY 聚合：COUNT/MAX/MIN', () => {
		const steps = run('SELECT 专业, COUNT(*), MAX(成绩), MIN(成绩) FROM 学生 GROUP BY 专业');
		const last = steps[steps.length - 1];
		expect(last.table?.columns).toEqual(['专业', 'COUNT(*)', 'MAX(成绩)', 'MIN(成绩)']);
		expect(last.table?.rows).toEqual([
			['计算机', 3, 95, 76],
			['软件工程', 2, 92, 63],
			['网络工程', 1, 85, 85]
		]);
	});

	it('无 GROUP BY 的纯聚合', () => {
		const steps = run('SELECT COUNT(*), AVG(成绩) FROM 学生');
		const last = steps[steps.length - 1];
		expect(last.table?.rows[0][0]).toBe(6);
		expect(last.table?.rows[0][1]).toBeCloseTo(83.17, 2);
	});

	it('执行计划算子链', () => {
		const e = new SelectEngine();
		e.init({ sql: 'SELECT 姓名 FROM 学生 WHERE 成绩 >= 85', tables: TABLES });
		expect(e.pseudocode).toEqual([
			'SCAN FROM 学生',
			'FILTER 成绩 >= 85',
			'SELECT 姓名'
		]);
	});

	it('JOIN：两表连接查询（学生 ↔ 选课）', () => {
		const steps = run('SELECT 学生.姓名, 选课.成绩 FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号');
		const last = steps[steps.length - 1];
		expect(last.table?.columns).toEqual(['学生.姓名', '选课.成绩']);
		expect(last.table?.rows).toEqual([
			['张三', 90],
			['张三', 85],
			['李四', 95],
			['王五', 78],
			['孙七', 60]
		]);
	});

	it('JOIN：连接后的表带前缀列名', () => {
		const steps = run('SELECT * FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号');
		const last = steps[steps.length - 1];
		expect(last.table?.columns).toEqual(['学生.学号', '学生.姓名', '学生.专业', '学生.成绩', '选课.学号', '选课.课程号', '选课.成绩']);
		expect(last.table?.rows).toHaveLength(5);
	});

	it('JOIN + WHERE：连接后再筛选', () => {
		const steps = run(
			"SELECT 学生.姓名, 选课.成绩 FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号 WHERE 选课.成绩 >= 80"
		);
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([
			['张三', 90],
			['张三', 85],
			['李四', 95]
		]);
	});

	it('DISTINCT：去重', () => {
		const steps = run('SELECT DISTINCT 专业 FROM 学生');
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([['计算机'], ['软件工程'], ['网络工程']]);
	});

	it('LIMIT：限制返回行数', () => {
		const steps = run('SELECT 姓名 FROM 学生 LIMIT 2');
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([['张三'], ['李四']]);
	});

	it('ORDER BY + LIMIT 组合', () => {
		const steps = run('SELECT 姓名, 成绩 FROM 学生 ORDER BY 成绩 DESC LIMIT 3');
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([
			['周八', 95],
			['李四', 92],
			['张三', 88]
		]);
	});

	it('子查询：IN (SELECT ...)', () => {
		const steps = run(
			"SELECT 姓名 FROM 学生 WHERE 学号 IN (SELECT 学号 FROM 选课 WHERE 成绩 > 80)"
		);
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([['张三'], ['李四']]);
	});

	it('JOIN 算子链', () => {
		const e = new SelectEngine();
		e.init({
			sql: 'SELECT 学生.姓名 FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号',
			tables: TABLES
		});
		expect(e.pseudocode).toEqual([
			'SCAN FROM 学生',
			'SCAN FROM 选课',
			'JOIN ON 学生.学号 = 选课.学号',
			'SELECT 学生.姓名'
		]);
	});

	it('JOIN + GROUP BY：每人平均选课成绩', () => {
		const steps = run(
			'SELECT 学生.姓名, AVG(选课.成绩) FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号 GROUP BY 学生.姓名'
		);
		const last = steps[steps.length - 1];
		expect(last.table?.rows).toEqual([
			['张三', 87.5],
			['李四', 95],
			['王五', 78],
			['孙七', 60]
		]);
	});
});
