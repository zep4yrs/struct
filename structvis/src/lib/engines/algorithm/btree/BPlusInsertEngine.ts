/**
 * B+ 树插入引擎 — BPlusInsertEngine
 *
 * 动态演示 B+ 树（阶 3，节点最多 2 个键）的插入过程：
 *   1. 从根沿键比较下钻到叶子
 *   2. 叶子插入键（有序）
 *   3. 键满 → 分裂：左半留原叶、右半进新叶、中间键提升到父
 *   4. 父满继续向上分裂，根满则新根，树增高
 * 引擎自建树结构（成员 nodes），每步由 _snapshot() 递归计算层布局输出 btree 快照。
 * 渲染用 btree。
 */

import type {
	BPlusTreeData,
	BPlusNode,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const MAX_KEYS = 2; // 阶 3：节点最多 2 个键

const PSEUDO: string[] = [
	'// B+ 树插入（阶 3，节点最多 2 键）',
	'function insert(key):',
	'  leaf = 从根下钻找到应插入的叶子',
	'  leaf.keys 插入 key（有序）',
	'  if leaf 键数 > 2:',
	'    分裂：中间键提升到父节点',
	'    父满则继续向上分裂',
	'  end if',
	'end function'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'B+ 树叶子节点键满后插入，会发生什么？',
		options: ['分裂叶子，中间键提升到父节点', '丢弃最小编', '整树重建', '数据丢失'],
		correctAnswer: '分裂叶子，中间键提升到父节点',
		hint: '保持所有叶子节点键数不超过上限',
		explanation:
			'叶子键满再插入会分裂：左半留在原叶，右半进新叶子节点，中间键作为分隔键提升到父节点。若父也满则递归向上分裂。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: 'B+ 树与 B 树的本质区别是？',
		options: [
			'数据全部在叶子，内部节点只存分隔键',
			'内部节点也存数据',
			'B+ 树没有根',
			'两者完全一样'
		],
		correctAnswer: '数据全部在叶子，内部节点只存分隔键',
		hint: '内部节点只用于路由',
		explanation:
			'B+ 树所有数据键都在叶子节点，内部节点只存放分隔键用于路由；叶子间用链表串联，范围查找非常高效。这也是数据库索引采用 B+ 树的原因。'
	}
];

const INSERT_KEYS = [8, 5, 12, 3, 7, 10, 15, 1, 9, 14, 6, 13];

interface BNode {
	id: number;
	keys: number[];
	leaf: boolean;
	children: number[];
	parent: number | null;
}

export class BPlusInsertEngine extends EngineBase<number[]> {
	readonly name = 'B+ 树插入';
	readonly renderType = 'btree' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'B+ 树插入演示：依次插入 8, 5, 12, 3, 7, 10, 15, 1, 9, 14, 6, 13。每插入一个键，从根下钻到叶子，满了就分裂并向上提升。'
		},
		{
			type: 'compare',
			narration: '从根节点比较键值，决定下钻到哪个子树。'
		},
		{
			type: 'edge-select',
			narration: '叶子键满：分裂叶子，中间键提升到父节点。'
		},
		{
			type: 'edge-candidate',
			narration: '父节点也满：继续向上分裂。'
		},
		{
			type: 'complete',
			narration:
				'全部插入完成。B+ 树始终平衡（所有叶子同层），高度 O(log_m n)——这是数据库索引高效的根本。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '12 个键依次插入（阶 3）' }];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '待插入的键（逗号分隔整数）',
				type: 'text',
				placeholder: '如 8, 5, 12, 3, 7, 10',
				default: '8, 5, 12, 3, 7, 10, 15, 1, 9, 14, 6, 13'
			}
		]
	};

	applyPreset(_name: string): void {
		this.init(INSERT_KEYS);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map(Number);
		if (nums.length < 1) throw new Error('至少需要 1 个键');
		this.init(nums);
	}

	// === 树结构（每次 init 重建） ===
	private _nodes = new Map<number, BNode>();
	private _nextId = 0;
	private _root = 0;

	private _newNode(leaf: boolean, parent: number | null): number {
		const id = this._nextId++;
		this._nodes.set(id, { id, keys: [], leaf, children: [], parent });
		return id;
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		this._nodes = new Map();
		this._nextId = 0;

		const keys = input.length ? input : INSERT_KEYS;
		this._root = this._newNode(true, null);

		this._emit('init', '空树开始：根节点（叶子）。依次插入 ' + keys.join(', ') + '。', 0, [
			this._root
		]);

		for (const key of keys) {
			// 1) 下钻找叶子
			let cur = this._root;
			const path: number[] = [this._root];
			while (!this._nodes.get(cur)!.leaf) {
				const nd = this._nodes.get(cur)!;
				let next = nd.children[nd.children.length - 1];
				for (let i = 0; i < nd.keys.length; i++) {
					if (key < nd.keys[i]) {
						next = nd.children[i];
						break;
					}
				}
				cur = next;
				path.push(cur);
			}
			this._emit(
				'compare',
				'插入 ' +
					key +
					'：从根下钻 ' +
					path.map((p) => '[' + this._nodes.get(p)!.keys.join(',') + ']').join(' → ') +
					'，到达叶子。',
				1,
				path
			);

			// 2) 叶子插入
			const leaf = this._nodes.get(cur)!;
			leaf.keys.push(key);
			leaf.keys.sort((a, b) => a - b);
			this._emit(
				'edge-candidate',
				'叶子 [' +
					leaf.keys.join(', ') +
					'] 插入 ' +
					key +
					(leaf.keys.length > MAX_KEYS ? '，键数超出上限，需要分裂。' : '，未满。'),
				2,
				[cur]
			);

			// 3) 自底向上分裂
			let splitNode = cur;
			while (this._nodes.get(splitNode)!.keys.length > MAX_KEYS) {
				const nd = this._nodes.get(splitNode)!;
				let midKey: number;
				let rightId: number;
				if (nd.leaf) {
					// 叶子分裂：左半 ⌈n/2⌉ 键留原叶，右半进新叶，中间键复制提升
					const midIdx = Math.ceil(nd.keys.length / 2);
					const leftKeys = nd.keys.slice(0, midIdx);
					const rightKeys = nd.keys.slice(midIdx);
					midKey = nd.keys[midIdx - 1];
					nd.keys = leftKeys;
					rightId = this._newNode(true, nd.parent);
					this._nodes.get(rightId)!.keys = rightKeys;
					this._emit(
						'edge-select',
						'叶子 [' +
							leftKeys.join(', ') +
							'] 分裂：右半 [' +
							rightKeys.join(', ') +
							'] 进新叶，中间键 ' +
							midKey +
							' 提升。',
						3,
						[splitNode, rightId]
					);
				} else {
					// 内部节点分裂：中间键提升，左右各留一半键与指针
					const midIdx = Math.floor(nd.keys.length / 2);
					midKey = nd.keys[midIdx];
					const leftKeys = nd.keys.slice(0, midIdx);
					const rightKeys = nd.keys.slice(midIdx + 1);
					const leftChildren = nd.children.slice(0, midIdx + 1);
					const rightChildren = nd.children.slice(midIdx + 1);
					nd.keys = leftKeys;
					nd.children = leftChildren;
					rightId = this._newNode(false, nd.parent);
					const rn = this._nodes.get(rightId)!;
					rn.keys = rightKeys;
					rn.children = rightChildren;
					for (const c of rightChildren) this._nodes.get(c)!.parent = rightId;
					this._emit(
						'edge-select',
						'内部节点 [' +
							leftKeys.join(', ') +
							' | ' +
							rightKeys.join(', ') +
							'] 分裂：中间键 ' +
							midKey +
							' 提升。',
						3,
						[splitNode, rightId]
					);
				}

				// 提升 midKey 到父节点
				const parentId = nd.parent;
				if (parentId === null) {
					const newRoot = this._newNode(false, null);
					const rn = this._nodes.get(newRoot)!;
					rn.keys = [midKey];
					rn.children = [splitNode, rightId];
					this._nodes.get(splitNode)!.parent = newRoot;
					this._nodes.get(rightId)!.parent = newRoot;
					this._root = newRoot;
					this._emit(
						'edge-candidate',
						'根分裂：中间键 ' + midKey + ' 提升为新根，树增高一层。',
						3,
						[newRoot, splitNode, rightId]
					);
					break;
				}
				const parent = this._nodes.get(parentId)!;
				const pos = parent.children.indexOf(splitNode);
				parent.keys.push(midKey);
				parent.keys.sort((a, b) => a - b);
				parent.children.splice(pos + 1, 0, rightId);
				this._emit(
					'edge-candidate',
					'中间键 ' +
						midKey +
						' 提升到父节点 [' +
						parent.keys.join(', ') +
						']。' +
						(parent.keys.length > MAX_KEYS ? ' 父节点也满，继续分裂。' : ''),
					3,
					[parentId, rightId]
				);
				splitNode = parentId;
			}

			this._emit('compare', '插入 ' + key + ' 完成，树保持平衡。', 5, []);
		}

		this._emit(
			'complete',
			'全部插入完成：' + keys.join(', ') + '。B+ 树所有叶子同层，高度 ' + this._height() + '。',
			7,
			[]
		);
		this.totalSteps = this.steps.length;
	}

	private _height(): number {
		let h = 0;
		let cur = this._root;
		while (!this._nodes.get(cur)!.leaf) {
			h++;
			cur = this._nodes.get(cur)!.children[0];
		}
		return h + 1;
	}

	// === 布局 + 快照 ===
	private _snapshot(): BPlusTreeData {
		const out: BPlusNode[] = [];
		const edges: { from: string; to: string }[] = [];
		// 每层 y
		const depthOf = new Map<number, number>();
		const q: number[] = [this._root];
		depthOf.set(this._root, 0);
		let maxDepth = 0;
		while (q.length) {
			const cur = q.shift()!;
			const d = depthOf.get(cur)!;
			maxDepth = Math.max(maxDepth, d);
			for (const c of this._nodes.get(cur)!.children) {
				depthOf.set(c, d + 1);
				q.push(c);
			}
		}
		// 每层节点均分 x（按子树叶子数加权更自然，这里简化按层内序号均分）
		const layerNodes = new Map<number, number[]>();
		for (const [id, d] of depthOf) {
			if (!layerNodes.has(d)) layerNodes.set(d, []);
			layerNodes.get(d)!.push(id);
		}
		const LAYER_Y = [70, 170, 270, 370, 470];
		for (const [d, ids] of layerNodes) {
			const y = LAYER_Y[Math.min(d, LAYER_Y.length - 1)];
			const sorted = ids.slice().sort((a, b) => a - b);
			const W = 900;
			sorted.forEach((id, i) => {
				const nd = this._nodes.get(id)!;
				const x = (W / (sorted.length + 1)) * (i + 1);
				out.push({ id: String(id), keys: [...nd.keys], leaf: nd.leaf, x, y });
			});
		}
		for (const [id, nd] of this._nodes) {
			for (const c of nd.children) {
				edges.push({ from: String(id), to: String(c) });
			}
		}
		return { nodes: out, edges };
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		hlIds: number[]
	): void {
		const snapshot = this._snapshot();
		const idxById = new Map(snapshot.nodes.map((n, i) => [n.id, i]));
		const highlights: Highlight[] = [];
		if (hlIds.length) {
			highlights.push({
				type: 'current',
				indices: hlIds
					.map((id) => idxById.get(String(id)))
					.filter((i): i is number => i !== undefined)
			});
		}
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine,
			btree: snapshot
		});
	}
}
