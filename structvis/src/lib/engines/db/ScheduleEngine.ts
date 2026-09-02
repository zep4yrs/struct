/**
 * M4.3 可串行化调度引擎 — 冲突对识别 + 冲突可串行化（等价串行序列）。
 * 概念状态机演示（非 SQL 执行）：调度 S = R1(A) R2(A) W1(A) W2(A) R1(B) W1(B)。
 */

import type { AlgorithmStep, PracticeQuestion } from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import type { ScheduleData } from '../algorithm/types';

const PSEUDOCODE = [
	'调度 S：R1(A) R2(A) W1(A) W2(A) R1(B) W1(B)',
	'冲突条件：不同事务 · 同一数据 · 至少一个写',
	'冲突对：(R1(A),W2(A)) (R2(A),W1(A)) (W1(A),W2(A))',
	'交换相邻「非冲突」操作尝试化成串行',
	'串行化成功：等价于 T1 → T2'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'R1(A) 与 R2(A)（两个读）是冲突操作吗？',
		options: ['是，都访问 A', '不是，两个读互不冲突', '取决于事务顺序', '仅当隔离级别低时冲突'],
		correctAnswer: '不是，两个读互不冲突',
		hint: '冲突 = 结果可能因顺序不同而不同',
		explanation:
			'两个读只取值不改变数据，交换顺序不影响最终结果——所以不冲突。冲突必须「不同事务 + 同数据 + 至少一个写」。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '调度 S 可串行化意味着什么？',
		options: [
			'S 就是串行执行的',
			'存在一个串行调度与 S 结果等价',
			'S 一定比串行快',
			'S 不需要加锁'
		],
		correctAnswer: '存在一个串行调度与 S 结果等价',
		hint: '「可串行化」= 可以等价改写成串行',
		explanation:
			'冲突可串行化理论：通过交换相邻非冲突操作，S 能化成某个串行调度（本例 T1→T2），则两者对数据库的影响完全一致。'
	}
];

const OPS = [
	{ id: 0, label: 'R1(A)', tx: 1 },
	{ id: 1, label: 'R2(A)', tx: 2 },
	{ id: 2, label: 'W1(A)', tx: 1 },
	{ id: 3, label: 'W2(A)', tx: 2 },
	{ id: 4, label: 'R1(B)', tx: 1 },
	{ id: 5, label: 'W1(B)', tx: 1 }
];
const CONFLICTS: [number, number][] = [
	[0, 3],
	[1, 2],
	[2, 3]
];
const SERIAL = [0, 2, 4, 5, 1, 3];

export class ScheduleEngine extends EngineBase<void> {
	readonly name = '可串行化调度';
	readonly renderType = 'schedule' as const;
	readonly panelTitle = '冲突分析';
	readonly pseudocode = PSEUDOCODE;
	readonly practiceQuestions = PRACTICE;

	init(): void {
		this._stepId = 0;
		const mk = (
			d: Partial<ScheduleData>,
			type: AlgorithmStep['type'],
			note?: string
		): AlgorithmStep => ({
			id: this._stepId++,
			type,
			description: note ?? '',
			data: [],
			highlights: [],
			pseudocodeLine: 0,
			schedule: {
				ops: OPS.map((o) => ({
					...o,
					state: (d.activeId === o.id ? 'active' : 'normal') as 'normal' | 'active' | 'conflict'
				})),
				conflicts: CONFLICTS.map((c) => [...c] as [number, number]),
				...d,
				phase: (d.phase ?? 'run') as ScheduleData['phase']
			}
		});

		this.steps = [
			mk({ phase: 'run', note: '调度 S：R1(A) R2(A) W1(A) W2(A) R1(B) W1(B)' }, 'init'),
			...OPS.map((o, i) =>
				mk({ phase: 'run', activeId: o.id }, 'compare', `执行 ${o.label}（第 ${i + 1} 步）`)
			),
			mk(
				{ phase: 'conflict', activeConflict: [0, 3], note: '冲突对：R1(A) 与 W2(A)（读-写）' },
				'pivot-select'
			),
			mk(
				{ phase: 'conflict', activeConflict: [1, 2], note: '冲突对：R2(A) 与 W1(A)（读-写）' },
				'pivot-select'
			),
			mk(
				{ phase: 'conflict', activeConflict: [2, 3], note: '冲突对：W1(A) 与 W2(A)（写-写）' },
				'pivot-select'
			),
			mk(
				{
					phase: 'serial',
					serialOrder: SERIAL,
					note: '交换非冲突相邻操作，化成串行 T1→T2：R1(A) W1(A) R1(B) W1(B) R2(A) W2(A)'
				},
				'swap'
			),
			mk(
				{ phase: 'serial', serialOrder: SERIAL, note: '结论：S 冲突可串行化，等价于串行 T1 → T2' },
				'complete'
			)
		];
		this.totalSteps = this.steps.length;
		this.playbackPos = 0;
	}
}
