import { describe, it, expect } from 'vitest';
import { ProcedureEngine } from './ProcedureEngine';

function createEngine(body: string, callArgs: (string | number)[] = []): ProcedureEngine {
	const e = new ProcedureEngine();
	e.init({ name: '测试过程', params: [], body, callArgs });
	return e;
}

describe('ProcedureEngine', () => {
	it('DECLARE + SET + SELECT INTO：步骤覆盖', () => {
		const body = `DECLARE 总工资 INT DEFAULT 0;
DECLARE 人数 INT DEFAULT 0;
SET 总工资 = 1000;
SELECT COUNT(*) INTO 人数 FROM 员工;
SELECT 总工资, 人数;`;
		const e = createEngine(body);
		expect(e.totalSteps).toBeGreaterThanOrEqual(4);
		expect(e.steps[0].type).toBe('init');
		expect(e.steps[e.steps.length - 1].type).toBe('complete');
	});

	it('IF / ELSEIF / ELSE 分支：条件为真走 THEN', () => {
		const body = `DECLARE 职称 VARCHAR(20) DEFAULT '工程师';
DECLARE 涨幅 INT DEFAULT 0;

IF 职称 = '工程师' THEN
  SET 涨幅 = 500;
ELSEIF 职称 = '高级工程师' THEN
  SET 涨幅 = 800;
ELSE
  SET 涨幅 = 300;
END IF;

SELECT 职称, 涨幅;`;
		const e = createEngine(body);
		expect(e.totalSteps).toBeGreaterThanOrEqual(5);
		const ifStep = e.steps.find((s) => s.description.includes('IF'));
		expect(ifStep).toBeDefined();
		expect(ifStep!.description).toContain('TRUE');
	});

	it('WHILE 循环：条件为真进入循环体', () => {
		const body = `DECLARE N INT DEFAULT 3;
DECLARE i INT DEFAULT 1;
DECLARE 总和 INT DEFAULT 0;

WHILE i <= N DO
  SET 总和 = 总和 + i;
  SET i = i + 1;
END WHILE;

SELECT 总和;`;
		const e = createEngine(body);
		expect(e.totalSteps).toBeGreaterThanOrEqual(4);
		const whileStep = e.steps.find((s) => s.description.includes('WHILE'));
		expect(whileStep).toBeDefined();
	});

	it('CALL 嵌套过程：调用栈追加', () => {
		const body = `DECLARE x INT DEFAULT 10;
CALL 打印结果(x);
SELECT x;`;
		const e = createEngine(body);
		const callStep = e.steps.find((s) => s.description.includes('CALL'));
		expect(callStep).toBeDefined();
		expect(callStep!.description).toContain('打印结果');
	});

	it('applyPreset 重建步骤', () => {
		const e = createEngine('DECLARE x INT DEFAULT 0; SELECT x;');
		e.applyPreset('计算员工平均工资');
		expect(e.totalSteps).toBeGreaterThanOrEqual(2);
	});

	it('applyCustom 切换过程体', () => {
		const e = createEngine('DECLARE x INT DEFAULT 0;');
		e.applyCustom({ body: 'DECLARE y INT DEFAULT 1; SELECT y;' });
		expect(e.steps.some((s) => s.description.includes('DECLARE y'))).toBe(true);
	});

	it('pseudocode 正确生成', () => {
		const body = 'DECLARE x INT DEFAULT 0;\nSET x = 1;\nSELECT x;';
		const e = createEngine(body);
		expect(e.pseudocode.length).toBeGreaterThanOrEqual(2);
	});

	it('demoScript 覆盖三个阶段', () => {
		const e = new ProcedureEngine();
		expect(e.demoScript).toHaveLength(3);
		expect(e.demoScript[0]?.type).toBe('init');
		expect(e.demoScript[2]?.type).toBe('complete');
	});

	it('presets 包含 4 个', () => {
		const e = new ProcedureEngine();
		expect(e.presets).toHaveLength(4);
	});

	it('practiceQuestions 有 2 题', () => {
		const e = new ProcedureEngine();
		expect(e.practiceQuestions).toHaveLength(2);
	});

	it('getCurrentStep 不越界', () => {
		const e = createEngine('DECLARE x INT DEFAULT 0; SELECT x;');
		expect(() => e.getCurrentStep()).not.toThrow();
		expect(() => e.getCurrentStep()).not.toThrow();
	});

	it('reset 归零 playbackPos', () => {
		const e = createEngine('DECLARE x INT DEFAULT 0; SELECT x;');
		e.playbackPos = 2;
		e.reset();
		expect(e.playbackPos).toBe(0);
	});
});
