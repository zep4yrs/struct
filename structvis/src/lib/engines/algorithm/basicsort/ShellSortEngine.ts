/**
 * 希尔排序引擎 — ShellSortEngine
 *
 * 教材第 11 章：按递减的增量（gap）分组做插入排序，先粗排后细排。
 * 增量序列取 n/2, n/4, ..., 1（每次整除 2），最后一轮 gap=1 即普通插入排序。
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
	'procedure shellSort(a, n)',
	'  gap = n / 2',
	'  while gap > 0 do',
	'    for i = gap to n - 1 do',
	'      temp = a[i]',
	'      j = i',
	'      while j >= gap and a[j - gap] > temp do',
	'        a[j] = a[j - gap]',
	'        j = j - gap',
	'      end while',
	'      a[j] = temp',
	'    end for',
	'    gap = gap / 2',
	'  end while',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: '希尔排序的核心思想是什么？',
		options: [
			'按增量分组做插入排序，逐步缩小增量',
			'每次选最小元素交换',
			'相邻元素两两比较交换',
			'递归分治'
		],
		correctAnswer: '按增量分组做插入排序，逐步缩小增量',
		hint: '先让相隔较远的元素有序，再逐步拉近',
		explanation:
			'希尔排序用递减的增量把数组分成若干组，组内做插入排序。增量大时元素跳跃移动、整体快速接近有序，最后 gap=1 时就是普通插入排序，此时数组已接近有序，效率高。'
	}
];

export class ShellSortEngine extends EngineBase<number[]> {
	readonly name = '希尔排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'希尔排序是插入排序的改进：先按大步长把数组分成几组分别排序，让元素快速接近最终位置，再逐步缩小步长，最后一轮步长为 1 时就是普通插入排序。'
		},
		{
			type: 'partition-start',
			narration: '开始新一轮：步长为 gap，数组被分成若干组，每组内做插入排序。'
		},
		{
			type: 'compare',
			narration: '在组内比较并后移：把当前元素与它前面相隔 gap 的元素比较，大的后移。'
		},
		{
			type: 'swap',
			narration: '插入到正确位置：组内元素前移后，把当前元素放到空出来的位置。'
		},
		{
			type: 'partition-end',
			narration: '本轮完成：gap 减半，继续下一轮更精细的排序。'
		},
		{
			type: 'complete',
			narration:
				'排序完成。希尔排序的时间复杂度取决于增量序列，平均约 O(n^1.3)；它是不稳定排序，但比简单插入排序快得多，且同样就地排序。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '示例 A', description: '[5, 2, 8, 1, 9]' },
		{ name: '示例 B', description: '[9, 7, 5, 3, 1, 8, 6, 4]' }
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
			'示例 B': [9, 7, 5, 3, 1, 8, 6, 4]
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
		const n = arr.length;

		this._emit(
			'init',
			'初始数组：' + arr.join(' ') + '。希尔排序：按递减增量分组插入排序。',
			arr,
			0
		);

		let gap = Math.floor(n / 2);
		let round = 0;
		while (gap > 0) {
			round++;
			this._emit(
				'partition-start',
				'第 ' + round + ' 轮：gap = ' + gap + '，分成 ' + (n - gap) + ' 组进行插入排序。',
				arr,
				2,
				[{ type: 'partition', indices: this._range(0, n - 1) }]
			);

			for (let i = gap; i < n; i++) {
				const temp = arr[i];
				this._emit(
					'partition-start',
					'取出位置 ' + (i + 1) + ' 的元素 ' + temp + '，在它所在的 gap 组内向前插入。',
					arr,
					4,
					[
						{ type: 'partition', indices: this._range(0, n - 1) },
						{ type: 'pivot', indices: [i] },
						{ type: 'pointer-i', indices: [i], label: 'i' }
					]
				);

				let j = i;
				while (j >= gap && arr[j - gap] > temp) {
					this._emit(
						'compare',
						'比较 ' +
							temp +
							' 与前方 gap 步的 ' +
							arr[j - gap] +
							'：' +
							arr[j - gap] +
							' > ' +
							temp +
							'，后移。',
						arr,
						6,
						[
							{ type: 'partition', indices: this._range(0, n - 1) },
							{ type: 'compare', indices: [j - gap] },
							{ type: 'pivot', indices: [j] },
							{ type: 'pointer-j', indices: [j - gap], label: 'j-gap' },
							{ type: 'pointer-i', indices: [i], label: 'i' }
						]
					);
					arr[j] = arr[j - gap];
					this._emit('swap', '将 ' + arr[j] + ' 后移到位置 ' + (j + 1) + '。', arr, 7, [
						{ type: 'partition', indices: this._range(0, n - 1) },
						{ type: 'swap', indices: [j] },
						{ type: 'pointer-j', indices: [j - gap], label: 'j-gap' },
						{ type: 'pointer-i', indices: [i], label: 'i' }
					]);
					j -= gap;
				}

				arr[j] = temp;
				this._emit('swap', temp + ' 插入到位置 ' + (j + 1) + '（组内有序）。', arr, 9, [
					{ type: 'partition', indices: this._range(0, n - 1) },
					{ type: 'swap', indices: [j], label: '插入' },
					{ type: 'pointer-i', indices: [i], label: 'i' }
				]);
			}

			this._emit('partition-end', 'gap = ' + gap + ' 轮完成，数组更接近有序。', arr, 11, [
				{ type: 'partition', indices: this._range(0, n - 1) }
			]);
			gap = Math.floor(gap / 2);
		}

		this._emit('complete', '排序完成：' + arr.join(' ') + '。', arr, 12, [
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
