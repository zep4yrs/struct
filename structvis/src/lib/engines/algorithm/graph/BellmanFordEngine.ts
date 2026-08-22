/**
 * Bellman-Ford 最短路引擎 — BellmanFordEngine
 *
 * Bellman-Ford：单源最短路，允许负权边。初始化源点 dist=0、其余 ∞，
 * 每轮遍历所有边做松弛（dist[u]+w < dist[v] 则更新），共最多 n-1 轮；
 * 若某一轮无任何更新则提前收敛。若 n-1 轮后仍能更新，则存在负权环。
 * 每步 graph 快照：nodeNote 显示当前 dist，渲染用 graph。
 */

import type {
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

const PSEUDO: string[] = [
	'procedure BellmanFord(G, s)',
	'  dist[s] ← 0; 其余顶点 dist[v] ← ∞',
	'  for i = 1 to n-1 do',
	'    for each 边 (u, v, w) do',
	'      if dist[u] + w < dist[v] then dist[v] ← dist[u] + w   // 松弛',
	'    if 本轮无任何更新: break              // 提前收敛',
	'  if 第 n-1 轮仍能更新: 图含负权环'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'Bellman-Ford 每轮要做的事是？',
		options: ['遍历所有边做一次松弛', '选出 dist 最小的顶点', '按拓扑序处理', '只处理源点的邻居'],
		correctAnswer: '遍历所有边做一次松弛',
		hint: '它与 Dijkstra 不同，不看"当前最小"',
		explanation:
			'Bellman-Ford 每轮把图中所有边都松弛一遍，因此能正确处理负权边（这是它的优势）；经过至多 n-1 轮，dist 要么收敛要么说明存在负权环。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '若第 n-1 轮过后仍有一条边能被松弛，说明什么？',
		options: ['图含负权环', '图不连通', '图是无向图', '算法写错了'],
		correctAnswer: '图含负权环',
		hint: '没有最短路径可以一直变小',
		explanation:
			'最短路最多经过 n-1 条边。若跑完 n-1 轮还有边能继续被更新，说明存在一个能无限减小 dist 的负权环——这也是 Bellman-Ford 用来检测负环的原理。'
	}
];

// 节点 S,A,B,C,T(id 0-4)
const LABELS = ['S', 'A', 'B', 'C', 'T'];
// 有向带权边
const EDGES: [number, number, number][] = [
	[0, 1, 4],
	[0, 2, 5],
	[1, 3, -3],
	[2, 3, 6],
	[3, 4, 2],
	[1, 4, 7]
];
const N = LABELS.length;
const INF = -1; // data 中用 -1 表示 ∞
const SRC = 0;

export class BellmanFordEngine extends EngineBase<number[]> {
	readonly name = 'Bellman-Ford 最短路';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'Bellman-Ford 单源最短路：源点距离设 0、其余设 ∞，每轮把所有边松弛一遍，至多 n-1 轮收敛，允许负权边。'
		},
		{
			type: 'edge-candidate',
			narration: '遍历全部边松弛：若绕道能让邻点距离更小就更新它，并记录本轮被更新的顶点。'
		},
		{
			type: 'edge-reject',
			narration: '本轮遍历所有边后无任何顶点被更新——距离已收敛，提前结束。'
		},
		{
			type: 'complete',
			narration:
				'收敛完成。其复杂度 O(V·E)，并能检测负权环：若第 n-1 轮后仍能更新某条边，则图中存在负权环。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '教材示例', description: 'S 出发的有向带权图（含 -3 负权边）' }
	];

	customConfig: EngineCustomConfig = {
		title: '固定示例数据',
		fields: []
	};

	applyPreset(_name: string): void {
		this.init([]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const dist = new Array(N).fill(INF);
		dist[SRC] = 0;

		this._emit(
			'init',
			'Bellman-Ford: 有向带权图共 ' +
				N +
				' 顶点、' +
				EDGES.length +
				' 条边，从 ' +
				LABELS[SRC] +
				' 出发。dist[' +
				LABELS[SRC] +
				']=0，其余顶点为 ∞。',
			dist,
			{ [SRC]: 'current' },
			{},
			1
		);

		for (let r = 1; r <= N - 1; r++) {
			const updates: { v: number; val: number }[] = [];
			const selEdges: number[] = [];
			const triedEdges: number[] = [];
			for (let ei = 0; ei < EDGES.length; ei++) {
				const [a, b, w] = EDGES[ei];
				if (dist[a] === INF) {
					triedEdges.push(ei);
					continue;
				}
				const cand = dist[a] + w;
				if (dist[b] === INF || cand < dist[b]) {
					dist[b] = cand;
					updates.push({ v: b, val: cand });
					selEdges.push(ei);
				} else {
					triedEdges.push(ei);
				}
			}

			if (updates.length === 0) {
				const nodeState: Record<number, GraphNodeState> = {};
				for (let i = 0; i < N; i++) nodeState[i] = dist[i] === INF ? 'unvisited' : 'visited';
				nodeState[SRC] = 'done';
				const edgeState: Record<number, GraphEdgeState> = {};
				for (const ei of triedEdges) edgeState[ei] = 'tried';
				this._emit(
					'edge-reject',
					'第 ' + r + ' 轮：遍历全部 ' + EDGES.length + ' 条边后没有任何顶点被更新 → 提前收敛。',
					dist,
					nodeState,
					edgeState,
					6
				);
				break;
			}

			const nodeState: Record<number, GraphNodeState> = {};
			for (let i = 0; i < N; i++) nodeState[i] = dist[i] === INF ? 'unvisited' : 'visited';
			nodeState[SRC] = 'done';
			for (const u of updates) nodeState[u.v] = 'frontier';
			const edgeState: Record<number, GraphEdgeState> = {};
			for (const ei of selEdges) edgeState[ei] = 'selected';
			for (const ei of triedEdges) edgeState[ei] = 'tried';
			const desc =
				'第 ' +
				r +
				' 轮松弛（遍历 ' +
				EDGES.length +
				' 条边）：' +
				(updates.length
					? '更新 ' + updates.map((x) => LABELS[x.v] + '=' + x.val).join('，') + '。'
					: '');
			this._emit('edge-candidate', desc, dist, nodeState, edgeState, 5);
		}

		const nodeState: Record<number, GraphNodeState> = {};
		for (let i = 0; i < N; i++) nodeState[i] = dist[i] === INF ? 'unvisited' : 'done';
		const finalDist = dist.map((d, i) => LABELS[i] + '=' + this._fmt(d)).join('，');
		this._emit(
			'complete',
			'收敛！最终 dist：' +
				finalDist +
				'。Bellman-Ford 复杂度 O(V·E)；若第 ' +
				(N - 1) +
				' 轮后仍能更新某条边，则图中存在负权环。',
			dist,
			nodeState,
			{},
			7
		);
		this.totalSteps = this.steps.length;
	}

	private _fmt(d: number): string {
		return d === INF ? '∞' : String(d);
	}

	private _graph(
		dist: number[],
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, GraphEdgeState>
	): GraphData {
		const nodeNote: Record<number, string> = {};
		for (let i = 0; i < N; i++) nodeNote[i] = this._fmt(dist[i]);
		return {
			nodes: LABELS.map((label, id) => ({ id, label })),
			edges: EDGES.map(([from, to, weight]) => ({ from, to, weight })),
			directed: true,
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
