/**
 * 圈排序引擎 — CycleSortEngine
 * 理论写入次数最少的排序: 每个元素直接落到最终位置。
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
	'for cs = 0 to n-2:',
	'  item = a[cs]; pos = cs',
	'  统计比 item 小的个数 → pos',
	'  while pos != cs: 交换 item 与 a[pos], 更新 pos'
];

export class CycleSortEngine extends EngineBase<number[]> {
	readonly name = '圈排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '圈排序开始: 理论上写入次数最少(每元素恰好写到最终位置一次)。' },
		{ type: 'compare', narration: '为当前元素计算最终位置, 循环交换归位。' },
		{ type: 'complete', narration: '排序完成。适合写代价昂贵的存储(EEPROM/Flash)。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '圈排序', fields: [] };

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

		for (let cs = 0; cs < arr.length - 1; cs++) {
			let item = arr[cs];
			let pos = cs;
			for (let i = cs + 1; i < arr.length; i++) {
				if (arr[i] < item) pos++;
			}
			if (pos === cs) continue;
			while (item === arr[pos]) pos++;
			this._emit('edge-select', item + ' 的最终位置是 ' + (pos + 1), arr, 3, [
				{ type: 'current', indices: [pos] }
			]);
			let tmp = arr[pos];
			arr[pos] = item;
			item = tmp;
			this._emit('swap', '归位后: ' + arr.join(' '), arr, 4, [{ type: 'swap', indices: [pos] }]);
			while (pos !== cs) {
				pos = cs;
				for (let i = cs + 1; i < arr.length; i++) {
					if (arr[i] < item) pos++;
				}
				while (item === arr[pos]) pos++;
				tmp = arr[pos];
				arr[pos] = item;
				item = tmp;
				this._emit('swap', '循环继续: ' + arr.join(' '), arr, 5, [
					{ type: 'swap', indices: [pos] }
				]);
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
