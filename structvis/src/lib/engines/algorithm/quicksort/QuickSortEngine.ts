/**
 * 快速排序引擎 — QuickSortEngine
 *
 * 实现 Lomuto 分区方案的快速排序，生成完整的步进关键帧。
 * 引擎是纯逻辑的，不涉及任何渲染，只产出 AlgorithmStep 数据。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	PracticeQuestion
} from '../types';
import { EngineBase } from '../EngineBase';
import { parseNumberList } from '../parseInput';

const PSEUDOCODE: string[] = [
	'function quickSort(arr, low, high)',
	'  if low < high then',
	'    pi = partition(arr, low, high)',
	'    quickSort(arr, low, pi - 1)',
	'    quickSort(arr, pi + 1, high)',
	'  end if',
	'end function',
	'',
	'function partition(arr, low, high)',
	'  pivot = arr[high]              // 选最右为基准',
	'  i = low - 1                    // 小于区的右边界',
	'',
	'  for j = low to high - 1 do',
	'    if arr[j] <= pivot then',
	'      i = i + 1',
	'      swap arr[i] and arr[j]',
	'    end if',
	'  end for',
	'',
	'  swap arr[i+1] and arr[high]    // pivot 放到正确位置',
	'  return i + 1',
	'end function'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '在 partition 函数中，pivot 选的是哪个元素？',
		options: ['arr[low]', 'arr[mid]', 'arr[high]', 'arr[low + high / 2]'],
		correctAnswer: 'arr[high]',
		hint: '看看第 10 行伪代码',
		explanation:
			'Lomuto 分区方案选择最右边的元素作为 pivot（基准）。这是最简单的一种选择方式，教学中最常用。'
	},
	{
		type: 'choose-next',
		stepIndex: 10,
		prompt: '当前 arr[j] = 2，pivot = 7。判断后应该做什么？',
		options: [
			'arr[j] <= pivot，i++ 然后交换',
			'arr[j] > pivot，什么都不做',
			'直接和 pivot 交换',
			'j++ 跳过'
		],
		correctAnswer: 'arr[j] <= pivot，i++ 然后交换',
		hint: '回想 partition 的逻辑：找到小于等于 pivot 的元素，就把它换到"小于区"里',
		explanation:
			'2 小于 7，所以它应该在 pivot 的左边。i 指针右移一位（扩大小于区），然后把 arr[i] 和 arr[j] 交换，把 2 放进小于区。'
	},
	{
		type: 'fill-code',
		stepIndex: 8,
		prompt: 'partition 函数遍历结束后，需要把 pivot（arr[high]）放到它正确的位置。补全这一行代码：',
		options: [
			'swap arr[i+1] and arr[high]',
			'swap arr[i] and arr[high]',
			'swap arr[low] and arr[high]',
			'swap arr[i+1] and arr[low]'
		],
		correctAnswer: 'swap arr[i+1] and arr[high]',
		hint: 'i 是"小于区"右边界，pivot 应该放在小于区后面第一个位置',
		explanation:
			'遍历结束时，下标 0..i 都是 ≤ pivot 的元素，所以 pivot 的正确位置是 i+1：swap(arr[i+1], arr[high]) 把 pivot 换过去，小于区紧随其后，右侧全大于 pivot。'
	}
];

export class QuickSortEngine extends EngineBase<number[]> {
	readonly name = '快速排序';
	readonly renderType = 'array' as const;
	readonly pseudocode = PSEUDOCODE;
	readonly practiceQuestions = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'这是快速排序的输入数组。整体思路只有三步：选基准、分区、递归。每一轮分区都会把基准元素放到它最终的位置上，所有元素归位后数组自然有序。'
		},
		{
			type: 'pivot-select',
			narration:
				'选定基准（pivot）：这里取当前区间的最后一个元素。基准的最终位置将在这一轮分区后确定。'
		},
		{
			type: 'partition-start',
			narration: '开始分区：i 指向"小于区"的右边界，j 从头扫描，把小元素通过交换丢到左边。'
		},
		{
			type: 'compare',
			narration: 'j 指针向右扫描：把当前元素和基准比较，小于等于基准的元素会进入左侧的"小于区"。'
		},
		{
			type: 'swap',
			narration: '交换：把小于基准的元素换到左边的"小于区"，大于基准的留在右边，让分区逐步推进。'
		},
		{
			type: 'partition-end',
			narration:
				'分区完成：基准被放到它最终的位置，左边全小于它、右边全大于它。基准已经"归位"，不会再移动。'
		},
		{
			type: 'recurse-enter',
			narration: '递归：基准左右两侧互不影响，分别对左、右子区间重复"选基准 + 分区"的过程。'
		},
		{
			type: 'recurse-exit',
			narration: '该区间的递归完成返回。小区间只有一个或零个元素时自然有序，直接返回。'
		},
		{
			type: 'complete',
			narration:
				'排序完成！快速排序平均时间复杂度 O(n log n)，空间复杂度 O(log n)（递归栈）。注意：最坏情况（如已有序数组）会退化到 O(n²)。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '随机 8 个', description: '[6, 2, 8, 5, 1, 9, 3, 7]' },
		{ name: '逆序 8 个', description: '[9, 8, 7, 6, 5, 4, 3, 2]' },
		{ name: '基本有序', description: '[1, 2, 4, 3, 5, 7, 6, 8]' },
		{ name: '随机 12 个', description: '[9, 4, 7, 2, 8, 1, 6, 3, 5, 11, 10, 12]' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '数据序列',
				type: 'text',
				placeholder: '逗号分隔的整数，如 6, 2, 8, 5, 1, 9, 3, 7',
				default: '6, 2, 8, 5, 1, 9, 3, 7'
			}
		]
	};

	applyPreset(name: string): void {
		const data: number[] | undefined = {
			'随机 8 个': [6, 2, 8, 5, 1, 9, 3, 7],
			'逆序 8 个': [9, 8, 7, 6, 5, 4, 3, 2],
			基本有序: [1, 2, 4, 3, 5, 7, 6, 8],
			'随机 12 个': [9, 4, 7, 2, 8, 1, 6, 3, 5, 11, 10, 12]
		}[name];
		if (data) this.init(data);
	}

	applyCustom(values: Record<string, string>): void {
		this.init(parseNumberList(values.data ?? '', { min: 2, max: 20 }));
	}
	private _originalData: number[] = [];

	init(input: number[]): void {
		this._originalData = [...input];
		this.steps = [];
		this._stepId = 0;
		this.playbackPos = 0;

		const arr = [...input];
		const sortedIndices: number[] = [];

		// 第 0 步：初始状态
		this._addStep({
			type: 'init',
			description: '初始数组，准备开始快速排序',
			detail: `数组长度：${arr.length}，我们用分治策略，每次选一个基准元素，把数组分成小于和大于基准的两部分，递归排序。`,
			data: [...arr],
			highlights: [],
			pseudocodeLine: 0,
			recursionDepth: 0
		});

		// 开始递归
		this._quickSort(arr, 0, arr.length - 1, 0, sortedIndices);

		// 最后一步：全部完成
		this._addStep({
			type: 'complete',
			description: '排序完成！所有元素已就位',
			detail: `共执行 ${this.steps.length} 步。快速排序的平均时间复杂度是 O(n log n)，最坏情况 O(n²)。`,
			data: [...arr],
			highlights: [{ type: 'sorted', indices: arr.map((_, i) => i) }],
			pseudocodeLine: 6,
			recursionDepth: 0
		});

		this.totalSteps = this.steps.length;
	}

	// === 内部：快速排序递归 ===

	private _quickSort(
		arr: number[],
		low: number,
		high: number,
		depth: number,
		sortedIndices: number[]
	): void {
		if (low >= high) {
			// 单个元素 = 已排序
			if (low === high && !sortedIndices.includes(low)) {
				sortedIndices.push(low);
			}
			return;
		}

		// 递归进入
		this._addStep({
			type: 'recurse-enter',
			description: `对子数组 [${low}...${high}] 进行快速排序`,
			detail: `当前递归深度：${depth}。子数组范围：索引 ${low} 到 ${high}。`,
			data: [...arr],
			highlights: [
				{ type: 'partition', indices: this._range(low, high), label: '当前分区' },
				{ type: 'sorted', indices: [...sortedIndices] }
			],
			pseudocodeLine: 1,
			recursionDepth: depth
		});

		// 分区
		const pi = this._partition(arr, low, high, depth, sortedIndices);

		// pi 位置的元素已就位
		if (!sortedIndices.includes(pi)) {
			sortedIndices.push(pi);
		}

		// 递归左半
		this._quickSort(arr, low, pi - 1, depth + 1, sortedIndices);

		// 递归右半
		this._quickSort(arr, pi + 1, high, depth + 1, sortedIndices);

		// 递归返回
		this._addStep({
			type: 'recurse-exit',
			description: `分区 [${low}...${high}] 排序完成，返回上一层`,
			data: [...arr],
			highlights: [{ type: 'sorted', indices: [...sortedIndices] }],
			pseudocodeLine: 5,
			recursionDepth: depth
		});
	}

	// === 内部：分区函数 ===

	private _partition(
		arr: number[],
		low: number,
		high: number,
		depth: number,
		sortedIndices: number[]
	): number {
		const pivot = arr[high];

		// 选择 pivot
		this._addStep({
			type: 'pivot-select',
			description: `选择基准元素 pivot = arr[${high}] = ${pivot}`,
			detail:
				'Lomuto 分区方案选择最右侧元素作为基准。接下来我们要把数组分成两部分：左边都 <= pivot，右边都 > pivot。',
			data: [...arr],
			highlights: [
				{ type: 'pivot', indices: [high], label: 'pivot' },
				{ type: 'partition', indices: this._range(low, high) },
				{ type: 'sorted', indices: [...sortedIndices] }
			],
			pseudocodeLine: 9,
			recursionDepth: depth
		});

		let i = low - 1; // 小于区的右边界

		// 初始 i, j 位置
		this._addStep({
			type: 'partition-start',
			description: `初始化 i = ${i}（小于区右边界），j 从 ${low} 开始遍历`,
			detail:
				'i 指向"小于 pivot 的区域"的右边界。j 逐个检查元素，如果 arr[j] <= pivot，就把它换到小于区里。',
			data: [...arr],
			highlights: [
				{ type: 'pivot', indices: [high] },
				{ type: 'pointer-i', indices: [Math.max(low - 1, low)], label: `i = ${i}` },
				{ type: 'pointer-j', indices: [low], label: 'j' },
				{ type: 'partition', indices: this._range(low, high) },
				{ type: 'sorted', indices: [...sortedIndices] }
			],
			pseudocodeLine: 10,
			recursionDepth: depth
		});

		for (let j = low; j < high; j++) {
			// 比较：arr[j] vs pivot
			this._addStep({
				type: 'compare',
				description: `比较 arr[${j}] = ${arr[j]} 与 pivot = ${pivot}`,
				detail:
					arr[j] <= pivot
						? `${arr[j]} ≤ ${pivot}，需要把它换到小于区`
						: `${arr[j]} > ${pivot}，跳过，j 继续右移`,
				data: [...arr],
				highlights: [
					{ type: 'pivot', indices: [high] },
					{ type: 'compare', indices: [j, high], label: '比较' },
					{ type: 'pointer-j', indices: [j], label: 'j' },
					{ type: 'pointer-i', indices: [Math.max(i, low)], label: `i = ${i}` },
					{ type: 'partition', indices: this._range(low, high) },
					{ type: 'sorted', indices: [...sortedIndices] }
				],
				pseudocodeLine: 13,
				recursionDepth: depth
			});

			if (arr[j] <= pivot) {
				i++;

				if (i !== j) {
					// 交换 arr[i] 和 arr[j]
					this._addStep({
						type: 'swap',
						description: `交换 arr[${i}] = ${arr[i]} 和 arr[${j}] = ${arr[j]}`,
						detail: `i 右移到 ${i}，把 arr[${j}] = ${arr[j]} 换到小于区里。`,
						data: [...arr],
						highlights: [
							{ type: 'swap', indices: [i, j], label: '交换' },
							{ type: 'pivot', indices: [high] },
							{ type: 'partition', indices: this._range(low, high) },
							{ type: 'sorted', indices: [...sortedIndices] }
						],
						pseudocodeLine: 15,
						recursionDepth: depth
					});

					[arr[i], arr[j]] = [arr[j], arr[i]];

					// 交换后状态
					this._addStep({
						type: 'default',
						description: `交换完成，小于区扩大到 i = ${i}`,
						data: [...arr],
						highlights: [
							{ type: 'pivot', indices: [high] },
							{ type: 'pointer-i', indices: [i], label: 'i' },
							{ type: 'pointer-j', indices: [j], label: 'j' },
							{ type: 'partition', indices: this._range(low, high) },
							{ type: 'sorted', indices: [...sortedIndices] }
						],
						pseudocodeLine: 16,
						recursionDepth: depth
					});
				} else {
					// i == j，元素已经在小于区了
					this._addStep({
						type: 'default',
						description: `i 右移到 ${i}，元素已在小于区，无需交换`,
						data: [...arr],
						highlights: [
							{ type: 'pivot', indices: [high] },
							{ type: 'pointer-i', indices: [i], label: 'i' },
							{ type: 'pointer-j', indices: [j], label: 'j' },
							{ type: 'partition', indices: this._range(low, high) },
							{ type: 'sorted', indices: [...sortedIndices] }
						],
						pseudocodeLine: 14,
						recursionDepth: depth
					});
				}
			}
			// else: arr[j] > pivot，跳过
		}

		// 把 pivot 放到正确位置（交换 arr[i+1] 和 arr[high]）
		const pivotFinalPos = i + 1;

		this._addStep({
			type: 'swap',
			description: `把 pivot 放到正确位置：交换 arr[${pivotFinalPos}] 和 arr[${high}]`,
			detail: `遍历结束。pivot 的正确位置是 i+1 = ${pivotFinalPos}，把它和那里的元素交换。`,
			data: [...arr],
			highlights: [
				{ type: 'swap', indices: [pivotFinalPos, high], label: 'pivot 归位' },
				{ type: 'partition', indices: this._range(low, high) },
				{ type: 'sorted', indices: [...sortedIndices] }
			],
			pseudocodeLine: 19,
			recursionDepth: depth
		});

		[arr[pivotFinalPos], arr[high]] = [arr[high], arr[pivotFinalPos]];

		// 分区完成
		this._addStep({
			type: 'partition-end',
			description: `分区完成！pivot = ${pivot} 在索引 ${pivotFinalPos}，左边都 ≤ 它，右边都 > 它`,
			detail: `接下来递归排序左边 [${low}...${pivotFinalPos - 1}] 和右边 [${pivotFinalPos + 1}...${high}]。`,
			data: [...arr],
			highlights: [
				{ type: 'pivot', indices: [pivotFinalPos], label: 'pivot (就位)' },
				{ type: 'sorted', indices: [...sortedIndices, pivotFinalPos] },
				{ type: 'partition', indices: this._range(low, high) }
			],
			pseudocodeLine: 20,
			recursionDepth: depth
		});

		return pivotFinalPos;
	}

	// === 工具函数 ===

	private _addStep(step: Omit<AlgorithmStep, 'id'>): void {
		this.steps.push({
			...step,
			id: this._stepId++
		});
	}

	private _range(start: number, end: number): number[] {
		const result: number[] = [];
		for (let i = start; i <= end; i++) {
			result.push(i);
		}
		return result;
	}
}
