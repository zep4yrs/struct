/**
 * 斯托奇排序引擎 — StoogeSortEngine
 * 递归三分: 前 2/3 排、后 2/3 排、再前 2/3 排。O(n^2.7) 教学趣味算法。
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
	'stooge(l, r):',
	'  if a[l] > a[r]: swap',
	'  if r-l+1 > 2:',
	'    t = (r-l+1)/3',
	'    stooge(l, r-t); stooge(l+t, r); stooge(l, r-t)'
];

export class StoogeSortEngine extends EngineBase<number[]> {
	readonly name = '斯托奇排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '斯托奇排序开始: 三段递归的搞笑但正确的排序。' },
		{ type: 'compare', narration: '前 2/3、后 2/3、再前 2/3——递归三次。' },
		{ type: 'complete', narration: '排序完成。O(n^2.7) 比冒泡还慢, 但展示了递归的通用性。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '斯托奇排序', fields: [] };

	applyPreset(_name: string): void {
		this.init([5, 2, 8, 1, 9, 3]);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => Number(s.trim()))
			.filter((n) => !Number.isNaN(n));
		this.init(nums.length >= 2 ? nums.slice(0, 8) : [5, 2, 8, 1, 9, 3]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const arr = [...input];
		this._emit('init', '初始数组: ' + arr.join(' '), arr, 0);

		const stooge = (l: number, r: number): void => {
			if (r - l + 1 < 2) return;
			this._emit('compare', '比较端点 a[' + l + '] 与 a[' + r + ']', arr, 1, [
				{ type: 'compare', indices: [l, r] }
			]);
			if (arr[l] > arr[r]) {
				const tmp = arr[l];
				arr[l] = arr[r];
				arr[r] = tmp;
				this._emit('swap', '交换端点: ' + arr.join(' '), arr, 1, [
					{ type: 'swap', indices: [l, r] }
				]);
			}
			if (r - l + 1 > 2) {
				const t = Math.floor((r - l + 1) / 3);
				stooge(l, r - t);
				stooge(l + t, r);
				stooge(l, r - t);
			}
		};

		stooge(0, arr.length - 1);

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
