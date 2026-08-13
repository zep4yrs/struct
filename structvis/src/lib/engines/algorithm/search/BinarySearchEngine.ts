/**
 * 二分查找引擎 — BinarySearchEngine
 *
 * 教材第 9 章：对有序表折半查找。每次取区间中点 mid 与目标 x 比较，
 * 相等即命中；x < a[mid] 收缩右界，否则收缩左界；区间为空则查找失败。
 */

import type {
	AlgorithmStep,
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
	'procedure binarySearch(a, n, x)',
	'  low = 1; high = n',
	'  while low <= high do',
	'    mid = (low + high) / 2（向下取整）',
	'    if x = a[mid] then',
	'      return mid                // 查找成功',
	'    else if x < a[mid] then',
	'      high = mid - 1            // 到左半区',
	'    else',
	'      low = mid + 1             // 到右半区',
	'    end if',
	'  end while',
	'  return 0                      // 查找失败',
	'end procedure'
];

// 默认图例：a = [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92]，查找 21，比较 3 次命中（56 → 19 → 21）
const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '在 [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92] 中查找 21，第一次比较的元素是？',
		options: ['56', '37', '19', '21'],
		correctAnswer: '56',
		hint: 'mid = (low + high) / 2 向下取整，比较中点',
		explanation: 'low=1, high=11，mid=(1+11)/2=6（第 6 个位置），对应元素 56。'
	},
	{
		type: 'choose-next',
		stepIndex: 7,
		prompt: '查找 21 共比较了几次？',
		options: ['2 次', '3 次', '4 次', '5 次'],
		correctAnswer: '3 次',
		hint: '每次比较都会把查找区间缩小一半',
		explanation: '56 → 19 → 21 共 3 次比较。折半查找最多比较 ⌈log₂(n+1)⌉ 次，11 个元素至多 4 次。'
	},
	{
		type: 'fill-code',
		stepIndex: 4,
		prompt: '二分查找循环体中，当 arr[mid] < target 时需要调整区间。补全这一行：',
		options: [
			'low = mid + 1',
			'low = mid',
			'high = mid - 1',
			'high = mid + 1'
		],
		correctAnswer: 'low = mid + 1',
		hint: 'mid 已经比较过不等于 target，可以安全排除',
		explanation:
			'arr[mid] < target 说明目标在右半区，且 mid 本身已排除，所以 low = mid + 1；同理 arr[mid] > target 时 high = mid - 1。'
	}
];

export class BinarySearchEngine extends EngineBase<{ data: number[]; target: number }> {
	readonly name = '二分查找';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'二分查找的前提是数据有序。每次取区间中点与目标比较：相等即命中；中点偏大就只查左半，中点偏小就只查右半，每轮区间减半。'
		},
		{
			type: 'compare',
			narration: '计算区间中点 mid，与目标 x 比较，据此收缩查找区间。'
		},
		{
			type: 'edge-select',
			narration: '中点恰好等于目标值，查找命中！'
		},
		{
			type: 'recurse-exit',
			narration: '区间已为空（low > high），目标不存在于表中，查找失败。'
		},
		{
			type: 'complete',
			narration:
				'查找结束。二分查找的时间复杂度 O(log₂n)：规模每翻一倍只多一次比较，对有序静态数据极其高效。'
		}
	];

	private _arr: number[] = [];
	private _target = 0;

	presets: EnginePreset[] = [
		{
			name: '教材示例（命中）',
			description: '[5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92] 查找 21'
		},
		{ name: '示例（失败）', description: '同表查找 90（不存在）' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义查找',
		fields: [
			{
				key: 'data',
				label: '有序数据序列',
				type: 'text',
				placeholder: '升序整数，如 5, 13, 19, 21, 37, 56',
				default: '5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92'
			},
			{
				key: 'target',
				label: '查找目标值',
				type: 'text',
				placeholder: '整数，如 21',
				default: '21'
			}
		]
	};

	applyPreset(name: string): void {
		const data = [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92];
		const target = name.includes('失败') ? 90 : 21;
		this.init({ data, target });
	}

	applyCustom(values: Record<string, string>): void {
		const data = parseNumberList(values.data ?? '', { min: 2, max: 20 });
		for (let i = 1; i < data.length; i++) {
			if (data[i] < data[i - 1]) throw new Error('数据必须按升序排列（二分查找要求有序表）');
		}
		const target = parseInt((values.target ?? '').trim(), 10);
		if (isNaN(target)) throw new Error('请输入查找目标值');
		this.init({ data, target });
	}

	init(input: { data: number[]; target: number }): void {
		const { data, target } = input;
		this._arr = [...data];
		this._target = target;

		this.steps = [];
		this._stepId = 0;

		const n = this._arr.length;
		this._emit(
			'init',
			`有序表：${this._arr.join(' ')}，查找目标 ${target}。初始区间 [1, ${n}]。`,
			1,
			[{ type: 'partition', indices: this._range(0, n - 1), label: '查找区间' }]
		);

		let low = 0;
		let high = n - 1;
		let found = false;
		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const v = this._arr[mid];
			this._emit(
				'compare',
				`mid = (${low + 1} + ${high + 1}) / 2 = ${mid + 1}，比较 a[${mid + 1}] = ${v} 与目标 ${target}。`,
				3,
				[
					{ type: 'partition', indices: this._range(low, high), label: '查找区间' },
					{ type: 'pivot', indices: [mid], label: `mid=${mid + 1}` },
					{ type: 'pointer-i', indices: [low], label: `low=${low + 1}` },
					{ type: 'pointer-j', indices: [high], label: `high=${high + 1}` }
				]
			);
			if (v === target) {
				found = true;
				this._emit(
					'edge-select',
					`a[${mid + 1}] = ${v} = 目标 ${target}，命中！查找成功，位置 ${mid + 1}。`,
					5,
					[
						{ type: 'partition', indices: this._range(low, high) },
						{ type: 'pivot', indices: [mid], label: '命中' },
						{ type: 'sorted', indices: [mid] }
					]
				);
				break;
			}
			if (target < v) {
				high = mid - 1;
				this._emit('compare', `${target} < ${v}，目标在左半区，high = ${high + 1}。`, 7, [
					{ type: 'partition', indices: this._range(low, high), label: '新区间' },
					{ type: 'pivot', indices: [mid] },
					{ type: 'pointer-j', indices: [Math.max(high, low)], label: `high=${high + 1}` }
				]);
			} else {
				low = mid + 1;
				this._emit('compare', `${target} > ${v}，目标在右半区，low = ${low + 1}。`, 9, [
					{ type: 'partition', indices: this._range(low, high), label: '新区间' },
					{ type: 'pivot', indices: [mid] },
					{ type: 'pointer-i', indices: [low], label: `low=${low + 1}` }
				]);
			}
		}

		if (!found) {
			this._emit('recurse-exit', `low（${low + 1}）> high（${high + 1}），查找区间为空。`, 12, [
				{ type: 'partition', indices: [], label: '区间为空' }
			]);
			this._emit('complete', `查找失败：${target} 不在有序表中。`, 13, [
				{ type: 'partition', indices: this._range(0, n - 1) }
			]);
		} else {
			this._emit(
				'complete',
				`查找成功：${target} 位于位置 ${this._arr.indexOf(target) + 1}。`,
				13,
				[{ type: 'sorted', indices: [this._arr.indexOf(target)] }]
			);
		}
		this.totalSteps = this.steps.length;
	}

	private _range(from: number, to: number): number[] {
		const out: number[] = [];
		for (let i = from; i <= to; i++) out.push(i);
		return out;
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		highlights?: Highlight[]
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...this._arr],
			highlights: highlights ?? [],
			pseudocodeLine
		});
	}

}
