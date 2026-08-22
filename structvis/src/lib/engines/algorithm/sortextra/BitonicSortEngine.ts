/**
 * 双调排序引擎 — BitonicSortEngine
 * 比较网络: 递归构造双调序列再归并。GPU 并行排序的理论基础。
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
	'bitonicSort(lo, n, dir):',
	'  if n > 1:',
	'    bitonicSort(lo, n/2, ASC)',
	'    bitonicSort(lo+n/2, n/2, DESC)',
	'    bitonicMerge(lo, n, dir)'
];

export class BitonicSortEngine extends EngineBase<number[]> {
	readonly name = '双调排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '双调排序开始: 先升后降构成双调序列, 再归并(要求 2 的幂长度, 自动补齐)。'
		},
		{ type: 'compare', narration: '比较网络固定——与数据无关, 天然适合 GPU 并行。' },
		{ type: 'complete', narration: '排序完成。O(n log²n), 固定比较模式可完全并行化。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '双调排序', fields: [] };

	applyPreset(_name: string): void {
		this.init([5, 2, 8, 1, 9, 3, 7, 4]);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => Number(s.trim()))
			.filter((n) => !Number.isNaN(n));
		this.init(nums.length >= 2 ? nums : [5, 2, 8, 1, 9, 3, 7, 4]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const arr = [...input];
		this._emit('init', '初始数组: ' + arr.join(' '), arr, 0);

		const compareSwap = (i: number, j: number, dir: boolean): void => {
			this._emit(
				'compare',
				'网络比较 a[' + i + '] 与 a[' + j + '](' + (dir ? '升' : '降') + ')',
				arr,
				3,
				[{ type: 'compare', indices: [i, j] }]
			);
			if (dir === arr[i] > arr[j]) {
				const tmp = arr[i];
				arr[i] = arr[j];
				arr[j] = tmp;
				this._emit('swap', '交换后: ' + arr.join(' '), arr, 4, [{ type: 'swap', indices: [i, j] }]);
			}
		};

		const bitonicMerge = (lo: number, cnt: number, dir: boolean): void => {
			if (cnt <= 1) return;
			const k = Math.floor(cnt / 2);
			for (let i = lo; i < lo + k; i++) compareSwap(i, i + k, dir);
			bitonicMerge(lo, k, dir);
			bitonicMerge(lo + k, k, dir);
		};
		const bitonicSort = (lo: number, cnt: number, dir: boolean): void => {
			if (cnt <= 1) return;
			const k = Math.floor(cnt / 2);
			bitonicSort(lo, k, true);
			bitonicSort(lo + k, k, false);
			bitonicMerge(lo, cnt, dir);
		};

		// 补齐到 2 的幂
		let m = 1;
		while (m < arr.length) m *= 2;
		while (arr.length < m) arr.push(Number.MAX_SAFE_INTEGER);
		this._emit('edge-reject', '补齐到 2 的幂(用极大值占位), 排序后截断。', arr, 0);

		bitonicSort(0, arr.length, true);

		// 截断
		const finalArr = arr.filter((v) => v !== Number.MAX_SAFE_INTEGER);
		for (let i = 0; i < arr.length; i++) arr[i] = finalArr[i] ?? Number.MAX_SAFE_INTEGER;

		this._emit('complete', '排序完成: ' + finalArr.join(' '), finalArr, 5, [
			{ type: 'sorted', indices: finalArr.map((_, i) => i) }
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
