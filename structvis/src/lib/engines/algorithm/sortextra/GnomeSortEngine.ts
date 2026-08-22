/**
 * 地精排序 — GnomeSortEngine (趣味算法)
 * 花盆故事: 往前插、撞了就退
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

export class GnomeSortEngine extends EngineBase<number[]> {
	readonly name = '地精排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '地精排序: 像花匠整理花盆, 顺序不对就往回退一格。' },
		{ type: 'compare', narration: '位置正确就前进, 错误就交换后退。' },
		{ type: 'complete', narration: '本质是插入排序的另一种写法, O(n²)。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '地精排序', fields: [] };

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
		let pos = 0;
		while (pos < arr.length) {
			if (pos === 0 || arr[pos] >= arr[pos - 1]) {
				pos++;
				this._emit('compare', '位置 ' + (pos + 1) + ': 顺序正确, 前进。', arr, 3, [
					{ type: 'current', indices: [pos - 1] }
				]);
			} else {
				const t = arr[pos];
				arr[pos] = arr[pos - 1];
				arr[pos - 1] = t;
				this._emit('swap', '顺序错误: 交换并后退 → ' + arr.join(' '), arr, 4, [
					{ type: 'swap', indices: [pos - 1, pos] }
				]);
				pos--;
			}
		}

		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 5, [
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
