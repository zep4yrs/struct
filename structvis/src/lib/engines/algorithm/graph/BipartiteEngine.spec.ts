import { describe, it, expect } from 'vitest';
import { BipartiteEngine } from './BipartiteEngine';

function runBipartite(): BipartiteEngine {
	const e = new BipartiteEngine();
	e.init({
		labels: ['1', '2', '3', '4', '5', '6'],
		edges: [
			[0, 3],
			[0, 4],
			[0, 5],
			[1, 3],
			[1, 5],
			[2, 4]
		]
	});
	return e;
}

function runOdd(): BipartiteEngine {
	const e = new BipartiteEngine();
	e.init({
		labels: ['A', 'B', 'C'],
		edges: [
			[0, 1],
			[1, 2],
			[2, 0]
		]
	});
	return e;
}

describe('BipartiteEngine 二分图判定', () => {
	it('教材二分图判定为是，并给出两组', () => {
		const e = runBipartite();
		const last = e.steps[e.totalSteps - 1];
		expect(last.description).toContain('是二分图');
		expect(last.description).toContain('左部');
	});

	it('三角形（奇环）判定为非二分图', () => {
		const e = runOdd();
		const descs = e.steps.map((s) => s.description).join(' ');
		expect(descs).toContain('不是二分图');
	});

	it('每步带 graph 快照且无向', () => {
		const e = runBipartite();
		for (const s of e.steps) {
			expect(s.graph).toBeDefined();
			expect(s.graph!.directed).toBe(false);
		}
	});
});
