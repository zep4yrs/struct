/**
 * 红黑树引擎 — RedBlackTreeEngine
 *
 * 教材第 7 章：红黑树是近似平衡的 BST——根黑、红节点的孩子全黑、每条路径黑节点数相同。
 * 插入新节点为红色，按父/叔颜色分三种情况修复：变色、旋转+变色。
 * data 快照为层序数组（-1 空位）；渲染器高亮当前修复路径。
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
	'// 红黑树插入修复',
	'procedure rbInsertFixup(T, z)',
	'  while z.parent 为红色 do',
	'    if z 的叔叔是红色 then',
	'      变色：父、叔变黑，祖父变红',
	'      z = 祖父',
	'    else',
	'      旋转 + 变色（LL/LR/RR/RL）',
	'    end if',
	'  end while',
	'  根节点染黑',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '插入修复时，如果父节点和叔叔节点都是红色，应该怎么做？',
		options: ['旋转', '变色（父、叔变黑，祖父变红）', '删除节点', '什么都不做'],
		correctAnswer: '变色（父、叔变黑，祖父变红）',
		hint: '红色上推，不破坏黑色高度',
		explanation:
			'父、叔都红时，把它们变黑、祖父变红：每条路径的黑节点数不变，红色继续向上推，直到根或遇到黑父。'
	}
];

interface RbNode {
	value: number;
	left: number;
	right: number;
	parent: number;
	red: boolean; // true=红 false=黑
}

export class RedBlackTreeEngine extends EngineBase<number[]> {
	readonly name = '红黑树';
	readonly renderType = 'tree' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'红黑树：二叉搜索树加颜色约束——根和空叶是黑色、红节点的孩子必须是黑、任意路径的黑节点数相同。插入后最多旋转两次即可恢复平衡。'
		},
		{
			type: 'compare',
			narration: '按二叉搜索树规则找到插入位置，新节点初始为红色。'
		},
		{
			type: 'pivot-select',
			narration: '插入后检查红黑性质：如果父节点是红色，需要修复。'
		},
		{
			type: 'edge-candidate',
			narration: '叔叔节点也是红色：变色——父、叔变黑，祖父变红，红色继续上推。'
		},
		{
			type: 'edge-select',
			narration: '叔叔是黑色（或无）：通过旋转 + 变色调整局部结构。'
		},
		{
			type: 'swap',
			narration: '旋转完成，红黑性质恢复。'
		},
		{
			type: 'complete',
			narration:
				'插入完成。红黑树高度不超过 2·log₂(n+1)，查找、插入、删除都是 O(log n)，是实际应用最广的平衡树（如 TreeMap、Linux 内核）。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '变色场景', description: '插入 10, 20, 30, 15, 5, 40, 25 → 多次变色+旋转' },
		{ name: '示例 B', description: '[7, 3, 18, 10, 22, 8, 11, 26]' }
	];

	customConfig: EngineCustomConfig = {
		title: '插入序列',
		fields: [
			{
				key: 'data',
				label: '关键字序列',
				type: 'text',
				placeholder: '逗号分隔的不重复整数',
				default: '10, 20, 30, 15, 5, 40, 25'
			}
		]
	};

	applyPreset(name: string): void {
		const data: number[] | undefined = {
			变色场景: [10, 20, 30, 15, 5, 40, 25],
			'示例 B': [7, 3, 18, 10, 22, 8, 11, 26]
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

		this._emit('init', '红黑树：按序列 ' + input.join(', ') + ' 逐个插入并修复红黑性质。', 0, []);

		for (const v of input) this._insert(v);

		// 根染黑
		if (this._root !== -1 && this._nodes[this._root].red) {
			this._nodes[this._root].red = false;
			this._emit('swap', '根节点染黑。', 6, [this._root]);
		}

		this._emit('complete', '全部插入完成，红黑性质成立。', 6, []);
		this.totalSteps = this.steps.length;
	}

	// ---------- 内部 ----------
	private _nodes: RbNode[] = [];
	private _root = -1;

	private _addNode(value: number, red: boolean): number {
		this._nodes.push({ value, left: -1, right: -1, parent: -1, red });
		return this._nodes.length - 1;
	}

	private _insert(value: number): void {
		if (this._root === -1) {
			this._root = this._addNode(value, false); // 根黑
			this._emit('swap', value + ' 作为黑色根节点插入。', 0, [this._root]);
			return;
		}
		let p = this._root;
		while (true) {
			this._emit('compare', '比较 ' + value + ' 与 ' + this._nodes[p].value + '。', 0, [p]);
			if (value < this._nodes[p].value) {
				if (this._nodes[p].left === -1) {
					const id = this._addNode(value, true);
					this._nodes[p].left = id;
					this._nodes[id].parent = p;
					this._emit('swap', value + ' 作为红色节点插入到 ' + this._nodes[p].value + ' 左侧。', 1, [
						id
					]);
					this._fixup(id);
					return;
				}
				p = this._nodes[p].left;
			} else {
				if (this._nodes[p].right === -1) {
					const id = this._addNode(value, true);
					this._nodes[p].right = id;
					this._nodes[id].parent = p;
					this._emit('swap', value + ' 作为红色节点插入到 ' + this._nodes[p].value + ' 右侧。', 1, [
						id
					]);
					this._fixup(id);
					return;
				}
				p = this._nodes[p].right;
			}
		}
	}

	/** 插入修复：父红时循环处理 */
	private _fixup(z: number): void {
		while (true) {
			const parent = this._nodes[z].parent;
			if (parent === -1) break; // z 是根，交给最后染黑
			if (!this._nodes[parent].red) break; // 父黑，性质满足

			const grand = this._nodes[parent].parent;
			if (grand === -1) {
				// 父是根：直接染黑父
				this._nodes[parent].red = false;
				this._emit('swap', '父节点是根，染黑。', 6, [parent]);
				break;
			}
			const gNode = this._nodes[grand];
			const parentIsLeft = gNode.left === parent;
			const uncle = parentIsLeft ? gNode.right : gNode.left;
			const uncleRed = uncle !== -1 && this._nodes[uncle].red;

			this._emit('pivot-select', '父节点 ' + this._nodes[parent].value + ' 是红色，需要修复。', 2, [
				parent,
				grand
			]);

			if (uncleRed) {
				// 情况 1：叔红 → 变色
				this._nodes[parent].red = false;
				this._nodes[uncle].red = false;
				this._nodes[grand].red = true;
				this._emit(
					'edge-candidate',
					'叔叔 ' +
						this._nodes[uncle].value +
						' 也是红色：父、叔变黑，祖父 ' +
						this._nodes[grand].value +
						' 变红。',
					3,
					[parent, uncle, grand]
				);
				z = grand; // 红色上推
				continue;
			}

			// 情况 2/3：叔黑 → 旋转 + 变色
			this._emit('edge-select', '叔叔是黑色：需要旋转 + 变色。', 4, [parent, grand]);

			// LR / RL：先转一次，统一成 LL / RR
			if (parentIsLeft && this._nodes[parent].right === z) {
				this._rotateLeft(parent);
				z = parent;
			} else if (!parentIsLeft && this._nodes[parent].left === z) {
				this._rotateRight(parent);
				z = parent;
			}

			const p2 = this._nodes[z].parent;
			const g2 = this._nodes[p2].parent;
			this._nodes[p2].red = false;
			this._nodes[g2].red = true;
			this._emit(
				'swap',
				'旋转调整：' + this._nodes[p2].value + ' 变黑，' + this._nodes[g2].value + ' 变红。',
				5,
				[p2, g2]
			);

			if (this._nodes[g2].left === p2) {
				this._rotateRight(g2);
			} else {
				this._rotateLeft(g2);
			}
			this._emit('swap', '旋转完成：子树重新平衡。', 5, [p2]);
			break;
		}
	}

	private _rotateLeft(a: number): void {
		const b = this._nodes[a].right;
		const parent = this._nodes[a].parent;
		this._nodes[a].right = this._nodes[b].left;
		if (this._nodes[b].left !== -1) this._nodes[this._nodes[b].left].parent = a;
		this._nodes[b].left = a;
		this._nodes[a].parent = b;
		this._nodes[b].parent = parent;
		if (parent === -1) this._root = b;
		else if (this._nodes[parent].left === a) this._nodes[parent].left = b;
		else this._nodes[parent].right = b;
	}

	private _rotateRight(a: number): void {
		const b = this._nodes[a].left;
		const parent = this._nodes[a].parent;
		this._nodes[a].left = this._nodes[b].right;
		if (this._nodes[b].right !== -1) this._nodes[this._nodes[b].right].parent = a;
		this._nodes[b].right = a;
		this._nodes[a].parent = b;
		this._nodes[b].parent = parent;
		if (parent === -1) this._root = b;
		else if (this._nodes[parent].left === a) this._nodes[parent].left = b;
		else this._nodes[parent].right = b;
	}

	/** 层序序列化（空位 -1） */
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
