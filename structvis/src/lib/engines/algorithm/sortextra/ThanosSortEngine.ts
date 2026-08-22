/**
 * 灭霸排序 — ThanosSortEngine (趣味)
 * 随机删除一半元素, 若仍无序继续删一半, 直到有序或只剩一个。"完美平衡"。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = ['while not sorted:', '  删除一半元素 (随机)', '  "perfectly balanced"'];

export class ThanosSortEngine extends EngineBase<number[]> {
	readonly name = '灭霸排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '灭霸排序: 打个响指, 随机删掉一半。' },
		{ type: 'edge-reject', narration: '还是无序? 再删一半。' },
		{ type: 'complete', narration: '完成——不保证保留原数据, 复杂度无意义, 但"完美平衡"。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '灭霸排序', fields: [] };

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
		let arr = [...input];
		this._emit('init', '初始数组: ' + arr.join(' '), arr, 0);

		let round = 0;
		const isSorted = (a: number[]): boolean => a.every((v, i) => i === 0 || a[i - 1] <= v);

		while (!isSorted(arr) && arr.length > 1) {
			round++;
			const keepCount = Math.ceil(arr.length / 2);
			const kept: number[] = [];
			for (let i = 0; i < arr.length && kept.length < keepCount; i += 2) {
				kept.push(arr[i]);
			}
			arr = kept.length > 0 ? kept : [arr[0]];
			this._emit(
				'edge-reject',
				'响指 #' + round + ': 删一半, 剩余 [' + arr.join(', ') + ']。',
				arr,
				1,
				arr.map((_, i) => i).map((i2) => ({ type: 'sorted' as const, indices: [i2] }))
			);
		}

		this._emit(
			'complete',
			isSorted(arr)
				? '"完美平衡": [' + arr.join(', ') + '] 有序(幸存者)。'
				: '只剩一个元素: [' + arr.join(', ') + ']。',
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
