/**
 * LCA 最近公共祖先引擎 — LCAEngine
 *
 * 树上倍增（Binary Lifting）求最近公共祖先：
 *   预处理每个节点的深度 depth[u] 与 2^k 级祖先 up[u][k]。
 *   查询 (u,v)：先把较深者上跳到与另一点同深度；若未重合，
 *   再从高位到低位让两点同步上跳（up[u][k] != up[v][k] 才跳），
 *   最后父节点即为 LCA。每步 graph 快照：nodeState 标记当前跳跃位置，
 *   nodeNote 显示各节点深度。渲染用 graph。
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
	'procedure LCA(u, v)',
	'  预处理: depth[u] 与 up[u][k] = 2^k 级祖先',
	'  if depth[u] < depth[v]: 交换 u, v        // 让 u 更深',
	'  diff = depth[u] - depth[v]',
	'  for k = 0..LOG-1: if diff 第 k 位为 1: u = up[u][k]',
	'  if u == v: return u',
	'  for k = LOG-1..0:',
	'    if up[u][k] != up[v][k]: u=up[u][k]; v=up[v][k]',
	'  return up[u][0]                       // 父节点即 LCA'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '树上倍增 LCA 中 up[u][k] 的含义是？',
		options: ['u 的 2^k 级祖先', 'u 的父节点', 'u 的子节点个数', 'u 的深度'],
		correctAnswer: 'u 的 2^k 级祖先',
		hint: 'up[u][0] 是父节点，逐级翻倍',
		explanation:
			'up[u][k] 表示从 u 出发向上跳 2^k 步到达的祖先。up[u][0]=父节点，up[u][k]=up[up[u][k-1]][k-1]，利用二进制拆分把单次上跳压到 O(log n)。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '同步上跳时，为何只在 up[u][k] != up[v][k] 时跳？',
		options: ['跳过头就会越过 LCA', '等于 LCA 则无需再跳', '不这样会死循环', '为了减少步数'],
		correctAnswer: '跳过头就会越过 LCA',
		hint: '让 u,v 尽量靠近 LCA 但不越过',
		explanation:
			'若 up[u][k] == up[v][k]，它们可能是 LCA 或 LCA 之上的祖先，贸然上跳可能越过 LCA；只在二者不同时才跳，保证停留在 LCA 的紧下方，最后取父节点即得 LCA。'
	}
];

// 固定树: 节点 A-G(id 0-6)
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const EDGES: [number, number][] = [
	[0, 1],
	[0, 2],
	[1, 3],
	[1, 4],
	[2, 5],
	[4, 6]
];
const N = LABELS.length;
const LOG = 4;

export class LCAEngine extends EngineBase<number[]> {
	readonly name = 'LCA 最近公共祖先';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'树上倍增求最近公共祖先：先预处理每个节点的深度与 2^k 级祖先表，再把查询的两点深度对齐、同步上跳，最终父节点就是 LCA。'
		},
		{
			type: 'compare',
			narration: '比较两点深度，把较深者按二进制拆分上跳到同深度。'
		},
		{
			type: 'edge-select',
			narration: '同深度后让两点同步上跳（只有 2^k 级祖先前不同才跳），停留在 LCA 的紧下方。'
		},
		{
			type: 'complete',
			narration: '上跳结束，父节点即最近公共祖先。预处理 O(n log n)，单次查询 O(log n)。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '查询 LCA(G, F)' }];

	customConfig: EngineCustomConfig = {
		title: '自定义查询',
		fields: [
			{
				key: 'u',
				label: '第一个节点编号 (0-6)',
				type: 'text',
				placeholder: '如 6',
				default: '6'
			},
			{
				key: 'v',
				label: '第二个节点编号 (0-6)',
				type: 'text',
				placeholder: '如 5',
				default: '5'
			}
		]
	};

	private _depth: number[] = [];

	applyPreset(_name: string): void {
		this.init([6, 5]);
	}

	applyCustom(values: Record<string, string>): void {
		const u = parseInt((values.u ?? '').trim(), 10);
		const v = parseInt((values.v ?? '').trim(), 10);
		if (isNaN(u) || isNaN(v)) throw new Error('请输入两个节点编号');
		if (u < 0 || u >= N || v < 0 || v >= N) throw new Error('节点编号应在 0-' + (N - 1) + ' 之间');
		this.init([u, v]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const uq = input && input.length >= 2 ? input[0] : 6;
		const vq = input && input.length >= 2 ? input[1] : 5;
		if (uq < 0 || uq >= N || vq < 0 || vq >= N)
			throw new Error('节点编号应在 0-' + (N - 1) + ' 之间');

		// 以 0 为根，DFS 求 parent 与 depth
		const adj: number[][] = Array.from({ length: N }, () => []);
		for (const [a, b] of EDGES) {
			adj[a].push(b);
			adj[b].push(a);
		}
		const parent = new Array(N).fill(-1);
		const depth = new Array(N).fill(0);
		const build = (u: number, p: number): void => {
			parent[u] = p;
			for (const w of adj[u]) {
				if (w === p) continue;
				depth[w] = depth[u] + 1;
				build(w, u);
			}
		};
		build(0, 0);
		this._depth = [...depth];

		// 倍增表 up[u][k]
		const up: number[][] = Array.from({ length: N }, () => new Array(LOG).fill(0));
		for (let u = 0; u < N; u++) up[u][0] = parent[u] < 0 ? 0 : parent[u];
		for (let k = 1; k < LOG; k++) {
			for (let u = 0; u < N; u++) up[u][k] = up[up[u][k - 1]][k - 1];
		}

		const name = (x: number): string => LABELS[x] ?? String(x);
		let u = uq;
		let v = vq;

		this._emit(
			'init',
			'树上倍增 LCA: 已预处理每个节点的深度与 2^k 级祖先。查询 LCA(' +
				name(u) +
				', ' +
				name(v) +
				')。',
			[u, v],
			[],
			1
		);

		// 让 u 为较深者
		const swap = depth[u] < depth[v];
		if (swap) {
			const t = u;
			u = v;
			v = t;
		}
		this._emit(
			'compare',
			'depth[' +
				name(u) +
				']=' +
				depth[u] +
				', depth[' +
				name(v) +
				']=' +
				depth[v] +
				'。先把较深的 ' +
				name(u) +
				' 上跳到深度 ' +
				depth[v] +
				'。',
			[u, v],
			[],
			3
		);

		// 较深者上跳到同深度
		const diff = depth[u] - depth[v];
		for (let k = 0; k < LOG; k++) {
			if (diff & (1 << k)) {
				const from = u;
				u = up[u][k];
				this._emit(
					'edge-select',
					name(from) +
						' 上跳 2^' +
						k +
						'=' +
						(1 << k) +
						' 步 → ' +
						name(u) +
						'（深度 ' +
						depth[u] +
						'）。',
					[u, v],
					[from],
					4
				);
			}
		}

		if (u === v) {
			this._emit('edge-select', '上跳后两点重合，LCA = ' + name(u) + '。', [u], [], 5);
			this._emit(
				'complete',
				'LCA(' + name(uq) + ', ' + name(vq) + ') = ' + name(u) + '。',
				[u],
				[],
				7
			);
			this.totalSteps = this.steps.length;
			return;
		}

		this._emit(
			'compare',
			'深度相同（' +
				depth[u] +
				'）但 ' +
				name(u) +
				' ≠ ' +
				name(v) +
				'：从高位到低位同步上跳，直到父节点相同。',
			[u, v],
			[],
			6
		);

		for (let k = LOG - 1; k >= 0; k--) {
			const tu = up[u][k];
			const tv = up[v][k];
			if (tu !== tv) {
				u = tu;
				v = tv;
				this._emit(
					'edge-select',
					'2^' + k + ' 级祖先不同（' + name(u) + ' vs ' + name(v) + '）：同时上跳。',
					[u, v],
					[],
					7
				);
			} else {
				this._emit(
					'edge-reject',
					'2^' + k + ' 级祖先相同（' + name(tu) + '）：跳过，以免越过 LCA。',
					[u, v],
					[],
					7
				);
			}
		}

		const lca = up[u][0];
		this._emit(
			'edge-select',
			'同步上跳结束：LCA = ' + name(u) + ' 的父节点 = ' + name(lca) + '。',
			[lca],
			[u, v],
			8
		);
		this._emit(
			'complete',
			'LCA(' + name(uq) + ', ' + name(vq) + ') = ' + name(lca) + '。',
			[lca],
			[],
			8
		);
		this.totalSteps = this.steps.length;
	}

	private _graph(current: number[], visited: number[]): GraphData {
		const nodeState: Record<number, GraphNodeState> = {};
		for (let i = 0; i < N; i++) nodeState[i] = 'unvisited';
		for (const x of visited) nodeState[x] = 'visited';
		for (const x of current) nodeState[x] = 'current';
		const nodeNote: Record<number, string> = {};
		for (let i = 0; i < N; i++) nodeNote[i] = 'd=' + this._depth[i];
		return {
			nodes: LABELS.map((label, id) => ({ id, label })),
			edges: EDGES.map(([a, b]) => ({ from: a, to: b })),
			directed: false,
			nodeState,
			nodeNote
		};
	}

	private _emit(
		type: StepType,
		description: string,
		current: number[],
		visited: number[],
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...this._depth],
			highlights: [],
			pseudocodeLine,
			graph: this._graph(current, visited)
		});
	}
}
