/**
 * 最差排序 — WorstSortEngine (趣味算法)
 * 暴力枚举所有排列
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

export class WorstSortEngine extends EngineBase<number[]> {
	readonly name = '最差排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '最差排序: 枚举全排列找有序的那个, O(n × n!)。' },
		{ type: 'compare', narration: '确定性但灾难性——5 个元素就要 120 次尝试。' },
		{ type: 'complete', narration: '演示"暴力穷举的天花板"。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '最差排序', fields: [] };

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
		const permute = (a: number[], l: number, r: number): boolean => {
			if (l === r) {
				attempts++;
				this._emit('compare', '排列 #' + attempts + ': ' + a.join(','), a, 2);
				return isSorted(a);
			}
			for (let i = l; i <= r; i++) {
				const t = a[l];
				a[l] = a[i];
				a[i] = t;
				if (permute(a, l + 1, r)) return true;
				a[i] = a[l];
				a[l] = t;
			}
			return false;
		};

		const work = [...arr];
		permute(work, 0, Math.min(arr.length - 1, 4));
		for (let i = 0; i < arr.length; i++) arr[i] = work[i];

		this._emit('complete', '共尝试 ' + attempts + ' 个排列后找到有序解: ' + arr.join(' '), arr, 3, [
			{ type: 'sorted', indices: arr.map((_, i) => i) }
		]);
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
