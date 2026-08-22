/**
 * 梳排序引擎 — CombSortEngine
 * 冒泡改进: 间隙从 n 开始每次除以 1.3, 间隙为 1 时退化为冒泡。
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
	'gap = n',
	'repeat until gap == 1 and sorted:',
	'  gap = max(1, floor(gap / 1.3))',
	'  for i = 0 to n-gap-1:',
	'    if a[i] > a[i+gap]: swap'
];

export class CombSortEngine extends EngineBase<number[]> {
	readonly name = '梳排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '梳排序(Comb Sort)开始: 大间隙快速消除乱序。' },
		{ type: 'compare', narration: '间隙递减, 越来越接近冒泡。' },
		{ type: 'complete', narration: '排序完成。平均 O(n²/2^p), 实践常快于快排常数倍。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '梳排序', fields: [] };

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

		let gap = arr.length;
		let swapped = true;
		while (gap > 1 || swapped) {
			gap = Math.max(1, Math.floor(gap / 1.3));
			swapped = false;
			for (let i = 0; i + gap < arr.length; i++) {
				this._emit(
					'compare',
					'间隙 ' + gap + ': 比较 a[' + i + '] 与 a[' + (i + gap) + ']',
					arr,
					4,
					[{ type: 'compare', indices: [i, i + gap] }]
				);
				if (arr[i] > arr[i + gap]) {
					const tmp = arr[i];
					arr[i] = arr[i + gap];
					arr[i + gap] = tmp;
					swapped = true;
					this._emit('swap', '交换后: ' + arr.join(' '), arr, 5, [
						{ type: 'swap', indices: [i, i + gap] }
					]);
				}
			}
		}

		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 6, [
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
