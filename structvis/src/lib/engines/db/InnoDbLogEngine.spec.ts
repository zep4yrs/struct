import { describe, it, expect } from 'vitest';
import { InnoDbLogEngine } from './InnoDbLogEngine';

function run(): InnoDbLogEngine {
	const e = new InnoDbLogEngine();
	e.init([0]);
	return e;
}

describe('InnoDbLogEngine InnoDB 日志体系', () => {
	it('五阶段链路', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		expect(last.description).toContain('链路完成');
	});

	it('每步带 5 节点链式图', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.graph).toBeDefined();
			expect(s.graph!.layout).toBe('chain');
			expect(s.graph!.nodes.length).toBe(5);
		}
	});
});
