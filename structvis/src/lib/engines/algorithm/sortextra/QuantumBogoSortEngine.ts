/**
 * 量子猴排 — QuantumBogoSortEngine (趣味)
 * "同时处于所有排列的叠加态, 一观测就有序"。一次观测即完成。
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
	'1. 量子打乱数组(叠加态包含所有排列)',
	'2. 观测宇宙',
	'3. 若宇宙毁灭则本分支不成立',
	'4. 存活的观测结果必然有序'
];

export class QuantumBogoSortEngine extends EngineBase<number[]> {
	readonly name = '量子猴排';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '量子猴排: 把数组打成所有排列的量子叠加态。' },
		{ type: 'compare', narration: '观测!在绝大多数分支里宇宙毁灭了……' },
		{
			type: 'complete',
			narration:
				'我们所在的这个分支幸存了下来, 数组恰好有序。平均 O(1)!代价是需要多个宇宙。(纯属娱乐)'
		}
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '量子猴排', fields: [] };

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
		this._emit('edge-select', '量子打乱: 数组同时处于所有 n! 种排列……', arr, 1);
		const sorted = [...arr].sort((a, b) => a - b);
		for (let i = 0; i < arr.length; i++) arr[i] = sorted[i];
		this._emit(
			'complete',
			'观测完成: 我们幸存的宇宙里它恰好有序 [' + arr.join(', ') + ']。O(1) 完成!',
			arr,
			3,
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
