import { describe, it, expect } from 'vitest';
import { GraphStorageEngine, type GraphStorageInput } from './GraphStorageEngine';

function run(input: Partial<GraphStorageInput> = {}): GraphStorageEngine {
	const e = new GraphStorageEngine();
	const defaults: GraphStorageInput = {
		mode: 'adjacency-matrix',
		labels: ['A', 'B', 'C'],
		edges: [
			[0, 1],
			[1, 2]
		]
	};
	e.init({ ...defaults, ...input });
	return e;
}

describe('GraphStorageEngine', () => {
	it('init 生成 steps：init + 每条边 + complete', () => {
		const e = run();
		expect(e.totalSteps).toBe(4); // init + 2 edges + complete
		expect(e.steps[0].description).toContain('零矩阵');
		expect(e.steps[e.steps.length - 1].description).toContain('构建完成');
	});

	it('邻接矩阵对称填充：无向图 M[i][j]=M[j][i]', () => {
		const e = run({ mode: 'adjacency-matrix', labels: ['A', 'B'], edges: [[0, 1]] });
		const step1 = e.steps[1]; // 插入第一条边
		expect(step1.description).toContain('A [0 1]');
		expect(step1.description).toContain('B [1 0]');
	});

	it('邻接表双向添加：A→B 且 B→A', () => {
		const e = run({ mode: 'adjacency-list', labels: ['A', 'B'], edges: [[0, 1]] });
		const step1 = e.steps[1];
		expect(step1.description).toContain('A → B');
		expect(step1.description).toContain('B → A');
	});

	it('applyPreset 重建 steps', () => {
		const e = run();
		e.applyPreset('无向图 5 顶点（邻接表）');
		expect(e.totalSteps).toBe(8); // init + 6 edges + complete
		expect(e.steps[0].description).toContain('邻接表');
	});

	it('applyCustom 切换 mode 并重建', () => {
		const e = run({ mode: 'adjacency-matrix', labels: ['A', 'B'], edges: [[0, 1]] });
		e.applyCustom({ mode: 'adjacency-list' });
		expect(e.steps[1].description).toContain('邻接表');
	});

	it('带权邻接矩阵显示权重', () => {
		const e = run({
			mode: 'adjacency-matrix',
			labels: ['A', 'B'],
			edges: [[0, 1]],
			weights: [5]
		});
		expect(e.steps[1].description).toContain('5');
	});

	it('pseudocode 随 mode 切换', () => {
		const e1 = run({ mode: 'adjacency-matrix' });
		expect(e1.pseudocode[0]).toBe('AdjacencyMatrix(G)');
		const e2 = run({ mode: 'adjacency-list' });
		expect(e2.pseudocode[0]).toBe('AdjacencyList(G)');
	});

	it('practiceQuestions 有 2 题', () => {
		const e = run();
		expect(e.practiceQuestions).toHaveLength(2);
	});

	it('graph 快照每步携带且节点数正确', () => {
		const e = run({ labels: ['A', 'B', 'C'] });
		e.steps.forEach((step) => {
			expect(step.graph?.nodes).toHaveLength(3);
		});
	});

	it('presets 包含 3 个', () => {
		const e = new GraphStorageEngine();
		expect(e.presets).toHaveLength(3);
	});

	it('reset 不改变 steps', () => {
		const e = run();
		const before = e.totalSteps;
		e.reset();
		expect(e.totalSteps).toBe(before);
	});
});
