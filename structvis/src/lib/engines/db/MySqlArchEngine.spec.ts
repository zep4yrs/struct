import { describe, it, expect } from 'vitest';
import { MySqlArchEngine } from './MySqlArchEngine';

function run(): MySqlArchEngine {
	const e = new MySqlArchEngine();
	e.init([0]);
	return e;
}

describe('MySqlArchEngine MySQL 架构', () => {
	it('生成完整链路步骤', () => {
		const e = run();
		expect(e.totalSteps).toBe(11);
	});

	it('每步带链式图快照（layout=chain、5 节点、有向边）', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.graph).toBeDefined();
			expect(s.graph!.layout).toBe('chain');
			expect(s.graph!.nodes.length).toBe(5);
			expect(s.graph!.directed).toBe(true);
			expect(s.graph!.edges.length).toBe(4);
		}
	});

	it('init 步骤高亮连接器（节点 0）', () => {
		const e = run();
		const first = e.steps[0];
		expect(first.graph!.nodeState![0]).toBe('current');
		expect(first.graph!.nodeState![1]).toBe('unvisited');
	});

	it('最后一步高亮存储引擎（节点 4）', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		expect(last.graph!.nodeState![4]).toBe('current');
		expect(last.description).toContain('链路完成');
	});
});
