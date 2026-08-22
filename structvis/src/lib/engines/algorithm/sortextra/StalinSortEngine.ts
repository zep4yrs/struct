/**
 * 斯大林排序 — StalinSortEngine (趣味)
 * 从左到右扫描, 逆序元素直接"清除", 剩余天然有序。O(n) 但丢数据。
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
	'result = [a[0]]',
	'for i = 1 to n-1:',
	'  if a[i] >= last(result): result.push(a[i])',
	'  else: 清除 a[i]'
];

export class StalinSortEngine extends EngineBase<number[]> {
	readonly name = '斯大林排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '斯大林排序: 不服从顺序的元素将被清除。' },
		{ type: 'edge-reject', narration: '逆序元素直接淘汰——剩余天然有序。' },
		{ type: 'complete', narration: 'O(n) 完成, 高效但"代价惨重"。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '斯大林排序', fields: [] };

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

		const result: number[] = [arr[0]];
		let purged = 0;
		for (let i = 1; i < arr.length; i++) {
			if (arr[i] >= result[result.length - 1]) {
				result.push(arr[i]);
				this._emit(
					'edge-select',
					arr[i] + ' 服从秩序: 保留。[' + result.join(', ') + ']',
					result.concat(arr.slice(i + 1)),
					2,
					[{ type: 'current', indices: [result.length - 1] }]
				);
			} else {
				purged++;
				this._emit(
					'edge-reject',
					arr[i] + ' 被清除!(共 ' + purged + ' 人)',
					result.concat(arr.slice(i + 1)),
					2,
					[]
				);
			}
		}

		this._emit(
			'complete',
			'完成:[' + result.join(', ') + '] 有序。清除 ' + purged + ' 个元素,O(n) 但丢失数据。',
			result,
			3,
			[{ type: 'sorted', indices: result.map((_, i) => i) }]
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
