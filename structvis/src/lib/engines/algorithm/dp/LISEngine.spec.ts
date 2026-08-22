import { describe, it, expect } from 'vitest';
import { LISEngine } from './LISEngine';

function run(): LISEngine {
	const e = new LISEngine();
	e.init([10, 9, 2, 5, 3, 7, 101, 18]);
	return e;
}

describe('LISEngine 最长递增子序列', () => {
	it('教材示例 LIS 长度 = 4', () => {
		const e = run();
		expect(e.steps[e.totalSteps - 1].description).toContain('长度 = 4');
	});
	it('每步带 dp 表格', () => {
		const e = run();
		for (const s of e.steps) expect(s.dp).toBeDefined();
	});
});
