/**
 * 编辑距离引擎 — EditDistanceEngine
 *
 * Levenshtein 距离：word1 变成 word2 最少需要的插入/删除/替换次数。
 * dp[i][j] = w1 前 i 个字符 → w2 前 j 个字符的最少操作数。
 * 相等：dp[i-1][j-1]；不等：1 + min(上，左，左上)。渲染用 dp-table。
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
	'// 编辑距离 dp[i][j]',
	'if w1[i-1] == w2[j-1]:',
	'  dp[i][j] = dp[i-1][j-1]',
	'else:',
	'  dp[i][j] = 1 + min(',
	'    dp[i-1][j],      // 删除',
	'    dp[i][j-1],      // 插入',
	'    dp[i-1][j-1])    // 替换'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '两字符相等时 dp[i][j] 等于？',
		options: ['dp[i-1][j-1]（无需操作）', 'dp[i-1][j-1] + 1', 'max(dp)', '0'],
		correctAnswer: 'dp[i-1][j-1]（无需操作）',
		hint: '相等就不用动',
		explanation: '当前字符相同，问题规模直接缩小到两个前缀——不产生任何操作代价。'
	},
	{
		type: 'choose-next',
		stepIndex: 7,
		prompt: '编辑距离的应用场景不包括？',
		options: ['拼写检查', 'DNA 序列比对', '模糊搜索', '快速排序'],
		correctAnswer: '快速排序',
		hint: '其余都是相似度场景',
		explanation: '编辑距离衡量字符串相似度，广泛用于拼写纠错、DNA 比对、模糊搜索；与排序无关。'
	}
];

export class EditDistanceEngine extends EngineBase<string[]> {
	readonly name = '编辑距离';
	readonly renderType = 'dp-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'编辑距离：horse → ros 最少需要 3 步（删 r、删 e、换 o→r）。二维表逐格计算最小操作数。'
		},
		{ type: 'compare', narration: '字符相等走左上零代价；不等则取三种操作的最小值 +1。' },
		{ type: 'edge-select', narration: '取最小操作方向：删除 / 插入 / 替换。' },
		{ type: 'complete', narration: '右下角即答案。编辑距离是自然语言处理与生物信息学的基础算法。' }
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: 'horse → ros（距离 3）' }];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '两个单词（逗号分隔）',
				type: 'text',
				placeholder: '如 horse,ros',
				default: 'horse,ros'
			}
		]
	};

	applyPreset(_name: string): void {
		this.init(['horse', 'ros']);
	}

	applyCustom(values: Record<string, string>): void {
		const parts = (values.data ?? '').split(',').map((s) => s.trim());
		if (!parts[0] || !parts[1]) throw new Error('需要两个非空单词');
		this.init([parts[0], parts[1]]);
	}

	init(input: string[]): void {
		this.steps = [];
		this._stepId = 0;

		const A = input[0] ?? 'horse';
		const B = input[1] ?? 'ros';
		const n = A.length;
		const m = B.length;

		const rows = n + 1;
		const cols = m + 1;
		const grid: (string | number)[][] = Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => 0)
		);
		const dp: number[][] = Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => 0)
		);
		for (let i = 0; i <= n; i++) dp[i][0] = i;
		for (let j = 0; j <= m; j++) dp[0][j] = j;
		for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) grid[i][j] = dp[i][j];

		const rowHeaders = Array.from({ length: n }, (_, i) => A[i]);
		const colHeaders = Array.from({ length: m }, (_, i) => B[i]);

		this._emit(
			'init',
			`编辑距离："${A}" → "${B}"。边界已填：空串到任意串的距离就是长度。`,
			grid,
			rowHeaders,
			colHeaders,
			[],
			''
		);

		for (let i = 1; i <= n; i++) {
			for (let j = 1; j <= m; j++) {
				if (A[i - 1] === B[j - 1]) {
					dp[i][j] = dp[i - 1][j - 1];
					this._emit(
						'edge-select',
						`'${A[i - 1]}' == '${B[j - 1]}'：dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}。`,
						grid,
						rowHeaders,
						colHeaders,
						[
							{ type: 'current', row: i, col: j },
							{ type: 'depend', row: i - 1, col: j - 1 }
						],
						''
					);
				} else {
					dp[i][j] = 1 + Math.min(dp[i - 1][j], Math.min(dp[i][j - 1], dp[i - 1][j - 1]));
					this._emit(
						'edge-reject',
						`'${A[i - 1]}' ≠ '${B[j - 1]}'：1 + min(上 ${dp[i - 1][j]}, 左 ${dp[i][j - 1]}, 左上 ${dp[i - 1][j - 1]}) = ${dp[i][j]}。`,
						grid,
						rowHeaders,
						colHeaders,
						[
							{ type: 'current', row: i, col: j },
							{ type: 'depend', row: i - 1, col: j },
							{ type: 'depend', row: i, col: j - 1 },
							{ type: 'depend', row: i - 1, col: j - 1 }
						],
						''
					);
				}
				grid[i][j] = dp[i][j];
			}
		}

		this._emit(
			'complete',
			`填表完成：编辑距离 = ${dp[n][m]}。`,
			grid,
			rowHeaders,
			colHeaders,
			[{ type: 'current', row: n, col: m }],
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
