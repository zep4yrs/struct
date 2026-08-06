import { describe, it, expect } from 'vitest';
import { ViewEngine, VIEW_PRESETS } from './ViewEngine';
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
	const e = new ViewEngine();
	e.init({ sql, tables: TABLES });
	return e;
}

describe('ViewEngine', () => {
	it('CREATE VIEW 解析：视图名与底层 SELECT 步骤', () => {
		const e = run(VIEW_PRESETS[0].sql);
		expect(e.steps.length).toBeGreaterThan(5);
		expect(e.steps[0].description).toContain('v_优秀成绩');
		expect(e.steps[1].description).toContain('视图');
	});

	it('首尾步骤：视图声明 → 基表 → 底层执行 → 视图完成 → 查询视图 → 基表更新 → complete', () => {
		const e = run(VIEW_PRESETS[0].sql);
		const types = e.steps.map((s) => s.type);
		expect(types[0]).toBe('init');
		expect(types[types.length - 1]).toBe('complete');
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('创建完成');
		expect(joined).toContain('查询视图');
		expect(joined).toContain('基表更新');
	});

	it('筛选视图：最终结果 = 成绩 ≥ 85 的行（含基表更新后的新行 20107）', () => {
		const e = run(VIEW_PRESETS[0].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows.length).toBe(5);
		expect(last?.rows.map((r) => r[0])).toContain(20107);
	});

	it('隐藏列视图：视图结果不含成绩列', () => {
		const e = run(VIEW_PRESETS[1].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.columns).toEqual(['学号', '姓名', '专业']);
	});

	it('聚合视图：按专业统计人数（4 组含新增行后 = 3 组 + 软件工程 +1）', () => {
		const e = run(VIEW_PRESETS[2].sql);
		const last = e.steps[e.steps.length - 1].table;
		const row = last?.rows.find((r) => r[0] === '软件工程');
		expect(row?.[1]).toBe(3);
	});

	it('连接视图：JOIN 结果随基表插入新行而更新', () => {
		const e = run(VIEW_PRESETS[3].sql);
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows.length).toBe(5);
	});

	it('非法语句报错：非 CREATE VIEW 或缺少 SELECT', () => {
		expect(() => run('SELECT * FROM 学生')).toThrow(/仅支持 CREATE VIEW/);
		expect(() => run('CREATE VIEW v1 AS DELETE FROM 学生')).toThrow(/仅支持 CREATE VIEW/);
	});

	it('伪代码/执行计划：视图声明 + 底层算子 + 视图访问', () => {
		const e = run(VIEW_PRESETS[0].sql);
		expect(e.pseudocode[0]).toContain('CREATE VIEW');
		expect(e.pseudocode[e.pseudocode.length - 1]).toContain('SELECT * FROM');
	});

	it('练习题库：3 题且 stepIndex 落在早期稳定步骤', () => {
		const e = run(VIEW_PRESETS[0].sql);
		expect(e.practiceQuestions.length).toBe(3);
		for (const q of e.practiceQuestions) {
			expect(q.stepIndex).toBeGreaterThanOrEqual(0);
			expect(q.stepIndex).toBeLessThan(4);
			expect(q.explanation.length).toBeGreaterThan(10);
		}
	});

	it('演示预设与自定义配置齐备', () => {
		const e = new ViewEngine();
		expect(e.presets.length).toBe(4);
		expect(e.customConfig.fields[0].key).toBe('sql');
	});

	it('getCurrentStep / setProgress / reset 契约', () => {
		const e = run(VIEW_PRESETS[0].sql);
		e.setProgress(2);
		expect(e.getProgress()).toBe(2);
		expect(e.getCurrentStep().id).toBe(2);
		e.reset();
		expect(e.getProgress()).toBe(0);
	});
});
