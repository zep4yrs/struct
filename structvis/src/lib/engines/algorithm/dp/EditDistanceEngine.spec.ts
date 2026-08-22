import { describe, it, expect } from 'vitest';
import { EditDistanceEngine } from './EditDistanceEngine';

function run(): EditDistanceEngine {
	const e = new EditDistanceEngine();
	e.init(['horse', 'ros']);
	return e;
}

describe('EditDistanceEngine 编辑距离', () => {
	it('horse → ros 距离 = 3', () => {
		const e = run();
		expect(e.steps[e.totalSteps - 1].description).toContain('编辑距离 = 3');
	});
	it('每步带 dp 表格，尺寸正确', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.dp!.grid.length).toBe(6);
			expect(s.dp!.grid[0].length).toBe(4);
		}
	});
});
