import { describe, it, expect } from 'vitest';
import { CompleteKnapsackEngine } from './CompleteKnapsackEngine';

function run(): CompleteKnapsackEngine {
	const e = new CompleteKnapsackEngine();
	e.init([2, 3, 3, 4, 4, 5]);
	return e;
}

describe('CompleteKnapsackEngine 完全背包', () => {
	it('容量 8 最大价值 ≥ 对应 0-1 背包（无限件更优）', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		expect(last.description).toContain('最大价值');
	});
	it('每步 dp 表尺寸 (n+1)x(C+1)', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.dp!.grid.length).toBe(4);
			expect(s.dp!.grid[0].length).toBe(9);
		}
	});
});
