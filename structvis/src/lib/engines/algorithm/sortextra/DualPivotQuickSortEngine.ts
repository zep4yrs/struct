/**
 * 双轴快排 — DualPivotQuickSortEngine
 * 两个基准把数组分三区(JDK Arrays.sort 对基本类型的实现)。
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
	'dualPivot(lo, hi):',
	'  if a[lo] > a[hi] swap',
	'  p=a[lo], q=a[hi]',
	'  三指针分区: <p | [p,q] | >q',
	'  递归三段'
];

export class DualPivotQuickSortEngine extends EngineBase<number[]> {
	readonly name = '双轴快排';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '双轴快排开始: 两个基准三分区——JDK 的 Arrays.sort 实现。' },
		{ type: 'compare', narration: '比单轴少一次扫描, 缓存友好。' },
		{ type: 'complete', narration: '排序完成。生产级算法。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '双轴快排', fields: [] };

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
			if (arr[lo] > arr[hi]) {
				const t = arr[lo];
				arr[lo] = arr[hi];
				arr[hi] = t;
				this._emit('swap', '保证 pivot1 <= pivot2', arr, 3, [{ type: 'swap', indices: [lo, hi] }]);
			}
			const p1 = arr[lo];
			const p2 = arr[hi];
			let l = lo + 1;
			let g = hi - 1;
			let k = l;
			while (k <= g) {
				if (arr[k] < p1) {
					const t = arr[k];
					arr[k] = arr[l];
					arr[l] = t;
					l++;
					this._emit('swap', arr[k] + '<p1 移左区: ' + arr.join(' '), arr, 5, [
						{ type: 'swap', indices: [l - 1, k] }
					]);
				} else if (arr[k] > p2) {
					while (arr[g] > p2 && g > k) g--;
					const t = arr[k];
					arr[k] = arr[g];
					arr[g] = t;
					g--;
					this._emit('swap', '>p2 移右区: ' + arr.join(' '), arr, 6, [
						{ type: 'swap', indices: [k, g + 1] }
					]);
				}
				k++;
			}
			l--;
			g++;
			const t1 = arr[lo];
			arr[lo] = arr[l];
			arr[l] = t1;
			const t2 = arr[hi];
			arr[hi] = arr[g];
			arr[g] = t2;
			this._emit('edge-select', '基准归位: [' + p1 + ',' + p2 + '] 三区分界。', arr, 7, [
				{ type: 'sorted', indices: [l, g] }
			]);
			sort(lo, l - 1);
			sort(l + 1, g - 1);
			sort(g + 1, hi);
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
