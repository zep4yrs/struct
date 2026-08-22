/**
 * 耐心排序引擎 — PatienceSortEngine
 * 扑克牌接龙: 数组分到若干"牌堆"(每堆栈顶递减), 再多路归并。堆数 = LIS 长度。
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
	'for each card:',
	'  二分找左端牌堆顶 >= card 的堆',
	'  放入该堆; 无则新建堆',
	'堆数 = LIS 长度',
	'多路归并所有堆'
];

export class PatienceSortEngine extends EngineBase<number[]> {
	readonly name = '耐心排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '耐心排序(扑克接龙)开始: 分堆 + 归并两阶段。' },
		{ type: 'compare', narration: '每张牌放到左端第一个牌堆顶不小于它的堆上。' },
		{ type: 'complete', narration: '排序完成。堆数恰为最长递减子序列相关——可顺便求 LIS。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '耐心排序', fields: [] };

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

		// 分堆(简化演示: 直接用等价的多轮选择最小实现归并结果)
		const piles: number[][] = [];
		for (const v of arr) {
			let placed = false;
			for (const pile of piles) {
				if (pile[pile.length - 1] >= v) {
					pile.push(v);
					placed = true;
					break;
				}
			}
			if (!placed) piles.push([v]);
			this._emit('compare', '放 ' + v + ': 现在 ' + piles.length + ' 个牌堆。', arr.slice(), 2, []);
		}

		// 多路归并: 反复取各堆顶最小
		const heaps = piles.map((p) => [...p].reverse()); // 堆顶在末尾
		const result: number[] = [];
		while (result.length < arr.length) {
			let best = -1;
			for (let i = 0; i < heaps.length; i++) {
				if (
					heaps[i].length &&
					(best === -1 || heaps[i][heaps[i].length - 1] < heaps[best][heaps[best].length - 1])
				)
					best = i;
			}
			result.push(heaps[best].pop()!);
			this._emit(
				'edge-select',
				'归并取出 ' + result[result.length - 1],
				result.concat(arr.slice(result.length)),
				4,
				[{ type: 'sorted', indices: result.map((_, i) => i) }]
			);
		}

		for (let i = 0; i < arr.length; i++) arr[i] = result[i];
		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 5, [
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
