/**
 * AVL 树引擎 — AvlEngine
 *
 * 教材第 7 章：平衡二叉排序树。逐个插入关键字，插入后从新节点向上检查平衡因子，
 * 失衡时按 LL / RR / LR / RL 四种情况进行旋转恢复平衡（所有子树高度差 ≤ 1）。
 * data 快照为层序数组（-1 表示空位）；渲染器高亮失衡节点与旋转涉及的子树。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';
import { parseNumberList } from '../parseInput';

const PSEUDO: string[] = [
	'// AVL 树：插入后维护平衡',
	'procedure avlInsert(root, key)',
	'  按 BST 规则插入新节点',
	'  从新节点向上更新高度与平衡因子',
	'  if 平衡因子 = 2 且 左左（LL）then 右旋',
	'  if 平衡因子 = 2 且 左右（LR）then 先左旋后右旋',
	'  if 平衡因子 = -2 且 右右（RR）then 左旋',
	'  if 平衡因子 = -2 且 右左（RL）then 先右旋后左旋',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '在 AVL 树中插入 30 后，节点 20 的平衡因子是 2，属于哪种失衡？',
		options: ['LL（左左）', 'LR（左右）', 'RR（右右）', 'RL（右左）'],
		correctAnswer: 'RR（右右）',
		hint: '看失衡节点 20 的右孩子 30 的右子树方向',
		explanation:
			'插入 30 后，20 的右子树（30）比左子树深 2 层，且 30 是右孩子——连续两个"右"，属于 RR 型，需要一次左旋恢复平衡。'
	}
];

// 内部结点
interface AvlNode {
	value: number;
	left: number; // 结点 id，-1 为空
	right: number;
	parent: number;
}

export class AvlEngine extends EngineBase<number[]> {
	readonly name = 'AVL 树';
	readonly renderType = 'tree' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'AVL 树是一种自平衡的二叉搜索树：插入节点后，任何节点的左右子树高度差都不超过 1。一旦失衡，就通过旋转来恢复平衡。'
		},
		{
			type: 'compare',
			narration: '按二叉搜索树的规则查找插入位置：比当前节点小走左边，大走右边。'
		},
		{
			type: 'swap',
			narration: '新节点插入为叶子。现在从它向上检查平衡因子，看是否有节点失衡。'
		},
		{
			type: 'pivot-select',
			narration: '发现失衡：某个节点的左右子树高度差超过 1，需要旋转来恢复平衡。'
		},
		{
			type: 'partition-start',
			narration: '执行旋转：调整失衡节点与其子树的连接关系，使树恢复平衡。'
		},
		{
			type: 'partition-end',
			narration: '旋转完成，这棵子树重新满足 AVL 性质，继续向上检查。'
		},
		{
			type: 'complete',
			narration: '插入完成，AVL 树始终平衡。查找、插入、删除的时间复杂度都是 O(log n)。'
		}
	];

	presets: EnginePreset[] = [
		{ name: 'LL 失衡（右旋）', description: '插入 10, 20, 30, 40, 50 → 触发左旋' },
		{ name: '示例 B', description: '[5, 3, 7, 2, 4, 6, 8]' }
	];

	customConfig: EngineCustomConfig = {
		title: '插入序列',
		fields: [
			{
				key: 'data',
				label: '关键字序列',
				type: 'text',
				placeholder: '逗号分隔的不重复整数，如 10, 20, 30',
				default: '10, 20, 30, 40, 50'
			}
		]
	};

	applyPreset(name: string): void {
		const data: number[] | undefined = {
			'LL 失衡（右旋）': [10, 20, 30, 40, 50],
			'示例 B': [5, 3, 7, 2, 4, 6, 8]
		}[name];
		if (data) this.init(data);
	}

	applyCustom(values: Record<string, string>): void {
		this.init(parseNumberList(values.data ?? '', { min: 1, max: 12 }));
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		this._nodes = [];
		this._root = -1;

		this._emit(
			'init',
			'AVL 树：按序列 ' + input.join(', ') + ' 逐个插入，保持左右子树高度差 ≤ 1。',
			0,
			[]
		);

		for (const v of input) {
			this._insert(v);
		}

		this._emit('complete', '全部插入完成。AVL 树高度始终为 O(log n)，查找效率稳定。', 0, []);

		this.totalSteps = this.steps.length;
	}

	// ---------- 内部实现 ----------
	private _nodes: AvlNode[] = [];
	private _root = -1;

	private _addNode(value: number): number {
		this._nodes.push({ value, left: -1, right: -1, parent: -1 });
		return this._nodes.length - 1;
	}

	private _height(id: number): number {
		if (id === -1) return 0;
		const l = this._height(this._nodes[id].left);
		const r = this._height(this._nodes[id].right);
		return Math.max(l, r) + 1;
	}

	private _bf(id: number): number {
		if (id === -1) return 0;
		return this._height(this._nodes[id].left) - this._height(this._nodes[id].right);
	}

	/** 插入一个关键字：BST 插入 + 沿途平衡（旋转） */
	private _insert(value: number): void {
		if (this._root === -1) {
			this._root = this._addNode(value);
			this._emit('swap', value + ' 作为根节点插入。', 0, [this._root]);
			return;
		}

		// 1) BST 查找插入位置
		let p = this._root;
		while (true) {
			this._emit('compare', '比较 ' + value + ' 与当前节点 ' + this._nodes[p].value + '。', 0, [p]);
			if (value < this._nodes[p].value) {
				if (this._nodes[p].left === -1) {
					const id = this._addNode(value);
					this._nodes[p].left = id;
					this._nodes[id].parent = p;
					this._emit('swap', value + ' 插入为 ' + this._nodes[p].value + ' 的左孩子。', 0, [id]);
					break;
				}
				p = this._nodes[p].left;
			} else {
				if (this._nodes[p].right === -1) {
					const id = this._addNode(value);
					this._nodes[p].right = id;
					this._nodes[id].parent = p;
					this._emit('swap', value + ' 插入为 ' + this._nodes[p].value + ' 的右孩子。', 0, [id]);
					break;
				}
				p = this._nodes[p].right;
			}
		}

		// 2) 从新节点向上检查平衡并旋转
		let cur = this._nodes[this._nodes.length - 1].parent;
		while (cur !== -1) {
			const bf = this._bf(cur);
			if (bf > 1 || bf < -1) {
				const node = this._nodes[cur];
				const leftId = node.left;
				const rightId = node.right;
				const left = leftId !== -1 ? this._nodes[leftId] : null;
				const right = rightId !== -1 ? this._nodes[rightId] : null;

				if (bf > 1 && left && this._bf(leftId) >= 0) {
					// LL：右旋
					this._emit(
						'pivot-select',
						'节点 ' + node.value + ' 平衡因子 = ' + bf + '（LL 型），执行右旋。',
						0,
						[cur, leftId]
					);
					this._rotateRight(cur);
					this._emit(
						'partition-end',
						'右旋完成：' + node.value + ' 成为 ' + left.value + ' 的右孩子。',
						0,
						[cur, leftId]
					);
				} else if (bf > 1 && left && this._bf(leftId) < 0) {
					// LR：先左旋左孩子，再右旋
					this._emit(
						'pivot-select',
						'节点 ' + node.value + ' 平衡因子 = ' + bf + '（LR 型），先左旋左孩子再右旋。',
						0,
						[cur, leftId]
					);
					this._rotateLeft(leftId);
					this._rotateRight(cur);
					this._emit('partition-end', 'LR 双旋完成：子树恢复平衡。', 0, [cur]);
				} else if (bf < -1 && right && this._bf(rightId) <= 0) {
					// RR：左旋
					this._emit(
						'pivot-select',
						'节点 ' + node.value + ' 平衡因子 = ' + bf + '（RR 型），执行左旋。',
						0,
						[cur, rightId]
					);
					this._rotateLeft(cur);
					this._emit(
						'partition-end',
						'左旋完成：' + node.value + ' 成为 ' + right.value + ' 的左孩子。',
						0,
						[cur, rightId]
					);
				} else if (bf < -1 && right && this._bf(rightId) > 0) {
					// RL：先右旋右孩子，再左旋
					this._emit(
						'pivot-select',
						'节点 ' + node.value + ' 平衡因子 = ' + bf + '（RL 型），先右旋右孩子再左旋。',
						0,
						[cur, rightId]
					);
					this._rotateRight(rightId);
					this._rotateLeft(cur);
					this._emit('partition-end', 'RL 双旋完成：子树恢复平衡。', 0, [cur]);
				}
			}
			cur = this._nodes[cur].parent;
		}
	}

	/** 左旋：失衡节点 a（右孩子 b）→ b 上位，a 成为 b 的左孩子 */
	private _rotateLeft(a: number): void {
		const b = this._nodes[a].right;
		const parent = this._nodes[a].parent;
		// a.right = b.left
		this._nodes[a].right = this._nodes[b].left;
		if (this._nodes[b].left !== -1) this._nodes[this._nodes[b].left].parent = a;
		// b.left = a
		this._nodes[b].left = a;
		this._nodes[a].parent = b;
		// b 接替 a 的位置
		this._nodes[b].parent = parent;
		if (parent === -1) {
			this._root = b;
		} else if (this._nodes[parent].left === a) {
			this._nodes[parent].left = b;
		} else {
			this._nodes[parent].right = b;
		}
	}

	/** 右旋：失衡节点 a（左孩子 b）→ b 上位，a 成为 b 的右孩子 */
	private _rotateRight(a: number): void {
		const b = this._nodes[a].left;
		const parent = this._nodes[a].parent;
		this._nodes[a].left = this._nodes[b].right;
		if (this._nodes[b].right !== -1) this._nodes[this._nodes[b].right].parent = a;
		this._nodes[b].right = a;
		this._nodes[a].parent = b;
		this._nodes[b].parent = parent;
		if (parent === -1) {
			this._root = b;
		} else if (this._nodes[parent].left === a) {
			this._nodes[parent].left = b;
		} else {
			this._nodes[parent].right = b;
		}
	}

	/** 层序序列化（空位 -1），供 TreeRenderer 使用 */
	private _snapshot(): number[] {
		if (this._root === -1) return [];
		const out: number[] = [];
		let layer: number[] = [this._root];
		while (true) {
			const next: number[] = [];
			let hasReal = false;
			for (const id of layer) {
				if (id === -1) {
					out.push(-1);
					next.push(-1, -1);
					continue;
				}
				out.push(this._nodes[id].value);
				const l = this._nodes[id].left;
				const r = this._nodes[id].right;
				if (l !== -1 || r !== -1) hasReal = true;
				next.push(l, r);
			}
			if (!hasReal) break;
			layer = next;
		}
		// 去掉末尾空位
		while (out.length > 0 && out[out.length - 1] === -1) out.pop();
		return out;
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		highlightIds: number[]
	): void {
		const highlights: Highlight[] = [];
		if (highlightIds.length) highlights.push({ type: 'current', indices: highlightIds });
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: this._snapshot(),
			highlights,
			pseudocodeLine
		});
	}
}
