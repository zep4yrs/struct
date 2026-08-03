/**
 * 冒泡排序引擎 — BubbleSortEngine
 *
 * 教材第 11 章：每一轮把无序区中的最大值逐次上浮到末尾。
 * 外层 i 从 n-1 递减到 1（无序区长度），内层 j 在 [0, i-1] 比较相邻元素。
 * data 快照为数组值序列，渲染器用 'sorted' 高亮已排定尾部。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { parseNumberList } from '../parseInput';

const PSEUDO: string[] = [
	'procedure bubbleSort(a, n)',
	'  for i = n - 1 downto 1 do',
	'    for j = 0 to i - 1 do',
	'      if a[j] > a[j + 1] then',
	'        swap(a[j], a[j + 1])',
	'      end if',
	'    end for',
	'  end for',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: '冒泡排序每一轮结束后，最大的元素会出现在哪里？',
		options: ['数组末尾', '数组开头', '中间位置', '随机位置'],
		correctAnswer: '数组末尾',
		hint: '相邻比较时较大值总是向后交换',
		explanation:
			'每轮比较中较大的元素不断与后继交换，最大值会被"冒泡"到无序区末尾；下一轮无序区长度减一，该位置不再参与比较。'
	}
];

export class BubbleSortEngine implements AlgorithmEngine<number[]> {
	readonly name = '冒泡排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'冒泡排序的思路：每一轮从头到尾比较相邻元素，把最大的数"冒泡"到末尾。共需要 n-1 轮，每轮少比较一个元素。'
		},
		{
			type: 'partition-start',
			narration: '新一轮开始。左侧是待排序区间，右侧灰色部分已经是排好序的，不再参与比较。'
		},
		{
			type: 'compare',
			narration: '比较相邻两个元素：如果左边的更大，就交换它们，让较大的数向后"上浮"。'
		},
		{
			type: 'swap',
			narration: '交换完成，大数向后移动一位。继续向后比较。'
		},
		{
			type: 'partition-end',
			narration: '本轮结束，最大数已就位到区间末尾。下一轮待排序区间缩短一个元素。'
		},
		{
			type: 'complete',
			narration:
				'排序完成。冒泡排序时间复杂度 O(n²)，每轮结束后最大元素都会"沉底"——这就是名字的由来。'
		}
	];

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

		this._emit('init', `初始数组：${arr.join(' ')}。冒泡排序：相邻比较，较大值上浮。`, arr, 0);

		const n = arr.length;
		for (let i = n - 1; i >= 1; i--) {
			const round = n - i;
			this._emit(
				'partition-start',
				`第 ${round} 轮：在区间 [1, ${i + 1}] 内比较相邻元素，把最大值上浮到位置 ${i + 1}。`,
				arr,
				1,
				[
					{ type: 'partition', indices: this._range(0, i) },
					{ type: 'sorted', indices: this._range(i + 1, n - 1) }
				]
			);

			let swapped = false;
			for (let j = 0; j < i; j++) {
				if (arr[j] > arr[j + 1]) {
					this._emit(
						'compare',
						`比较 ${arr[j]} 与 ${arr[j + 1]}：${arr[j]} > ${arr[j + 1]}，需要交换。`,
						arr,
						3,
						[
							{ type: 'compare', indices: [j, j + 1] },
							{ type: 'pointer-j', indices: [j], label: 'j' },
							{ type: 'partition', indices: this._range(0, i) },
							{ type: 'sorted', indices: this._range(i + 1, n - 1) }
						]
					);
					[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
					swapped = true;
					this._emit(
						'swap',
						`交换 ${arr[j]} 与 ${arr[j + 1]}，较大值 ${arr[j + 1]} 上浮一位。`,
						arr,
						4,
						[
							{ type: 'swap', indices: [j, j + 1] },
							{ type: 'pointer-j', indices: [j + 1], label: 'j' },
							{ type: 'partition', indices: this._range(0, i) },
							{ type: 'sorted', indices: this._range(i + 1, n - 1) }
						]
					);
				} else {
					this._emit('compare', `比较 ${arr[j]} 与 ${arr[j + 1]}：已有序，无需交换。`, arr, 3, [
						{ type: 'compare', indices: [j, j + 1] },
						{ type: 'pointer-j', indices: [j], label: 'j' },
						{ type: 'partition', indices: this._range(0, i) },
						{ type: 'sorted', indices: this._range(i + 1, n - 1) }
					]);
				}
			}

			this._emit(
				'partition-end',
				`第 ${round} 轮${swapped ? '' : '无交换'}结束，${arr[i]} 已就位（位置 ${i + 1}）。`,
				arr,
				5,
				[{ type: 'sorted', indices: this._range(i, n - 1) }]
			);
		}

		this._emit('complete', `排序完成：${arr.join(' ')}。`, arr, 8, [
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
