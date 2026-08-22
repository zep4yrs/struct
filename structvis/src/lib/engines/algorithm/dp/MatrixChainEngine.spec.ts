import { describe, it, expect } from 'vitest';
import { MatrixChainEngine } from './MatrixChainEngine';

function run(): MatrixChainEngine {
	const e = new MatrixChainEngine();
	e.init([30, 35, 15, 5, 10, 20, 25]);
	return e;
}

describe('MatrixChainEngine 矩阵链乘', () => {
	it('CLRS 示例最优代价 = 15125', () => {
		const e = run();
		expect(e.steps[e.totalSteps - 1].description).toContain('15125');
	});
	it('只填上三角（下三角为空）', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		expect(last.dp!.grid[2][1]).toBe('');
		expect(last.dp!.grid[0][0]).toBe(0);
	});
});
