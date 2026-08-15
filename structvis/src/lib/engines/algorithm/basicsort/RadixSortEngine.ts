/**
 * 基数排序引擎 — RadixSortEngine
 *
 * 教材第 11 章：LSD 基数排序——从最低位开始，按每一位的数字分桶收集，
 * 逐位处理直到最高位。稳定排序，时间复杂度 O(d·n)。
 * data 快照为数组值序列；渲染器用 'partition' 标记当前桶区间、'compare' 标记收集顺序。
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
	'procedure radixSort(a, n)',
	'  d = 最大位数',
	'  for k = 1 to d do                // 从最低位到最高位',
	'    初始化 10 个桶',
	'    for i = 1 to n do',
	'      桶[a[i] 的第 k 位数字].push(a[i])',
	'    end for',
	'    按桶顺序收集回数组 a',
	'  end for',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: 'LSD 基数排序按什么顺序处理各个位？',
		options: ['从低位到高位', '从高位到低位', '随机顺序', '只处理最高位'],
		correctAnswer: '从低位到高位',
		hint: 'LSD = Least Significant Digit',
		explanation:
			'LSD（最低位优先）基数排序先按个位分桶，再十位、百位……逐位处理。因为桶内保持先进先出，稳定排序保证高位的排序不会打乱低位的相对顺序。'
	}
];

export class RadixSortEngine extends EngineBase<number[]> {
	readonly name = '基数排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'基数排序不做元素比较，而是按数字的每一位分桶：先按个位分 0-9 十个桶，按序收集；再按十位分桶收集，逐位处理，直到最高位。'
		},
		{
			type: 'partition-start',
			narration: '开始处理某一位：把每个元素按该位数字放入对应的桶（0-9）。'
		},
		{
			type: 'compare',
			narration: '取元素的当前位数字，决定它进入哪个桶。'
		},
		{
			type: 'pivot-select',
			narration: '元素已入桶：同一位数字的元素进入同一个桶，保持相对顺序。'
		},
		{
			type: 'swap',
			narration: '收集：按桶 0 到 9 的顺序把元素放回数组，这一位就排好了。'
		},
		{
			type: 'partition-end',
			narration: '这一位处理完成，进入下一位。'
		},
		{
			type: 'complete',
			narration:
				'排序完成。基数排序时间复杂度 O(d·n)（d 为最大位数），稳定且适合整数/定长字符串排序。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '示例 A', description: '[53, 12, 78, 34, 91]' },
		{ name: '示例 B', description: '[329, 457, 657, 839, 436, 720, 355]' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '数据序列（非负整数）',
				type: 'text',
				placeholder: '逗号分隔的非负整数，如 53, 12, 78, 34',
				default: '53, 12, 78, 34, 91'
			}
		]
	};

	applyPreset(name: string): void {
		const data: number[] | undefined = {
			'示例 A': [53, 12, 78, 34, 91],
			'示例 B': [329, 457, 657, 839, 436, 720, 355]
		}[name];
		if (data) this.init(data);
	}

	applyCustom(values: Record<string, string>): void {
		this.init(parseNumberList(values.data ?? '', { min: 2, max: 20 }));
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		// 校验非负整数
		for (const v of input) {
			if (!Number.isInteger(v) || v < 0) {
				throw new Error('基数排序要求非负整数输入');
			}
		}

		const arr = [...input];
		const n = arr.length;
		const maxVal = n > 0 ? Math.max(...arr) : 0;
		const maxDigits = maxVal <= 0 ? 1 : String(maxVal).length;

		this._emit(
			'init',
			'初始数组：' +
				arr.join(' ') +
				'。最大数 ' +
				maxVal +
				'（' +
				maxDigits +
				' 位），LSD 基数排序。',
			arr,
			0
		);

		for (let digit = 0; digit < maxDigits; digit++) {
			const place = Math.pow(10, digit);
			this._emit(
				'partition-start',
				'第 ' + (digit + 1) + ' 位（' + ['个位', '十位', '百位', '千位'][digit] ||
					'第 ' + (digit + 1) + ' 位' + '）：按该位数字分桶。',
				arr,
				2,
				[{ type: 'partition', indices: this._range(0, n - 1) }]
			);

			// 分桶：显示每个元素取位数字
			const buckets: number[][] = Array.from({ length: 10 }, () => []);
			const digitOf = (v: number) => Math.floor(v / place) % 10;
			for (let i = 0; i < n; i++) {
				const d = digitOf(arr[i]);
				this._emit('compare', arr[i] + ' 的该位数字是 ' + d + '，进入桶 ' + d + '。', arr, 4, [
					{ type: 'partition', indices: this._range(0, n - 1) },
					{ type: 'compare', indices: [i], label: '→桶' + d }
				]);
				buckets[d].push(arr[i]);
			}

			// 收集：按桶顺序放回
			let idx = 0;
			for (let b = 0; b < 10; b++) {
				for (const v of buckets[b]) {
					arr[idx] = v;
					this._emit('swap', '桶 ' + b + ' 收集：' + v + ' 放回位置 ' + (idx + 1) + '。', arr, 6, [
						{ type: 'partition', indices: this._range(0, n - 1) },
						{ type: 'swap', indices: [idx], label: '桶' + b }
					]);
					idx++;
				}
			}

			this._emit('partition-end', '第 ' + (digit + 1) + ' 位处理完成，数组按该位有序。', arr, 7, [
				{ type: 'partition', indices: this._range(0, n - 1) }
			]);
		}

		this._emit('complete', '排序完成：' + arr.join(' ') + '。', arr, 8, [
			{ type: 'sorted', indices: this._range(0, n - 1) }
		]);

		this.totalSteps = this.steps.length;
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
		pseudocodeLine: number,
		extraHighlights?: Highlight[]
	): void {
		const highlights: Highlight[] = [];
		if (extraHighlights) highlights.push(...extraHighlights);

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
