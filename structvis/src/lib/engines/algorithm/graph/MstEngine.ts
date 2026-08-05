/**
 * 最小生成树引擎 — MstEngine
 *
 * 支持 Prim（从起点扩张树）与 Kruskal（按权排序避环选边）两种算法，
 * 生成步进关键帧：候选边扫描、选中权最小/不构成回路的边、成环跳过（tried）、完成。
 * 每帧携带 graph 快照（节点/边 + nodeState/edgeState），由 graph 渲染器环形布局绘制。
 * 引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	GraphData,
	GraphEdgeState,
	GraphNodeState,
	PracticeQuestion,
	StepType
} from '../types';
import { parseLabelList, parseWeightedEdgeList } from '../parseInput';

export type MstMode = 'prim' | 'kruskal';

export interface MstInput {
	/** 节点标签（索引即节点 id） */
	labels: string[];
	/** 带权边 [from, to, weight] */
	edges: [number, number, number][];
	mode: MstMode;
	/** 起点顶点 id（仅 Prim 使用） */
	start: number;
}

const PRIM_PSEUDO: string[] = [
	'procedure Prim(G, v0)',
	'  T ← {v0}                          // 树中只含起点',
	'  while |T| < n do                  // 树尚未包含全部顶点',
	'    从连接 T 与 V-T 的边中选权最小的边 (u, v)',
	'    T ← T ∪ {(u, v), v}             // 把边和端点并入树',
	'  end while',
	'end procedure'
];

const KRUSKAL_PSEUDO: string[] = [
	'procedure Kruskal(G)',
	'  T ← empty set',
	'  将 E 中所有边按权从小到大排序',
	'  for each edge e ∈ sorted E do',
	'    if e 的两个端点分属不同连通分量 then',
	'      T ← T ∪ {e}; 合并两端点所在分量',
	'    else',
	'      丢弃 e（若加入将形成回路）',
	'  end for',
	'end procedure'
];

const PSEUDO_BY_MODE: Record<MstMode, string[]> = {
	prim: PRIM_PSEUDO,
	kruskal: KRUSKAL_PSEUDO
};

// 练习基于默认演示图（0-1:2, 0-3:6, 1-2:3, 1-3:8, 1-4:5, 2-4:7, 3-4:9，Prim 从 0 出发）：
// 两算法选边顺序均为 0-1, 1-2, 1-4, 0-3，总权 16；Kruskal 跳过 2-4 / 1-3 / 3-4
const PRACTICE_BY_MODE: Record<MstMode, PracticeQuestion[]> = {
	prim: [
		{
			type: 'choose-next',
			stepIndex: 6,
			prompt: 'Prim（从顶点 0 出发）第 3 条选中的边是？',
			options: ['1-4', '1-2', '0-3', '2-4'],
			correctAnswer: '1-4',
			hint: '前两条选中的边是 0-1(2)、1-2(3)，此后候选边有哪些？',
			explanation:
				'树为 {0,1,2} 时，连接树与外部的边为 0-3(6)、1-3(8)、1-4(5)、2-4(7)，权最小的是 1-4(5)。'
		}
	],
	kruskal: [
		{
			type: 'choose-next',
			stepIndex: 5,
			prompt: 'Kruskal 考察边 2-4（权 7）时应该怎么处理？',
			options: ['加入生成树', '丢弃（两端已连通）', '暂存待定', '跳过并继续选同权边'],
			correctAnswer: '丢弃（两端已连通）',
			hint: '此时 0-1、1-2、1-4、0-3 已被选中，2 与 4 是否已在同一连通分量中？',
			explanation:
				'2 通过 1-2 与 1 相连，4 通过 1-4 与 1 相连，两端已同属一个连通分量，加入会形成回路，故丢弃。'
		}
	]
};

const DEFAULT_EDGES: [number, number, number][] = [
	[0, 1, 2],
	[0, 3, 6],
	[1, 2, 3],
	[1, 3, 8],
	[1, 4, 5],
	[2, 4, 7],
	[3, 4, 9]
];

export class MstEngine implements AlgorithmEngine<MstInput> {
	readonly name = '最小生成树';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = [];
	practiceQuestions: PracticeQuestion[] = [];

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'带权无向图的最小生成树（MST）：用 n-1 条边连通全部 n 个顶点，且边权总和最小。两种经典算法——Prim 从一个顶点逐步"长"出一棵树，Kruskal 把边按权从小到大挑、只要不成环就收。'
		},
		{
			type: 'edge-candidate',
			narration: '扫描当前候选边：Prim 收集树与树外顶点之间的全部边，Kruskal 按权从小到大取一条边。'
		},
		{
			type: 'edge-select',
			narration: '选中权最小（且不构成回路）的边，把新顶点并入生成树。'
		},
		{
			type: 'edge-reject',
			narration: '这条边的两端已经连通，若加入会形成回路，丢弃它。'
		},
		{
			type: 'complete',
			narration:
				'生成树完成：恰好 n-1 条边连通全部顶点，且边权总和最小。两种算法殊途同归，都可用于网络布线、电力管网等场景。'
		}
	];

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	private _stepId = 0;
	private _labels: string[] = [];
	private _edges: [number, number, number][] = [];
	private _mode: MstMode = 'prim';
	private _start = 0;

	presets: EnginePreset[] = [
		{ name: '普里姆 Prim', description: '从起点逐步扩张树（教材示例图，从 0 出发）' },
		{ name: '克鲁斯卡尔 Kruskal', description: '边按权排序避环选边（同一教材示例图）' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义带权图',
		fields: [
			{
				key: 'mode',
				label: '算法',
				type: 'select',
				options: [
					{ value: 'prim', label: '普里姆 Prim' },
					{ value: 'kruskal', label: '克鲁斯卡尔 Kruskal' }
				],
				default: 'prim'
			},
			{
				key: 'labels',
				label: '顶点列表',
				type: 'text',
				placeholder: '逗号分隔，如 0, 1, 2, 3, 4',
				default: '0, 1, 2, 3, 4'
			},
			{
				key: 'edges',
				label: '带权边列表',
				type: 'text',
				placeholder: '如 0-1:2, 0-3:6, 1-2:3',
				default: '0-1:2, 0-3:6, 1-2:3, 1-3:8, 1-4:5, 2-4:7, 3-4:9'
			},
			{
				key: 'start',
				label: '起点顶点编号（Prim）',
				type: 'text',
				placeholder: '0 ~ 顶点数-1',
				default: '0'
			}
		]
	};

	applyPreset(name: string): void {
		const mode: MstMode = name.startsWith('普') ? 'prim' : 'kruskal';
		this.init({
			labels: ['0', '1', '2', '3', '4'],
			edges: DEFAULT_EDGES,
			mode,
			start: 0
		});
	}

	applyCustom(values: Record<string, string>): void {
		const labels = parseLabelList(values.labels ?? '', { min: 2, max: 12 });
		const edges = parseWeightedEdgeList(values.edges ?? '', {
			maxIndex: labels.length - 1,
			label: '边'
		});
		if (edges.length < labels.length - 1) throw new Error('边数过少，无法连通全部顶点');
		const start = parseInt((values.start ?? '').trim(), 10);
		if (isNaN(start)) throw new Error('请输入起点顶点编号');
		if (start < 0 || start >= labels.length) throw new Error('起点顶点编号超出范围');
		if (!this._connected(labels.length, edges)) throw new Error('图不连通，无法生成最小生成树');
		const mode = (values.mode ?? 'prim') as MstMode;
		this.init({ labels, edges, mode, start });
	}

	init(input: MstInput): void {
		const { labels, edges, mode, start } = input;
		this._labels = [...labels];
		this._edges = [...edges];
		this._mode = mode;
		this._start = start;
		this.pseudocode = PSEUDO_BY_MODE[mode];
		this.practiceQuestions = PRACTICE_BY_MODE[mode];

		this.steps = [];
		this._stepId = 0;

		this._emit(
			'init',
			`带权无向图共 ${labels.length} 个顶点、${edges.length} 条边。目标：用 ${labels.length - 1} 条边连通全部顶点并使总权最小。`,
			[],
			{},
			{},
			0
		);

		const selected: number[] = [];
		if (mode === 'prim') this._genPrim(start, selected);
		else this._genKruskal(selected);

		const total = selected.reduce((sum, ei) => sum + this._edges[ei][2], 0);
		const edgeText = selected.map((ei) => this._edgeText(ei)).join(', ');
		this._emit(
			'complete',
			`生成树完成：共 ${selected.length} 条边（${edgeText}），总权 ${total}。`,
			selected,
			{},
			{},
			mode === 'prim' ? 5 : 8
		);
		this.totalSteps = this.steps.length;
	}

	private _connected(n: number, edges: [number, number, number][]): boolean {
		const adj: number[][] = n === 0 ? [] : Array.from({ length: n }, () => []);
		for (const [a, b] of edges) {
			adj[a].push(b);
			adj[b].push(a);
		}
		const seen = new Set<number>([0]);
		const stack = [0];
		while (stack.length > 0) {
			const u = stack.pop()!;
			for (const w of adj[u]) {
				if (!seen.has(w)) {
					seen.add(w);
					stack.push(w);
				}
			}
		}
		return seen.size === n;
	}

	private _label(id: number): string {
		return this._labels[id] ?? String(id);
	}

	private _edgeText(ei: number): string {
		const [a, b, w] = this._edges[ei];
		return `${this._label(a)}-${this._label(b)}(${w})`;
	}

	private _genPrim(start: number, selected: number[]): void {
		const n = this._labels.length;
		const inTree = new Set<number>([start]);
		this._emit(
			'edge-select',
			`起始顶点 ${this._label(start)} 作为树的第一个顶点。`,
			selected,
			{ [start]: 'current' },
			{},
			1
		);

		while (inTree.size < n) {
			// 候选边：连接树内与树外顶点的边
			const candidates = this._edges
				.map(([a, b], ei) => ({ a, b, w: this._edges[ei][2], ei }))
				.filter(({ a, b }) => inTree.has(a) !== inTree.has(b));
			if (candidates.length === 0) break;

			const best = candidates.reduce((m, c) => (c.w < m.w || (c.w === m.w && c.ei < m.ei) ? c : m));
			const nodeState: Record<number, GraphNodeState> = {};
			for (const id of inTree) nodeState[id] = 'visited';
			for (const c of candidates) {
				const outer = inTree.has(c.a) ? c.b : c.a;
				if (!(outer in nodeState)) nodeState[outer] = 'frontier';
			}
			this._emit(
				'edge-candidate',
				`候选边：${candidates.map((c) => this._edgeText(c.ei)).join('、')}。其中权最小的是 ${this._edgeText(best.ei)}。`,
				selected,
				nodeState,
				{},
				3
			);

			selected.push(best.ei);
			const newVertex = inTree.has(best.a) ? best.b : best.a;
			inTree.add(newVertex);
			const selState: Record<number, GraphNodeState> = {};
			for (const id of inTree) {
				if (id === newVertex) selState[id] = 'current';
				else selState[id] = 'visited';
			}
			this._emit(
				'edge-select',
				`选中边 ${this._edgeText(best.ei)}，把顶点 ${this._label(newVertex)} 并入生成树。`,
				selected,
				selState,
				{ [best.ei]: 'selected' },
				4
			);
		}
	}

	private _genKruskal(selected: number[]): void {
		const n = this._labels.length;
		const sorted = this._edges
			.map((_, ei) => ei)
			.sort((x, y) => this._edges[x][2] - this._edges[y][2]);
		const parent = this._labels.map((_, i) => i);
		const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
		const union = (a: number, b: number): void => {
			parent[find(a)] = find(b);
		};

		this._emit(
			'edge-candidate',
			`把 ${this._edges.length} 条边按权从小到大排序：${sorted.map((ei) => this._edgeText(ei)).join(', ')}。`,
			selected,
			{},
			{},
			2
		);

		for (const ei of sorted) {
			const [a, b] = this._edges[ei];
			if (find(a) === find(b)) {
				this._emit(
					'edge-reject',
					`考察边 ${this._edgeText(ei)}：顶点 ${this._label(a)} 与 ${this._label(b)} 已连通，加入会形成回路，丢弃。`,
					selected,
					{ [a]: 'frontier', [b]: 'frontier' },
					{ [ei]: 'tried' },
					7
				);
				continue;
			}
			union(a, b);
			selected.push(ei);
			const nodeState: Record<number, GraphNodeState> = {};
			for (const s of selected) {
				const [x, y] = this._edges[s];
				nodeState[x] = 'visited';
				nodeState[y] = 'visited';
			}
			nodeState[a] = 'current';
			nodeState[b] = 'current';
			this._emit(
				'edge-select',
				`考察边 ${this._edgeText(ei)}：两端分属不同连通分量，选中它并合并两个分量。`,
				selected,
				nodeState,
				{ [ei]: 'selected' },
				5
			);
		}
	}

	private _graph(
		selected: number[],
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, GraphEdgeState>
	): GraphData {
		const state: Record<number, GraphNodeState> = {};
		const visited = new Set<number>();
		for (const s of selected) {
			const [a, b] = this._edges[s];
			visited.add(a);
			visited.add(b);
		}
		for (const id of visited) {
			if (!(id in nodeState)) state[id] = 'visited';
		}
		for (const [id, v] of Object.entries(nodeState)) state[Number(id)] = v;
		const eState: Record<number, GraphEdgeState> = {};
		for (const s of selected) eState[s] = 'selected';
		for (const [ei, v] of Object.entries(edgeState)) {
			if (!(Number(ei) in eState)) eState[Number(ei)] = v;
		}
		return {
			nodes: this._labels.map((label, id) => ({ id, label })),
			edges: this._edges.map(([from, to, weight]) => ({ from, to, weight })),
			nodeState: state,
			edgeState: eState
		};
	}

	private _emit(
		type: StepType,
		description: string,
		selected: number[],
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, GraphEdgeState>,
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...selected],
			highlights: [],
			pseudocodeLine,
			graph: this._graph(selected, nodeState, edgeState)
		});
	}

	getCurrentStep(): AlgorithmStep {
		return this.steps[Math.min(Math.floor(this.playbackPos), this.steps.length - 1)];
	}

	getProgress(): number {
		return this.playbackPos;
	}

	setProgress(pos: number): void {
		this.playbackPos = pos;
	}

	reset(): void {
		this.playbackPos = 0;
	}
}
