import { describe, it, expect } from 'vitest';
import { NQueensEngine } from './NQueensEngine';

function run(): NQueensEngine {
	const e = new NQueensEngine();
	e.init([0]);
	return e;
}

describe('NQueensEngine 八皇后回溯', () => {
	it('6 皇后找到全部 4 个解', () => {
		const e = run();
		const solutions = e.steps.filter(
			(s) => s.queens?.phase === 'solution' && s.queens!.placed.length === 6
		);
		expect(solutions.length).toBe(4);
	});

	it('每步棋盘快照 placed 数 ≤ n', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.queens).toBeDefined();
			expect(s.queens!.placed.length).toBeLessThanOrEqual(6);
		}
	});

	it('解的皇后互不同列', () => {
		const e = run();
		const solSteps = e.steps.filter(
			(s) => s.queens?.phase === 'solution' && s.queens!.placed.length === 6
		);
		for (const s of solSteps) {
			const cols = s.queens!.placed;
			expect(new Set(cols).size).toBe(cols.length);
		}
	});
});
