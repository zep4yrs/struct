/**
 * 关键路径引擎 — CriticalPathEngine
 *
 * AOE 网络（顶点=事件，边=活动，边权=持续时间）：先求拓扑序，
 * 再按拓扑序算 ve（事件最早发生时间）、逆拓扑序算 vl（事件最晚发生时间），
 * 最后逐活动判定 e(a)=ve[u] 与 l(a)=vl[v]-w 是否相等，相等者即关键活动。
 * 每帧携带 graph 快照（nodeNote 显示 ve/vl），由 graph 渲染器绘制。
 * 引擎是纯逻辑的，不涉及任何渲染。
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

export interface CriticalPathInput {
	/** 节点标签（索引即事件 id） */
	labels: string[];
	/** 有向活动 [from, to, duration] */
	edges: [number, number, number][];
}

const CP_PSEUDO: string[] = [
	'procedure CriticalPath(G)',
	'  对 G 求拓扑序              // AOE 网必须是有向无环图',
	'  for each v in 拓扑序 do',
	'    ve[v] ← max(ve[u] + w(u, v))  // 最早发生时间',
	'  for each v in 逆拓扑序 do',
	'    vl[v] ← min(vl[u] - w(v, u))  // 最晚发生时间（汇点 vl = ve）',
	'  for each 活动 a = (u, v) do',
	'    e(a) ← ve[u]; l(a) ← vl[v] - w(a)',
	'    if e(a) = l(a) then a 是关键活动',
	'end procedure'
];

// 练习基于默认演示图：关键路径 0→1→3→5，总工期 9
const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 26,
		prompt: '该 AOE 网络的总工期（关键路径长度）是？',
		options: ['7', '8', '9', '11'],
		correctAnswer: '9',
		hint: '总工期 = 汇点的最早发生时间 ve[汇点]',
		explanation: '关键路径 0→1→3→5 上活动时长之和为 3+4+2=9，任何一条路径都不可能更长，总工期为 9。'
	},
	{
		type: 'choose-next',
		stepIndex: 20,
		prompt: '活动 0→2（耗时 2）是关键活动吗？',
		options: ['是', '不是'],
		correctAnswer: '不是',
		hint: '比较 e(0→2) = ve[0] 与 l(0→2) = vl[2] - 2',
		explanation:
			'e(0→2) = ve[0] = 0，l(0→2) = vl[2] - 2 = 5 - 2 = 3，两者不等，所以它不是关键活动（可延误 3 天而不影响总工期）。'
	}
];

const DEFAULT_EDGES: [number, number, number][] = [
	[0, 1, 3],
	[0, 2, 2],
	[1, 3, 4],
	[1, 4, 2],
	[2, 4, 3],
	[3, 5, 2],
	[4, 5, 1]
];

export class CriticalPathEngine extends EngineBase<CriticalPathInput> {
	readonly name = '关键路径';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = CP_PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'AOE 网络：顶点表示事件，边表示活动，边上的数字是活动耗时。关键路径是图中最长路径——它决定整个工程的总工期，其上的活动（关键活动）延误一天，总工期就延误一天。'
		},
		{
			type: 'edge-select',
			narration: '先按拓扑序确定事件的先后，再用它计算最早/最晚发生时间。'
		},
		{
			type: 'edge-candidate',
			narration: '扫描相关边：ve 取入边中的最大值，vl 取出边中的最小值。'
		},
		{
			type: 'edge-reject',
			narration: '该活动最早开始与最晚开始不同步，可以延误，不是关键活动。'
		},
		{
			type: 'complete',
			narration:
				'关键活动连成关键路径，总工期 = 汇点最早发生时间。想缩短工期，只能从关键活动下手；非关键活动适当延误不影响整体进度。'
		}
	];

	private _labels: string[] = [];
	private _edges: [number, number, number][] = [];

	presets: EnginePreset[] = [
		{ name: '教材示例 AOE', description: '6 事件 7 活动，关键路径 0-1-3-5' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义 AOE 网络',
		fields: [
			{
				key: 'labels',
				label: '事件列表',
				type: 'text',
				placeholder: '逗号分隔，如 0, 1, 2, 3, 4, 5',
				default: '0, 1, 2, 3, 4, 5'
			},
			{
				key: 'edges',
				label: '活动列表（有向带权）',
				type: 'text',
				placeholder: '如 0-1:3, 1-3:4, 3-5:2',
				default: '0-1:3, 0-2:2, 1-3:4, 1-4:2, 2-4:3, 3-5:2, 4-5:1'
			}
		]
	};

	applyPreset(name: string): void {
		this.init({ labels: ['0', '1', '2', '3', '4', '5'], edges: DEFAULT_EDGES });
	}

	applyCustom(values: Record<string, string>): void {
		const labels = parseLabelList(values.labels ?? '', { min: 2, max: 12 });
		const edges = parseWeightedEdgeList(values.edges ?? '', {
			maxIndex: labels.length - 1,
			label: '活动'
		});
		this.init({ labels, edges });
	}

	init(input: CriticalPathInput): void {
		const { labels, edges } = input;
		this._labels = [...labels];
		this._edges = [...edges];

		this.steps = [];
		this._stepId = 0;

		const n = labels.length;
		this._emit(
			'init',
			`AOE 网络共 ${n} 个事件、${edges.length} 个活动。求拓扑序（AOE 必须是有向无环图），然后计算各事件的最早/最晚发生时间。`,
			[],
			{},
			{},
			0
		);

		// 1. 拓扑序（Kahn）
		const indegree = labels.map(() => 0);
		for (const [, b] of edges) indegree[b]++;
		const queue: number[] = [];
		for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i);
		const topo: number[] = [];
		while (queue.length > 0) {
			const u = queue.shift()!;
			topo.push(u);
			for (const [a, b] of this._edges) {
				if (a === u) {
					indegree[b]--;
					if (indegree[b] === 0) {
						queue.push(b);
						queue.sort((x, y) => x - y);
					}
				}
			}
			this._emit(
				'edge-select',
				`按拓扑序确定事件 ${this._label(u)}（第 ${topo.length} 个），删除其出边后入度归零的事件入队。`,
				[],
				{ [u]: 'current' },
				{},
				1
			);
		}

		if (topo.length < n) {
			this._emit(
				'edge-reject',
				`还有 ${n - topo.length} 个事件无法确定先后：图中存在环，AOE 网络非法，无法求关键路径。`,
				[],
				{},
				{},
				1
			);
			this._emit('complete', `关键路径求解失败：图中存在环。`, [], {}, {}, 9);
			this.totalSteps = this.steps.length;
			return;
		}

		// 2. ve：按拓扑序
		const ve = labels.map(() => 0);
		const noteVe = (ve: number[]): Record<number, string> => {
			const m: Record<number, string> = {};
			for (let i = 0; i < ve.length; i++) m[i] = String(ve[i]);
			return m;
		};
		for (const u of topo) {
			const inEdges: number[] = [];
			let maxV = 0;
			for (let ei = 0; ei < this._edges.length; ei++) {
				const [a, b, w] = this._edges[ei];
				if (b === u) {
					inEdges.push(ei);
					maxV = Math.max(maxV, ve[a] + w);
				}
			}
			ve[u] = maxV;
			const calcText = inEdges.length
				? `ve[${this._label(u)}] = max(${inEdges
						.map((ei) => {
							const [a, , w] = this._edges[ei];
							return `ve[${this._label(a)}](${ve[a]}) + ${w}`;
						})
						.join(', ')}) = ${maxV}`
				: `ve[${this._label(u)}] = 0（源点）`;
			this._emit(
				'edge-candidate',
				`最早发生时间：${calcText}。`,
				[],
				{ [u]: 'visited' },
				{},
				3,
				noteVe(ve)
			);
		}

		// 3. vl：按逆拓扑序
		// 汇点 = ve 最大的事件（真源点到真汇点的工期最长）
		let sink = topo[0];
		for (const u of topo) {
			if (ve[u] > ve[sink]) sink = u;
		}
		const vl = labels.map(() => 0);
		vl[sink] = ve[sink];
		const noteVeVl = (ve: number[], vl: number[]): Record<number, string> => {
			const m: Record<number, string> = {};
			for (let i = 0; i < ve.length; i++) m[i] = `${ve[i]}/${vl[i]}`;
			return m;
		};
		for (let k = topo.length - 1; k >= 0; k--) {
			const u = topo[k];
			const outEdges: number[] = [];
			let minV = Infinity;
			for (let ei = 0; ei < this._edges.length; ei++) {
				const [a, b, w] = this._edges[ei];
				if (a === u) {
					outEdges.push(ei);
					minV = Math.min(minV, vl[b] - w);
				}
			}
			if (outEdges.length === 0) {
				vl[u] = ve[u];
				this._emit(
					'edge-candidate',
					`最晚发生时间：${this._label(u)} 是汇点，vl = ve = ${ve[u]}。`,
					[],
					{ [u]: 'visited' },
					{},
					5,
					noteVeVl(ve, vl)
				);
				continue;
			}
			vl[u] = minV;
			this._emit(
				'edge-candidate',
				`最晚发生时间：vl[${this._label(u)}] = min(${outEdges
					.map((ei) => {
						const [, b, w] = this._edges[ei];
						return `vl[${this._label(b)}](${vl[b]}) - ${w}`;
					})
					.join(', ')}) = ${minV}。`,
				[],
				{ [u]: 'visited' },
				{},
				5,
				noteVeVl(ve, vl)
			);
		}

		// 4. 关键活动判定
		const critical: number[] = [];
		for (let ei = 0; ei < this._edges.length; ei++) {
			const [a, b, w] = this._edges[ei];
			const e = ve[a];
			const l = vl[b] - w;
			if (e === l) {
				critical.push(ei);
				this._emit(
					'edge-select',
					`活动 ${this._label(a)}→${this._label(b)}（耗时 ${w}）：e = ve[${this._label(a)}] = ${e}，l = vl[${this._label(b)}] - ${w} = ${l}，e = l —— 是关键活动。`,
					[...critical],
					{},
					{ [ei]: 'selected' },
					8
				);
			} else {
				this._emit(
					'edge-reject',
					`活动 ${this._label(a)}→${this._label(b)}（耗时 ${w}）：e = ${e} ≠ l = ${l}，可延误 ${l - e}，不是关键活动。`,
					[...critical],
					{},
					{ [ei]: 'tried' },
					7
				);
			}
		}

		const pathText = critical
			.map((ei) => {
				const [a] = this._edges[ei];
				return this._label(a);
			})
			.concat([this._label(sink)])
			.join(' → ');
		const finalEdgeState: Record<number, GraphEdgeState> = {};
		for (let ei = 0; ei < this._edges.length; ei++) {
			finalEdgeState[ei] = critical.includes(ei) ? 'selected' : 'tried';
		}
		this._emit(
			'complete',
			`关键活动 ${critical.map((ei) => this._label(this._edges[ei][0]) + '→' + this._label(this._edges[ei][1])).join('、')}，关键路径 ${pathText}，总工期 ${ve[sink]}。`,
			[...critical],
			{},
			finalEdgeState,
			9
		);
		this.totalSteps = this.steps.length;
	}

	private _label(id: number): string {
		return this._labels[id] ?? String(id);
	}

	private _graph(
		critical: number[],
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, GraphEdgeState>,
		nodeNote?: Record<number, string>
	): GraphData {
		const eState: Record<number, GraphEdgeState> = {};
		for (const ei of critical) eState[ei] = 'selected';
		for (const [ei, v] of Object.entries(edgeState)) {
			if (!(Number(ei) in eState)) eState[Number(ei)] = v;
		}
		return {
			nodes: this._labels.map((label, id) => ({ id, label })),
			edges: this._edges.map(([from, to, weight]) => ({ from, to, weight })),
			directed: true,
			nodeState,
			edgeState: eState,
			nodeNote
		};
	}

	private _emit(
		type: StepType,
		description: string,
		critical: number[],
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, GraphEdgeState>,
		pseudocodeLine: number,
		nodeNote?: Record<number, string>
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...critical],
			highlights: [],
			pseudocodeLine,
			graph: this._graph(critical, nodeState, edgeState, nodeNote)
		});
	}

}
