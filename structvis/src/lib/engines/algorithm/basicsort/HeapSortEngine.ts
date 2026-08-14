/**
 * 堆排序引擎 — HeapSortEngine
 *
 * 教材第 11 章：先建大根堆（自底向上下滤），再反复把堆顶（最大值）与堆末尾交换，
 * 每次交换后对缩小后的堆重新下滤。就地排序，O(n log n)。
 * data 快照为数组值序列；渲染器用 'sorted' 高亮已就位尾部、'partition' 标记当前堆范围。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';
import { parseNumberList } from '../parseInput';

const PSEUDO: string[] = [
	'procedure siftDown(a, i, n)',
	'  while 2*i + 1 < n do',
	'    j = 2*i + 1                    // 左孩子',
	'    if j + 1 < n and a[j+1] > a[j] then',
	'      j = j + 1                    // 取较大的孩子',
	'    end if',
	'    if a[i] >= a[j] then break',
	'    swap(a[i], a[j])               // 下滤',
	'    i = j',
	'  end while',
	'end procedure',
	'',
	'procedure heapSort(a, n)',
	'  for i = n/2 - 1 downto 0 do      // 建堆',
	'    siftDown(a, i, n)',
	'  end for',
	'  for end = n - 1 downto 1 do      // 排序',
	'    swap(a[0], a[end])             // 堆顶就位',
	'    siftDown(a, 0, end)',
	'  end for',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '下滤（siftDown）时，父节点应该和哪个孩子交换？',
		options: ['任意一个孩子', '较大的孩子', '较小的孩子', '左孩子'],
		correctAnswer: '较大的孩子',
		hint: '大根堆要求父节点 ≥ 两个孩子',
		explanation:
			'大根堆中父节点必须不小于两个孩子。下滤时若父节点小于孩子，需要与较大的孩子交换，才能维持堆的性质。'
	},
	{
		type: 'choose-next',
		stepIndex: 16,
		prompt: '堆排序每一轮把堆顶与堆末尾交换后，末尾元素发生了什么？',
		options: ['回到堆中', '就位（有序尾部）', '与下一个元素再交换', '随机移动'],
		correctAnswer: '就位（有序尾部）',
		hint: '堆顶是当前最大值',
		explanation:
			'大根堆堆顶是当前最大值，与堆末尾交换后它到达最终位置，属于有序尾部，不再参与后续堆操作。'
	}
];

export class HeapSortEngine extends EngineBase<number[]> {
	readonly name = '堆排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'堆排序的思路：先把数组调整成一个大根堆（父节点不小于孩子），然后反复把堆顶——也就是最大值——与堆末尾交换，每轮确定一个最大值就位。'
		},
		{
			type: 'partition-start',
			narration: '开始建堆：从最后一个非叶节点开始，自底向上逐个下滤，让每个子树都满足大根堆性质。'
		},
		{
			type: 'compare',
			narration: '比较当前节点与它的孩子：在大根堆中，父节点应该不小于两个孩子。'
		},
		{
			type: 'pivot-select',
			narration: '选定较大的孩子作为交换对象——只有与较大的孩子交换，才能维持大根堆性质。'
		},
		{
			type: 'swap',
			narration: '交换并继续下滤：节点下沉到孩子的位置，重复比较，直到满足堆性质或到达叶子。'
		},
		{
			type: 'partition-end',
			narration: '建堆完成：整个数组满足大根堆性质，堆顶就是最大值。'
		},
		{
			type: 'complete',
			narration:
				'排序完成。堆排序时间复杂度稳定为 O(n log n)：建堆 O(n)，每轮下滤 O(log n) 共 n 轮；空间复杂度 O(1)（就地排序）。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '示例 A', description: '[5, 2, 8, 1, 9]' },
		{ name: '示例 B', description: '[3, 7, 1, 9, 4, 6]' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '数据序列',
				type: 'text',
				placeholder: '逗号分隔的整数，如 5, 2, 8, 1, 9',
				default: '5, 2, 8, 1, 9'
			}
		]
	};

	applyPreset(name: string): void {
		const data: number[] | undefined = {
			'示例 A': [5, 2, 8, 1, 9],
			'示例 B': [3, 7, 1, 9, 4, 6]
		}[name];
		if (data) this.init(data);
	}

	applyCustom(values: Record<string, string>): void {
		this.init(parseNumberList(values.data ?? '', { min: 2, max: 20 }));
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const arr = [...input];
		const n = arr.length;

		this._emit('init', '初始数组：' + arr.join(' ') + '。堆排序 = 建大根堆 + 反复取堆顶。', arr, 0);

		// === 建堆：自底向上下滤 ===
		for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
			this._emit(
				'partition-start',
				'建堆：从最后一个非叶节点 ' + (i + 1) + '（值 ' + arr[i] + '）开始下滤。',
				arr,
				13,
				[
					{ type: 'partition', indices: this._range(0, n - 1) },
					{ type: 'pivot', indices: [i] }
				]
			);
			this._siftDown(arr, i, n);
			this._emit(
				'partition-end',
				'节点 ' + (i + 1) + ' 下滤完成，其子树满足大根堆性质。',
				arr,
				14,
				[{ type: 'partition', indices: this._range(0, n - 1) }]
			);
		}

		this._emit(
			'partition-end',
			'建堆完成：堆顶 ' + arr[0] + ' 是最大值。开始排序：每轮把堆顶交换到末尾。',
			arr,
			15,
			[
				{ type: 'partition', indices: this._range(0, n - 1) },
				{ type: 'pivot', indices: [0] }
			]
		);

		// === 排序：堆顶与末尾交换 + 下滤 ===
		for (let end = n - 1; end > 0; end--) {
			[arr[0], arr[end]] = [arr[end], arr[0]];
			this._emit(
				'swap',
				'堆顶 ' + arr[end] + ' 与末尾（位置 ' + (end + 1) + '）交换——最大值就位。',
				arr,
				18,
				[
					{ type: 'swap', indices: [0, end] },
					{ type: 'sorted', indices: this._range(end, n - 1) },
					{ type: 'pivot', indices: [0] }
				]
			);
			if (end > 1) {
				this._emit(
					'partition-start',
					'对堆范围 [1, ' + end + '] 下滤新堆顶 ' + arr[0] + '。',
					arr,
					19,
					[
						{ type: 'partition', indices: this._range(0, end - 1) },
						{ type: 'sorted', indices: this._range(end, n - 1) },
						{ type: 'pivot', indices: [0] }
					]
				);
				this._siftDown(arr, 0, end);
				this._emit('partition-end', '堆范围 [1, ' + end + '] 重新满足大根堆性质。', arr, 19, [
					{ type: 'partition', indices: this._range(0, end - 1) },
					{ type: 'sorted', indices: this._range(end, n - 1) }
				]);
			}
		}

		this._emit('complete', '排序完成：' + arr.join(' ') + '。', arr, 22, [
			{ type: 'sorted', indices: this._range(0, n - 1) }
		]);

		this.totalSteps = this.steps.length;
	}

	/** 下滤：从节点 i 开始，在堆范围 [0, size) 内维持大根堆性质 */
	private _siftDown(arr: number[], i: number, size: number): void {
		while (true) {
			const l = 2 * i + 1;
			if (l >= size) break; // 无左孩子 → 叶子，结束
			const r = l + 1;
			let bigger = l;
			if (r < size) {
				this._emit('compare', '比较两个孩子：左 ' + arr[l] + '、右 ' + arr[r] + '。', arr, 3, [
					{ type: 'partition', indices: this._range(0, size - 1) },
					{ type: 'compare', indices: [l, r] },
					{ type: 'pivot', indices: [i] }
				]);
				if (arr[r] > arr[l]) bigger = r;
			}
			this._emit(
				'pivot-select',
				'较大的孩子是位置 ' + (bigger + 1) + '（值 ' + arr[bigger] + '）。',
				arr,
				4,
				[
					{ type: 'partition', indices: this._range(0, size - 1) },
					{ type: 'pivot', indices: [bigger] },
					{ type: 'compare', indices: [l] },
					{ type: 'pointer-j', indices: [bigger], label: 'j' },
					{ type: 'pointer-i', indices: [i], label: 'i' }
				]
			);
			if (arr[i] >= arr[bigger]) {
				this._emit(
					'compare',
					'父节点 ' + arr[i] + ' ≥ 较大孩子 ' + arr[bigger] + '：满足堆性质，下滤结束。',
					arr,
					6,
					[
						{ type: 'partition', indices: this._range(0, size - 1) },
						{ type: 'pivot', indices: [i] },
						{ type: 'compare', indices: [bigger] }
					]
				);
				break;
			}
			[arr[i], arr[bigger]] = [arr[bigger], arr[i]];
			this._emit('swap', '父节点 ' + arr[i] + ' < ' + arr[bigger] + '：交换并继续下滤。', arr, 7, [
				{ type: 'partition', indices: this._range(0, size - 1) },
				{ type: 'swap', indices: [i, bigger] },
				{ type: 'pivot', indices: [bigger] }
			]);
			i = bigger;
		}
	}

	private _range(a: number, b: number): number[] {
		const out: number[] = [];
		for (let i = a; i <= b; i++) out.push(i);
		return out;
	}

	private _emit(
		type: StepType,
		description: string,
		data: number[],
		pseudocodeLine: number,
		extraHighlights?: Highlight[]
	): void {
		const highlights: Highlight[] = [];
		if (extraHighlights) highlights.push(...extraHighlights);

		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...data],
			highlights,
			pseudocodeLine
		});
	}
}
