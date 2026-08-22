/**
 * 猴子排序 — BogoSortEngine (趣味算法)
 * 随机打乱全靠运气
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

export class BogoSortEngine extends EngineBase<number[]> {
	readonly name = '猴子排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '猴子排序: 随机打乱数组直到碰巧有序。' },
		{ type: 'compare', narration: '每次打乱都是全新的一次抽奖。' },
		{
			type: 'complete',
			narration: '期望 O(n × n!)——8 个元素平均要洗 10 万次。教学演示限定了尝试次数。'
		}
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '猴子排序', fields: [] };

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
		const maxAttempts = 50;
		while (!isSorted(arr) && attempts < maxAttempts) {
			attempts++;
			for (let i = arr.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				const t = arr[i];
				arr[i] = arr[j];
				arr[j] = t;
			}
			this._emit('compare', '第 ' + attempts + ' 次打乱: ' + arr.join(' '), arr, 2);
		}

		this._emit(
			'complete',
			attempts < maxAttempts
				? '第 ' + attempts + ' 次打乱后碰巧有序! [' + arr.join(', ') + ']'
				: maxAttempts + ' 次仍未有序——放弃(期望次数是天文数字)。',
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
