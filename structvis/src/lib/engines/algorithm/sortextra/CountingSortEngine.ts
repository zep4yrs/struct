/**
 * 计数排序引擎 — CountingSortEngine
 *
 * 计数排序（非比较排序）：值域 [0, max]。
 *   ① 统计频次：count[v] = v 在输入中出现的次数；
 *   ② 按序回填：从小到大遍历 v，把 count[v] 个 v 依次写入输出数组。
 * data 为当前数组快照（先输入、后逐步回填），highlights 标记正在写入的位置。
 * 每步 type 用 array 渲染器绘制（计数阶段原地淡入 / 回填阶段高亮写入位）。
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
	'procedure countingSort(a, n)',
	'  max = max(a)',
	'  count[0..max] ← 0',
	'  for i = 1 to n do: count[a[i]]++        // 统计频次',
	'  pos ← 0',
	'  for v = 0 to max do:',
	'    for c = 1 to count[v] do: a[pos++] ← v   // 按序回填',
	'end procedure'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '计数排序的第一步是？',
		options: ['统计每个值出现的频次', '两两比较元素大小', '选取基准元素', '递归排序子区间'],
		correctAnswer: '统计每个值出现的频次',
		hint: '不比较元素，而是直接数个数',
		explanation:
			'计数排序不比较元素，而是先统计每个取值出现的次数（count 数组），再按值从小到大依次回填，因此它是非比较排序。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: '计数排序的时间复杂度是？',
		options: ['O(n log n)', 'O(n+k)', 'O(n²)', 'O(log n)'],
		correctAnswer: 'O(n+k)',
		hint: 'k 是值域大小',
		explanation:
			'计数排序是 O(n+k)，其中 n 为元素个数、k 为值域大小（max）。当 k=O(n) 时接近线性，但它需要额外 O(k) 空间，且只适用于取值集中的整数等场景。'
	}
];

const DEFAULT_DATA = [4, 2, 2, 8, 3, 3, 1];

export class CountingSortEngine extends EngineBase<number[]> {
	readonly name = '计数排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'计数排序不比较元素：先开一个 count 数组统计每个值出现的频次，再按值从小到大把元素依次回填，最终得到有序序列。'
		},
		{
			type: 'compare',
			narration: '统计频次：读一个元素，把 count[该值] 加一。'
		},
		{
			type: 'swap',
			narration: '回填：从值 0 到 max，把每个值按它的频次依次写入输出数组。'
		},
		{
			type: 'complete',
			narration:
				'排序完成。计数排序是非比较排序，复杂度 O(n+k)（k 为值域大小），需要 O(k) 的额外空间。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '[4, 2, 2, 8, 3, 3, 1]' }];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '数据序列（非负整数）',
				type: 'text',
				placeholder: '逗号分隔的非负整数，如 4, 2, 2, 8, 3, 3, 1',
				default: '4, 2, 2, 8, 3, 3, 1'
			}
		]
	};

	applyPreset(_name: string): void {
		this.init(DEFAULT_DATA);
	}

	applyCustom(values: Record<string, string>): void {
		this.init(parseNumberList(values.data ?? '', { min: 2, max: 20 }));
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		for (const v of input) {
			if (!Number.isInteger(v) || v < 0) throw new Error('计数排序要求非负整数输入');
		}

		const arr = [...input];
		const n = arr.length;
		const max = n > 0 ? Math.max(...arr) : 0;
		const count = new Array(max + 1).fill(0);

		this._emit(
			'init',
			'计数排序：值域 [0, ' +
				max +
				']，共 ' +
				n +
				' 个元素。不比较元素大小，先统计每个值的频次，再按序回填。',
			arr,
			[],
			1
		);

		// ① 统计频次
		for (let i = 0; i < n; i++) {
			const v = arr[i];
			count[v]++;
			this._emit(
				'compare',
				'统计 ' + v + ' 的频次：count[' + v + '] 变为 ' + count[v] + '。',
				arr,
				[{ type: 'compare', indices: [i] }],
				3
			);
		}

		const countDesc = this._countString(count);
		this._emit(
			'compare',
			'计数完成：count = [' + countDesc + ']。接下来按值从小到大回填到输出数组。',
			arr,
			[],
			3
		);

		// ② 按序回填
		let pos = 0;
		for (let v = 0; v <= max; v++) {
			for (let c = 0; c < count[v]; c++) {
				arr[pos] = v;
				const remain = count[v] - c - 1;
				this._emit(
					'swap',
					'回填：位置 ' +
						(pos + 1) +
						' 写入 ' +
						v +
						'（count[' +
						v +
						'] 尚余 ' +
						remain +
						' 个）。',
					arr,
					[{ type: 'swap', indices: [pos] }],
					5
				);
				pos++;
			}
		}

		this._emit(
			'complete',
			'排序完成：' +
				arr.join(' ') +
				'。计数排序是非比较排序，复杂度 O(n+' +
				max +
				')（k=' +
				max +
				' 为值域大小），需要额外 O(k) 空间。',
			arr,
			[{ type: 'sorted', indices: this._range(0, n - 1) }],
			7
		);
		this.totalSteps = this.steps.length;
	}

	private _countString(count: number[]): string {
		return count.join(', ');
	}

	private _range(from: number, to: number): number[] {
		const out: number[] = [];
		for (let i = from; i <= to; i++) out.push(i);
		return out;
	}

	private _emit(
		type: StepType,
		description: string,
		data: number[],
		highlights: Highlight[],
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...data],
			highlights,
			pseudocodeLine
		});
	}
}
