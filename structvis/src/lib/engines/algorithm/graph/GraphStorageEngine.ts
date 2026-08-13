/**
 * 图的存储引擎 — GraphStorageEngine
 *
 * 演示邻接矩阵 vs 邻接表两种存储结构的逐步构建过程。
 * 复用 graph 渲染器环形布局，通过 GraphData.nodeState / edgeState 控制高亮。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EnginePreset,
	GraphEdge,
	GraphEdgeState,
	GraphNode,
	PracticeQuestion
} from '../types';
import { EngineBase } from '../EngineBase';

export type StorageMode = 'adjacency-matrix' | 'adjacency-list';

export interface GraphStorageInput {
	mode: StorageMode;
	labels: string[];
	edges: [number, number][];
	weights?: number[];
}

const PRESETS: EnginePreset[] = [
	{ name: '无向图 5 顶点（邻接矩阵）', description: 'A-B-C-D-E，6 条无向边，逐步填充对称矩阵' },
	{ name: '无向图 5 顶点（邻接表）', description: '同一张图，用链表逐个顶点挂接邻居' },
	{ name: '带权有向图（邻接矩阵）', description: '5 顶点有向边，矩阵单元存放权重' }
];

const PSEUDO_MATRIX: string[] = [
	'AdjacencyMatrix(G)',
	'  n ← |V|',
	'  M ← n×n matrix filled with 0',
	'  for each edge (u, v) ∈ E do',
	'    M[u][v] ← 1; M[v][u] ← 1  // 无向对称',
	'  end for',
	'end procedure'
];

const PSEUDO_LIST: string[] = [
	'AdjacencyList(G)',
	'  for each vertex v ∈ V do',
	'    Adj[v] ← empty linked list',
	'  for each edge (u, v) ∈ E do',
	'    insert v into Adj[u]',
	'    insert u into Adj[v]      // 无向对称',
	'  end for',
	'end procedure'
];

const DEMO_SCRIPT: DemoScriptItem[] = [
	{
		type: 'init',
		narration:
			'图的存储是把顶点之间的关系"翻译"成计算机能高效读写的数据结构。最经典的两种：邻接矩阵（二维数组）和邻接表（数组+链表）。'
	},
	{
		type: 'compare',
		narration:
			'邻接矩阵：天然支持 O(1) 查边，但空间 O(V²)；邻接表：空间 O(V+E)，省内存，但查边要遍历链表。'
	},
	{
		type: 'complete',
		narration:
			'稀疏图（边少）用邻接表更省空间；稠密图（边多）邻接矩阵反而更简单。选择合适的存储结构是图算法的第一步。'
	}
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: '邻接矩阵中 M[i][j]=1 表示什么？',
		options: ['顶点 i 的度是 1', '顶点 i 与 j 之间有边', 'i 是 j 的父节点', '图中只有一条边'],
		correctAnswer: '顶点 i 与 j 之间有边',
		hint: '矩阵的行和列都对应顶点编号。',
		explanation: 'M[i][j]=1 表示顶点 i 与顶点 j 之间存在边。无向图中矩阵对称，故 M[i][j]=M[j][i]。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '5 个顶点的无向图，邻接矩阵占用多少单元？',
		options: ['5', '10', '25', '50'],
		correctAnswer: '25',
		hint: '矩阵大小是 n×n，n 为顶点数。',
		explanation: '5×5=25 个单元，与边数无关；而邻接表只需要 2×边数+顶点数个节点指针。'
	}
];

const DEFAULT_EDGES_5: [number, number][] = [
	[0, 1],
	[0, 2],
	[1, 3],
	[1, 4],
	[2, 4],
	[3, 4]
];

const DEFAULT_EDGES_DIRECTED: [number, number][] = [
	[0, 1],
	[0, 2],
	[1, 3],
	[2, 1],
	[2, 4],
	[3, 4],
	[4, 0]
];

export class GraphStorageEngine extends EngineBase<GraphStorageInput> {
	readonly name = '图的存储';
	readonly renderType = 'graph' as const;

	readonly demoScript: DemoScriptItem[] = DEMO_SCRIPT;
	readonly presets: EnginePreset[] = PRESETS;

	private _input: GraphStorageInput | null = null;

	init(input: GraphStorageInput): void {
		this._input = input;
		this._rebuild();
	}

	applyPreset(name: string): void {
		const map: Record<string, GraphStorageInput> = {
			'无向图 5 顶点（邻接矩阵）': {
				mode: 'adjacency-matrix',
				labels: ['A', 'B', 'C', 'D', 'E'],
				edges: DEFAULT_EDGES_5
			},
			'无向图 5 顶点（邻接表）': {
				mode: 'adjacency-list',
				labels: ['A', 'B', 'C', 'D', 'E'],
				edges: DEFAULT_EDGES_5
			},
			'带权有向图（邻接矩阵）': {
				mode: 'adjacency-matrix',
				labels: ['V0', 'V1', 'V2', 'V3', 'V4'],
				edges: DEFAULT_EDGES_DIRECTED,
				weights: [5, 3, 2, 7, 4, 1, 6]
			}
		};
		const input = map[name];
		if (!input) throw new Error(`未知预设：${name}`);
		this._input = input;
		this._rebuild();
	}

	applyCustom(input: Partial<GraphStorageInput>): void {
		if (!this._input) throw new Error('请先 init 或 applyPreset');
		this._input = { ...this._input, ...input };
		this._rebuild();
	}

	private _nodes(labels: string[]): GraphNode[] {
		return labels.map((label, id) => ({ id, label }));
	}

	private _edges(input: GraphStorageInput): Omit<GraphEdge, 'state'>[] {
		return input.edges.map(([from, to], i) => ({
			from,
			to,
			weight: input.weights?.[i]
		}));
	}

	private _rebuild(): void {
		if (!this._input) return;
		const input = this._input;
		const n = input.labels.length;
		const edges = this._edges(input);
		const nodes = this._nodes(input.labels);

		this.pseudocode = input.mode === 'adjacency-matrix' ? PSEUDO_MATRIX : PSEUDO_LIST;
		this.practiceQuestions = PRACTICE;

		const steps: AlgorithmStep[] = [];

		const mkEdgeState = (
			activeIdx: number,
			mode: 'init' | 'step' | 'done'
		): Record<number, GraphEdgeState> => {
			const state: Record<number, GraphEdgeState> = {};
			edges.forEach((_, i) => {
				if (mode === 'init') state[i] = 'normal';
				else if (mode === 'done') state[i] = 'selected';
				else state[i] = i < activeIdx ? 'selected' : i === activeIdx ? 'current' : 'normal';
			});
			return state;
		};

		// init
		steps.push({
			id: 0,
			type: 'init',
			description:
				input.mode === 'adjacency-matrix'
					? `初始化 ${n}×${n} 零矩阵：所有单元为 0（表示无边）。`
					: `初始化 ${n} 个空邻接表头：Adj[0..${n - 1}] = ∅。`,
			data: [],
			highlights: [],
			pseudocodeLine: 1,
			graph: {
				nodes,
				edges,
				nodeState: Object.fromEntries(nodes.map((nd) => [nd.id, 'unvisited'])),
				edgeState: mkEdgeState(-1, 'init')
			}
		});

		// 逐步插入边
		edges.forEach((edge, idx) => {
			const built = edges.slice(0, idx + 1).map((e) => [e.from, e.to] as [number, number]);
			const desc = this._describeAt(input, built, idx);

			steps.push({
				id: idx + 1,
				type: 'compare',
				description: desc,
				data: [],
				highlights: [{ type: 'current', indices: [idx] }],
				pseudocodeLine: idx + 4,
				graph: {
					nodes,
					edges,
					nodeState: Object.fromEntries(nodes.map((nd) => [nd.id, 'visited'])),
					edgeState: mkEdgeState(idx, 'step')
				}
			});
		});

		// complete
		steps.push({
			id: edges.length + 1,
			type: 'complete',
			description:
				input.mode === 'adjacency-matrix'
					? `矩阵构建完成。无向图对称：M[i][j]=M[j][i]，空间 ${n}×${n}=${n * n} 单元。`
					: `邻接表构建完成。共 ${edges.length} 条边，节点指针共 ${edges.length * 2} 个，空间 O(V+E)=O(${n}+${edges.length})。`,
			data: [],
			highlights: edges.map((_, i) => ({ type: 'current', indices: [i] })),
			pseudocodeLine: input.mode === 'adjacency-matrix' ? 6 : 5,
			graph: {
				nodes,
				edges,
				nodeState: Object.fromEntries(nodes.map((nd) => [nd.id, 'done'])),
				edgeState: mkEdgeState(-1, 'done')
			}
		});

		this.steps = steps;
		this.totalSteps = steps.length;
	}

	private _describeAt(input: GraphStorageInput, built: [number, number][], idx: number): string {
		if (input.mode === 'adjacency-matrix') {
			const n = input.labels.length;
			const lines: string[] = [];
			for (let i = 0; i < n; i++) {
				const row: string[] = [];
				for (let j = 0; j < n; j++) {
					const eIdx = built.findIndex(([a, b]) => (a === i && b === j) || (a === j && b === i));
					if (eIdx >= 0 && input.weights && input.weights.length === input.edges.length) {
						row.push(String(input.weights[eIdx]));
					} else if (eIdx >= 0) {
						row.push('1');
					} else {
						row.push('0');
					}
				}
				lines.push(`${input.labels[i]} [${row.join(' ')}]`);
			}
			return `插入第 ${idx + 1} 条边 (${input.labels[input.edges[idx][0]]}, ${input.labels[input.edges[idx][1]]})：\n${lines.join('\n')}`;
		}
		const adj: Record<string, string[]> = {};
		input.labels.forEach((l) => (adj[l] = []));
		built.forEach(([a, b]) => {
			adj[input.labels[a]].push(input.labels[b]);
			adj[input.labels[b]].push(input.labels[a]);
		});
		const lines = input.labels.map((l) => `  ${l} → ${adj[l].join(', ') || '∅'}`);
		return `插入第 ${idx + 1} 条边后邻接表：\n${lines.join('\n')}`;
	}
}
