/**
 * 博佐排序 — BozoSortEngine (趣味算法)
 * 随机交换两个元素碰运气
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = ['// 趣味算法: 教学娱乐用', '// 无实用价值'];

export class BozoSortEngine extends EngineBase<number[]> {
	readonly name = '博佐排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '博佐排序: 随机挑两个元素交换, 直到有序。' },
		{ type: 'compare', narration: '比猴子排序聪明一点点——只换两个而不是全部重排。' },
		{ type: 'complete', narration: '同样期望极慢, 但偶尔能蒙对。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '博佐排序', fields: [] };

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
		const isSorted = (a: number[]): boolean => a.every((v, i) => i === 0 || a[i - 1] <= v);

		let attempts = 0;
		const maxAttempts = 80;
		while (!isSorted(arr) && attempts < maxAttempts) {
			attempts++;
			const i = Math.floor(Math.random() * arr.length);
			let j = Math.floor(Math.random() * arr.length);
			while (j === i) j = Math.floor(Math.random() * arr.length);
			const t = arr[i];
			arr[i] = arr[j];
			arr[j] = t;
			this._emit(
				'swap',
				'第 ' + attempts + ' 次: 交换 a[' + i + '] 与 a[' + j + '] → ' + arr.join(' '),
				arr,
				2,
				[{ type: 'swap', indices: [i, j] }]
			);
		}

		this._emit(
			'complete',
			attempts < maxAttempts
				? '第 ' + attempts + ' 次交换后有序!'
				: '放弃: ' + maxAttempts + ' 次不够运气。',
			arr,
			3,
			[{ type: 'sorted', indices: arr.map((_, i) => i) }]
		);
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
