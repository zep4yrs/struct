/**
 * Tarjan 强连通分量引擎 — TarjanEngine
 *
 * Tarjan 算法：一次 DFS 求有向图全部强连通分量（SCC）。
 *   dfn[u] = DFS 时间戳；low[u] = u 能回溯到的最早时间戳
 *   当 dfn[u] == low[u] 时，栈中 u 之上（含 u）的节点构成一个 SCC。
 * 每步 graph 快照：nodeState 标记访问状态/当前节点/已完成的 SCC，
 * nodeNote 显示 dfn/low 值。渲染用 graph。
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
import { parseEdgeList, parseLabelList } from '../parseInput';

export interface TarjanInput {
	labels: string[];
	edges: [number, number][];
}

const PSEUDO: string[] = [
	'procedure Tarjan(u):',
	'  dfn[u] ← low[u] ← ++index; push(u); inStack[u] ← true',
	'  for each (u, v) do',
	'    if v 未访问: Tarjan(v); low[u] = min(low[u], low[v])',
	'    else if inStack[v]: low[u] = min(low[u], dfn[v])',
	'  if dfn[u] == low[u]:',
	'    弹栈直到 u —— 这些点构成一个强连通分量',
	'end procedure'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: 'Tarjan 算法中 low[u] 的含义是？',
		options: [
			'u 或其子树能回溯到的最早时间戳',
			'u 的入度',
			'u 所在 SCC 的最大编号',
			'u 被访问的次数'
		],
		correctAnswer: 'u 或其子树能回溯到的最早时间戳',
		hint: 'low 值决定何时切分 SCC',
		explanation:
			'low[u] 记录 u 及其后代通过返祖边能到达的最早时间戳。当 dfn[u]==low[u] 时 u 无法回到更早的节点，栈内它之上的节点构成一个 SCC。'
	},
	{
		type: 'choose-next',
		stepIndex: 8,
		prompt: 'dfn[u] == low[u] 成立意味着？',
		options: ['u 是某个 SCC 的根', 'u 是孤立点', '图有环', 'u 入度为 0'],
		correctAnswer: 'u 是某个 SCC 的根',
		hint: '此时无法再向上回溯',
		explanation:
			'dfn==low 说明从 u 出发的子树都到不了比 u 更早的节点——u 就是其所在 SCC 中最早被访问的点，弹栈即得该分量。'
	}
];

// 教材示例:6 节点两个 SCC({0,1,2} 与 {3,4,5})
const DEFAULT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DEFAULT_EDGE_LIST: [number, number][] = [
	[0, 1],
	[1, 2],
	[2, 0],
	[2, 3],
	[3, 4],
	[4, 5],
	[5, 3]
];

export class TarjanEngine extends EngineBase<TarjanInput> {
	readonly name = 'Tarjan 强连通分量';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'Tarjan 强连通分量：一次 DFS 找出所有强连通分量。dfn 是访问时间戳，low 是能回溯到的最早时间戳。'
		},
		{ type: 'compare', narration: '访问节点，打时间戳并压栈；递归子节点后用子树 low 值更新。' },
		{ type: 'edge-reject', narration: '遇到已在栈中的节点（返祖边），更新 low 为 dfn——发现回路。' },
		{ type: 'edge-select', narration: 'dfn == low：当前节点是 SCC 的根，弹栈得到一个完整分量。' },
		{ type: 'complete', narration: 'Tarjan 完成：所有强连通分量已找出，复杂度 O(V+E)。' }
	];
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	presets: EnginePreset[] = [{ name: '教材示例', description: '6 节点两个 SCC' }];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'labels',
				label: '顶点标签（逗号分隔）',
				type: 'text',
				placeholder: '如 A,B,C,D,E,F',
				default: 'A,B,C,D,E,F'
			},
			{
				key: 'edges',
				label: '有向边（如 0-1,1-2,2-0）',
				type: 'text',
				placeholder: '0-1,1-2,2-0,2-3',
				default: '0-1,1-2,2-0,2-3,3-4,4-5,5-3'
			}
		]
	};

	private _labels: string[] = [];
	private _edges: [number, number][] = [];

	applyPreset(_name: string): void {
		this.init({ labels: DEFAULT_LABELS, edges: DEFAULT_EDGE_LIST });
	}

	applyCustom(values: Record<string, string>): void {
		const labels = parseLabelList(values.labels ?? '', { min: 2, max: 10 });
		const edges = parseEdgeList(values.edges ?? '', { maxIndex: labels.length - 1 });
		if (!edges.length) throw new Error('至少需要一条边');
		this.init({ labels, edges });
	}

	init(input: TarjanInput): void {
		const { labels, edges } = input;
		this._labels = [...labels];
		this._edges = [...edges];
		const n = labels.length;

		this.steps = [];
		this._stepId = 0;

		// 邻接表
		const adj: number[][] = Array.from({ length: n }, () => []);
		for (const [a, b] of edges) adj[a].push(b);

		const dfn = new Array(n).fill(0);
		const low = new Array(n).fill(0);
		const inStack = new Array(n).fill(false);
		const visited = new Array(n).fill(false);
		const stack: number[] = [];
		let index = 0;
		const sccCount = { n: 0 };
		const sccOf = new Array(n).fill(-1);

		let allDone = false;
		const mkGraph = (
			active: number[],
			cur: number | null,
			sccDone: number[][] = [],
			sccColorSeed = 0
		): GraphData => {
			const nodeState: Record<number, GraphNodeState> = {};
			for (let i = 0; i < n; i++) {
				nodeState[i] = allDone ? 'done' : visited[i] ? 'visited' : 'unvisited';
			}
			for (let i = 0; i < n; i++) {
				if (inStack[i]) nodeState[i] = 'frontier';
			}
			for (const comp of sccDone) {
				for (const v of comp) nodeState[v] = 'done';
			}
			if (cur !== null) nodeState[cur] = 'current';
			void active;
			void sccColorSeed;
			return {
				nodes: this._labels.map((l, id) => ({ id, label: l })),
				edges: this._edges.map(([a, b]) => ({ from: a, to: b })),
				directed: true,
				nodeState,
				nodeNote: Object.fromEntries(
					this._labels.map((_, i) => [
						i,
						(dfn[i] ? 'dfn=' + dfn[i] : '') + (dfn[i] && low[i] ? ' low=' + low[i] : '')
					])
				)
			};
		};

		this._emit(
			'init',
			'Tarjan 强连通分量：一次 DFS 找出所有 SCC。dfn = 访问时间戳，low = 能回溯到的最早时间戳。',
			mkGraph([], null),
			0
		);

		const dfs = (u: number): void => {
			dfn[u] = low[u] = ++index;
			stack.push(u);
			inStack[u] = true;
			visited[u] = true;
			this._emit(
				'compare',
				`访问 ${this._label(u)}：dfn[${this._label(u)}] = low[${this._label(u)}] = ${dfn[u]}，入栈。`,
				mkGraph(stack, u),
				1
			);

			for (const v of adj[u]) {
				if (!visited[v]) {
					this._emit(
						'edge-candidate',
						`${this._label(u)} → ${this._label(v)} 未访问：递归 Tarjan(${this._label(v)})。`,
						mkGraph(stack, u),
						3
					);
					dfs(v);
					const oldLow = low[u];
					low[u] = Math.min(low[u], low[v]);
					this._emit(
						'compare',
						`回溯 ${this._label(v)}：low[${this._label(u)}] = min(low[${this._label(u)}], low[${this._label(v)}]) = ${low[u]}${oldLow !== low[u] ? '（更新）' : ''}。`,
						mkGraph(stack, u),
						4
					);
				} else if (inStack[v]) {
					const oldLow = low[u];
					low[u] = Math.min(low[u], dfn[v]);
					this._emit(
						'edge-reject',
						`${this._label(u)} → ${this._label(v)} 在栈中（返祖边）：low[${this._label(u)}] = min(low, dfn[${this._label(v)}]) = ${low[u]}${oldLow !== low[u] ? '（更新！）发现回路' : ''}。`,
						mkGraph(stack, u),
						5
					);
				}
			}

			if (dfn[u] === low[u]) {
				const comp: number[] = [];
				while (stack.length) {
					const w = stack.pop()!;
					inStack[w] = false;
					sccOf[w] = sccCount.n;
					comp.push(w);
					if (w === u) break;
				}
				sccCount.n++;
				this._emit(
					'edge-select',
					`dfn == low：弹出 SCC #{${sccCount.n}} = {${comp.map((i) => this._label(i)).join(', ')}}。`,
					mkGraph(stack, null, [comp]),
					7
				);
			}
		};

		for (let i = 0; i < n; i++) {
			if (!visited[i]) dfs(i);
		}

		allDone = true;
		this._emit(
			'complete',
			`Tarjan 完成：共找到 ${sccCount.n} 个强连通分量。时间复杂度 O(V+E)，一次 DFS 即可。`,
			mkGraph([], null),
			7
		);
		this.totalSteps = this.steps.length;
	}

	private _label(i: number): string {
		return this._labels[i] ?? String(i);
	}

	private _emit(
		type: StepType,
		description: string,
		graph: GraphData,
		pseudocodeLine: number
	): void {
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
