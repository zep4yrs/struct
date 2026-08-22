/**
 * 鸡尾酒排序引擎 — CocktailSortEngine
 * 双向冒泡: 奇数轮向右冒最大, 偶数轮向左沉最小。
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
	'procedure cocktailSort(a, n):',
	'  low = 0, high = n - 1',
	'  while low < high:',
	'    for i = low to high-1: 正向比较交换',
	'    high--',
	'    for i = high downto low+1: 反向比较交换',
	'    low++'
];

export class CocktailSortEngine extends EngineBase<number[]> {
	readonly name = '鸡尾酒排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '鸡尾酒排序(双向冒泡)开始。' },
		{ type: 'compare', narration: '正向冒泡把最大值推到右端, 反向把最小值沉到左端。' },
		{ type: 'complete', narration: '排序完成。鸡尾酒排序 O(n²)。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];

	customConfig: EngineCustomConfig = { title: '鸡尾酒排序', fields: [] };

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

		let low = 0;
		let high = arr.length - 1;
		while (low < high) {
			for (let i = low; i < high; i++) {
				this._emit('compare', '正向比较 ' + arr[i] + ' 与 ' + arr[i + 1], arr, 3, [
					{ type: 'compare', indices: [i, i + 1] }
				]);
				if (arr[i] > arr[i + 1]) {
					const tmp = arr[i];
					arr[i] = arr[i + 1];
					arr[i + 1] = tmp;
					this._emit('swap', '交换后: ' + arr.join(' '), arr, 3, [
						{ type: 'swap', indices: [i, i + 1] }
					]);
				}
			}
			high--;
			for (let i = high; i > low; i--) {
				this._emit('compare', '反向比较 ' + arr[i - 1] + ' 与 ' + arr[i], arr, 5, [
					{ type: 'compare', indices: [i - 1, i] }
				]);
				if (arr[i - 1] > arr[i]) {
					const tmp = arr[i];
					arr[i] = arr[i - 1];
					arr[i - 1] = tmp;
					this._emit('swap', '交换后: ' + arr.join(' '), arr, 5, [
						{ type: 'swap', indices: [i - 1, i] }
					]);
				}
			}
			low++;
		}

		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 7, [
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
