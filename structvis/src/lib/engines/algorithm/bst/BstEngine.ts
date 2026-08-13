/**
 * 二叉搜索树引擎 — BstEngine
 *
 * 教材第 7 章：BST 的查找 / 插入 / 删除。
 * 查找：从根沿 BST 性质下行（左小右大），命中即停。
 * 插入：沿查找路径走到空位，挂上新叶子。
 * 删除：分三种情况——无左孩子（右子树顶替）、无右孩子（左子树顶替）、
 * 双孩子（用中序后继替换值，再摘除后继）。
 * data 快照为层序编码（-1 占空位），由 tree 渲染器重建树形。
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

export type BstMode = 'search' | 'insert' | 'delete';

export interface BstInput {
	tree: number[];
	mode: BstMode;
	target: number;
}

const SEARCH_PSEUDO: string[] = [
	'procedure bstSearch(root, x)',
	'  p = root',
	'  while p ≠ null 且 p.data ≠ x do',
	'    if x < p.data then p = p.left   // 目标小，去左子树',
	'    else p = p.right                // 目标大，去右子树',
	'  return p                          // 命中返回结点，否则为 null',
	'end procedure'
];

const INSERT_PSEUDO: string[] = [
	'procedure bstInsert(root, x)',
	'  p = root; parent = null',
	'  while p ≠ null do                 // 沿查找路径找空位',
	'    parent = p',
	'    if x < p.data then p = p.left',
	'    else if x > p.data then p = p.right',
	'    else return                    // 已存在，不插入',
	'  q = 新建结点(x)',
	'  if parent = null then root = q    // 空树',
	'  else if x < parent.data then parent.left = q',
	'  else parent.right = q',
	'end procedure'
];

const DELETE_PSEUDO: string[] = [
	'procedure bstDelete(root, x)',
	'  p = bstSearch(root, x); if p = null return',
	'  if p 无左孩子 then 用 p 的右子树顶替 p',
	'  else if p 无右孩子 then 用 p 的左子树顶替 p',
	'  else',
	'    q = p 右子树的最左下结点       // 中序后继',
	'    p.data = q.data; 摘除 q        // q 必无左孩子，用其右子树顶替',
	'  end if',
	'end procedure'
];

const PSEUDO_BY_MODE: Record<BstMode, string[]> = {
	search: SEARCH_PSEUDO,
	insert: INSERT_PSEUDO,
	delete: DELETE_PSEUDO
};

// 默认树 10,5,15,3,7,12,20
const PRACTICE_BY_MODE: Record<BstMode, PracticeQuestion[]> = {
	search: [
		{
			type: 'choose-next',
			stepIndex: 4,
			prompt: '查找 12 的完整比较路径是？',
			options: ['10 → 5 → 7 → 12', '10 → 15 → 12', '10 → 5 → 12', '10 → 15 → 20 → 12'],
			correctAnswer: '10 → 15 → 12',
			hint: '从根出发，比目标大走右子树，比目标小走左子树',
			explanation:
				'12 > 10 走右到 15；12 < 15 走左到 12，命中。BST 查找就是沿着"左小右大"的路径下行，比较次数 ≤ 树高。'
		}
	],
	insert: [
		{
			type: 'choose-next',
			stepIndex: 4,
			prompt: '插入 8 后，8 成为哪个结点的孩子？',
			options: ['5 的左孩子', '7 的右孩子', '12 的左孩子', '10 的右孩子'],
			correctAnswer: '7 的右孩子',
			hint: '沿查找路径：8 > 10 → 右；8 > 5 → 右；8 > 7 → 右，7 无右孩子，挂上',
			explanation:
				'新结点总是作为叶子插入，具体位置由 BST 性质唯一决定。中序遍历 3,5,7,8,10,12,15,20 仍有序。'
		}
	],
	delete: [
		{
			type: 'choose-next',
			stepIndex: 5,
			prompt: '删除 15（左右孩子都在）时，用什么值顶替它的位置？',
			options: ['12', '20', '7', '10'],
			correctAnswer: '20',
			hint: '双孩子删除用中序后继（右子树最左下结点）替换',
			explanation:
				'15 的右子树是 20，最左下结点就是 20。把 20 复制到 15 的位置再摘除 20（叶子），删除后仍保持 BST 性质。'
		}
	]
};

// 内部结点
interface BstNode {
	value: number;
	left: number;
	right: number;
	parent: number;
	deleted: boolean;
}

export class BstEngine extends EngineBase<BstInput> {
	readonly name = '二叉搜索树';
	readonly renderType = 'tree' as const;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'二叉搜索树：每个结点都满足"左子树所有值 < 根 < 右子树所有值"。有了这条性质，查找、插入、删除都能沿路径下行，平均 O(log n)。'
		},
		{
			type: 'compare',
			narration: '沿 BST 性质下行：目标小走左子树，目标大走右子树。'
		},
		{
			type: 'edge-select',
			narration: '比较命中或位置确定：目标已找到 / 新结点已挂上。'
		},
		{
			type: 'edge-reject',
			narration: '目标不存在或走错方向：按 BST 性质重定向。'
		},
		{
			type: 'recurse-enter',
			narration: '进入子树继续查找。'
		},
		{
			type: 'complete',
			narration: '操作完成。BST 的性能取决于树形：平衡时 O(log n)，退化成链则退化为 O(n)。'
		}
	];

	private _nodes: BstNode[] = [];
	private _root = -1;
	private _mode: BstMode = 'search';

	presets: EnginePreset[] = [
		{ name: '查找', description: '在 10,5,15,3,7,12,20 中查找 12' },
		{ name: '插入', description: '向示例树插入 8' },
		{ name: '删除', description: '从示例树删除 15（双孩子情况）' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义操作',
		fields: [
			{
				key: 'mode',
				label: '操作',
				type: 'select',
				options: [
					{ value: 'search', label: '查找' },
					{ value: 'insert', label: '插入' },
					{ value: 'delete', label: '删除' }
				],
				default: 'search'
			},
			{
				key: 'tree',
				label: '层序编码',
				type: 'text',
				placeholder: '逗号分隔，-1 表示空节点',
				default: '10, 5, 15, 3, 7, 12, 20'
			},
			{
				key: 'target',
				label: '目标值 x',
				type: 'text',
				placeholder: '整数，如 12',
				default: '12'
			}
		]
	};

	applyPreset(name: string): void {
		const modeMap: Record<string, BstMode> = { 查找: 'search', 插入: 'insert', 删除: 'delete' };
		const mode = modeMap[name] ?? 'search';
		this.init({
			tree: [10, 5, 15, 3, 7, 12, 20],
			mode,
			target: mode === 'insert' ? 8 : mode === 'delete' ? 15 : 12
		});
	}

	applyCustom(values: Record<string, string>): void {
		const tree = parseNumberList(values.tree ?? '', { min: 1, max: 31, label: '结点' });
		if (tree[0] === -1) throw new Error('根节点不能为空');
		const target = parseInt((values.target ?? '').trim(), 10);
		if (isNaN(target)) throw new Error('请输入目标值');
		const mode = (values.mode ?? 'search') as BstMode;
		this.init({ tree, mode, target });
	}

	init(input: BstInput): void {
		const { tree, mode, target } = input;
		this._mode = mode;
		this.pseudocode = PSEUDO_BY_MODE[mode];
		this.practiceQuestions = PRACTICE_BY_MODE[mode];

		this.steps = [];
		this._stepId = 0;
		this._nodes = [];
		this._root = this._buildFromLevel(tree);

		this._emit(
			'init',
			`二叉搜索树层序：${tree.join(' ')}。${this._modeLabel(mode)}目标值 ${target}。`,
			0,
			[],
			[],
			[]
		);

		switch (mode) {
			case 'search':
				this._genSearch(target);
				break;
			case 'insert':
				this._genInsert(target);
				break;
			case 'delete':
				this._genDelete(target);
				break;
		}
		this.totalSteps = this.steps.length;
	}

	// ---------- 内部树操作 ----------

	private _buildFromLevel(level: number[]): number {
		if (level.length === 0 || level[0] === -1) return -1;
		const nodes: BstNode[] = level.map((v) => ({
			value: v,
			left: -1,
			right: -1,
			parent: -1,
			deleted: false
		}));
		for (let i = 0; i < level.length; i++) {
			if (level[i] === -1) continue;
			const l = 2 * i + 1;
			const r = 2 * i + 2;
			if (l < level.length && level[l] !== -1) {
				nodes[i].left = l;
				nodes[l].parent = i;
			}
			if (r < level.length && level[r] !== -1) {
				nodes[i].right = r;
				nodes[r].parent = i;
			}
		}
		this._nodes = nodes;
		return 0;
	}

	private _snapshot(): number[] {
		const out: number[] = [];
		if (this._root === -1) return out;
		let layer: number[] = [this._root];
		while (true) {
			const nextLayer: number[] = [];
			let hasReal = false;
			for (const id of layer) {
				const n = this._nodes[id];
				if (!n || n.deleted) {
					out.push(-1);
					nextLayer.push(-1, -1);
					continue;
				}
				out.push(n.value);
				nextLayer.push(n.left, n.right);
				if (n.left !== -1 || n.right !== -1) hasReal = true;
			}
			if (!hasReal) break;
			layer = nextLayer;
		}
		return out;
	}

	private _addNode(value: number): number {
		this._nodes.push({ value, left: -1, right: -1, parent: -1, deleted: false });
		return this._nodes.length - 1;
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		currentIds: number[],
		sortedIds: number[],
		compareIds: number[]
	): void {
		const highlights: Highlight[] = [];
		if (sortedIds.length) highlights.push({ type: 'sorted', indices: sortedIds });
		if (currentIds.length) highlights.push({ type: 'current', indices: currentIds });
		if (compareIds.length) highlights.push({ type: 'compare', indices: compareIds });
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: this._snapshot(),
			highlights,
			pseudocodeLine
		});
	}

	private _modeLabel(mode: BstMode): string {
		return mode === 'search' ? '查找' : mode === 'insert' ? '插入' : '删除';
	}

	/** 沿查找路径下行，返回（命中结点 id, 终止的父 id / 空位父 id）。每步产生 compare 帧。 */
	private _walk(target: number, pseudoLine: number): { found: number; parent: number } {
		let p = this._root;
		let parent = -1;
		while (p !== -1) {
			const v = this._nodes[p].value;
			this._emit('compare', `比较 ${v} 与目标 ${target}。`, pseudoLine, [p], [], []);
			if (v === target) return { found: p, parent };
			parent = p;
			p = v > target ? this._nodes[p].left : this._nodes[p].right;
		}
		return { found: -1, parent };
	}

	private _genSearch(target: number): void {
		const { found } = this._walk(target, 2);
		if (found !== -1) {
			this._emit('edge-select', `命中！${target} 位于树中。`, 4, [], [found], []);
		} else {
			this._emit('edge-reject', `${target} 不在树中（走到空指针）。`, 4, [], [], []);
		}
		this._emit(
			'complete',
			`查找结束：${found !== -1 ? '命中' : '未命中'}。比较次数 = 路径长度 + 1。`,
			4,
			[],
			found !== -1 ? [found] : [],
			[]
		);
	}

	private _genInsert(target: number): void {
		// 先检查是否已存在
		let p = this._root;
		let parent = -1;
		let existed = false;
		while (p !== -1) {
			const v = this._nodes[p].value;
			this._emit('compare', `比较 ${v} 与 ${target}。`, 3, [p], [], []);
			if (v === target) {
				existed = true;
				break;
			}
			parent = p;
			p = v > target ? this._nodes[p].left : this._nodes[p].right;
		}
		if (existed) {
			this._emit('edge-reject', `${target} 已存在，BST 不允许重复关键字，不插入。`, 6, [], [p], []);
			this._emit('complete', '插入取消：关键字已存在。', 6, [], [], []);
			return;
		}
		const newId = this._addNode(target);
		if (parent === -1) {
			this._root = newId;
		} else if (this._nodes[parent].value > target) {
			this._nodes[parent].left = newId;
		} else {
			this._nodes[parent].right = newId;
		}
		this._nodes[newId].parent = parent;
		this._emit(
			'edge-select',
			parent === -1
				? '空树：新结点直接成为根。'
				: `走到空位：${target} 作为 ${this._nodes[parent].value} 的${this._nodes[parent].value > target ? '左' : '右'}孩子挂上。`,
			8,
			[],
			[newId],
			[]
		);
		this._emit(
			'complete',
			`插入完成。中序遍历 ${this._inorder()}，仍然有序。`,
			11,
			[],
			[newId],
			[]
		);
	}

	private _genDelete(target: number): void {
		const { found } = this._walk(target, 2);
		if (found === -1) {
			this._emit('edge-reject', `${target} 不在树中，无法删除。`, 1, [], [], []);
			this._emit('complete', '删除取消：目标不存在。', 1, [], [], []);
			return;
		}
		const n = this._nodes[found];
		this._emit(
			'edge-select',
			`找到 ${target}（第 ${found} 个结点）。分情况处理。`,
			1,
			[],
			[found],
			[]
		);

		if (n.left === -1) {
			// 无左孩子：右子树顶替（含叶子情况）
			this._replaceChild(found, n.right);
			n.deleted = true;
			this._emit('edge-select', `${target} 无左孩子：用其右子树顶替位置。`, 2, [], [found], []);
		} else if (n.right === -1) {
			this._replaceChild(found, n.left);
			n.deleted = true;
			this._emit('edge-select', `${target} 无右孩子：用其左子树顶替位置。`, 3, [], [found], []);
		} else {
			// 双孩子：找右子树最左下（中序后继）
			this._emit(
				'recurse-enter',
				`${target} 左右孩子都在：进入右子树找中序后继（最左下结点）。`,
				5,
				[found],
				[],
				[]
			);
			let q = n.right;
			const path: number[] = [q];
			while (this._nodes[q].left !== -1) {
				q = this._nodes[q].left;
				path.push(q);
			}
			this._emit('compare', `中序后继是 ${this._nodes[q].value}。`, 6, [q], [], path.slice(0, -1));
			// 值替换
			const oldValue = n.value;
			n.value = this._nodes[q].value;
			this._emit(
				'edge-select',
				`用 ${n.value} 顶替 ${oldValue}，再摘除 ${n.value}（原后继位置）。`,
				6,
				[q],
				[found],
				[]
			);
			// 摘除 q（q 无左孩子，用其右子树顶替）
			this._replaceChild(q, this._nodes[q].right);
			this._nodes[q].deleted = true;
		}

		this._emit('complete', `删除完成。中序遍历 ${this._inorder()}，仍然有序。`, 7, [], [], []);
	}

	/** 把 id 从其父的引用中替换为 replacement；若 id 是根则更新根 */
	private _replaceChild(id: number, replacement: number): void {
		const par = this._nodes[id].parent;
		if (par === -1) {
			this._root = replacement;
			if (replacement !== -1) this._nodes[replacement].parent = -1;
			return;
		}
		if (this._nodes[par].left === id) this._nodes[par].left = replacement;
		else this._nodes[par].right = replacement;
		if (replacement !== -1) this._nodes[replacement].parent = par;
	}

	private _inorder(): string {
		const out: number[] = [];
		const visit = (id: number) => {
			if (id === -1 || this._nodes[id].deleted) return;
			visit(this._nodes[id].left);
			out.push(this._nodes[id].value);
			visit(this._nodes[id].right);
		};
		visit(this._root);
		return out.join(' ');
	}
}
