/**
 * 拓扑排序引擎 — TopoSortEngine
 *
 * Kahn 算法（入度表 + 队列）：每轮把入度为 0 的顶点入队、出队输出，并更新邻居入度；
 * 若最终输出顶点不足 n 个，说明图中存在环。
 * 每帧携带 graph 快照（节点/边 + nodeState + nodeNote 实时入度），
 * 由 graph 渲染器环形布局绘制。引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmStep,
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

export interface TopoSortInput {
	/** 节点标签（索引即节点 id） */
	labels: string[];
	/** 有向边对 [from, to] */
	edges: [number, number][];
}

const TOPO_PSEUDO: string[] = [
	'procedure TopologicalSort(G)',
	'  indegree ← 计算各顶点入度',
	'  queue ← 所有 indegree 为 0 的顶点',
	'  while queue not empty do',
	'    u ← dequeue(queue); 输出 u',
	'    for each 出边 (u, v) do',
	'      indegree[v] ← indegree[v] - 1',
	'      if indegree[v] = 0 then enqueue(v)',
	'  end while',
	'  if 输出的顶点数 < n then 图中存在环',
	'end procedure'
];

// 练习基于默认演示图（0→1, 0→2, 1→3, 1→4, 2→4, 2→5, 3→5）：
// Kahn 输出序列 0, 1, 2, 3, 4, 5
const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: 'Kahn 算法第 2 个输出的顶点是？',
		options: ['0', '1', '2', '3'],
		correctAnswer: '1',
		hint: '输出 0 后，它的出边被删除，哪些顶点的入度变为 0？',
		explanation:
			'输出 0 后删除出边 0→1、0→2，顶点 1、2 的入度都变为 0；队列按编号升序，先出 1，序列为 0, 1。'
	}
];

const DEFAULT_EDGES: [number, number][] = [
	[0, 1],
	[0, 2],
	[1, 3],
	[1, 4],
	[2, 4],
	[2, 5],
	[3, 5]
];

export class TopoSortEngine extends EngineBase<TopoSortInput> {
	readonly name = '拓扑排序';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = TOPO_PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'拓扑排序：把有向无环图（DAG）的所有顶点排成一个线性序列，使每条边都从前指向后——常用于选课顺序、工程工序。顶点下方的数字是当前入度（指向它的边数）。'
		},
		{
			type: 'edge-candidate',
			narration: '入度为 0 的顶点没有前置依赖，可以排到当前位，把它们加入队列。'
		},
		{
			type: 'edge-select',
			narration: '输出队列头顶点并删除它的全部出边，受影响邻居的入度减 1。'
		},
		{
			type: 'edge-reject',
			narration: '还有顶点剩余但入度都不为 0，说明图中存在环，无法完成拓扑排序。'
		},
		{
			type: 'complete',
			narration:
				'拓扑排序完成。有环的图无法拓扑排序；拓扑序列通常不唯一——本例中 1 和 2 的先后可互换，都是合法序列。'
		}
	];

	private _labels: string[] = [];
	private _edges: [number, number][] = [];

	presets: EnginePreset[] = [
		{ name: '教材示例 DAG', description: '选课依赖无环图（6 顶点 7 边）' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义有向图',
		fields: [
			{
				key: 'labels',
				label: '顶点列表',
				type: 'text',
				placeholder: '逗号分隔，如 0, 1, 2, 3, 4, 5',
				default: '0, 1, 2, 3, 4, 5'
			},
			{
				key: 'edges',
				label: '有向边列表',
				type: 'text',
				placeholder: '如 0-1, 0-2, 1-3（从前者指向后者）',
				default: '0-1, 0-2, 1-3, 1-4, 2-4, 2-5, 3-5'
			}
		]
	};

	applyPreset(name: string): void {
		this.init({ labels: ['0', '1', '2', '3', '4', '5'], edges: DEFAULT_EDGES });
	}

	applyCustom(values: Record<string, string>): void {
		const labels = parseLabelList(values.labels ?? '', { min: 2, max: 12 });
		const edges = parseEdgeList(values.edges ?? '', { maxIndex: labels.length - 1 });
		this.init({ labels, edges });
	}

	init(input: TopoSortInput): void {
		const { labels, edges } = input;
		this._labels = [...labels];
		this._edges = [...edges];

		this.steps = [];
		this._stepId = 0;

		const n = labels.length;
		const indegree = this._labels.map(() => 0);
		for (const [, b] of edges) indegree[b]++;

		this._emit(
			'init',
			`有向图共 ${n} 个顶点、${edges.length} 条边。计算各顶点入度，入度为 0 的顶点可先输出。`,
			[],
			indegree,
			[],
			1
		);

		const seq: number[] = [];
		const queue: number[] = [];
		for (let i = 0; i < n; i++) {
			if (indegree[i] === 0) queue.push(i);
		}

		while (queue.length > 0) {
			if (queue.length > 0) {
				this._emit(
					'edge-candidate',
					`当前入度为 0 的顶点：${queue.map((i) => this._label(i)).join('、')}，依次入队。`,
					seq,
					indegree,
					[...queue],
					2
				);
			}
			const u = queue.shift()!;
			seq.push(u);
			const affected: number[] = [];
			for (let ei = 0; ei < this._edges.length; ei++) {
				const [a, b] = this._edges[ei];
				if (a === u) {
					indegree[b]--;
					if (indegree[b] === 0) {
						queue.push(b);
						queue.sort((x, y) => x - y);
					}
					if (!affected.includes(b)) affected.push(b);
				}
			}
			const inText = affected.length
				? affected
						.map((b) => `${this._label(b)} 的入度 ${indegree[b] + 1}→${indegree[b]}`)
						.join('，')
				: '无出边';
			this._emit(
				'edge-select',
				`输出顶点 ${this._label(u)}，拓扑序列：[${seq.map((i) => this._label(i)).join(', ')}]。删除其出边后：${inText}。`,
				seq,
				indegree,
				[],
				4,
				[u]
			);
		}

		if (seq.length < n) {
			this._emit(
				'edge-reject',
				`剩余 ${n - seq.length} 个顶点入度都不为 0：图中存在环，无法进行拓扑排序。`,
				seq,
				indegree,
				[],
				9
			);
		}
		this._emit(
			'complete',
			seq.length === n
				? `拓扑排序完成，序列：${seq.map((i) => this._label(i)).join(' → ')}。`
				: `拓扑排序失败：图中存在环。当前序列：${seq.map((i) => this._label(i)).join(', ')}。`,
			seq,
			indegree,
			[],
			10
		);
		this.totalSteps = this.steps.length;
	}

	private _label(id: number): string {
		return this._labels[id] ?? String(id);
	}

	private _graph(
		seq: number[],
		indegree: number[],
		frontier: number[],
		current: number[]
	): GraphData {
		const nodeState: Record<number, GraphNodeState> = {};
		for (const id of current) nodeState[id] = 'current';
		for (const id of frontier) {
			if (!(id in nodeState)) nodeState[id] = 'frontier';
		}
		for (const id of seq) {
			if (!(id in nodeState)) nodeState[id] = 'done';
		}
		const nodeNote: Record<number, string> = {};
		for (let i = 0; i < indegree.length; i++) nodeNote[i] = `in=${indegree[i]}`;
		return {
			nodes: this._labels.map((label, id) => ({ id, label })),
			edges: this._edges.map(([from, to]) => ({ from, to })),
			directed: true,
			nodeState,
			nodeNote
		};
	}

	private _emit(
		type: StepType,
		description: string,
		seq: number[],
		indegree: number[],
		frontier: number[],
		pseudocodeLine: number,
		current?: number[]
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...seq],
			highlights: [],
			pseudocodeLine,
			graph: this._graph(seq, indegree, frontier, current ?? [])
		});
	}

}
