import { describe, it, expect } from 'vitest';
import { AdvancedQueryEngine, ADVANCED_PRESETS } from './AdvancedQueryEngine';
import type { SqlTable } from './SelectEngine';

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

const TABLES = { 学生: STUDENT_TABLE, 选课: SCORE_TABLE };

function run(sql: string) {
	const e = new AdvancedQueryEngine();
	e.init({ sql, tables: TABLES });
	return e;
}

describe('AdvancedQueryEngine', () => {
	it('模式 dispatch：HAVING / LEFT JOIN / UNION / EXISTS 分别命中', () => {
		expect(run(ADVANCED_PRESETS[0].sql).steps.length).toBeGreaterThan(3);
		expect(run(ADVANCED_PRESETS[2].sql).steps.length).toBeGreaterThan(3);
		expect(run(ADVANCED_PRESETS[3].sql).steps.length).toBeGreaterThan(3);
		expect(run(ADVANCED_PRESETS[4].sql).steps.length).toBeGreaterThan(3);
	});

	it('非法语句：不支持的关键字报错', () => {
		expect(() => run('SELECT 姓名 FROM 学生 WHERE 成绩 > 80 ORDER BY 成绩')).toThrow(
			'仅支持四类高级查询'
		);
	});

	it('契约：pseudocode / practiceQuestions / presets / customConfig / renderType', () => {
		const e = run(ADVANCED_PRESETS[0].sql);
		expect(e.renderType).toBe('sql-table');
		expect(e.name).toBe('高级查询');
		expect(e.pseudocode.length).toBeGreaterThanOrEqual(4);
		expect(e.practiceQuestions.length).toBe(4);
		expect(e.presets.map((p) => p.name)).toEqual(ADVANCED_PRESETS.map((p) => p.name));
		expect(e.customConfig.fields[0].key).toBe('sql');
		expect(e.getCurrentStep()).toBeDefined();
		e.setProgress(e.totalSteps - 1);
		expect(e.getProgress()).toBe(e.totalSteps - 1);
		e.reset();
		expect(e.getProgress()).toBe(0);
	});

	it('HAVING：首尾类型 init 前 compare / complete 收尾，含 WHERE→GROUP→HAVING 阶段链', () => {
		const e = run(ADVANCED_PRESETS[0].sql);
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(e.steps[0].type).toBe('compare');
		expect(e.steps[e.steps.length - 1].type).toBe('complete');
		expect(joined).toContain('GROUP BY');
		expect(joined).toContain('HAVING');
		expect(joined).toContain('投影');
	});

	it('HAVING：人数 ≥ 2 的专业 = 计算机(3) + 软件工程(2)，网络工程被剔除', () => {
		const e = run(ADVANCED_PRESETS[0].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.columns).toEqual(['专业', 'COUNT(*)']);
		expect(last?.rows.length).toBe(2);
		expect(last?.rows.find((r) => r[0] === '计算机')?.[1]).toBe(3);
		expect(last?.rows.find((r) => r[0] === '软件工程')?.[1]).toBe(2);
	});

	it('HAVING 平均分：≥ 80 的学号（20101 AVG 87.5、20102 95、20103 78、20105 60）', () => {
		const e = run(ADVANCED_PRESETS[1].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows.length).toBe(2);
		expect(last?.rows.map((r) => r[0]).sort()).toEqual(['20101', '20102']);
		expect(last?.rows.find((r) => r[0] === '20101')?.[1]).toBe(87.5);
	});

	it('HAVING 无 GROUP BY 报错', () => {
		expect(() => run('SELECT 专业 FROM 学生 HAVING COUNT(*) > 1')).toThrow(
			'HAVING 必须与 GROUP BY'
		);
	});

	it('LEFT JOIN：左表全部保留——6 名学生中 4 人有选课记录（5 行匹配）+ 2 人补 NULL', () => {
		const e = run(ADVANCED_PRESETS[2].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows.length).toBe(7);
		expect(last?.columns).toEqual(['学生.学号', '学生.姓名', '选课.课程号', '选课.成绩']);
		const nulls = last?.rows.filter((r) => r[2] === null);
		expect(nulls?.length).toBe(2);
		expect(nulls?.map((r) => r[0]).sort()).toEqual([20104, 20106]);
	});

	it('LEFT JOIN：无匹配行的步骤描述包含「补 NULL」', () => {
		const e = run(ADVANCED_PRESETS[2].sql);
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('无匹配');
		expect(joined).toContain('补 NULL');
	});

	it('UNION：合并两查询并去重——学生 ≥85 的 4 人与选课 ≥85 的 3 行去重后 4 人', () => {
		const e = run(ADVANCED_PRESETS[3].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.columns).toEqual(['学号']);
		expect(last?.rows.length).toBe(4);
		expect(last?.rows.map((r) => r[0]).sort()).toEqual([20101, 20102, 20104, 20106]);
	});

	it('UNION 步骤链：左查询 → 右查询 → 合并 → complete', () => {
		const e = run(ADVANCED_PRESETS[3].sql);
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('执行左查询');
		expect(joined).toContain('执行右查询');
		expect(joined).toContain('UNION 合并');
	});

	it('UNION ALL 不去重', () => {
		const e = run(
			'SELECT 学号 FROM 学生 WHERE 成绩 >= 85 UNION ALL SELECT 学号 FROM 选课 WHERE 成绩 >= 85'
		);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows.length).toBe(7);
	});

	it('EXISTS：选了课的学生 = 有选课记录的 4 人', () => {
		const e = run(ADVANCED_PRESETS[4].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.columns).toEqual(['学号', '姓名']);
		expect(last?.rows.length).toBe(4);
		expect(last?.rows.map((r) => r[0]).sort()).toEqual([20101, 20102, 20103, 20105]);
	});

	it('EXISTS：逐行执行相关子查询——每行都出现子查询执行描述', () => {
		const e = run(ADVANCED_PRESETS[4].sql);
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('执行子查询');
		expect(e.steps.filter((s) => s.description.includes('执行子查询')).length).toBe(6);
	});

	it('NOT EXISTS：未选课的学生 = 赵六(20104) + 周八(20106)', () => {
		const e = run(ADVANCED_PRESETS[5].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows.map((r) => r[0]).sort()).toEqual([20104, 20106]);
	});

	it('EXISTS 非法：EXISTS 外带其他条件不支持', () => {
		expect(() =>
			run('SELECT 学号 FROM 学生 WHERE 成绩 > 80 AND EXISTS (SELECT 1 FROM 选课)')
		).toThrow('仅支持 SELECT ... FROM 表 WHERE [NOT] EXISTS');
	});

	it('applyPreset / applyCustom：重建后步骤有效', () => {
		const e = new AdvancedQueryEngine();
		e.init({ sql: ADVANCED_PRESETS[0].sql, tables: TABLES });
		e.applyPreset('左连接保留全部学生');
		expect(e.steps.length).toBeGreaterThan(3);
		e.applyCustom({ sql: 'SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业 HAVING COUNT(*) >= 2' });
		expect(e.steps.length).toBeGreaterThan(3);
		expect(() => e.applyCustom({ sql: '' })).toThrow('SQL 不能为空');
		expect(() => e.applyCustom({ sql: 'SELECT 姓名 FROM 学生' })).toThrow('仅支持四类高级查询');
	});
});
