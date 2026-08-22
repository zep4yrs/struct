/**
 * 奇偶排序引擎 — OddEvenSortEngine (砖排序)
 * 并行冒泡: 奇数相位与偶数相位交替比较相邻对。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'for phase = 0 until sorted:',
	'  if phase even: compare pairs (0,1)(2,3)...',
	'  else: compare pairs (1,2)(3,4)...'
];

export class OddEvenSortEngine extends EngineBase<number[]> {
	readonly name = '奇偶排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '奇偶排序(砖排序)开始: 交替比较奇偶下标对。' },
		{ type: 'compare', narration: '每个相位内所有比较对互不重叠——可并行执行。' },
		{ type: 'complete', narration: '排序完成。O(n²) 但天然适合并行硬件。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '奇偶排序', fields: [] };

	applyPreset(_name: string): void {
		this.init([5, 2, 8, 1, 9, 3]);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => Number(s.trim()))
			.filter((n) => !Number.isNaN(n));
		this.init(nums.length >= 2 ? nums : [5, 2, 8, 1, 9, 3]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const arr = [...input];
		this._emit('init', '初始数组: ' + arr.join(' '), arr, 0);

		let sorted = false;
		let phase = 0;
		while (!sorted) {
			sorted = true;
			const start = phase % 2;
			for (let i = start; i + 1 < arr.length; i += 2) {
				this._emit(
					'compare',
					'相位 ' + phase + ': 比较 a[' + i + '] 与 a[' + (i + 1) + ']',
					arr,
					2,
					[{ type: 'compare', indices: [i, i + 1] }]
				);
				if (arr[i] > arr[i + 1]) {
					const tmp = arr[i];
					arr[i] = arr[i + 1];
					arr[i + 1] = tmp;
					sorted = false;
					this._emit('swap', '交换后: ' + arr.join(' '), arr, 3, [
						{ type: 'swap', indices: [i, i + 1] }
					]);
				}
			}
			phase++;
		}

		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 4, [
			{ type: 'sorted', indices: arr.map((_, i) => i) }
		]);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		arr: number[],
		line: number,
		hl?: Highlight[]
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...arr],
			highlights: hl ?? [],
			pseudocodeLine: line
		});
	}
}
