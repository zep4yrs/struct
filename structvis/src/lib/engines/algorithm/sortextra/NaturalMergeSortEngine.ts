/**
 * 自然归并排序 — NaturalMergeSortEngine
 * 自适应: 先识别天然有序段, 两两归并直至整体有序。近似有序数据极快。
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
	'repeat:',
	'  识别天然有序段 runs',
	'  两两归并相邻 runs',
	'until 只剩一个 run'
];

export class NaturalMergeSortEngine extends EngineBase<number[]> {
	readonly name = '自然归并排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '自然归并开始: 利用数据中已有的有序片段。' },
		{ type: 'compare', narration: '识别天然升序段, 两两归并。' },
		{ type: 'complete', narration: '排序完成。对近似有序数据接近 O(n)——自适应排序的代表。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '自然归并', fields: [] };

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

		const findRuns = (a: number[]): number[][] => {
			const runs: number[][] = [];
			let start = 0;
			for (let i = 1; i < a.length; i++) {
				if (a[i] < a[i - 1]) {
					runs.push(a.slice(start, i));
					start = i;
				}
			}
			runs.push(a.slice(start));
			return runs;
		};

		const merge = (x: number[], y: number[]): number[] => {
			const out: number[] = [];
			let i = 0;
			let j = 0;
			while (i < x.length && j < y.length) out.push(x[i] <= y[j] ? x[i++] : y[j++]);
			while (i < x.length) out.push(x[i++]);
			while (j < y.length) out.push(y[j++]);
			return out;
		};

		let runs = findRuns(arr);
		while (runs.length > 1) {
			const next: number[][] = [];
			for (let i = 0; i < runs.length; i += 2) {
				next.push(i + 1 < runs.length ? merge(runs[i], runs[i + 1]) : runs[i]);
			}
			runs = next;
			arr = runs.flat();
			this._emit('compare', '归并后剩 ' + runs.length + ' 段: ' + arr.join(' '), arr, 3, []);
		}

		arr = runs[0];
		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 4, [
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
