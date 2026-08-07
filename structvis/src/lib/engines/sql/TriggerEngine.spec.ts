import { describe, it, expect, beforeEach } from 'vitest';
import { TriggerEngine } from './TriggerEngine';

const STUDENT_TABLE = {
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

function createEngine(triggerSql: string, dmlSql: string): TriggerEngine {
	const e = new TriggerEngine();
	e.init({ triggerSql, dmlSql, table: STUDENT_TABLE });
	return e;
}

describe('TriggerEngine', () => {
	it('AFTER INSERT 触发器：步骤链正确', () => {
		const e = createEngine(
			`CREATE TRIGGER 记录选课日志 AFTER INSERT ON 选课 FOR EACH ROW BEGIN INSERT INTO 选课日志 VALUES (NEW.学号, NEW.课程号, '已选课'); END`,
			"INSERT INTO 选课 VALUES (20101, 'CS101', 95)"
		);
		expect(e.totalSteps).toBeGreaterThanOrEqual(4);
		expect(e.steps[0].type).toBe('init');
		expect(e.steps[e.steps.length - 1].type).toBe('complete');
	});

	it('BEFORE UPDATE 触发器：校验成绩范围', () => {
		const e = createEngine(
			`CREATE TRIGGER 校验成绩 BEFORE UPDATE OF 成绩 ON 学生 FOR EACH ROW BEGIN IF NEW.成绩 < 0 OR NEW.成绩 > 100 THEN SET NEW.成绩 = OLD.成绩; END IF; END`,
			'UPDATE 学生 SET 成绩 = 150 WHERE 学号 = 20103'
		);
		expect(e.totalSteps).toBeGreaterThanOrEqual(4);
		const step1 = e.steps[1];
		expect(step1.description).toContain('准备执行');
	});

	it('AFTER DELETE 触发器：级联清理', () => {
		const e = createEngine(
			`CREATE TRIGGER 删除学生后清理选课 AFTER DELETE ON 学生 FOR EACH ROW BEGIN DELETE FROM 选课 WHERE 学号 = OLD.学号; END`,
			'DELETE FROM 学生 WHERE 学号 = 20106'
		);
		expect(e.totalSteps).toBeGreaterThanOrEqual(4);
	});

	it('applyPreset 重建步骤', () => {
		const e = createEngine('', '');
		e.applyPreset('AFTER INSERT 自动记录选课');
		expect(e.totalSteps).toBeGreaterThanOrEqual(4);
	});

	it('applyCustom 切换触发器与 DML', () => {
		const e = createEngine('', '');
		e.applyCustom({
			triggerSql: `CREATE TRIGGER t AFTER INSERT ON 选课 FOR EACH ROW BEGIN INSERT INTO 日志 VALUES (1); END`,
			dmlSql: "INSERT INTO 选课 VALUES (1, 'A', 90)"
		});
		expect(e.steps[0].description).toContain('t');
	});

	it('pseudocode 正确生成', () => {
		const e = createEngine(
			`CREATE TRIGGER t AFTER INSERT ON 选课 FOR EACH ROW BEGIN INSERT INTO 日志 VALUES (1); END`,
			"INSERT INTO 选课 VALUES (1, 'A', 90)"
		);
		expect(e.pseudocode.length).toBeGreaterThan(0);
	});

	it('demoScript 覆盖三个阶段', () => {
		const e = new TriggerEngine();
		expect(e.demoScript).toHaveLength(3);
		expect(e.demoScript[0]?.type).toBe('init');
		expect(e.demoScript[2]?.type).toBe('complete');
	});

	it('presets 包含 3 个', () => {
		const e = new TriggerEngine();
		expect(e.presets).toHaveLength(3);
	});

	it('practiceQuestions 有 2 题', () => {
		const e = new TriggerEngine();
		expect(e.practiceQuestions).toHaveLength(2);
	});

	it('getCurrentStep 不越界', () => {
		const e = createEngine(
			`CREATE TRIGGER t AFTER INSERT ON 选课 FOR EACH ROW BEGIN INSERT INTO 日志 VALUES (1); END`,
			"INSERT INTO 选课 VALUES (1, 'A', 90)"
		);
		expect(() => e.getCurrentStep()).not.toThrow();
		expect(() => e.getCurrentStep()).not.toThrow();
	});

	it('reset 归零 playbackPos', () => {
		const e = createEngine(
			`CREATE TRIGGER t AFTER INSERT ON 选课 FOR EACH ROW BEGIN INSERT INTO 日志 VALUES (1); END`,
			"INSERT INTO 选课 VALUES (1, 'A', 90)"
		);
		e.playbackPos = 3;
		e.reset();
		expect(e.playbackPos).toBe(0);
	});
});
