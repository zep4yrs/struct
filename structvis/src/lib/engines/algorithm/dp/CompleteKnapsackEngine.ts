/**
 * 完全背包引擎 — CompleteKnapsackEngine
 *
 * 与 0-1 背包唯一区别：每件物品可取无限次。
 * 转移：dp[i][c] = max(dp[i-1][c], dp[i][c-w[i]] + v[i])——注意取的是"本行左侧"（同层已更新）。
 * 渲染用 dp-table。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// 完全背包：物品无限件',
	'dp[i][c] = max(dp[i-1][c],        // 不取',
	'               dp[i][c-w[i]] + v[i]) // 再取一次(同行左列!)'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '完全背包与 0-1 背包转移方程的关键区别？',
		options: [
			'第二项从 dp[i-1][...] 变为 dp[i][...]',
			'没有区别',
			'容量遍历方向相反',
			'价值要翻倍'
		],
		correctAnswer: '第二项从 dp[i-1][...] 变为 dp[i][...]',
		hint: '同一行允许重复选取',
		explanation:
			'取自本行左侧 dp[i][c-w[i]] 表示"这件物品已经拿过还能再拿"，正是无限件的语义。0-1 背包则只能来自上一行。'
	}
];

export class CompleteKnapsackEngine extends EngineBase<number[]> {
	readonly name = '完全背包';
	readonly renderType = 'dp-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '完全背包：物品可以取无限次。与 0-1 背包只差一个下标——但语义完全不同。'
		},
		{ type: 'compare', narration: 'dp[i][c] 可以由本行左侧 dp[i][c-w]+v 推来（重复选取）。' },
		{ type: 'edge-select', narration: '再次选取更优：更新本行格子。' },
		{ type: 'complete', narration: '右下角即最大价值。' }
	];

	presets: EnginePreset[] = [
		{ name: '教材示例', description: '物品 (w,v): (2,3)(3,4)(4,5)，容量 8' }
	];

	customConfig: EngineCustomConfig = { title: '完全背包', fields: [] };

	applyPreset(_name: string): void {
		this.init([2, 3, 3, 4, 4, 5]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([2, 3, 3, 4, 4, 5]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const items: { w: number; v: number }[] = [];
		for (let i = 0; i + 1 < input.length; i += 2) items.push({ w: input[i], v: input[i + 1] });
		const C = 8;
		const n = items.length;
		const rows = n + 1;
		const cols = C + 1;
		const grid: (string | number)[][] = Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => 0)
		);
		const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
		const rowHeaders = items.map((it) => `w=${it.w},v=${it.v}`);
		const colHeaders = Array.from({ length: C + 1 }, (_, c) => String(c));

		this._emit(
			'init',
			`完全背包：${n} 种物品（各取无限件），容量 ${C}。`,
			grid,
			rowHeaders,
			colHeaders,
			[],
			''
		);

		for (let i = 1; i <= n; i++) {
			const it = items[i - 1];
			for (let c = 0; c <= C; c++) {
				const notTake = dp[i - 1][c];
				const take = it.w <= c ? dp[i][c - it.w] + it.v : -1;
				dp[i][c] = Math.max(notTake, take);
				grid[i][c] = dp[i][c];
				const hl: { type: 'current' | 'depend'; row: number; col: number }[] = [
					{ type: 'current', row: i, col: c },
					{ type: 'depend', row: i - 1, col: c }
				];
				if (it.w <= c) hl.push({ type: 'depend', row: i, col: c - it.w });
				this._emit(
					take > notTake ? 'edge-select' : 'edge-reject',
					it.w > c
						? `容量 ${c} 放不下 w=${it.w} → 继承 ${notTake}。`
						: `容量 ${c}：不取=${notTake}，再取一件=${take} → ${dp[i][c]}。`,
					grid,
					rowHeaders,
					colHeaders,
					hl,
					''
				);
			}
		}

		this._emit(
			'complete',
			`最大价值 = ${dp[n][C]}（每件物品可取任意多件）。`,
			grid,
			rowHeaders,
			colHeaders,
			[{ type: 'current', row: n, col: C }],
			''
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		grid: (string | number)[][],
		rowHeaders: string[],
		colHeaders: string[],
		hl: { type: 'current' | 'depend'; row: number; col: number }[],
		cornerLabel: string
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine: 0,
			dp: {
				rowHeaders,
				colHeaders,
				grid: grid.map((row) => [...row]),
				highlights: hl as never,
				cornerLabel
			}
		});
	}
}
