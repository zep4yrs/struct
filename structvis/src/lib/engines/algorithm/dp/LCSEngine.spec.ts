import { describe, it, expect } from 'vitest';
import { LCSEngine } from './LCSEngine';

function run(a: string, b: string): LCSEngine {
	const e = new LCSEngine();
	e.init([a, b]);
	return e;
}

describe('LCSEngine 最长公共子序列', () => {
	it('ABCBDAB × BDCABA 的 LCS 长度 = 4', () => {
		const e = run('ABCBDAB', 'BDCABA');
		const last = e.steps[e.totalSteps - 1];
		expect(last.description).toContain('长度 = 4');
	});

	it('每步都带 dp 表格快照，尺寸 = (|A|+1) × (|B|+1)', () => {
		const e = run('ABCBDAB', 'BDCABA');
		expect(e.totalSteps).toBeGreaterThan(20);
		for (const s of e.steps) {
			expect(s.dp).toBeDefined();
			expect(s.dp!.grid.length).toBe(8);
			expect(s.dp!.grid[0].length).toBe(7);
		}
	});

	it('完成步骤带回溯箭头', () => {
		const e = run('ABCBDAB', 'BDCABA');
		const last = e.steps[e.totalSteps - 1];
		expect(last.dp!.arrows).toBeDefined();
		expect(last.dp!.arrows!.length).toBeGreaterThan(0);
	});

	it('字符相等步骤类型为 edge-select', () => {
		const e = run('ABCBDAB', 'BDCABA');
		const selectSteps = e.steps.filter((s) => s.type === 'edge-select');
		expect(selectSteps.length).toBeGreaterThan(0);
	});
});
