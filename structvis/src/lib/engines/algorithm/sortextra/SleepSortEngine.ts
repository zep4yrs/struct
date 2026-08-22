/**
 * 睡眠排序 — SleepSortEngine (趣味)
 * 每个元素"睡"值那么久后醒来报到——输出天然有序。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = ['for each v: fork { sleep(v); print(v) }', '// 输出顺序 = 值升序'];

export class SleepSortEngine extends EngineBase<number[]> {
	readonly name = '睡眠排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '睡眠排序: 值多大就睡多久, 醒来顺序就是排序结果。' },
		{ type: 'compare', narration: '模拟时钟推进, 谁睡醒谁报到。' },
		{ type: 'complete', narration: '完成。依赖定时器精度, 是最"物理"的排序。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '睡眠排序', fields: [] };

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
		const arr = [...input].sort((a, b) => a - b);
		this._emit('init', '初始数组(按醒来时间排列): ' + [...arr].reverse().join(' '), arr, 0);

		for (const v of arr) {
			this._emit(
				'edge-select',
				'时刻 ' + v + ': 元素 ' + v + ' 睡醒报到!',
				arr.slice(arr.indexOf(v)),
				v,
				[{ type: 'current', indices: [arr.indexOf(v)] }]
			);
		}

		this._emit(
			'complete',
			'全部报到完毕: ' + arr.join(' ') + '(时间复杂度 O(max value), 取决于最大值)。',
			arr,
			2,
			[{ type: 'sorted', indices: arr.map((_, i) => i) }]
		);
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
