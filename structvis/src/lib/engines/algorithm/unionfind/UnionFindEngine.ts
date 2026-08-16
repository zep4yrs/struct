/**
 * 并查集引擎 — UnionFindEngine
 *
 * 并查集(Union-Find)：森林结构，parent[i] 指向父节点，根节点指向自己。
 * 支持三种操作：
 *   - find(x)：沿父链上溯到根（含路径压缩：沿途节点直接挂到根）
 *   - union(x, y)：先 find 再按秩合并（小树挂到大树下）
 * 渲染用 union-find：树形布局森林，高亮查找路径与合并操作。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// 并查集：森林 + 父指针',
	'function find(x):',
	'  if parent[x] != x:',
	'    parent[x] = find(parent[x])   // 路径压缩',
	'  return parent[x]',
	'',
	'function union(x, y):',
	'  rx = find(x); ry = find(y)',
	'  if rx == ry: return',
	'  // 按秩合并：小树挂大树',
	'  if rank[rx] < rank[ry]: parent[rx] = ry',
	'  else: parent[ry] = rx',
	''
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '并查集 find 操作中「路径压缩」的作用是？',
		options: [
			'把查找路径上的节点直接挂到根，加速后续查找',
			'让树变高',
			'交换两个节点的值',
			'删除多余的节点'
		],
		correctAnswer: '把查找路径上的节点直接挂到根，加速后续查找',
		hint: '沿途节点扁平化',
		explanation:
			'路径压缩在 find 递归返回时把沿途每个节点直接指向根，使树趋于扁平，后续 find 几乎 O(1)。摊还复杂度接近常数。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: 'union 时按秩合并（小树挂大树）的主要目的是？',
		options: [
			'控制树高，防止退化成链',
			'减少节点数量',
			'让所有节点指向同一个根',
			'提高节点存储密度'
		],
		correctAnswer: '控制树高，防止退化成链',
		hint: '树高决定 find 的耗时',
		explanation:
			'总是把较矮的树挂到较高的树下，树高增长最慢（对数级）。配合路径压缩，整体复杂度接近常数。'
	}
];

// 默认元素与操作序列
const DEFAULT_ELEMS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const DEFAULT_OPS = [
	{ kind: 'union', a: 0, b: 1 },
	{ kind: 'union', a: 2, b: 3 },
	{ kind: 'union', a: 0, b: 2 },
	{ kind: 'find', a: 3 },
	{ kind: 'union', a: 4, b: 5 },
	{ kind: 'union', a: 6, b: 7 },
	{ kind: 'union', a: 4, b: 6 },
	{ kind: 'find', a: 7 },
	{ kind: 'union', a: 1, b: 5 }
] as const;

interface UfNode {
	id: number;
	label: string;
	parent: number;
	rank: number;
}

export class UnionFindEngine extends EngineBase<string[]> {
	readonly name = '并查集';
	readonly renderType = 'union-find' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '并查集：用森林表示若干集合。每个元素一个节点，指向父节点；根节点指向自己。'
		},
		{
			type: 'compare',
			narration: 'find(x)：沿父链上溯到根，判断两个元素是否在同一集合。'
		},
		{
			type: 'edge-select',
			narration: '路径压缩：把查找路径上的节点直接挂到根，树变扁平。'
		},
		{
			type: 'edge-reject',
			narration: '按秩合并：把较矮的树挂到较高的树下，控制树高。'
		},
		{
			type: 'complete',
			narration:
				'操作完成。路径压缩 + 按秩合并让 find/union 的摊还复杂度接近 O(1)，这是并查集高效的关键。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '8 个元素，9 步 union/find' }];

	customConfig: EngineCustomConfig = {
		title: '并查集演示',
		fields: []
	};

	applyPreset(_name: string): void {
		this.init(DEFAULT_ELEMS);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init(DEFAULT_ELEMS);
	}

	init(input: string[]): void {
		this.steps = [];
		this._stepId = 0;

		const elems = input.length >= 2 ? input.slice(0, 10) : DEFAULT_ELEMS;
		const nodes: UfNode[] = elems.map((label, id) => ({ id, label, parent: id, rank: 0 }));

		// 构建当前森林快照
		const snapshot = (): {
			nodes: { id: number; label: string }[];
			edges: { from: number; to: number }[];
			parent: number[];
		} => {
			const edges: { from: number; to: number }[] = [];
			for (const nd of nodes) {
				if (nd.parent !== nd.id) edges.push({ from: nd.parent, to: nd.id });
			}
			return {
				nodes: nodes.map((nd) => ({ id: nd.id, label: nd.label })),
				edges,
				parent: nodes.map((nd) => nd.parent)
			};
		};

		this._emit('init', '初始状态：每个元素单独成集合（自环 = 根）。', snapshot(), 0, []);

		const findPath = (x: number): number[] => {
			const path: number[] = [];
			let cur = x;
			while (nodes[cur].parent !== cur) {
				path.push(cur);
				cur = nodes[cur].parent;
			}
			path.push(cur);
			return path;
		};

		for (const op of DEFAULT_OPS) {
			if (op.kind === 'union') {
				const pathA = findPath(op.a);
				const pathB = findPath(op.b);
				const rootA = pathA[pathA.length - 1];
				const rootB = pathB[pathB.length - 1];

				this._emit(
					'compare',
					`union(${elems[op.a]}, ${elems[op.b]})：先 find 找两个根 —— ${elems[op.a]} 的根是 ${elems[rootA]}，${elems[op.b]} 的根是 ${elems[rootB]}。`,
					snapshot(),
					2,
					[...pathA, ...pathB]
				);

				if (rootA === rootB) {
					this._emit(
						'edge-reject',
						`已在同一集合：${elems[op.a]} 与 ${elems[op.b]} 的根相同（${elems[rootA]}），无需合并。`,
						snapshot(),
						4,
						[rootA]
					);
					continue;
				}

				// 按秩合并
				let newParent: number;
				let child: number;
				if (nodes[rootA].rank < nodes[rootB].rank) {
					nodes[rootA].parent = rootB;
					newParent = rootB;
					child = rootA;
				} else if (nodes[rootA].rank > nodes[rootB].rank) {
					nodes[rootB].parent = rootA;
					newParent = rootA;
					child = rootB;
				} else {
					nodes[rootB].parent = rootA;
					nodes[rootA].rank += 1;
					newParent = rootA;
					child = rootB;
				}
				this._emit(
					'edge-reject',
					`按秩合并：${elems[child]}（秩 ${nodes[child].rank}）挂到 ${elems[newParent]}（秩 ${nodes[newParent].rank}）下。`,
					snapshot(),
					6,
					[newParent, child]
				);
			} else {
				const path = findPath(op.a);
				const root = path[path.length - 1];
				this._emit(
					'compare',
					`find(${elems[op.a]})：沿父链上溯 ${path.map((i) => elems[i]).join(' → ')}，根是 ${elems[root]}。`,
					snapshot(),
					1,
					path
				);
				// 路径压缩:沿途节点直接挂根
				let changed = false;
				for (const nd of path) {
					if (nodes[nd].parent !== root) {
						nodes[nd].parent = root;
						changed = true;
					}
				}
				if (changed) {
					this._emit(
						'edge-select',
						`路径压缩：${path
							.slice(0, -1)
							.map((i) => elems[i])
							.join('、')} 直接挂到根 ${elems[root]}。`,
						snapshot(),
						3,
						path
					);
				}
			}
		}

		this._emit(
			'complete',
			'操作完成。并查集用森林表示集合，find/union 均接近常数时间。',
			snapshot(),
			0,
			[]
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		snap: {
			nodes: { id: number; label: string }[];
			edges: { from: number; to: number }[];
			parent: number[];
		},
		pseudocodeLine: number,
		activeIds: number[]
	): void {
		// 森林图数据:自环不画边,active 高亮查找路径
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine,
			unionFind: {
				nodes: snap.nodes,
				parent: snap.parent,
				edges: snap.edges,
				active: activeIds
			}
		});
	}
}
