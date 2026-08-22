/**
 * 计数排序 — CountingSortEngine
 * 非比较排序: 统计频次后按序回填。O(n+k), k 为值域。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = ['count[v] 统计每个值出现次数', '按 v 从小到大: 输出 count[v] 个 v'];

export class CountingSortEngine extends EngineBase<number[]> {
	readonly name = '计数排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '计数排序开始: 不比较元素, 直接按值统计频次。' },
		{ type: 'compare', narration: '按值从小到大回填输出数组。' },
		{ type: 'complete', narration: '排序完成。O(n+k), 值域小时快过一切比较排序。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '计数排序', fields: [] };

	applyPreset(_name: string): void {
		this.init([4, 2, 2, 8, 3, 3, 1]);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => Number(s.trim()))
			.filter((n) => !Number.isNaN(n));
		this.init(nums.length >= 2 ? nums : [4, 2, 2, 8, 3, 3, 1]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const arr = [...input];
		this._emit('init', '初始数组: ' + arr.join(' '), arr, 0);

		const maxV = Math.max(...arr);
		const count = new Array(maxV + 1).fill(0);
		for (const v of arr) count[v]++;
		this._emit(
			'compare',
			'频次统计完成: ' +
				count
					.map((c, v) => (c ? v + 'x' + c : ''))
					.filter(Boolean)
					.join(' '),
			arr,
			1
		);

		const out: number[] = [];
		for (let v = 0; v <= maxV; v++) {
			for (let c = 0; c < count[v]; c++) {
				out.push(v);
				const snap = out.concat(arr.slice(out.length));
				this._emit('edge-select', '回填 ' + v + '(第 ' + out.length + ' 位)', snap, 2, [
					{ type: 'sorted', indices: out.map((_, i) => i) }
				]);
			}
		}

		for (let i = 0; i < arr.length; i++) arr[i] = out[i];
		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 3, [
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
