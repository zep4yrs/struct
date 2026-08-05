/**
 * 哈夫曼树引擎 — HuffmanEngine
 *
 * 教材第 6 章：构造哈夫曼树（带权路径长度 WPL 最小）。
 * 初始森林为 n 个孤立叶子；每轮取权值最小的两棵树合并成新树
 * （根权 = 两权之和），加入森林；n-1 轮后只剩一棵树即哈夫曼树。
 * 快照经 huffman 字段传递（森林多根并列），由 huffman 渲染器绘制。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	HuffmanData,
	HuffmanNode,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { parseNumberList } from '../parseInput';

export interface HuffmanInput {
	weights: number[];
}

const PSEUDO: string[] = [
	'procedure HuffmanTree(w, n)', // 0
	'  for i = 1 to n do 创建叶子 F[i]，权 w[i]', // 1
	'  for k = 1 to n - 1 do', // 2
	'    从 F 中选权最小的两棵树 i, j', // 3
	'    合并为新树 t，权 = w[i] + w[j]', // 4
	'    t 的左孩子 = i，右孩子 = j', // 5
	'    删去 i, j，t 加入 F', // 6
	'  end for', // 7
	'  return F 中唯一的树          // 哈夫曼树', // 8
	'WPL = Σ 叶子权 × 路径长度' // 9
];

const DEFAULT_WEIGHTS = [4, 2, 7, 5, 9];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '第一轮合并的是哪两个权值？',
		options: ['4 与 2', '2 与 5', '4 与 7', '2 与 9'],
		correctAnswer: '4 与 2',
		hint: '每轮总是选择森林中权最小的两棵树',
		explanation: '初始权 4, 2, 7, 5, 9 中最小的是 2 和 4，先合并成权 6 的新树。'
	},
	{
		type: 'choose-next',
		stepIndex: 12,
		prompt: '这棵哈夫曼树的 WPL（带权路径长度）是多少？',
		options: ['56', '58', '60', '64'],
		correctAnswer: '60',
		hint: 'WPL = Σ(叶子权 × 到根的路径长度)，或 = 各次合并权值之和',
		explanation:
			'合并依次为 2+4=6, 5+6=11, 7+9=16, 11+16=27，WPL = 6+11+16+27 = 60。哈夫曼树使 WPL 最小。'
	}
];

interface ForestNode extends HuffmanNode {
	parent: number;
}

export class HuffmanEngine implements AlgorithmEngine<HuffmanInput> {
	readonly name = '哈夫曼树';
	readonly renderType = 'huffman' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'哈夫曼树是最小带权路径长度的二叉树：给 n 个叶子各带权值，合并时总让权最小的两棵树优先结合，权大的结点自然离根更近。'
		},
		{
			type: 'compare',
			narration: '在森林中挑选权值最小的两棵树。'
		},
		{
			type: 'edge-select',
			narration: '两棵最小树合并成新树，根权等于两权之和。'
		},
		{
			type: 'edge-reject',
			narration: '该树权值不是最小，本轮不参与合并。'
		},
		{
			type: 'complete',
			narration:
				'合并完成，森林只剩一棵树。WPL = Σ(叶子权 × 路径长度)，哈夫曼树使 WPL 最小，是前缀编码的基础。'
		}
	];

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	private _stepId = 0;
	private _nodes: ForestNode[] = [];
	private _roots: number[] = [];
	private _wpl = 0;

	presets: EnginePreset[] = [
		{ name: '教材示例', description: `权值 ${DEFAULT_WEIGHTS.join(' ')}` },
		{ name: '示例二', description: '权值 7 5 2 4（WPL 最小验证）' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义权值',
		fields: [
			{
				key: 'weights',
				label: '叶子权值序列',
				type: 'text',
				placeholder: '正整数，逗号分隔，2 ~ 8 个',
				default: '4, 2, 7, 5, 9'
			}
		]
	};

	applyPreset(name: string): void {
		this.init({ weights: name.includes('示例二') ? [7, 5, 2, 4] : DEFAULT_WEIGHTS });
	}

	applyCustom(values: Record<string, string>): void {
		const weights = parseNumberList(values.weights ?? '', { min: 2, max: 8, label: '权值' });
		for (const w of weights) {
			if (w <= 0) throw new Error('权值必须为正整数');
		}
		this.init({ weights });
	}

	init(input: HuffmanInput): void {
		const weights = [...input.weights];
		this.steps = [];
		this._stepId = 0;
		this._nodes = [];
		this._roots = [];
		this._wpl = 0;

		for (const w of weights) {
			const id = this._nodes.length;
			this._nodes.push({ id, value: w, left: -1, right: -1, parent: -1 });
			this._roots.push(id);
		}
		const n = weights.length;

		this._emit(
			'init',
			`森林初始：${weights.join(' ')} 共 ${n} 棵单结点树。要合并 ${n - 1} 次。`,
			1,
			this._roots,
			[],
			[]
		);

		for (let k = 0; k < n - 1; k++) {
			// 选两棵权最小（并列取靠前者）
			const sorted = [...this._roots].sort((a, b) => this._nodes[a].value - this._nodes[b].value);
			const i = sorted[0];
			const j = sorted[1];
			const rest = sorted.slice(2);
			this._emit(
				'compare',
				`第 ${k + 1} 轮：森林中最小为 ${this._nodes[i].value} 与 ${this._nodes[j].value}。`,
				3,
				this._roots,
				[],
				rest.length ? rest : undefined
			);
			if (rest.length) {
				this._emit(
					'edge-reject',
					`其余根（${rest.map((r) => this._nodes[r].value).join(', ')}）本轮不合并。`,
					3,
					this._roots,
					[],
					rest
				);
			}

			const left = this._nodes[i].value <= this._nodes[j].value ? i : j;
			const right = left === i ? j : i;
			const sum = this._nodes[i].value + this._nodes[j].value;
			const id = this._nodes.length;
			this._nodes.push({ id, value: sum, left, right, parent: -1 });
			this._nodes[left].parent = id;
			this._nodes[right].parent = id;
			this._roots = this._roots.filter((r) => r !== i && r !== j);
			this._roots.push(id);

			this._emit(
				'edge-select',
				`合并 ${this._nodes[left].value} 与 ${this._nodes[right].value} → 新树权 ${sum}。`,
				4,
				this._roots,
				[id],
				[left, right]
			);
		}

		// WPL = Σ 叶子权 × 深度
		const depths: number[] = [];
		for (let i = 0; i < n; i++) depths.push(this._depthOf(i));
		const wpl = weights.reduce((acc, w, idx) => acc + w * depths[idx], 0);
		this._wpl = wpl;
		const finalRoot = this._roots[0];

		this._emit(
			'complete',
			`构造完成：WPL = ${weights.map((w, idx) => `${w}×${depths[idx]}`).join(' + ')} = ${wpl}，为最小带权路径长度。`,
			9,
			[finalRoot],
			[finalRoot],
			[]
		);
		this.totalSteps = this.steps.length;
	}

	private _depthOf(id: number): number {
		let d = 0;
		let cur = id;
		while (this._nodes[cur].parent !== -1) {
			cur = this._nodes[cur].parent;
			d++;
		}
		return d;
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		roots: number[],
		sortedIds: number[],
		compareIds?: number[]
	): void {
		const highlights: Highlight[] = [];
		if (sortedIds.length) highlights.push({ type: 'sorted', indices: sortedIds });
		if (compareIds?.length) highlights.push({ type: 'compare', indices: compareIds });
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [this._wpl],
			highlights,
			pseudocodeLine,
			huffman: {
				nodes: this._nodes.map((n) => ({
					id: n.id,
					value: n.value,
					left: n.left,
					right: n.right,
					parent: n.parent
				})),
				roots: [...roots],
				wpl: this._wpl
			}
		});
	}

	getCurrentStep(): AlgorithmStep {
		return this.steps[Math.min(Math.floor(this.playbackPos), this.steps.length - 1)];
	}

	getProgress(): number {
		return this.playbackPos;
	}

	setProgress(pos: number): void {
		this.playbackPos = pos;
	}

	reset(): void {
		this.playbackPos = 0;
	}
}
