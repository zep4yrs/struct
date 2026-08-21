/**
 * 最大流引擎 — MaxFlowEngine（Edmonds-Karp）
 *
 * Edmonds-Karp = BFS 版 Ford-Fulkerson：反复在残余网络中 BFS 找 s→t 最短增广路，
 * 沿路推送瓶颈容量，直到无增广路。累计流量即最大流。
 * 图数据：节点 = 顶点，边带 label「flow/cap」；edgeState 标记增广路。
 * 渲染用 graph（环形布局）。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	GraphData,
	GraphNodeState,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// Edmonds-Karp：BFS 找最短增广路',
	'maxflow = 0',
	'while true:',
	'  在残余网络中 BFS 找 s → t 的最短增广路 P',
	'  if P 不存在: break',
	'  f = min(残余容量 along P)   // 瓶颈',
	'  maxflow += f',
	'  沿 P 正向减 f、反向加 f',
	'end while'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'Edmonds-Karp 用什么方式找增广路？',
		options: ['BFS 最短路', 'DFS 任意路径', 'Dijkstra', '随机游走'],
		correctAnswer: 'BFS 最短路',
		hint: '按边数最少找路径',
		explanation:
			'Edmonds-Karp 是 Ford-Fulkerson 的 BFS 实现：每次沿"边数最少"的增广路推流。这一保证使复杂度收敛到 O(VE²)。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '一次增广的推送量由什么决定？',
		options: ['路径上最小的残余容量（瓶颈）', '源点的出度', '汇点的入度', '边的总数'],
		correctAnswer: '路径上最小的残余容量（瓶颈）',
		hint: '水桶效应',
		explanation:
			'一条增广路能推多少流量受限于路上残余容量最小的边（瓶颈边）。推完瓶颈边饱和，需要另找新路径。'
	}
];

// 教材经典网络：s=0, t=5
const V_LABELS = ['S', 'A', 'B', 'C', 'D', 'T'];
// [from, to, cap]
const V_EDGES: [number, number, number][] = [
	[0, 1, 10],
	[0, 2, 10],
	[1, 2, 2],
	[1, 3, 4],
	[1, 4, 8],
	[2, 4, 9],
	[3, 5, 10],
	[4, 3, 6],
	[4, 5, 10]
];

export class MaxFlowEngine extends EngineBase<number[]> {
	readonly name = '最大流 Edmonds-Karp';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'最大流问题：从源点 S 到汇点 T，每条边有容量上限，求单位时间最多能输送多少流量。Edmonds-Karp 用 BFS 反复找增广路。'
		},
		{
			type: 'compare',
			narration: '在残余网络中 BFS，寻找 S 到 T 的最短增广路。'
		},
		{
			type: 'edge-select',
			narration: '找到增广路：沿路推送瓶颈容量的流量，正向容量减少、反向容量增加。'
		},
		{
			type: 'edge-reject',
			narration: '残余网络中不存在新的增广路——当前累计流量就是最大流。'
		},
		{
			type: 'complete',
			narration:
				'算法结束。最大流等于每次增广的瓶颈之和；复杂度 O(V·E²)，其中增广次数不超过 O(V·E)。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材网络', description: '6 顶点 9 边，S→T 最大流 19' }];

	customConfig: EngineCustomConfig = { title: '最大流演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const n = V_LABELS.length;
		const S = 0;
		const T = n - 1;
		// 容量矩阵 + 邻接表（含反向边）
		const cap: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
		const flow: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
		const adj: number[][] = Array.from({ length: n }, () => []);
		const edgeList = V_EDGES;
		for (const [a, b, c] of edgeList) {
			cap[a][b] += c;
			if (cap[b][a] === 0 && a !== b) adj[b].push(a);
			if (!adj[a].includes(b)) adj[a].push(b);
		}

		const mkGraph = (pathEdges: Set<string>, doneEdges: Set<string>): GraphData => ({
			nodes: V_LABELS.map((l, id) => ({ id, label: l })),
			edges: edgeList.map(([a, b]) => {
				const f = flow[a][b];
				const c = cap[a][b];
				const key = a + '-' + b;
				void pathEdges;
				void doneEdges;
				void key;
				return {
					from: a,
					to: b,
					label: f + '/' + c,
					weight: c
				};
			}),
			directed: true,
			nodeNote: {}
		});

		this._emit(
			'init',
			'初始网络：S 为源、T 为汇，边标注 流量/容量。最大流 = 0。',
			mkGraph(new Set(), new Set()),
			1
		);

		let totalFlow = 0;
		let round = 0;
		for (;;) {
			round++;
			// BFS 找增广路
			const prev = new Array(n).fill(-1);
			prev[S] = S;
			const q = [S];
			while (q.length) {
				const u = q.shift()!;
				for (const v of adj[u]) {
					if (prev[v] === -1 && cap[u][v] - flow[u][v] > 0) {
						prev[v] = u;
						q.push(v);
						if (v === T) break;
					}
				}
				if (prev[T] !== -1) break;
			}

			if (prev[T] === -1) {
				this._emit(
					'edge-reject',
					'BFS 未找到新的增广路——算法结束。',
					mkGraph(new Set(), new Set()),
					4
				);
				break;
			}

			// 回溯路径
			const path: number[] = [];
			for (let v = T; v !== S; v = prev[v]) path.unshift(v);
			path.unshift(S);

			// 瓶颈
			let bottleneck = Infinity;
			for (let i = 0; i < path.length - 1; i++) {
				const a = path[i];
				const b = path[i + 1];
				bottleneck = Math.min(bottleneck, cap[a][b] - flow[a][b]);
			}
			totalFlow += bottleneck;

			this._emit(
				'compare',
				`第 ${round} 轮 BFS 找到增广路 ${path.map((i) => V_LABELS[i]).join(' → ')}，瓶颈 = ${bottleneck}。`,
				mkGraph(pathEdgesOf(path), new Set()),
				3,
				path
			);

			// 推流
			for (let i = 0; i < path.length - 1; i++) {
				const a = path[i];
				const b = path[i + 1];
				flow[a][b] += bottleneck;
				flow[b][a] -= bottleneck;
			}

			this._emit(
				'edge-select',
				`沿增广路推入 ${bottleneck} 单位流量：当前总流量 = ${totalFlow}。`,
				mkGraph(new Set(), pathEdgesOf(path)),
				6
			);
		}

		this._emit(
			'complete',
			`最大流 = ${totalFlow}（共 ${round - 1} 轮增广）。割集验证：与 S 相连不可达部分的边界即最小割。`,
			mkGraph(new Set(), new Set()),
			7
		);
		this.totalSteps = this.steps.length;

		function pathEdgesOf(p: number[]): Set<string> {
			const set = new Set<string>();
			for (let i = 0; i < p.length - 1; i++) set.add(p[i] + '-' + p[i + 1]);
			return set;
		}
	}

	private _emit(
		type: StepType,
		description: string,
		graph: GraphData,
		pseudocodeLine: number,
		activeNodes?: number[]
	): void {
		if (activeNodes?.length) {
			const st: Record<number, GraphNodeState> = {};
			for (const v of activeNodes) st[v] = 'current';
			graph.nodeState = { ...(graph.nodeState ?? {}), ...st };
		}
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine,
			graph
		});
	}
}
