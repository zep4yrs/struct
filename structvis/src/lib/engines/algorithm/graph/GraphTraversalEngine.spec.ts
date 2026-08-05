import { describe, it, expect } from 'vitest';
import { GraphTraversalEngine } from './GraphTraversalEngine';

const DEFAULT_LABELS = ['0', '1', '2', '3', '4', '5'];
const DEFAULT_EDGES: [number, number][] = [
	[0, 1],
	[0, 2],
	[1, 3],
	[1, 4],
	[2, 4],
	[2, 5],
	[3, 4],
	[4, 5]
];

function bfsEngine(): GraphTraversalEngine {
	const e = new GraphTraversalEngine();
	e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES, mode: 'bfs', start: 0 });
	return e;
}

function dfsEngine(): GraphTraversalEngine {
	const e = new GraphTraversalEngine();
	e.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGES, mode: 'dfs', start: 0 });
	return e;
}

describe('GraphTraversalEngine', () => {
	it('BFS 访问序列正确（教材示例图从 0 出发）', () => {
		const e = bfsEngine();
		const last = e.steps[e.totalSteps - 1];
		expect(last.data).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it('DFS 访问序列正确（邻居按编号升序）', () => {
		const e = dfsEngine();
		const last = e.steps[e.totalSteps - 1];
		expect(last.data).toEqual([0, 1, 3, 4, 2, 5]);
	});

	it('每帧 graph 快照：节点与边与输入一致，访问状态逐步累积', () => {
		const e = bfsEngine();
		const visitSteps = e.steps.filter((s) => s.type === 'compare');
		expect(visitSteps.length).toBe(6); // 6 个顶点各访问一次
		const visitedSet = new Set<number>();
		for (const s of visitSteps) {
			const g = s.graph!;
			expect(g.nodes.map((n) => n.label)).toEqual(DEFAULT_LABELS);
			expect(g.edges.length).toBe(DEFAULT_EDGES.length);
			const current = Object.entries(g.nodeState ?? {})
				.filter(([, st]) => st === 'current')
				.map(([id]) => Number(id));
			expect(current.length).toBe(1);
			expect(visitedSet.has(current[0])).toBe(false); // 不重复访问
			visitedSet.add(current[0]);
		}
		expect([...visitedSet].sort()).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it('BFS 中入队顶点标记为 frontier', () => {
		const e = bfsEngine();
		const frontierSteps = e.steps.filter((s) => s.type === 'recurse-enter' && s.graph!.nodeState);
		expect(frontierSteps.length).toBeGreaterThan(0);
		const withFrontier = frontierSteps.find((s) =>
			Object.values(s.graph!.nodeState!).includes('frontier')
		);
		expect(withFrontier).toBeDefined();
	});

	it('非连通图：孤立顶点不被访问，完成帧给出实际序列', () => {
		const e = new GraphTraversalEngine();
		e.init({
			labels: ['0', '1', '2', '3'],
			edges: [
				[0, 1],
				[2, 3]
			],
			mode: 'bfs',
			start: 0
		});
		const last = e.steps[e.totalSteps - 1];
		expect(last.data).toEqual([0, 1]);
		expect(last.description).toContain('访问序列');
	});

	it('applyCustom 校验：自环边、越界端点、非法起始顶点均抛错', () => {
		const e = new GraphTraversalEngine();
		expect(() =>
			e.applyCustom({ mode: 'bfs', labels: '0,1,2', edges: '0-0, 0-1', start: '0' })
		).toThrow('同一个顶点');
		expect(() => e.applyCustom({ mode: 'bfs', labels: '0,1,2', edges: '0-3', start: '0' })).toThrow(
			'顶点编号超出节点范围'
		);
		expect(() => e.applyCustom({ mode: 'bfs', labels: '0,1,2', edges: '0-1', start: '5' })).toThrow(
			'起始顶点编号超出范围'
		);
	});

	it('applyCustom 自定义图重建步骤，访问序列匹配自定义起点', () => {
		const e = new GraphTraversalEngine();
		e.applyCustom({ mode: 'dfs', labels: 'a, b, c', edges: '0-1, 1-2', start: '2' });
		const last = e.steps[e.totalSteps - 1];
		expect(last.data).toEqual([2, 1, 0]);
	});

	it('applyPreset 切换 BFS/DFS 并重建', () => {
		const e = new GraphTraversalEngine();
		e.applyPreset('广度优先 BFS');
		expect(e.steps[e.totalSteps - 1].data).toEqual([0, 1, 2, 3, 4, 5]);
		e.applyPreset('深度优先 DFS');
		expect(e.steps[e.totalSteps - 1].data).toEqual([0, 1, 3, 4, 2, 5]);
	});

	it('提供 demoScript 且覆盖全部实际步骤类型', () => {
		const e = bfsEngine();
		const emitted = new Set(e.steps.map((s) => s.type));
		const covered = new Set(e.demoScript!.map((m) => m.type));
		for (const t of emitted) {
			expect(covered, `缺步骤类型 ${t} 的旁白`).toContain(t);
		}
	});
});
