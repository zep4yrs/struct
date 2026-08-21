/**
 * 二分图判定引擎 — BipartiteEngine
 *
 * BFS 交替染色法：从任一未染色顶点出发，相邻顶点染相反颜色；
 * 若遇到相邻同色 → 不是二分图。染色完成且无冲突 → 是二分图，两组即两个颜色集合。
 * nodeState: frontier=颜色A、visited=颜色B（渲染器用不同色区分），
 * nodeNote 标注颜色组别。渲染用 graph。
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
	'// 二分图判定：BFS 交替染色',
	'color[所有] ← 未染色',
	'for each 未染色的 v:',
	'  color[v] ← A',
	'  queue ← [v]',
	'  while queue not empty:',
	'    u ← dequeue',
	'    for each (u, w):',
	'      if color[w] == color[u]: 不是二分图',
	'      if color[w] 未染色: color[w] ← 相反色; enqueue(w)',
	'end for'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '一个图是二分图的充要条件是？',
		options: [
			'可以用两种颜色染色使相邻顶点异色（无奇环）',
			'是连通图',
			'边数为偶数',
			'顶点数是偶数'
		],
		correctAnswer: '可以用两种颜色染色使相邻顶点异色（无奇环）',
		hint: '关键在"奇数长度回路"',
		explanation:
			'图可二分 ⟺ 不含奇数长度的环。偶环可以交替染色；奇环绕一圈回到起点必然与自己同色冲突。'
	},
	{
		type: 'choose-next',
		stepIndex: 7,
		prompt: '判定过程中发现相邻两点同色，说明？',
		options: ['存在奇环，不是二分图', '是二分图', '图不连通', '算法出错'],
		correctAnswer: '存在奇环，不是二分图',
		hint: '同色冲突的根源',
		explanation: 'BFS 染色中相邻同色意味着存在奇数长度的回路——这正是二分图判定的反例条件。'
	}
];

// 教材示例：6 节点二分图
const DEFAULT_LABELS = ['1', '2', '3', '4', '5', '6'];
const DEFAULT_EDGES: [number, number][] = [
	[0, 3],
	[0, 4],
	{ from: 0, to: 5 },
	[1, 3],
	[1, 5],
	[2, 4]
].map((e) => ('from' in e ? [e.from, e.to] : [e[0], e[1]])) as [number, number][];

export interface BipartiteInput {
	labels: string[];
	edges: [number, number][];
}

export class BipartiteEngine extends EngineBase<BipartiteInput> {
	readonly name = '二分图判定';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '二分图判定：把顶点分成两组，使每条边的两端分属不同组。用 BFS 交替染色即可判定。'
		},
		{
			type: 'compare',
			narration: '出队一个顶点，检查它的邻居颜色。'
		},
		{
			type: 'edge-select',
			narration: '邻居未染色：染上相反的颜色并入队。'
		},
		{
			type: 'edge-reject',
			narration: '邻居与本点同色——发现奇环，不是二分图！'
		},
		{
			type: 'complete',
			narration: '染色完成且无冲突：这是二分图。两组颜色集合就是二分图的左右部。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '6 节点二分图' }];

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
				label: '无向边（如 0-3,0-4）',
				type: 'text',
				placeholder: '0-3,0-4,0-5,1-3,1-5,2-4',
				default: '0-3,0-4,0-5,1-3,1-5,2-4'
			}
		]
	};

	private _labels: string[] = [];
	private _edges: [number, number][] = [];

	private _label(i: number): string {
		return this._labels[i] ?? String(i);
	}

	applyPreset(_name: string): void {
		this.init({
			labels: [...DEFAULT_LABELS],
			edges: DEFAULT_EDGES.map((e) => [...e] as [number, number])
		});
	}

	applyCustom(values: Record<string, string>): void {
		const labels = parseLabelListSafe(values.labels ?? '');
		const edges = parseEdgeListSafe(values.edges ?? '', labels.length - 1);
		if (!edges.length) throw new Error('至少需要一条边');
		this.init({ labels, edges });
	}

	init(input: { labels: string[]; edges: [number, number][] }): void {
		const { labels, edges } = input;
		this._labels = [...labels];
		this._edges = edges.map((e) => [...e] as [number, number]);
		const n = labels.length;

		this.steps = [];
		this._stepId = 0;

		const adj: number[][] = Array.from({ length: n }, () => []);
		for (const [a, b] of this._edges) {
			adj[a].push(b);
			adj[b].push(a);
		}

		// color: -1 未染色, 0/1 两组
		const color = new Array(n).fill(-1);

		const mkGraph = (cur: number | null, conflict: number[] = []): GraphData => {
			const nodeState: Record<number, GraphNodeState> = {};
			for (let i = 0; i < n; i++) {
				nodeState[i] = color[i] === 0 ? 'frontier' : color[i] === 1 ? 'visited' : 'unvisited';
			}
			for (const c of conflict) nodeState[c] = 'current';
			if (cur !== null) nodeState[cur] = 'current';
			return {
				nodes: labels.map((l, id) => ({ id, label: l })),
				edges: this._edges.map(([a, b]) => ({ from: a, to: b })),
				directed: false,
				nodeState,
				nodeNote: Object.fromEntries(
					labels.map((_, i) => [i, color[i] === 0 ? 'A 组' : color[i] === 1 ? 'B 组' : ''])
				)
			};
		};

		this._emit(
			'init',
			'二分图判定：BFS 交替染色。相邻顶点必须异色；出现同色相邻即非二分图。',
			mkGraph(null),
			0
		);

		let isBipartite = true;
		for (let start = 0; start < n; start++) {
			if (color[start] !== -1) continue;
			color[start] = 0;
			const q = [start];
			this._emit('compare', `新连通分量：${this._label(start)} 染 A 组，入队。`, mkGraph(start), 1);
			while (q.length) {
				const u = q.shift()!;
				this._emit(
					'compare',
					`出队 ${this._label(u)}（${color[u] === 0 ? 'A' : 'B'} 组）：检查其 ${adj[u].length} 个邻居。`,
					mkGraph(u),
					2
				);
				for (const v of adj[u]) {
					if (color[v] === -1) {
						color[v] = 1 - color[u];
						q.push(v);
						this._emit(
							'edge-select',
							`${this._label(u)}–${this._label(v)}：${this._label(v)} 未染色 → 染 ${color[v] === 0 ? 'A' : 'B'} 组，入队。`,
							mkGraph(v),
							3
						);
					} else if (color[v] === color[u]) {
						isBipartite = false;
						this._emit(
							'edge-reject',
							`冲突！${this._label(u)} 与 ${this._label(v)} 同为 ${color[u] === 0 ? 'A' : 'B'} 组但相邻——存在奇环，不是二分图。`,
							mkGraph(u, [v]),
							4
						);
						break;
					}
				}
				if (!isBipartite) break;
			}
			if (!isBipartite) break;
		}

		if (isBipartite) {
			const gA = labels.filter((_, i) => color[i] === 0).join('、');
			const gB = labels.filter((_, i) => color[i] === 1).join('、');
			this._emit(
				'complete',
				`染色完成无冲突：是二分图。左部（A）= {${gA}}，右部（B）= {${gB}}。`,
				mkGraph(null),
				7
			);
		}
		this.totalSteps = this.steps.length;
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

function parseLabelListSafe(text: string): string[] {
	const parts = text
		.split(/[,，\s]+/)
		.map((s) => s.trim())
		.filter(Boolean);
	if (parts.length < 2) throw new Error('至少需要 2 个顶点');
	return parts.slice(0, 12);
}

function parseEdgeListSafe(text: string, maxIndex: number): [number, number][] {
	const parts = text
		.split(/[,，\s]+/)
		.map((s) => s.trim())
		.filter(Boolean);
	const edges: [number, number][] = [];
	for (const part of parts) {
		const m = part.match(/^(\d+)[-–](\d+)$/);
		if (!m) throw new Error('边格式应为 a-b（如 0-3）');
		const a = Number(m[1]);
		const b = Number(m[2]);
		if (a > maxIndex || b > maxIndex || a === b) throw new Error('边端点越界或自环');
		edges.push([a, b]);
	}
	return edges;
}
