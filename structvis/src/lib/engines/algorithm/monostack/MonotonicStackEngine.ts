/**
 * 单调栈引擎 — MonotonicStackEngine
 *
 * 经典单调栈应用「每日温度」：给定每日温度数组，求每个位置要等几天才出现更高的温度。
 * 核心思想：维护一个"从栈底到栈顶递减"的单调栈，栈内存放下标；
 * 扫描到更高温度时，依次弹出栈顶（它们的答案 = 当前下标 - 栈顶下标）。
 * 数据快照 data = 温度数组；extra.mono = { stack: 下标数组, answer: number[], cur: 当前扫描位置 }
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

const PSEUDO: string[] = [
	'// 每日温度：找每个位置右侧第一个更高温度的距离',
	'stack = []',
	'for i in 0..n-1:',
	'  while stack 非空 and T[i] > T[stack.top]:',
	'    j = stack.pop()',
	'    answer[j] = i - j      // j 的答案',
	'  end while',
	'  stack.push(i)            // 单调递减栈',
	'end for',
	'// 栈中剩余的下标答案为 0（后面没有更高温度）'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '单调栈中维护的单调性是？',
		options: ['从栈底到栈顶温度递减（单调递减栈）', '从栈底到栈顶温度递增', '随机', '温度必须相等'],
		correctAnswer: '从栈底到栈顶温度递减（单调递减栈）',
		hint: '新元素入栈前先弹出所有更小的',
		explanation:
			'栈中保留下标，对应温度从栈底到栈顶严格递减。遇到更高温度时，栈内所有更小温度的下标都能一次性确定答案——这就是单调栈"每个元素最多进出栈一次"的 O(n) 关键。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: '扫描结束后栈里还剩元素，它们的 answer 是？',
		options: ['0（后面没有更高温度）', '1', 'n', '需要再扫描一遍'],
		correctAnswer: '0（后面没有更高温度）',
		hint: '没有更高温度可等',
		explanation:
			'扫描结束后栈里剩下的下标，其右侧再没有更高温度，答案保持 0（不用等）。例如最后一个元素永远是 0。'
	}
];

const DEFAULT_TEMPS = [73, 74, 75, 71, 69, 72, 76, 73];

export class MonotonicStackEngine extends EngineBase<number[]> {
	readonly name = '单调栈';
	readonly renderType = 'monostack' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'单调栈应用「每日温度」：73, 74, 75, 71, 69, 72, 76, 73。维护一个温度递减的栈，扫描到更高温度时批量结算答案。'
		},
		{
			type: 'compare',
			narration: '比较当前温度与栈顶温度：若更高，栈顶的答案就是距离差。'
		},
		{
			type: 'edge-select',
			narration: '栈顶温度更低：弹出并结算答案 = 当前位置 - 栈顶位置。'
		},
		{
			type: 'edge-reject',
			narration: '当前温度不高于栈顶：入栈，保持单调递减。'
		},
		{
			type: 'complete',
			narration:
				'扫描完成，答案数组 [1, 1, 4, 2, 1, 1, 0, 0]。每个元素最多入栈出栈各一次，总复杂度 O(n)。'
		}
	];

	presets: EnginePreset[] = [{ name: '每日温度', description: '73,74,75,71,69,72,76,73' }];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '温度序列（逗号分隔）',
				type: 'text',
				placeholder: '如 73,74,75,71,69,72,76,73',
				default: '73,74,75,71,69,72,76,73'
			}
		]
	};

	applyPreset(_name: string): void {
		this.init(DEFAULT_TEMPS);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map(Number);
		if (nums.length < 2) throw new Error('至少需要 2 个温度值');
		this.init(nums);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const temps = input.length ? input : DEFAULT_TEMPS;
		const n = temps.length;
		const answer: number[] = new Array(n).fill(0);
		const stack: number[] = [];

		const snapshot = () => ({
			temps: [...temps],
			stack: [...stack],
			answer: [...answer],
			cur: -1
		});

		this._emit(
			'init',
			'每日温度：' + temps.join(', ') + '。求每个位置要等几天出现更高温度。初始答案全 0，栈为空。',
			0,
			snapshot(),
			[]
		);

		for (let i = 0; i < n; i++) {
			const snap1 = snapshot();
			snap1.cur = i;
			this._emit(
				'compare',
				'扫描第 ' +
					(i + 1) +
					' 天：温度 ' +
					temps[i] +
					'。' +
					(stack.length
						? '当前栈顶是第 ' +
							(stack[stack.length - 1] + 1) +
							' 天（' +
							temps[stack[stack.length - 1]] +
							'）。'
						: '栈为空。'),
				2,
				snap1,
				[stack.length ? stack[stack.length - 1] : -1, i]
			);

			while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
				const j = stack.pop()!;
				answer[j] = i - j;
				const snap2 = snapshot();
				snap2.cur = i;
				this._emit(
					'edge-select',
					'第 ' +
						(j + 1) +
						' 天（' +
						temps[j] +
						'）比 ' +
						temps[i] +
						' 低：弹出，答案 = ' +
						(i - j) +
						' 天。',
					4,
					snap2,
					[j, i]
				);
			}

			stack.push(i);
			const snap3 = snapshot();
			snap3.cur = i;
			this._emit(
				'edge-reject',
				'第 ' + (i + 1) + ' 天（' + temps[i] + '）入栈（栈内温度保持递减）。',
				6,
				snap3,
				[i]
			);
		}

		const snapEnd = snapshot();
		this._emit(
			'complete',
			'扫描完成：答案 = [' +
				answer.join(', ') +
				']。栈中剩余 ' +
				(stack.length - 0) +
				' 个下标（栈顶递减链）答案保持 0。',
			7,
			snapEnd,
			stack
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		snap: { temps: number[]; stack: number[]; answer: number[]; cur: number },
		hl: number[]
	): void {
		const highlights: Highlight[] = [];
		if (hl.length) {
			highlights.push({ type: 'current', indices: hl.filter((i) => i >= 0) });
		}
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...snap.temps],
			highlights,
			pseudocodeLine,
			monoStack: {
				temps: [...snap.temps],
				stack: [...snap.stack],
				answer: [...snap.answer],
				cur: snap.cur
			}
		});
	}
}
