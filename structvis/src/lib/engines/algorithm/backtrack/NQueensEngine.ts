/**
 * 八皇后引擎 — NQueensEngine
 *
 * 回溯法：逐行放置皇后，每行从第 0 列试探；与已放置皇后同列或同对角线则冲突跳过；
 * 全行放完得到一个解；无列可放时回溯到上一行换下一列。
 * 每步 queens 快照：棋盘 + 当前试探格 + 冲突标记。渲染用 queens。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const N = 6; // 8 皇后再现步骤过多，教学用 6 皇后（解 4 个）

const PSEUDO: string[] = [
	'procedure solve(row):',
	'  if row == n: 记录一个解; return',
	'  for col = 0 to n-1:',
	'    if 安全(row, col):',
	'      place queen at (row, col)',
	'      solve(row + 1)          // 递归下一行',
	'      撤销 place              // 回溯',
	'end procedure'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '两个皇后在同一对角线的判定条件是？',
		options: [
			'|row1 - row2| == |col1 - col2|',
			'row1 == row2',
			'col1 == col2 或 row1 == row2',
			'(row+col) 相同即可'
		],
		correctAnswer: '|row1 - row2| == |col1 - col2|',
		hint: '对角线上行列差绝对值相等',
		explanation:
			'主对角线满足 row-col 为常数，副对角线满足 row+col 为常数——两者都等价于 |行差| == |列差|。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '回溯发生的时机是？',
		options: [
			'当前行所有列都冲突，退回上一行换列',
			'找到一个解后立即回溯到第一行',
			'每放置一个皇后就回溯',
			'永远不会回溯'
		],
		correctAnswer: '当前行所有列都冲突，退回上一行换列',
		hint: '此路不通，退回去换条路',
		explanation:
			'当某一行 0..n-1 全部尝试失败（都冲突），说明前面的摆放有问题——撤销上一行的皇后，让它移到下一列重新尝试。'
	}
];

export class NQueensEngine extends EngineBase<number[]> {
	readonly name = 'N 皇后回溯';
	readonly renderType = 'queens' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'N 皇后（演示 6×6）：在棋盘上放 N 个皇后使互不攻击。逐行放置、冲突剪枝、走不通就回溯——回溯法的经典范式。'
		},
		{
			type: 'compare',
			narration: '在当前行逐列试探：检查列、两条对角线是否与已放置的皇后冲突。'
		},
		{
			type: 'edge-select',
			narration: '位置安全：放置皇后，进入下一行。'
		},
		{
			type: 'edge-reject',
			narration: '本行全部冲突：回溯——撤销上一行的皇后，换下一列重试。'
		},
		{
			type: 'complete',
			narration: '找到全部解。6 皇后共 4 个解；8 皇后有 92 个解——回溯的剪枝让指数级搜索变得可行。'
		}
	];

	presets: EnginePreset[] = [{ name: '6 皇后', description: '全部 4 个解' }];

	customConfig: EngineCustomConfig = { title: 'N 皇后', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const placed: number[] = [];
		let solutionCount = 0;
		const allSolutions: number[][] = [];

		const mkSnap = (
			curRow: number,
			curCol: number,
			phase: 'try' | 'conflict' | 'place' | 'backtrack' | 'solution',
			conflicts?: { row: number; col: number }[],
			solutionIndex?: number
		) => ({
			n: N,
			placed: [...placed],
			curRow,
			curCol,
			conflicts,
			phase,
			solutionIndex
		});

		this._emit('init', `N 皇后（${N}×${N}）：从第 1 行开始逐行放置。`, mkSnap(0, -1, 'try'), 0);

		const conflictsWith = (row: number, col: number): number[] => {
			const cf: number[] = [];
			for (let pr = 0; pr < placed.length; pr++) {
				const pc = placed[pr];
				if (pc === col || Math.abs(pr - row) === Math.abs(pc - col)) cf.push(pr);
			}
			return cf;
		};

		const solve = (row: number): void => {
			if (row === N) {
				solutionCount++;
				allSolutions.push([...placed]);
				this._emit(
					'complete',
					`找到第 ${solutionCount} 个解：[${placed.map((c) => c + 1).join(', ')}]。`,
					mkSnap(-1, -1, 'solution', undefined, solutionCount),
					2
				);
				return;
			}
			for (let col = 0; col < N; col++) {
				const cfRows = conflictsWith(row, col);
				if (cfRows.length > 0) {
					this._emit(
						'edge-reject',
						`(${row + 1}, ${col + 1}) 冲突：与第 ${cfRows.map((r) => r + 1).join(', ')} 行的皇后同列/同对角线。`,
						mkSnap(
							row,
							col,
							'conflict',
							cfRows.map((r) => ({ row: r, col: placed[r] }))
						),
						3
					);
					continue;
				}
				placed.push(col);
				this._emit(
					'edge-select',
					`(${row + 1}, ${col + 1}) 安全：放置皇后，进入第 ${row + 2} 行。`,
					mkSnap(row, col, 'place'),
					5
				);
				solve(row + 1);
				placed.pop();
				if (placed.length >= 0 && solutionCount < 100) {
					this._emit(
						'edge-reject',
						`回溯：撤销第 ${row + 1} 行的皇后（该列后续无解），尝试下一列。`,
						mkSnap(row, Math.min(col + 1, N - 1), 'backtrack'),
						6
					);
				}
			}
		};

		solve(0);

		this._emit(
			'complete',
			`全部完成：${N} 皇后共 ${solutionCount} 个解（${allSolutions.map((s) => '[' + s.map((c) => c + 1).join(',') + ']').join(' ')}）。`,
			mkSnap(-1, -1, 'solution', undefined, solutionCount),
			7
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		snap: {
			n: number;
			placed: number[];
			curRow: number;
			curCol: number;
			conflicts?: { row: number; col: number }[];
			phase: 'try' | 'conflict' | 'place' | 'backtrack' | 'solution';
			solutionIndex?: number;
		},
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine,
			queens: snap as never
		});
	}
}
