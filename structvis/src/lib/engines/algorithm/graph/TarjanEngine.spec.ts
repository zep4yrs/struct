import { describe, it, expect } from 'vitest';
import { TarjanEngine } from './TarjanEngine';

function run(): TarjanEngine {
	const e = new TarjanEngine();
	e.init({
		labels: ['A', 'B', 'C', 'D', 'E', 'F'],
		edges: [
			[0, 1],
			[1, 2],
			[2, 0],
			[2, 3],
			[3, 4],
			[4, 5],
			[5, 3]
		]
	});
	return e;
}

describe('TarjanEngine 强连通分量', () => {
	it('教材图找到 2 个 SCC', () => {
		const e = run();
		const complete = e.steps[e.totalSteps - 1];
		expect(complete.description).toContain('2 个强连通分量');
	});

	it('每步带 graph 快照且 dfn/low 标注存在', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.graph).toBeDefined();
			expect(s.graph!.nodeNote).toBeDefined();
		}
	});

	it('完成时所有节点状态为 done', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		for (let i = 0; i < 6; i++) {
			expect(last.graph!.nodeState![i]).toBe('done');
		}
	});
});
