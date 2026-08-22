/**
 * 区间 DP · 矩阵链乘法引擎 — MatrixChainEngine
 *
 * 给定矩阵链的维度数组 p（矩阵 Ai 为 p[i]×p[i+1]），求最优加括号方案使乘法次数最少。
 * dp[i][j] = 合并 Ai..Aj 的最少乘法次数；dp[i][j] = min(dp[i][k] + dp[k+1][j] + p[i-1]*p[k]*p[j])。
 * 渲染用 dp-table（上三角填充）。
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
	'// 矩阵链乘 dp[i][j]',
	'for len = 2 to n:',
	'  for i = 1 to n-len+1:',
	'    j = i+len-1',
	'    dp[i][j] = min over k in [i, j):',
	'      dp[i][k] + dp[k+1][j] + p[i-1]*p[k]*p[j]'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '矩阵链乘法的目标是什么？',
		options: ['最少标量乘法次数', '最少的矩阵个数', '最大的结果值', '最快的 IO'],
		correctAnswer: '最少标量乘法次数',
		hint: '乘法顺序影响计算量',
		explanation:
			'矩阵乘法满足结合律但不满足交换律——不同的加括号方式标量乘法次数差异巨大，动态规划求最优切分点。'
	}
];

export class MatrixChainEngine extends EngineBase<number[]> {
	readonly name = '区间DP · 矩阵链乘';
	readonly renderType = 'dp-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '矩阵链乘：维度 [30×35, 35×15, 15×5, 5×10, 10×20, 20×25]。按区间长度从小到大填表。'
		},
		{ type: 'compare', narration: '枚举区间 [i,j] 的每个切分点 k：左边 + 右边 + 合并代价。' },
		{ type: 'edge-select', narration: '取最小代价的切分点。' },
		{ type: 'complete', narration: '右上角 dp[1][n] 即最少乘法次数。' }
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: 'CLRS 经典 6 矩阵链' }];

	customConfig: EngineCustomConfig = { title: '矩阵链', fields: [] };

	applyPreset(_name: string): void {
		this.init([30, 35, 15, 5, 10, 20, 25]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([30, 35, 15, 5, 10, 20, 25]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const p = input.length >= 4 ? input : [30, 35, 15, 5, 10, 20, 25];
		const n = p.length - 1;

		const grid: (string | number)[][] = Array.from({ length: n }, () =>
			Array.from({ length: n }, () => '')
		);
		const rowHeaders = Array.from({ length: n }, (_, i) => `A${i + 1}`);
		const colHeaders = Array.from({ length: n }, (_, j) => `A${j + 1}`);

		this._emit(
			'init',
			`矩阵链：${n} 个矩阵，维度 ${p.join('×')}。dp 只填上三角。`,
			grid,
			rowHeaders,
			colHeaders,
			[],
			''
		);

		const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
		for (let i = 0; i < n; i++) grid[i][i] = 0;

		for (let len = 2; len <= n; len++) {
			for (let i = 0; i + len - 1 < n; i++) {
				const j = i + len - 1;
				dp[i][j] = Infinity;
				let bestK = -1;
				for (let k = i; k < j; k++) {
					const cost = dp[i][k] + dp[k + 1][j] + p[i] * p[k + 1] * p[j + 1];
					if (cost < dp[i][j]) {
						dp[i][j] = cost;
						bestK = k;
					}
				}
				grid[i][j] = dp[i][j];
				this._emit(
					'edge-select',
					`dp[${i + 1}][${j + 1}] = ${dp[i][j]}（在 A${bestK + 1} 后切分）。`,
					grid,
					rowHeaders,
					colHeaders,
					[
						{ type: 'current', row: i, col: j },
						{ type: 'depend', row: i, col: bestK },
						{ type: 'depend', row: bestK + 1, col: j }
					],
					''
				);
			}
		}

		this._emit(
			'complete',
			`完成：最少乘法次数 = ${dp[0][n - 1]}。`,
			grid,
			rowHeaders,
			colHeaders,
			[{ type: 'current', row: 0, col: n - 1 }],
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
