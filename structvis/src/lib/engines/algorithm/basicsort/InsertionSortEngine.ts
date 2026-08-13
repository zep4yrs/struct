/**
 * 直接插入排序引擎 — InsertionSortEngine
 *
 * 教材第 11 章：把无序区第一个元素插入到已有序序列的适当位置。
 * 每轮取 arr[i] 为 temp，向前比较，比 temp 大的元素逐个后移，最后把 temp 放入空位。
 */

import type {
	DemoScriptItem,
	AlgorithmStep,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';
import { parseNumberList } from '../parseInput';

const PSEUDO: string[] = [
	'procedure insertionSort(a, n)',
	'  for i = 2 to n do',
	'    temp = a[i]',
	'    j = i - 1',
	'    while j >= 1 and a[j] > temp do',
	'      a[j + 1] = a[j]',
	'      j = j - 1',
	'    end while',
	'    a[j + 1] = temp',
	'  end for',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '插入排序处理第 i 个元素时，前提是什么？',
		options: ['前 i-1 个元素已有序', '整个数组已有序', '后 n-i 个元素已有序', '没有任何前提'],
		correctAnswer: '前 i-1 个元素已有序',
		hint: '把新元素插入到已排序部分',
		explanation:
			'插入排序维护一个"已有序前缀"：每轮把当前元素与前面的有序部分从后向前比较，找到合适位置插入，前 i-1 个元素始终有序。'
	}
];

export class InsertionSortEngine extends EngineBase<number[]> {
	readonly name = '插入排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'插入排序的思路：像整理扑克牌一样，把待排序的元素逐个插入到左边已有序的序列中。第 1 个元素天然有序，从第 2 个元素开始往前插。'
		},
		{
			type: 'partition-start',
			narration:
				'左侧灰色区域已经有序。现在拿出下一个元素，与前面的元素从右往左比较，找它该插入的位置。'
		},
		{
			type: 'compare',
			narration:
				'把当前元素与前面的元素比较：如果前面的更大，就把它向后挪一位，给待插入元素腾出位置。'
		},
		{
			type: 'swap',
			narration: '前一个元素向后挪动，比较窗口继续左移。'
		},
		{
			type: 'complete',
			narration: '排序完成。插入排序时间复杂度 O(n²)，但对近乎有序的数据效率很高，适合小规模数据。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '示例 A', description: '[5, 2, 8, 1, 9]' },
		{ name: '示例 B', description: '[3, 7, 1, 9, 4, 6]' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '数据序列',
				type: 'text',
				placeholder: '逗号分隔的整数，如 5, 2, 8, 1, 9',
				default: '5, 2, 8, 1, 9'
			}
		]
	};

	applyPreset(name: string): void {
		const data: number[] | undefined = {
			'示例 A': [5, 2, 8, 1, 9],
			'示例 B': [3, 7, 1, 9, 4, 6]
		}[name];
		if (data) this.init(data);
	}

	applyCustom(values: Record<string, string>): void {
		this.init(parseNumberList(values.data ?? '', { min: 2, max: 20 }));
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const arr = [...input];

		this._emit(
			'init',
			`初始数组：${arr.join(' ')}。直接插入排序：每轮将当前元素插入到已有序前缀。`,
			arr,
			0
		);

		const n = arr.length;
		for (let i = 1; i < n; i++) {
			const temp = arr[i];
			this._emit(
				'partition-start',
				`第 ${i} 轮：取出元素 ${temp}，插入到已有序部分 ${arr.slice(0, i).join(', ') || '(空)'}。`,
				arr,
				1,
				[{ type: 'partition', indices: this._range(0, i) }]
			);

			let j = i - 1;
			while (j >= 0 && arr[j] > temp) {
				this._emit(
					'compare',
					`比较 ${temp} 与 ${arr[j]}：${arr[j]} > ${temp}，${arr[j]} 需要后移。`,
					arr,
					4,
					[
						{ type: 'partition', indices: this._range(0, i) },
						{ type: 'compare', indices: [j] },
						{ type: 'pointer-j', indices: [j], label: 'j' },
						{ type: 'pointer-i', indices: [i], label: 'i' }
					]
				);
				arr[j + 1] = arr[j];
				this._emit('swap', `将 ${arr[j + 1]} 后移一位到位置 ${j + 2}。`, arr, 5, [
					{ type: 'partition', indices: this._range(0, i) },
					{ type: 'swap', indices: [j + 1] },
					{ type: 'pointer-j', indices: [j], label: 'j' },
					{ type: 'pointer-i', indices: [i], label: 'i' }
				]);
				j--;
			}

			arr[j + 1] = temp;
			this._emit('swap', `位置 ${j + 2} 已空出，${temp} 插入（其前元素均 ≤ ${temp}）。`, arr, 8, [
				{ type: 'partition', indices: this._range(0, i) },
				{ type: 'swap', indices: [j + 1], label: '插入' },
				{ type: 'sorted', indices: this._range(0, i) }
			]);
		}

		this._emit('complete', `排序完成：${arr.join(' ')}。`, arr, 10, [
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
