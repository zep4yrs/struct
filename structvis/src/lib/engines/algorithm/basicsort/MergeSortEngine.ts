/**
 * 二路归并排序引擎 — MergeSortEngine
 *
 * 教材第 11 章：把相邻的两个有序子序列合并为一个有序序列。
 * 迭代版：子序列长度 size 从 1 倍增到 ≥ n，每轮把相邻 size 段两两合并。
 * data 快照为数组值序列；合并区间用 partition 高亮，写回用 swap 高亮。
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
	'procedure mergeSort(a, n)',
	'  size = 1',
	'  while size < n do',
	'    for left = 1 to n - size step 2 * size do',
	'      mid = left + size - 1',
	'      right = min(left + 2 * size - 1, n)',
	'      merge(a, left, mid, right)',
	'    end for',
	'    size = 2 * size',
	'  end while',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: '归并排序的核心操作是什么？',
		options: ['合并两个有序序列', '相邻元素交换', '选出区间最小元素', '插入到有序前缀'],
		correctAnswer: '合并两个有序序列',
		hint: '归并的前提是两个子序列各自有序',
		explanation:
			'归并排序把数组拆成越来越小的子序列，再两两合并成有序序列；每次合并比较两个子序列的头部，把较小者放入辅助数组。时间复杂度 O(n log n)，稳定。'
	}
];

export class MergeSortEngine extends EngineBase<number[]> {
	readonly name = '归并排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'归并排序的思路：分治。先把数组对半拆成越来越小的子数组，再两两合并成有序数组。合并时保证有序，最终整个数组有序。'
		},
		{
			type: 'partition-start',
			narration: '新一轮归并开始：相邻的已有序子序列按相同长度两两合并，子序列长度逐轮翻倍。'
		},
		{
			type: 'recurse-enter',
			narration:
				'合并两个有序子区间：i、j 两个指针分别指向两个区间的头部，比较后把较小者写入辅助数组。'
		},
		{
			type: 'swap',
			narration: '合并结果写回原数组，这个区间现在有序。'
		},
		{
			type: 'partition-end',
			narration: '本轮所有子序列合并完毕，数组整体有序程度提高，进入下一轮（区间长度翻倍）。'
		},
		{
			type: 'complete',
			narration: '排序完成。归并排序稳定，时间复杂度恒为 O(n log n)，但需要 O(n) 的额外空间。'
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

		this._emit(
			'init',
			`初始数组：${arr.join(' ')}。二路归并：子序列从长度 1 开始两两合并，倍增到全数组有序。`,
			arr,
			0
		);

		let round = 0;
		for (let size = 1; size < n; size *= 2) {
			round++;
			this._emit(
				'partition-start',
				`第 ${round} 轮归并：相邻子序列长度 ${size}，两两合并。`,
				arr,
				2
			);

			for (let left = 0; left < n - size; left += 2 * size) {
				const mid = left + size - 1;
				const right = Math.min(left + 2 * size - 1, n - 1);

				this._emit(
					'recurse-enter',
					`合并有序区间 [${left + 1}..${mid + 1}] 与 [${mid + 2}..${right + 1}]：逐对比较头部，较小者先入辅助数组。`,
					arr,
					5,
					[
						{ type: 'partition', indices: this._range(left, mid) },
						{ type: 'partition', indices: this._range(mid + 1, right) },
						{ type: 'pointer-i', indices: [left], label: 'i' },
						{ type: 'pointer-j', indices: [mid + 1], label: 'j' }
					]
				);

				const merged = this._merge(arr.slice(left, mid + 1), arr.slice(mid + 1, right + 1));
				arr.splice(left, right - left + 1, ...merged);

				this._emit(
					'swap',
					`合并结果 ${merged.join(' ')} 已写回区间 [${left + 1}..${right + 1}]。`,
					arr,
					6,
					[
						{ type: 'swap', indices: this._range(left, right) },
						{ type: 'pointer-i', indices: [left], label: 'i' },
						{ type: 'pointer-j', indices: [mid + 1], label: 'j' }
					]
				);
			}

			this._emit('partition-end', `第 ${round} 轮结束：${arr.join(' ')}。`, arr, 4);
		}

		this._emit('complete', `排序完成：${arr.join(' ')}。`, arr, 10, [
			{ type: 'sorted', indices: this._range(0, n - 1) }
		]);

		this.totalSteps = this.steps.length;
	}

	private _merge(a: number[], b: number[]): number[] {
		const out: number[] = [];
		let i = 0;
		let j = 0;
		while (i < a.length && j < b.length) {
			if (a[i] <= b[j]) {
				out.push(a[i++]);
			} else {
				out.push(b[j++]);
			}
		}
		while (i < a.length) out.push(a[i++]);
		while (j < b.length) out.push(b[j++]);
		return out;
	}

	private _range(from: number, to: number): number[] {
		const out: number[] = [];
		for (let i = from; i <= to; i++) out.push(i);
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
