/**
 * 简单选择排序引擎 — SelectionSortEngine
 *
 * 教材第 11 章：每轮从无序区选出最小元素，与无序区第一个位置交换。
 * 外层 i 定位无序区起点，内层 j 扫描找最小下标 k，轮末交换并固定前缀。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
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

export class SelectionSortEngine implements AlgorithmEngine<number[]> {
	readonly name = '选择排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	private _stepId = 0;

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
					this._emit(
						'pivot-select',
						`最小元素更新为位置 ${k + 1}（值 ${arr[k]}）。`,
						arr,
						5,
						[
							{ type: 'partition', indices: this._range(i, n - 1) },
							{ type: 'pivot', indices: [k] },
							{ type: 'pointer-j', indices: [j], label: 'j' },
							{ type: 'pointer-i', indices: [i], label: 'i' },
							{ type: 'sorted', indices: this._range(0, i - 1) }
						]
					);
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
				this._emit(
					'swap',
					`将最小元素 ${arr[i]} 与位置 ${i + 1} 的 ${arr[k]} 交换。`,
					arr,
					9,
					[
						{ type: 'partition', indices: this._range(i, n - 1) },
						{ type: 'swap', indices: [i, k] },
						{ type: 'pivot', indices: [i] },
						{ type: 'sorted', indices: this._range(0, i - 1) }
					]
				);
			} else {
				this._emit(
					'compare',
					`位置 ${i + 1} 已是区间最小值，无需交换。`,
					arr,
					8,
					[
						{ type: 'partition', indices: this._range(i, n - 1) },
						{ type: 'pivot', indices: [i] },
						{ type: 'pointer-i', indices: [i], label: 'i' },
						{ type: 'sorted', indices: this._range(0, i - 1) }
					]
				);
			}

			this._emit(
				'partition-end',
				`第 ${i + 1} 轮结束，${arr[i]} 已就位（位置 ${i + 1}）。`,
				arr,
				10,
				[{ type: 'sorted', indices: this._range(0, i) }]
			);
		}

		this._emit(
			'complete',
			`排序完成：${arr.join(' ')}。`,
			arr,
			12,
			[{ type: 'sorted', indices: this._range(0, n - 1) }]
		);

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
