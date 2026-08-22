/**
 * 割点引擎 — CutVerticesEngine
 *
 * Tarjan 求割点：无向图 DFS，low[child] >= dfn[u] 时 u 为割点（根需两棵以上子树）。
 * 渲染用 graph（无向）。割点在 nodeNote 标注【割点】并标红。
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
	'procedure cutCheck(u):',
	'  root: childCount >= 2 => cut vertex',
	'  non-root: exists child v with low[v] >= dfn[u] => cut vertex'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '割点的定义是？',
		options: ['删除后连通分量增加的顶点', '度最大的顶点', '入度为 0 的点', '桥的端点'],
		correctAnswer: '删除后连通分量增加的顶点',
		hint: '关键节点',
		explanation: '割点（关节点）删除后图被切分成更多部分——网络可靠性分析的核心概念。'
	}
];

export class CutVerticesEngine extends EngineBase<number[]> {
	readonly name = '割点检测';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '割点检测：删除该顶点会使连通分量增加。用 Tarjan 的 low 值判定。' },
		{ type: 'compare', narration: 'DFS 中计算 dfn/low。' },
		{ type: 'edge-select', narration: 'low[child] >= dfn[u] 时 u 是割点。' },
		{ type: 'complete', narration: '完成。割点是网络脆弱性的关键指标。' }
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '7 节点' }];

	customConfig: EngineCustomConfig = { title: '割点演示', fields: [] };

	private _labels: string[] = [];
	private _edges: [number, number][] = [];

	private _label(i: number): string {
		return this._labels[i] ?? String(i);
	}

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
		this._labels = labels;
		const edges: [number, number][] = [
			[0, 1],
			[1, 2],
			[2, 0],
			[2, 3],
			[3, 4],
			[4, 5],
			[5, 6]
		];
		this._edges = edges;
		const n = labels.length;
		const adj: number[][] = Array.from({ length: n }, () => []);
		for (const [a, b] of edges) {
			adj[a].push(b);
			adj[b].push(a);
		}

		const dfn = new Array(n).fill(0);
		const low = new Array(n).fill(0);
		const visited = new Array(n).fill(false);
		let index = 0;
		const cutPoints = new Set<number>();

		const mkGraph = (cur: number | null): GraphData => ({
			nodes: labels.map((l, id) => ({ id, label: l })),
			edges: edges.map(([a, b]) => ({ from: a, to: b })),
			directed: false,
			nodeState: Object.fromEntries(
				labels.map((_, i) => [
					i,
					i === cur
						? ('current' as GraphNodeState)
						: cutPoints.has(i)
							? ('done' as GraphNodeState)
							: visited[i]
								? ('visited' as GraphNodeState)
								: ('unvisited' as GraphNodeState)
				])
			),
			nodeNote: Object.fromEntries(
				labels.map((_, i) => [
					i,
					(dfn[i] ? 'dfn=' + dfn[i] + ' low=' + low[i] : '') + (cutPoints.has(i) ? ' 【割点】' : '')
				])
			)
		});

		this._emit(
			'init',
			'割点检测：删除某顶点使连通分量增加，则它是割点。DFS 中用 low 值判定。',
			mkGraph(null),
			0
		);

		const dfs = (u: number, parent: number): void => {
			dfn[u] = low[u] = ++index;
			visited[u] = true;
			this._emit('compare', `访问 ${this._label(u)}：dfn=low=${dfn[u]}。`, mkGraph(u), 1);
			let childCount = 0;
			for (const v of adj[u]) {
				if (!visited[v]) {
					childCount++;
					dfs(v, u);
					low[u] = Math.min(low[u], low[v]);
					if ((parent === -1 && childCount === 2) || (parent !== -1 && low[v] >= dfn[u])) {
						cutPoints.add(u);
						this._emit(
							'edge-select',
							`割点：${this._label(u)} 被移除后图断开（low[${this._label(v)}]=${low[v]} >= dfn[${this._label(u)}]=${dfn[u]} 或根多子树）。`,
							mkGraph(u),
							2
						);
					}
				} else if (v !== parent) {
					low[u] = Math.min(low[u], dfn[v]);
				}
			}
		};

		dfs(0, -1);

		this._emit(
			'complete',
			`完成：共找到 ${cutPoints.size} 个割点（${[...cutPoints].map((i) => this._label(i)).join('、') || '无'}）。`,
			mkGraph(null),
			3
		);
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
