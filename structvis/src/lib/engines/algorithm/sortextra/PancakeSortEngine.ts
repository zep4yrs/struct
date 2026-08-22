/**
 * 煎饼排序 — PancakeSortEngine (趣味算法)
 * 只允许翻转前缀
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

export class PancakeSortEngine extends EngineBase<number[]> {
	readonly name = '煎饼排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '煎饼排序: 只能用"铲子翻前 k 个", 把最大的翻到顶部再翻到底部。' },
		{ type: 'compare', narration: '每轮两次翻转归位一个最大值。' },
		{ type: 'complete', narration: '真实算法, 总翻转次数 ≤ 2n-3。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '煎饼排序', fields: [] };

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
		const flip = (k: number): void => {
			let l = 0;
			let r = k;
			while (l < r) {
				const t = arr[l];
				arr[l] = arr[r];
				arr[r] = t;
				l++;
				r--;
			}
		};

		for (let size = arr.length; size > 1; size--) {
			let maxIdx = 0;
			for (let i = 1; i < size; i++) if (arr[i] > arr[maxIdx]) maxIdx = i;
			if (maxIdx === size - 1) continue;
			flip(maxIdx);
			this._emit(
				'edge-select',
				'翻转前 ' + (maxIdx + 1) + ' 个: 最大值到顶部 → ' + arr.join(' '),
				arr,
				2,
				[{ type: 'current', indices: [maxIdx] }]
			);
			flip(size - 1);
			this._emit('swap', '再整体翻转: ' + arr[size - 1] + ' 归位 → ' + arr.join(' '), arr, 3, [
				{ type: 'sorted', indices: [size - 1] }
			]);
		}

		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 4, [
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
