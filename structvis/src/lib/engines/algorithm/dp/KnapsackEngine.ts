/**
 * 0-1 背包引擎 — KnapsackEngine
 *
 * 经典动态规划：n 件物品（重量 w、价值 v），背包容量 C，每件只能取 0/1 次。
 * dp[i][c] = max(dp[i-1][c], dp[i-1][c-w[i]] + v[i])
 * 逐格填充二维表：每格高亮「上方(不取)」与「左上(取)」两个前置格子，体现状态转移。
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
import { parseNumberList } from '../parseInput';

const PSEUDO: string[] = [
	'// 0-1 背包：dp[i][c] = 前 i 件物品、容量 c 的最大价值',
	'for i = 1 to n:',
	'  for c = 0 to C:',
	'    if w[i] > c: dp[i][c] = dp[i-1][c]      // 放不下',
	'    else: dp[i][c] = max(dp[i-1][c],        // 不取',
	'                           dp[i-1][c-w[i]] + v[i])  // 取',
	'  end for',
	'end for',
	'answer = dp[n][C]'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '0-1 背包的状态转移方程中，dp[i][c] 表示什么？',
		options: [
			'前 i 件物品、容量 c 时的最大价值',
			'第 i 件物品的价值',
			'容量 c 能装的最大重量',
			'前 c 件物品的最大价值'
		],
		correctAnswer: '前 i 件物品、容量 c 时的最大价值',
		hint: '两个维度：物品前缀 + 容量',
		explanation:
			'dp[i][c] 表示只考虑前 i 件物品、背包容量恰好为 c 时能获得的最大价值。转移时比较「不取第 i 件」与「取第 i 件」两种选择。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: '当 w[i] > c（第 i 件物品放不下）时，dp[i][c] 等于？',
		options: ['dp[i-1][c]', 'dp[i-1][c-w[i]] + v[i]', '0', 'dp[i][c-1]'],
		correctAnswer: 'dp[i-1][c]',
		hint: '放不下就只能不取',
		explanation:
			'放不下时只能继承「前 i-1 件、容量 c」的结果，即 dp[i][c] = dp[i-1][c]，相当于第 i 件物品不参与。'
	}
];

// 教材示例：物品(重量, 价值)，容量 8
const CAPACITY = 8;

export class KnapsackEngine extends EngineBase<number[]> {
	readonly name = '0-1 背包';
	readonly renderType = 'dp-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'0-1 背包：4 件物品，背包容量 8。每件只能取一次，目标是装下总价值最大的组合。动态规划用一张二维表逐步求解。'
		},
		{
			type: 'compare',
			narration: '填写 dp[i][c]：比较「不取第 i 件」和「取第 i 件」两种选择，取价值更大者。'
		},
		{
			type: 'edge-select',
			narration: '取第 i 件更优：dp[i-1][c-w[i]] + v[i] 胜出。'
		},
		{
			type: 'edge-reject',
			narration: '不取第 i 件更优（或放不下）：直接继承上方的 dp[i-1][c]。'
		},
		{
			type: 'complete',
			narration:
				'表格填完，右下角 dp[4][8] 就是答案。回溯：从右下角出发，若与上方不同则说明取了该物品。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '4 件物品，容量 8' }];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '物品序列（重量,价值 成对，逗号分隔）',
				type: 'text',
				placeholder: '如 2,3,3,4,4,5,5,8',
				default: '2,3,3,4,4,5,5,8'
			}
		]
	};

	applyPreset(_name: string): void {
		this.init([2, 3, 3, 4, 4, 5, 5, 8]);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = parseNumberList(values.data ?? '', { min: 2, max: 16 });
		if (nums.length % 2 !== 0) throw new Error('物品需要成对的 重量,价值');
		this.init(nums);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		// 解析物品:每对 (w, v)
		const items: { name: string; w: number; v: number }[] = [];
		for (let i = 0; i + 1 < input.length; i += 2) {
			items.push({ name: '物品' + (items.length + 1), w: input[i], v: input[i + 1] });
		}
		const C = CAPACITY;
		const n = items.length;

		// 初始化 DP 表:grid 含表头行列 → 值区 rows=n+1, cols=C+1
		const rows = n + 1;
		const cols = C + 1;
		const grid: (string | number)[][] = Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => 0)
		);

		const rowHeaders = items.map((it) => `${it.name}(w=${it.w},v=${it.v})`);
		const colHeaders = Array.from({ length: C + 1 }, (_, c) => String(c));
		const dp: number[][] = Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => 0)
		);

		// init 步骤:空表 + 说明
		this._emit(
			'init',
			`0-1 背包：${n} 件物品，容量 ${C}。行 = 物品前缀，列 = 容量，格子 = 最大价值。`,
			grid,
			rowHeaders,
			colHeaders,
			[],
			'dp[i][c]'
		);

		// 逐格填充
		for (let i = 1; i <= n; i++) {
			const it = items[i - 1];
			this._emit(
				'compare',
				`第 ${i} 件 ${it.name}（重量 ${it.w}，价值 ${it.v}）：开始填写第 ${i} 行。`,
				grid,
				rowHeaders,
				colHeaders,
				[{ type: 'current', row: i, col: 0 }],
				'dp[i][c]'
			);
			for (let c = 0; c <= C; c++) {
				if (it.w > c) {
					dp[i][c] = dp[i - 1][c];
					this._emit(
						'edge-reject',
						`容量 ${c} < 重量 ${it.w}，放不下：dp[${i}][${c}] = dp[${i - 1}][${c}] = ${dp[i - 1][c]}。`,
						grid,
						rowHeaders,
						colHeaders,
						[
							{ type: 'current', row: i, col: c },
							{ type: 'depend', row: i - 1, col: c }
						],
						'dp[i][c]'
					);
				} else {
					const notTake = dp[i - 1][c];
					const takeVal = dp[i - 1][c - it.w] + it.v;
					const take = takeVal > notTake;
					dp[i][c] = Math.max(notTake, takeVal);
					const hl = [
						{ type: 'current', row: i, col: c },
						{ type: 'depend', row: i - 1, col: c }
					] as { type: 'current' | 'depend'; row: number; col: number }[];
					if (c >= it.w) hl.push({ type: 'depend', row: i - 1, col: c - it.w });
					this._emit(
						take ? 'edge-select' : 'edge-reject',
						`容量 ${c}：不取 = ${notTake}，取 = ${takeVal}${it.w <= c ? '（dp[' + (i - 1) + '][' + (c - it.w) + '] + ' + it.v + '）' : ''}。${take ? '取更优' : '不取更优'} → dp[${i}][${c}] = ${dp[i][c]}。`,
						grid,
						rowHeaders,
						colHeaders,
						hl,
						'dp[i][c]'
					);
				}
				grid[i][c] = dp[i][c];
			}
		}

		// 回溯:从右下角找取了哪些物品
		const chosen: string[] = [];
		let r = n,
			c = C;
		while (r > 0 && c > 0) {
			if (dp[r][c] !== dp[r - 1][c]) {
				chosen.unshift(items[r - 1].name);
				c -= items[r - 1].w;
			}
			r--;
		}

		this._emit(
			'complete',
			`填表完成：最大价值 = dp[${n}][${C}] = ${dp[n][C]}。回溯选中的物品：${chosen.length ? chosen.join('、') : '无'}。`,
			grid,
			rowHeaders,
			colHeaders,
			[{ type: 'current', row: n, col: C }],
			'dp[i][c]'
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
