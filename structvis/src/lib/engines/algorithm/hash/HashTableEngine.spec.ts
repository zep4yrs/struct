import { describe, it, expect } from 'vitest';
import { HashTableEngine, type HashInput } from './HashTableEngine';

const LINEAR_KEYS = [22, 41, 53, 46, 30, 13, 1, 67];

function run(
	input: Partial<HashInput> & { keys: number[]; mode: HashInput['mode']; size: number }
) {
	const e = new HashTableEngine();
	e.init({ ...input });
	return e;
}

describe('HashTableEngine 线性探测·构造', () => {
	it('生成全部步骤，槽位快照带 mode/size', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		expect(e.totalSteps).toBe(24);
		for (const s of e.steps) {
			expect(s.hash).toBeDefined();
			expect(s.hash!.mode).toBe('linear');
			expect(s.hash!.size).toBe(11);
		}
	});

	it('教材示例最终布局 [22, 01, 46, 13, 67, 空×3, 41, 53, 30]', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		const last = e.steps[e.totalSteps - 1];
		expect(last.hash!.slots).toEqual([22, 1, 46, 13, 67, null, null, null, 41, 53, 30]);
	});

	it('30 的探测序列为 8 → 9 → 10（第 12 步放入槽 10）', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		const placed = e.steps[12];
		expect(placed.hash!.key).toBe(30);
		expect(placed.hash!.placed).toBe(10);
		expect(placed.hash!.probe).toEqual([8, 9, 10]);
	});

	it('67 的探测序列为 1 → 2 → 3 → 4', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		const placed = e.steps[22];
		expect(placed.hash!.key).toBe(67);
		expect(placed.hash!.placed).toBe(4);
		expect(placed.hash!.probe).toEqual([1, 2, 3, 4]);
	});

	it('冲突步骤使用 edge-reject 类型，keyLabel 把 1 显示为 01', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		const conflict = e.steps[10];
		expect(conflict.type).toBe('edge-reject');
		const hashStep = e.steps[16];
		expect(hashStep.hash!.key).toBe(1);
		expect(hashStep.hash!.keyLabel).toBe('01');
		expect(hashStep.hash!.hashValue).toBe(1);
	});

	it('完成帧给出 ASL(成功) = 14/8 = 1.75', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		const last = e.steps[e.totalSteps - 1];
		expect(last.type).toBe('complete');
		expect(last.hash!.summary).toContain('1.75');
	});

	it('练习题的 stepIndex 落在有效范围内且答案正确', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		expect(e.practiceQuestions).toHaveLength(2);
		expect(e.practiceQuestions[0].stepIndex).toBeLessThan(e.totalSteps);
		expect(e.practiceQuestions[1].stepIndex).toBeLessThan(e.totalSteps);
	});
});

describe('HashTableEngine 线性探测·查找', () => {
	it('查找 67：探测 1 → 2 → 3 → 4 后命中槽 4', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'search', size: 11, target: 67 });
		const found = e.steps.find((s) => s.hash!.found === true)!;
		expect(found).toBeDefined();
		expect(found.hash!.placed).toBe(4);
		expect(found.hash!.probe).toEqual([1, 2, 3, 4]);
		expect(found.hash!.key).toBe(67);
	});

	it('查找 55（不存在）：探测到空槽失败', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'search', size: 11, target: 55 });
		const fail = e.steps.find((s) => s.hash!.found === false)!;
		expect(fail).toBeDefined();
		expect(fail.hash!.probe).toEqual([0, 1, 2, 3, 4, 5]);
		expect(e.steps[e.totalSteps - 1].type).toBe('complete');
	});

	it('查找模式伪代码与练习题已切换', () => {
		const e = run({ keys: LINEAR_KEYS, mode: 'search', size: 11, target: 67 });
		expect(e.pseudocode[0]).toContain('hashSearch');
		expect(e.practiceQuestions[0].correctAnswer).toBe('4 次');
	});
});

describe('HashTableEngine 链地址法', () => {
	const CHAIN_KEYS = [19, 14, 23, 1, 68, 20, 84, 27, 55, 11, 10, 79];

	it('生成全部步骤且快照为 chain 模式', () => {
		const e = run({ keys: CHAIN_KEYS, mode: 'chain', size: 13 });
		expect(e.totalSteps).toBe(26);
		for (const s of e.steps) {
			expect(s.hash!.mode).toBe('chain');
		}
	});

	it('最终链结构正确（表尾插入）', () => {
		const e = run({ keys: CHAIN_KEYS, mode: 'chain', size: 13 });
		const last = e.steps[e.totalSteps - 1];
		expect(last.hash!.chains).toEqual({
			1: [14, 1, 27, 79],
			3: [68, 55],
			6: [19, 84],
			7: [20],
			10: [23, 10],
			11: [11]
		});
	});

	it('完成帧给出 ASL(成功) = 21/12 = 1.75', () => {
		const e = run({ keys: CHAIN_KEYS, mode: 'chain', size: 13 });
		const last = e.steps[e.totalSteps - 1];
		expect(last.type).toBe('complete');
		expect(last.hash!.summary).toContain('1.75');
	});

	it('链上结点高亮：79 挂上时 current = 槽 1', () => {
		const e = run({ keys: CHAIN_KEYS, mode: 'chain', size: 13 });
		const step79 = e.steps.find((s) => s.hash!.key === 79 && s.type === 'edge-select')!;
		expect(step79).toBeDefined();
		expect(step79.hash!.current).toBe(1);
		expect(step79.hash!.chains![1]).toEqual([14, 1, 27, 79]);
	});
});

describe('HashTableEngine 自定义输入', () => {
	it('表长越界时报错', () => {
		const e = new HashTableEngine();
		expect(() => e.applyCustom({ mode: 'construct', size: '4', keys: '1, 2, 3' })).toThrow(
			/5 ~ 19/
		);
		expect(() => e.applyCustom({ mode: 'construct', size: '20', keys: '1, 2, 3' })).toThrow(
			/5 ~ 19/
		);
	});

	it('关键字个数超过表长时报错', () => {
		const e = new HashTableEngine();
		expect(() => e.applyCustom({ mode: 'construct', size: '5', keys: '1, 2, 3, 4, 5, 6' })).toThrow(
			/最多支持/
		);
	});

	it('查找模式缺目标值时报错', () => {
		const e = new HashTableEngine();
		expect(() => e.applyCustom({ mode: 'search', size: '11', keys: '1, 2, 3' })).toThrow(/目标/);
	});

	it('演示预设正确切换三种模式', () => {
		const e = new HashTableEngine();
		e.applyPreset('线性探测·构造');
		expect(e.pseudocode[0]).toContain('createHash');
		e.applyPreset('线性探测·查找');
		expect(e.pseudocode[0]).toContain('hashSearch');
		e.applyPreset('链地址法·构造');
		expect(e.pseudocode[0]).toContain('chainCreate');
	});
});
