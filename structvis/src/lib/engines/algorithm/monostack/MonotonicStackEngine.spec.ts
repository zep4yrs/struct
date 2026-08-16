import { describe, it, expect } from 'vitest';
import { MonotonicStackEngine } from './MonotonicStackEngine';

function run(temps: number[]): MonotonicStackEngine {
	const e = new MonotonicStackEngine();
	e.init(temps);
	return e;
}

describe('MonotonicStackEngine 单调栈', () => {
	it('教材序列答案 [1,1,4,2,1,1,0,0]', () => {
		const e = run([73, 74, 75, 71, 69, 72, 76, 73]);
		const last = e.steps[e.totalSteps - 1];
		expect(last.monoStack!.answer).toEqual([1, 1, 4, 2, 1, 1, 0, 0]);
	});

	it('每步带 monoStack 快照', () => {
		const e = run([73, 74, 75, 71, 69, 72, 76, 73]);
		for (const s of e.steps) {
			expect(s.monoStack).toBeDefined();
			expect(s.monoStack!.temps.length).toBe(8);
		}
	});

	it('单调递减:栈内温度从栈底到栈顶递减', () => {
		const e = run([73, 74, 75, 71, 69, 72, 76, 73]);
		for (const s of e.steps) {
			const st = s.monoStack!.stack;
			for (let i = 0; i < st.length - 1; i++) {
				expect(s.monoStack!.temps[st[i]]).toBeGreaterThan(s.monoStack!.temps[st[i + 1]]);
			}
		}
	});

	it('递增序列:每个答案都是 1', () => {
		const e = run([30, 40, 50, 60]);
		const last = e.steps[e.totalSteps - 1];
		expect(last.monoStack!.answer).toEqual([1, 1, 1, 0]);
	});

	it('递减序列:答案全 0', () => {
		const e = run([60, 50, 40, 30]);
		const last = e.steps[e.totalSteps - 1];
		expect(last.monoStack!.answer).toEqual([0, 0, 0, 0]);
	});
});
