import { describe, it, expect } from 'vitest';
import { MaxFlowEngine } from './MaxFlowEngine';

function run(): MaxFlowEngine {
	const e = new MaxFlowEngine();
	e.init([0]);
	return e;
}

describe('MaxFlowEngine Edmonds-Karp', () => {
	it('教材网络最大流 = 19', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		expect(last.description).toContain('19');
	});

	it('每步带 graph 快照，边标注 flow/cap', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.graph).toBeDefined();
			for (const edge of s.graph!.edges) {
				expect(edge.label).toBeDefined();
				expect(String(edge.label)).toContain('/');
			}
		}
	});

	it('包含增广路与终止两类描述', () => {
		const e = run();
		const descs = e.steps.map((s) => s.description).join(' ');
		expect(descs).toContain('增广路');
		expect(descs).toContain('BFS 未找到');
	});
});
