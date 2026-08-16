/**
 * 最长公共子序列引擎 — LCSEngine
 *
 * 经典动态规划：字符串 A 与 B 的最长公共子序列长度。
 * 若 A[i]==B[j]: dp[i][j]=dp[i-1][j-1]+1（取左上+1）
 * 否则:        dp[i][j]=max(dp[i-1][j], dp[i][j-1])（取上方/左方较大）
 * 逐格填充 + 完成时回溯箭头标出 LCS 路径。
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
	'// LCS：dp[i][j] = A[1..i] 与 B[1..j] 的 LCS 长度',
	'for i = 1 to |A|:',
	'  for j = 1 to |B|:',
	'    if A[i] == B[j]: dp[i][j] = dp[i-1][j-1] + 1',
	'    else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])',
	'  end for',
	'end for',
	'回溯：从右下角沿箭头走到左上角，斜走处即 LCS 字符'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '当 A[i] ≠ B[j] 时，dp[i][j] 如何计算？',
		options: ['max(dp[i-1][j], dp[i][j-1])', 'dp[i-1][j-1] + 1', 'dp[i-1][j]', '0'],
		correctAnswer: 'max(dp[i-1][j], dp[i][j-1])',
		hint: '字符不等，只能继承上方或左方',
		explanation:
			'不等时当前字符对不贡献长度，LCS 要么来自「A 少一个字符」要么来自「B 少一个字符」，取两者较大值。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '回溯构造 LCS 时，什么情况下当前字符属于 LCS？',
		options: [
			'dp[i][j] 从 dp[i-1][j-1] 斜向得来且 A[i]==B[j]',
			'dp[i][j] 从上方得来',
			'dp[i][j] 从左侧得来',
			'只要 dp[i][j] > 0'
		],
		correctAnswer: 'dp[i][j] 从 dp[i-1][j-1] 斜向得来且 A[i]==B[j]',
		hint: '斜走表示两字符匹配',
		explanation:
			'回溯从右下角出发：若 dp[i][j] == dp[i-1][j-1]+1 且 A[i]==B[j]，说明走的是斜对角线（字符匹配），该字符加入 LCS；否则向较大的一方移动。'
	}
];

const DEFAULT_A = 'ABCBDAB';
const DEFAULT_B = 'BDCABA';

export class LCSEngine extends EngineBase<string[]> {
	readonly name = '最长公共子序列 LCS';
	readonly renderType = 'dp-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'最长公共子序列：在保持相对顺序的前提下，两个字符串能匹配到的最长字符序列。经典动态规划填表题。'
		},
		{
			type: 'compare',
			narration: '逐格比较 A[i] 与 B[j]：相等走左上 +1，不等取上方与左方较大者。'
		},
		{
			type: 'edge-select',
			narration: '字符相等：dp[i][j] = dp[i-1][j-1] + 1，沿斜线前进。'
		},
		{
			type: 'edge-reject',
			narration: '字符不等：从上方与左方继承较大值。'
		},
		{
			type: 'complete',
			narration:
				'填表完成，右下角即 LCS 长度。回溯沿箭头从右下角走到左上角，斜向箭头经过的字符就是最长公共子序列。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '示例 A', description: 'ABCBDAB × BDCABA' },
		{ name: '示例 B', description: 'ABCDGH × AEDFHR' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '两个字符串（逗号分隔）',
				type: 'text',
				placeholder: '如 ABCBDAB,BDCABA',
				default: 'ABCBDAB,BDCABA'
			}
		]
	};

	applyPreset(name: string): void {
		if (name === '示例 B') this.init(['ABCDGH', 'AEDFHR']);
		else this.init([DEFAULT_A, DEFAULT_B]);
	}

	applyCustom(values: Record<string, string>): void {
		const parts = (values.data ?? '').split(',').map((s) => s.trim());
		if (parts.length < 2 || !parts[0] || !parts[1]) throw new Error('需要两个非空字符串');
		this.init([parts[0], parts[1]]);
	}

	init(input: string[]): void {
		this.steps = [];
		this._stepId = 0;

		const A = input[0] ?? DEFAULT_A;
		const B = input[1] ?? DEFAULT_B;
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

		// 行头 = A 的字符(每行对应 A 的一个字符), 列头 = B 的字符
		const rowHeaders = Array.from({ length: n }, (_, i) => A[i]);
		const colHeaders = Array.from({ length: m }, (_, i) => B[i]);

		this._emit(
			'init',
			`LCS：A = "${A}"，B = "${B}"。行 = A 的字符，列 = B 的字符，格子 = 前缀 LCS 长度。`,
			grid,
			rowHeaders,
			colHeaders,
			[],
			''
		);

		for (let i = 1; i <= n; i++) {
			this._emit(
				'compare',
				`处理 A 的第 ${i} 个字符「${A[i - 1]}」：逐列与 B 比较。`,
				grid,
				rowHeaders,
				colHeaders,
				[{ type: 'current', row: i, col: 0 }],
				''
			);
			for (let j = 1; j <= m; j++) {
				if (A[i - 1] === B[j - 1]) {
					dp[i][j] = dp[i - 1][j - 1] + 1;
					this._emit(
						'edge-select',
						`A[${i}]=${A[i - 1]} 与 B[${j}]=${B[j - 1]} 相等：dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}。`,
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
					dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
					this._emit(
						'edge-reject',
						`A[${i}]=${A[i - 1]} ≠ B[${j}]=${B[j - 1]}：取 max(上 ${dp[i - 1][j]}, 左 ${dp[i][j - 1]}) = ${dp[i][j]}。`,
						grid,
						rowHeaders,
						colHeaders,
						[
							{ type: 'current', row: i, col: j },
							{ type: 'depend', row: i - 1, col: j },
							{ type: 'depend', row: i, col: j - 1 }
						],
						''
					);
				}
				grid[i][j] = dp[i][j];
			}
		}

		// 回溯箭头:从右下角到左上角
		const arrows: { fromRow: number; fromCol: number; toRow: number; toCol: number }[] = [];
		let r = n,
			c = m;
		while (r > 0 && c > 0) {
			if (A[r - 1] === B[c - 1]) {
				arrows.push({ fromRow: r, fromCol: c, toRow: r - 1, toCol: c - 1 });
				r--;
				c--;
			} else if (dp[r - 1][c] >= dp[r][c - 1]) {
				arrows.push({ fromRow: r, fromCol: c, toRow: r - 1, toCol: c });
				r--;
			} else {
				arrows.push({ fromRow: r, fromCol: c, toRow: r, toCol: c - 1 });
				c--;
			}
		}

		// 回溯得到的 LCS 字符(反序)
		const lcsChars: string[] = [];
		{
			let rr = n,
				cc = m;
			while (rr > 0 && cc > 0) {
				if (A[rr - 1] === B[cc - 1]) {
					lcsChars.unshift(A[rr - 1]);
					rr--;
					cc--;
				} else if (dp[rr - 1][cc] >= dp[rr][cc - 1]) rr--;
				else cc--;
			}
		}

		this._emit(
			'complete',
			`LCS 长度 = ${dp[n][m]}。回溯路径（斜走处匹配）：${lcsChars.join('')}。`,
			grid,
			rowHeaders,
			colHeaders,
			[{ type: 'current', row: n, col: m }],
			'',
			arrows
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
		cornerLabel: string,
		arrows?: { fromRow: number; fromCol: number; toRow: number; toCol: number }[]
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
				cornerLabel,
				arrows
			}
		});
	}
}
