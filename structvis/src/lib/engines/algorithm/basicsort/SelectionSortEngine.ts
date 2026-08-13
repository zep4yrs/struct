/**
 * 简单选择排序引擎 — SelectionSortEngine
 *
 * 教材第 11 章：每轮从无序区选出最小元素，与无序区第一个位置交换。
 * 外层 i 定位无序区起点，内层 j 扫描找最小下标 k，轮末交换并固定前缀。
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
	'procedure selectionSort(a, n)',
	'  for i = 1 to n - 1 do',
	'    k = i',
	'    for j = i + 1 to n do',
	'      if a[j] < a[k] then',
	'        k = j',
	'      end if',
	'    end for',
	'    if k != i then',
	'      swap(a[i], a[k])',
	'    end if',
	'  end for',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '选择排序每轮从无序区中选出什么？',
		options: ['最小元素', '最大元素', '中间元素', '任意元素'],
		correctAnswer: '最小元素',
		hint: '选出后与无序区第一个位置交换',
		explanation:
			'选择排序每轮扫描无序区找出最小元素，与无序区第一个位置交换，使其成为有序前缀的一部分；比较次数固定 O(n²)，交换次数最多 n-1 次。'
	}
];

export class SelectionSortEngine extends EngineBase<number[]> {
	readonly name = '选择排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'选择排序的思路：每一轮在未排序区间里找到最小的元素，把它放到区间的最前面。共 n-1 轮，每轮确定一个元素的最终位置。'
		},
		{
			type: 'partition-start',
			narration: '左侧灰色区域已就位，右侧是待排序区间。现在在待排序区间中扫描，找到最小值。'
		},
		{
			type: 'pivot-select',
			narration: '当前假定的最小元素（基准）已选定：把它与后续元素逐个比较，找出真正的最小值。'
		},
		{
			type: 'compare',
			narration: '依次比较，记录当前找到的最小值的位置，与后续元素逐个比较。'
		},
		{
			type: 'swap',
			narration: '扫描结束：把最小值与区间首元素交换，最小值就位。'
		},
		{
			type: 'partition-end',
			narration: '本轮最小元素已固定，待排序区间从下一位重新开始。'
		},
		{
			type: 'complete',
			narration:
				'排序完成。选择排序始终执行 O(n²) 次比较，但交换次数最少（至多 n-1 次），适合交换代价高的场景。'
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
			`初始数组：${arr.join(' ')}。简单选择排序：每轮选出区间最小元素放到最前。`,
			arr,
			0
		);

		const n = arr.length;
		for (let i = 0; i < n - 1; i++) {
			let k = i;
			this._emit(
				'partition-start',
				`第 ${i + 1} 轮：在区间 [${i + 1}, ${n}] 内寻找最小元素。`,
				arr,
				1,
				[
					{ type: 'partition', indices: this._range(i, n - 1) },
					{ type: 'sorted', indices: this._range(0, i - 1) }
				]
			);

			for (let j = i + 1; j < n; j++) {
				if (arr[j] < arr[k]) {
					this._emit(
						'compare',
						`比较 ${arr[j]} 与当前最小 ${arr[k]}：发现更小值 ${arr[j]}。`,
						arr,
						4,
						[
							{ type: 'partition', indices: this._range(i, n - 1) },
							{ type: 'compare', indices: [j] },
							{ type: 'pivot', indices: [k] },
							{ type: 'pointer-j', indices: [j], label: 'j' },
							{ type: 'pointer-i', indices: [i], label: 'i' },
							{ type: 'sorted', indices: this._range(0, i - 1) }
						]
					);
					k = j;
					this._emit('pivot-select', `最小元素更新为位置 ${k + 1}（值 ${arr[k]}）。`, arr, 5, [
						{ type: 'partition', indices: this._range(i, n - 1) },
						{ type: 'pivot', indices: [k] },
						{ type: 'pointer-j', indices: [j], label: 'j' },
						{ type: 'pointer-i', indices: [i], label: 'i' },
						{ type: 'sorted', indices: this._range(0, i - 1) }
					]);
				} else {
					this._emit(
						'compare',
						`比较 ${arr[j]} 与当前最小 ${arr[k]}：${arr[k]} 仍是最小值。`,
						arr,
						4,
						[
							{ type: 'partition', indices: this._range(i, n - 1) },
							{ type: 'compare', indices: [j] },
							{ type: 'pivot', indices: [k] },
							{ type: 'pointer-j', indices: [j], label: 'j' },
							{ type: 'pointer-i', indices: [i], label: 'i' },
							{ type: 'sorted', indices: this._range(0, i - 1) }
						]
					);
				}
			}

			if (k !== i) {
				[arr[i], arr[k]] = [arr[k], arr[i]];
				this._emit('swap', `将最小元素 ${arr[i]} 与位置 ${i + 1} 的 ${arr[k]} 交换。`, arr, 9, [
					{ type: 'partition', indices: this._range(i, n - 1) },
					{ type: 'swap', indices: [i, k] },
					{ type: 'pivot', indices: [i] },
					{ type: 'sorted', indices: this._range(0, i - 1) }
				]);
			} else {
				this._emit('compare', `位置 ${i + 1} 已是区间最小值，无需交换。`, arr, 8, [
					{ type: 'partition', indices: this._range(i, n - 1) },
					{ type: 'pivot', indices: [i] },
					{ type: 'pointer-i', indices: [i], label: 'i' },
					{ type: 'sorted', indices: this._range(0, i - 1) }
				]);
			}

			this._emit(
				'partition-end',
				`第 ${i + 1} 轮结束，${arr[i]} 已就位（位置 ${i + 1}）。`,
				arr,
				10,
				[{ type: 'sorted', indices: this._range(0, i) }]
			);
		}

		this._emit('complete', `排序完成：${arr.join(' ')}。`, arr, 12, [
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
