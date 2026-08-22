/**
 * 三路快排 — Quick3WayEngine
 * 分成 < pivot / == pivot / > pivot 三区, 大量重复元素时优势明显。
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
	'quick3(lo, hi):',
	'  pivot = a[lo]',
	'  lt=lo, gt=hi, i=lo',
	'  while i <= gt:',
	'    if a[i]<pivot swap(lt++,i++)',
	'    elif a[i]>pivot swap(i,gt--)',
	'    else i++'
];

export class Quick3WayEngine extends EngineBase<number[]> {
	readonly name = '三路快排';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '三路快排开始: 小于/等于/大于基准三分区。' },
		{ type: 'compare', narration: '等于基准的元素不再参与递归——重复元素多时大幅加速。' },
		{ type: 'complete', narration: '排序完成。平均 O(n log n), JDK 对基本类型也用类似策略。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '三路快排', fields: [] };

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

		const sort = (lo: number, hi: number): void => {
			if (lo >= hi) return;
			const pivot = arr[lo];
			let lt = lo;
			let gt = hi;
			let i = lo;
			while (i <= gt) {
				this._emit('compare', '比较 ' + arr[i] + ' 与基准 ' + pivot, arr, 4, [
					{ type: 'compare', indices: [i] }
				]);
				if (arr[i] < pivot) {
					const t = arr[lt];
					arr[lt] = arr[i];
					arr[i] = t;
					lt++;
					i++;
					this._emit('swap', '小于基准: 移到左区', arr, 6, [
						{ type: 'swap', indices: [lt - 1, i - 1] }
					]);
				} else if (arr[i] > pivot) {
					const t = arr[i];
					arr[i] = arr[gt];
					arr[gt] = t;
					gt--;
					this._emit('swap', '大于基准: 移到右区', arr, 7, [
						{ type: 'swap', indices: [i, gt + 1] }
					]);
				} else {
					i++;
				}
			}
			sort(lo, lt - 1);
			sort(gt + 1, hi);
		};

		sort(0, arr.length - 1);

		this._emit('complete', '排序完成: ' + arr.join(' '), arr, 8, [
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
