/**
 * 最长递增子序列引擎 — LISEngine
 *
 * O(n²) DP：dp[i] = 以 nums[i] 结尾的 LIS 长度。
 * 转移：dp[i] = max(dp[j]+1)，j<i 且 nums[j]<nums[i]。
 * 每格填充高亮依赖格（所有更小且更靠前的位置）。渲染用 dp-table（一维表：行=单行）。
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
	'// LIS: dp[i] = 以 i 结尾的最长递增子序列长度',
	'dp[所有] = 1',
	'for i = 1 to n-1:',
	'  for j = 0 to i-1:',
	'    if a[j] < a[i]:',
	'      dp[i] = max(dp[i], dp[j] + 1)',
	'answer = max(dp)'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'LIS 的状态定义 dp[i] 是？',
		options: ['以 a[i] 结尾的 LIS 长度', '前 i 个数的 LIS 长度', '全局 LIS 长度', 'a[i] 的排名'],
		correctAnswer: '以 a[i] 结尾的 LIS 长度',
		hint: '结尾必须含 a[i] 才能转移',
		explanation:
			'dp[i] 定义为"以 a[i] 结尾"才能从更小的 j 转移过来；最终答案是所有 dp[i] 的最大值，而不是 dp[n-1]。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: 'LIS 的 O(n log n) 优化借助什么结构？',
		options: ['贪心 + 二分查找维护 tails 数组', '哈希表', '堆', '并查集'],
		correctAnswer: '贪心 + 二分查找维护 tails 数组',
		hint: 'tails[k] = 长度 k+1 的递增子序列最小结尾',
		explanation:
			'tails 数组保持有序，每个新元素二分定位替换或追加——总复杂度 O(n log n)。该数组本身不是某个 LIS，但长度正确。'
	}
];

export class LISEngine extends EngineBase<number[]> {
	readonly name = '最长递增子序列';
	readonly renderType = 'dp-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'最长递增子序列 LIS：10, 9, 2, 5, 3, 7, 101, 18 的 LIS 是 [2,3,7,101]，长度 4。逐个元素计算以它结尾的最大长度。'
		},
		{
			type: 'compare',
			narration: '扫描前面所有更小的元素：dp[i] = max(dp[j]) + 1。'
		},
		{
			type: 'edge-select',
			narration: '找到更长的前驱：更新 dp[i]。'
		},
		{
			type: 'complete',
			narration: '填表完成，最大值即答案。进阶：贪心 + 二分可优化到 O(n log n)。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '[10,9,2,5,3,7,101,18]' }];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '数字序列（逗号分隔）',
				type: 'text',
				placeholder: '如 10,9,2,5,3,7,101,18',
				default: '10,9,2,5,3,7,101,18'
			}
		]
	};

	applyPreset(_name: string): void {
		this.init([10, 9, 2, 5, 3, 7, 101, 18]);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map(Number);
		if (nums.length < 2) throw new Error('至少需要 2 个数');
		this.init(nums);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const nums = input.length ? input : [10, 9, 2, 5, 3, 7, 101, 18];
		const n = nums.length;
		const dp = new Array(n).fill(1);

		const rowHeaders = nums.map((v, i) => `a[${i}]=${v}`);
		// 单列表:一列 "dp"
		const colHeaders = ['dp'];
		const grid: (string | number)[][] = Array.from({ length: n }, () => [1]);

		this._emit(
			'init',
			`LIS：序列 [${nums.join(', ')}]。dp[i] = 以 a[i] 结尾的最长递增子序列长度，初始全为 1。`,
			grid,
			rowHeaders,
			colHeaders,
			[],
			''
		);

		let bestLen = 1;
		for (let i = 0; i < n; i++) {
			if (i === 0) {
				grid[0][0] = 1;
				continue;
			}
			const deps: number[] = [];
			for (let j = 0; j < i; j++) {
				if (nums[j] < nums[i]) {
					deps.push(j);
					dp[i] = Math.max(dp[i], dp[j] + 1);
				}
			}
			bestLen = Math.max(bestLen, dp[i]);
			grid[i][0] = dp[i];
			this._emit(
				deps.length ? 'edge-select' : 'edge-reject',
				deps.length
					? `a[${i}]=${nums[i]}：比它小的前驱有 ${deps.length} 个 → dp[${i}] = ${dp[i]}。`
					: `a[${i}]=${nums[i]}：没有更小的前驱 → dp[${i}] = 1。`,
				grid,
				rowHeaders,
				colHeaders,
				[
					{ type: 'current', row: i, col: 0 },
					...deps.slice(-3).map((j) => ({ type: 'depend' as const, row: j, col: 0 }))
				],
				''
			);
		}

		this._emit(
			'complete',
			`填表完成：LIS 长度 = ${bestLen}（取所有 dp 的最大值）。O(n²) 解法。`,
			grid,
			rowHeaders,
			colHeaders,
			[{ type: 'current', row: n - 1, col: 0 }],
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
