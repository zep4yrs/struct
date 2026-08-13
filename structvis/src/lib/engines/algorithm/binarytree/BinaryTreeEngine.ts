/**
 * 二叉树遍历引擎 — BinaryTreeEngine
 *
 * 支持前序/中序/后序/层序遍历，生成步进关键帧。
 * data 快照为层序编码数组（-1 表示空节点），渲染器据此重建树。
 * 引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';
import { parseNumberList } from '../parseInput';

export type TraversalMode = 'preorder' | 'inorder' | 'postorder' | 'levelorder';

export interface TreeEngineInput {
	tree: number[];
	mode: TraversalMode;
}

const PREORDER_PSEUDO: string[] = [
	'procedure preorder(node)',
	'  if node == null then return',
	'  visit(node)              // 先访问根',
	'  preorder(node.left)      // 再遍历左子树',
	'  preorder(node.right)     // 最后遍历右子树',
	'end procedure'
];

const INORDER_PSEUDO: string[] = [
	'procedure inorder(node)',
	'  if node == null then return',
	'  inorder(node.left)       // 先遍历左子树',
	'  visit(node)              // 再访问根',
	'  inorder(node.right)      // 最后遍历右子树',
	'end procedure'
];

const POSTORDER_PSEUDO: string[] = [
	'procedure postorder(node)',
	'  if node == null then return',
	'  postorder(node.left)     // 先遍历左子树',
	'  postorder(node.right)    // 再遍历右子树',
	'  visit(node)              // 最后访问根',
	'end procedure'
];

const LEVELORDER_PSEUDO: string[] = [
	'procedure levelorder(root)',
	'  if root == null then return',
	'  queue ← empty queue',
	'  enqueue(queue, root)',
	'  while queue not empty do',
	'    node ← dequeue(queue)',
	'    visit(node)            // 访问节点',
	'    if node.left ≠ null then enqueue(queue, node.left)',
	'    if node.right ≠ null then enqueue(queue, node.right)',
	'  end while',
	'end procedure'
];

const PSEUDO_BY_MODE: Record<TraversalMode, string[]> = {
	preorder: PREORDER_PSEUDO,
	inorder: INORDER_PSEUDO,
	postorder: POSTORDER_PSEUDO,
	levelorder: LEVELORDER_PSEUDO
};

// 练习（基于教材示例树 10,5,15,3,7,12,20）：
// 前序 10,5,3,7,15,12,20 | 中序 3,5,7,10,12,15,20 | 后序 3,7,5,12,20,15,10 | 层序 10,5,15,3,7,12,20
const PRACTICE_BY_MODE: Record<TraversalMode, PracticeQuestion[]> = {
	preorder: [
		{
			type: 'choose-next',
			stepIndex: 2,
			prompt: '前序遍历中，第 4 个被访问的节点是？',
			options: ['5', '7', '10', '15'],
			correctAnswer: '7',
			hint: '前序顺序：根 → 左子树 → 右子树，依次访问 10, 5, 3, …',
			explanation: '前序序列为 10, 5, 3, 7, 15, 12, 20，第 4 个访问的是 7（5 的右孩子）。'
		},
		{
			type: 'fill-array',
			stepIndex: 3,
			prompt: '写出这棵树的完整前序遍历序列（节点值用逗号分隔）：',
			correctAnswer: '10,5,3,7,15,12,20',
			hint: '前序：根 → 左子树 → 右子树，逐个写出访问顺序',
			explanation: '前序遍历：10 → 左子树(5 → 3 → 7) → 右子树(15 → 12 → 20)，完整序列 10,5,3,7,15,12,20。'
		}
	],
	inorder: [
		{
			type: 'choose-next',
			stepIndex: 2,
			prompt: '中序遍历中，第 4 个被访问的节点是？',
			options: ['7', '10', '12', '15'],
			correctAnswer: '10',
			hint: '中序顺序：左子树 → 根 → 右子树，左子树先完整遍历',
			explanation: '中序序列为 3, 5, 7, 10, 12, 15, 20，第 4 个访问的是根节点 10。'
		},
		{
			type: 'fill-array',
			stepIndex: 3,
			prompt: '写出这棵树的完整中序遍历序列（节点值用逗号分隔）：',
			correctAnswer: '3,5,7,10,12,15,20',
			hint: '中序：左子树 → 根 → 右子树',
			explanation: '中序遍历：左子树(3,5,7) → 根 10 → 右子树(12,15,20)，完整序列 3,5,7,10,12,15,20（恰好有序）。'
		}
	],
	postorder: [
		{
			type: 'choose-next',
			stepIndex: 2,
			prompt: '后序遍历中，第 1 个被访问的节点是？',
			options: ['3', '5', '10', '20'],
			correctAnswer: '3',
			hint: '后序顺序：左子树 → 右子树 → 根，最先访问的是最左下的叶子',
			explanation: '后序序列为 3, 7, 5, 12, 20, 15, 10，第 1 个访问的是最左下的叶子 3。'
		},
		{
			type: 'fill-array',
			stepIndex: 3,
			prompt: '写出这棵树的完整后序遍历序列（节点值用逗号分隔）：',
			correctAnswer: '3,7,5,12,20,15,10',
			hint: '后序：左子树 → 右子树 → 根',
			explanation: '后序遍历：左子树(3,7,5) → 右子树(12,20,15) → 根 10，完整序列 3,7,5,12,20,15,10。'
		}
	],
	levelorder: [
		{
			type: 'choose-next',
			stepIndex: 2,
			prompt: '层序遍历中，第 3 个被访问的节点是？',
			options: ['3', '7', '15', '20'],
			correctAnswer: '15',
			hint: '层序即从上到下、从左到右逐层扫描',
			explanation: '层序序列为 10, 5, 15, 3, 7, 12, 20，第 3 个访问的是第二层右边的 15。'
		},
		{
			type: 'fill-array',
			stepIndex: 3,
			prompt: '写出这棵树的完整层序遍历序列（节点值用逗号分隔）：',
			correctAnswer: '10,5,15,3,7,12,20',
			hint: '层序：从上到下、从左到右逐层输出',
			explanation: '层序遍历：第 1 层 10 → 第 2 层 5,15 → 第 3 层 3,7,12,20，完整序列 10,5,15,3,7,12,20。'
		}
	]
};

export class BinaryTreeEngine extends EngineBase<TreeEngineInput> {
	readonly name = '二叉树遍历';
	readonly renderType = 'tree' as const;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'这是用层序编码表示的一棵二叉树。遍历就是按照某种顺序"访问"每个节点一次。这里演示先序 / 中序 / 后序 / 层序四种遍历。'
		},
		{
			type: 'recurse-enter',
			narration:
				'递归进入子树。先序：根→左→右；中序：左→根→右；后序：左→右→根。区别只在"访问根"发生在什么时候。'
		},
		{
			type: 'compare',
			narration: '访问当前节点，把它的值记入遍历序列。'
		},
		{
			type: 'recurse-exit',
			narration: '当前子树访问完毕，递归返回上一层。'
		},
		{
			type: 'complete',
			narration:
				'遍历完成。层序遍历按层从上到下、每层从左到右，其他三种则是深度优先，靠递归栈实现。'
		}
	];

	private _tree: number[] = [];

	private static DEFAULT_TREE = [10, 5, 15, 3, 7, 12, 20];

	presets: EnginePreset[] = [
		{ name: '前序遍历', description: '根 → 左 → 右（教材示例树）' },
		{ name: '中序遍历', description: '左 → 根 → 右（教材示例树）' },
		{ name: '后序遍历', description: '左 → 右 → 根（教材示例树）' },
		{ name: '层序遍历', description: '逐层从左到右（教材示例树）' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义二叉树',
		fields: [
			{
				key: 'mode',
				label: '遍历方式',
				type: 'select',
				options: [
					{ value: 'preorder', label: '前序' },
					{ value: 'inorder', label: '中序' },
					{ value: 'postorder', label: '后序' },
					{ value: 'levelorder', label: '层序' }
				],
				default: 'preorder'
			},
			{
				key: 'tree',
				label: '层序编码',
				type: 'text',
				placeholder: '逗号分隔，-1 表示空节点',
				default: '10, 5, 15, 3, 7, 12, 20'
			}
		]
	};

	applyPreset(name: string): void {
		const modeMap: Record<string, TraversalMode> = {
			前序遍历: 'preorder',
			中序遍历: 'inorder',
			后序遍历: 'postorder',
			层序遍历: 'levelorder'
		};
		const mode: TraversalMode | undefined = modeMap[name];
		if (mode) this.init({ tree: BinaryTreeEngine.DEFAULT_TREE, mode });
	}

	applyCustom(values: Record<string, string>): void {
		const tree = parseNumberList(values.tree ?? '', { min: 1, max: 31, label: '节点' });
		if (tree[0] === -1) throw new Error('根节点不能为空');
		const mode = (values.mode ?? 'preorder') as TraversalMode;
		this.init({ tree, mode });
	}

	init(input: TreeEngineInput): void {
		const { tree, mode } = input;
		this._tree = [...tree];
		this.pseudocode = PSEUDO_BY_MODE[mode];
		this.practiceQuestions = PRACTICE_BY_MODE[mode];

		this.steps = [];
		this._stepId = 0;

		// 初始步：展示树
		this._emit('init', '一棵二叉树，开始' + this._modeLabel(mode) + '。', [], 0);
		const visited: number[] = [];
		const rootIdx = tree[0] === -1 ? -1 : 0;

		if (mode === 'levelorder') {
			this._genLevelorder(rootIdx, visited);
		} else {
			this._genRecursive(rootIdx, mode, visited, 0);
		}

		this._emit('complete', '遍历完成，共访问 ' + visited.length + ' 个节点。', visited, 0);
		this.totalSteps = this.steps.length;
	}

	private _modeLabel(mode: TraversalMode): string {
		switch (mode) {
			case 'preorder':
				return '前序遍历';
			case 'inorder':
				return '中序遍历';
			case 'postorder':
				return '后序遍历';
			case 'levelorder':
				return '层序遍历';
		}
	}

	private _leftOf(i: number): number {
		return 2 * i + 1 < this._tree.length ? 2 * i + 1 : -1;
	}

	private _rightOf(i: number): number {
		return 2 * i + 2 < this._tree.length ? 2 * i + 2 : -1;
	}

	/** 访问一个节点（前/中/后序共用） */
	private _visit(nodeIdx: number, mode: TraversalMode, visited: number[]): void {
		visited.push(nodeIdx);
		const nodeVal = this._tree[nodeIdx];
		const seq = visited.map((i) => this._tree[i]).join(', ');
		const visitLine =
			mode === 'preorder' ? 3 : mode === 'inorder' ? 4 : mode === 'postorder' ? 5 : 6;
		this._emit('compare', `访问节点 ${nodeVal}，已访问序列：[${seq}]`, visited, visitLine, [
			{ type: 'current', indices: [nodeIdx] }
		]);
	}

	private _genRecursive(
		nodeIdx: number,
		mode: TraversalMode,
		visited: number[],
		depth: number
	): void {
		if (nodeIdx === -1 || this._tree[nodeIdx] === -1) {
			this._emit('recurse-exit', '当前节点为空，递归返回。', visited, depth);
			return;
		}

		const leftLine = mode === 'preorder' ? 4 : 3;
		const rightLine = 5;

		if (mode === 'preorder') this._visit(nodeIdx, mode, visited);
		this._emit(
			'recurse-enter',
			`递归遍历节点 ${this._tree[nodeIdx]} 的左子树。`,
			visited,
			leftLine,
			[{ type: 'compare', indices: [nodeIdx] }]
		);
		this._genRecursive(this._leftOf(nodeIdx), mode, visited, depth + 1);
		if (mode === 'inorder') this._visit(nodeIdx, mode, visited);
		this._emit(
			'recurse-enter',
			`递归遍历节点 ${this._tree[nodeIdx]} 的右子树。`,
			visited,
			rightLine,
			[{ type: 'compare', indices: [nodeIdx] }]
		);
		this._genRecursive(this._rightOf(nodeIdx), mode, visited, depth + 1);
		if (mode === 'postorder') this._visit(nodeIdx, mode, visited);
		this._emit(
			'recurse-exit',
			`节点 ${this._tree[nodeIdx]} 的子树遍历完成，返回上一层。`,
			visited,
			depth
		);
	}

	private _genLevelorder(rootIdx: number, visited: number[]): void {
		if (rootIdx === -1) return;
		const queue: number[] = [rootIdx];
		while (queue.length > 0) {
			const idx = queue.shift()!;
			this._visit(idx, 'levelorder', visited);
			const l = this._leftOf(idx);
			const r = this._rightOf(idx);
			if (l !== -1 && this._tree[l] !== -1) {
				queue.push(l);
				this._emit(
					'recurse-enter',
					`节点 ${this._tree[idx]} 的左孩子 ${this._tree[l]} 入队。`,
					visited,
					7,
					[{ type: 'compare', indices: [l] }]
				);
			}
			if (r !== -1 && this._tree[r] !== -1) {
				queue.push(r);
				this._emit(
					'recurse-enter',
					`节点 ${this._tree[idx]} 的右孩子 ${this._tree[r]} 入队。`,
					visited,
					8,
					[{ type: 'compare', indices: [r] }]
				);
			}
		}
	}

	private _emit(
		type: StepType,
		description: string,
		data: number[],
		pseudocodeLine: number,
		extraHighlights?: Highlight[]
	): void {
		const highlights: Highlight[] = [];
		// 已访问节点标记 sorted（levelorder 由 visited 序列直接计算，此处先算好）
		highlights.push({ type: 'sorted', indices: data });
		if (extraHighlights) highlights.push(...extraHighlights);

		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...this._tree],
			highlights,
			pseudocodeLine
		});
	}

}
