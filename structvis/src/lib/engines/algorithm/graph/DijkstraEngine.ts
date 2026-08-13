/**
 * 最短路径引擎 — DijkstraEngine
 *
 * 单源最短路径（Dijkstra）：每轮从未确定顶点中选 dist 最小者确定之，
 * 再对其全部出边做松弛（dist[u] + w < dist[v] 则更新）。
 * 每帧携带 graph 快照（节点/边 + nodeState/edgeState + nodeNote 显示 dist），
 * 由 graph 渲染器环形布局绘制。引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
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
import { EngineBase } from '../EngineBase';
import { parseLabelList, parseWeightedEdgeList } from '../parseInput';

export interface DijkstraInput {
	/** 节点标签（索引即节点 id） */
	labels: string[];
	/** 带权边 [from, to, weight] */
	edges: [number, number, number][];
	/** 有向图（否则按无向处理） */
	directed: boolean;
	/** 源点 id */
	start: number;
}

const DIJKSTRA_PSEUDO: string[] = [
	'procedure Dijkstra(G, v0)',
	'  dist[v0] ← 0; 其余顶点 dist[v] ← ∞',
	'  S ← empty set                  // 已确定最短路径的顶点',
	'  while S ≠ V do',
	'    u ← dist 最小且 ∉ S 的顶点',
	'    S ← S ∪ {u}                  // 确定 u 的最短路径',
	'    for each 出边 (u, v, w) do',
	'      if dist[u] + w < dist[v] then',
	'        dist[v] ← dist[u] + w    // 松弛成功，更新 v',
	'  end while',
	'end procedure'
];

// 练习基于默认演示图（有向，从 0 出发）：
// 确定顺序 0, 3, 4, 1, 2；最终 dist = [0, 8, 9, 5, 7]
const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 8,
		prompt: 'Dijkstra（源点 0）第 3 个被确定最短路径的顶点是？',
		options: ['1', '2', '3', '4'],
		correctAnswer: '4',
		hint: '确定顺序由当前未确定顶点中 dist 最小者决定：0 之后是 3，再之后是？',
		explanation:
			'确定顺序为 0, 3, 4, 1, 2。0 与 3 确定后，未确定顶点 dist 为：1=8、2=14、4=7，最小的是 4（dist 7）。'
	}
];

const DEFAULT_EDGES: [number, number, number][] = [
	[0, 1, 10],
	[0, 3, 5],
	[1, 2, 1],
	[1, 3, 2],
	[2, 4, 4],
	[3, 1, 3],
	[3, 2, 9],
	[3, 4, 2],
	[4, 0, 7],
	[4, 2, 6]
];

export class DijkstraEngine extends EngineBase<DijkstraInput> {
	readonly name = '最短路径';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = DIJKSTRA_PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'单源最短路径：给定源点，求它到每个顶点的最短距离。Dijkstra 的思路是不断确定一个"距离已最小"的顶点，再用它去更新（松弛）其他顶点——贪心加松弛，关键前提是边权非负。'
		},
		{
			type: 'edge-select',
			narration: '在尚未确定的顶点里，选 dist 最小的一个确定下来——它的最短路径从此不再改变。'
		},
		{
			type: 'edge-candidate',
			narration: '松弛出边：如果绕道当前顶点能让邻居的 dist 更小，就更新它（红色数字随之变化）。'
		},
		{
			type: 'edge-reject',
			narration: '绕道并不会更短，这条出边保持原状。'
		},
		{
			type: 'complete',
			narration:
				'全部顶点确定完毕，图中深色边构成最短路径树。dist 就是源点到各顶点的最短距离，最短路径可在路径树中回溯得到。'
		}
	];

	private _labels: string[] = [];
	private _edges: [number, number, number][] = [];
	private _directed = true;
	private _start = 0;

	presets: EnginePreset[] = [{ name: '有向图示例', description: '教材示例有向图，从顶点 0 出发' }];

	customConfig: EngineCustomConfig = {
		title: '自定义带权图',
		fields: [
			{
				key: 'directed',
				label: '图的类型',
				type: 'select',
				options: [
					{ value: 'true', label: '有向图' },
					{ value: 'false', label: '无向图' }
				],
				default: 'true'
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
				placeholder: '如 0-1:10, 0-3:5, 3-1:3',
				default: '0-1:10, 0-3:5, 1-2:1, 1-3:2, 2-4:4, 3-1:3, 3-2:9, 3-4:2, 4-0:7, 4-2:6'
			},
			{
				key: 'start',
				label: '源点顶点编号',
				type: 'text',
				placeholder: '0 ~ 顶点数-1',
				default: '0'
			}
		]
	};

	applyPreset(name: string): void {
		this.init({
			labels: ['0', '1', '2', '3', '4'],
			edges: DEFAULT_EDGES,
			directed: true,
			start: 0
		});
	}

	applyCustom(values: Record<string, string>): void {
		const labels = parseLabelList(values.labels ?? '', { min: 2, max: 12 });
		const edges = parseWeightedEdgeList(values.edges ?? '', {
			maxIndex: labels.length - 1,
			label: '边'
		});
		const start = parseInt((values.start ?? '').trim(), 10);
		if (isNaN(start)) throw new Error('请输入源点顶点编号');
		if (start < 0 || start >= labels.length) throw new Error('源点顶点编号超出范围');
		const directed = values.directed === 'true';
		this.init({ labels, edges, directed, start });
	}

	init(input: DijkstraInput): void {
		const { labels, edges, directed, start } = input;
		this._labels = [...labels];
		this._edges = [...edges];
		this._directed = directed;
		this._start = start;

		this.steps = [];
		this._stepId = 0;

		const INF = -1; // data 数组中用 -1 表示无穷
		const dist = this._labels.map(() => INF);
		dist[start] = 0;
		this._emit(
			'init',
			`${directed ? '有向' : '无向'}带权图共 ${labels.length} 个顶点、${edges.length} 条边。初始化 dist：源点 ${this._label(start)} 为 0，其余顶点为 ∞。`,
			dist,
			{ [start]: 'current' },
			{},
			1
		);

		const settled = new Set<number>();
		const prev: number[] = [];
		while (settled.size < labels.length) {
			let u = -1;
			let best = INF;
			for (let i = 0; i < dist.length; i++) {
				if (settled.has(i) || dist[i] === INF) continue;
				if (u === -1 || dist[i] < best) {
					u = i;
					best = dist[i];
				}
			}
			if (u === -1) break; // 剩余顶点不可达

			const nodeState: Record<number, GraphNodeState> = {};
			for (const s of settled) nodeState[s] = 'done';
			nodeState[u] = 'current';
			const edgeState: Record<number, GraphEdgeState> = {};
			for (const s of settled) {
				const p = prev[s];
				if (p !== undefined) edgeState[this._edgeIndex(p, s)] = 'selected';
			}
			this._emit(
				'edge-select',
				`未确定顶点中 dist 最小的是 ${this._label(u)}（dist ${this._fmt(dist[u])}），确定它的最短路径。`,
				dist,
				nodeState,
				edgeState,
				5
			);
			settled.add(u);

			for (const [a, b, w, ei] of this._outEdges(u)) {
				const candidate = dist[a] + w;
				if (dist[b] === INF || candidate < dist[b]) {
					const old = dist[b];
					dist[b] = candidate;
					prev[b] = a;
					this._emit(
						'edge-candidate',
						`松弛边 ${this._edgeText(ei)}：dist[${this._label(a)}](${this._fmt(dist[a])}) + ${w} = ${candidate} < dist[${this._label(b)}](${this._fmt(old)})，更新 dist[${this._label(b)}] = ${candidate}。`,
						dist,
						{ [a]: 'visited', [b]: 'frontier' },
						{ [ei]: 'candidate' },
						8
					);
				} else {
					this._emit(
						'edge-reject',
						`松弛边 ${this._edgeText(ei)}：dist[${this._label(a)}](${this._fmt(dist[a])}) + ${w} = ${candidate} ≥ dist[${this._label(b)}](${this._fmt(dist[b])})，无需更新。`,
						dist,
						{ [a]: 'visited', [b]: 'visited' },
						{ [ei]: 'tried' },
						7
					);
				}
			}
		}

		const nodeState: Record<number, GraphNodeState> = {};
		for (const s of settled) nodeState[s] = 'done';
		const edgeState: Record<number, GraphEdgeState> = {};
		for (const s of settled) {
			const p = prev[s];
			if (p !== undefined) edgeState[this._edgeIndex(p, s)] = 'selected';
		}
		this._emit(
			'complete',
			`全部可达顶点确定完毕。最终 dist：${this._labels.map((_, i) => `${this._label(i)}=${this._fmt(dist[i])}`).join('，')}。图中深色边构成最短路径树。`,
			dist,
			nodeState,
			edgeState,
			10
		);
		this.totalSteps = this.steps.length;
	}

	private _outEdges(u: number): [number, number, number, number][] {
		const out: [number, number, number, number][] = [];
		for (let ei = 0; ei < this._edges.length; ei++) {
			const [a, b, w] = this._edges[ei];
			if (a === u) out.push([a, b, w, ei]);
			else if (!this._directed && b === u) out.push([b, a, w, ei]);
		}
		return out;
	}

	private _edgeIndex(a: number, b: number): number {
		for (let ei = 0; ei < this._edges.length; ei++) {
			const [x, y] = this._edges[ei];
			if (x === a && y === b) return ei;
			if (!this._directed && x === b && y === a) return ei;
		}
		return -1;
	}

	private _fmt(d: number): string {
		return d === -1 ? '∞' : String(d);
	}

	private _label(id: number): string {
		return this._labels[id] ?? String(id);
	}

	private _edgeText(ei: number): string {
		const [a, b, w] = this._edges[ei];
		return `${this._label(a)}-${this._label(b)}(${w})`;
	}

	private _graph(
		dist: number[],
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, GraphEdgeState>
	): GraphData {
		const nodeNote: Record<number, string> = {};
		for (let i = 0; i < dist.length; i++) nodeNote[i] = this._fmt(dist[i]);
		return {
			nodes: this._labels.map((label, id) => ({ id, label })),
			edges: this._edges.map(([from, to, weight]) => ({ from, to, weight })),
			directed: this._directed,
			nodeState,
			edgeState,
			nodeNote
		};
	}

	private _emit(
		type: StepType,
		description: string,
		dist: number[],
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, GraphEdgeState>,
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...dist],
			highlights: [],
			pseudocodeLine,
			graph: this._graph(dist, nodeState, edgeState)
		});
	}

}
