/**
 * M4.2 锁等待甘特图引擎 — 两事务争抢资源 → 循环等待 → 死锁检测 → 回滚解锁。
 * 概念状态机演示（非 SQL 执行），甘特条带按时间刻度累积。
 */

import type { AlgorithmStep, PracticeQuestion } from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import type { LockGanttData } from '../algorithm/types';

const PSEUDOCODE = [
	'T1: LOCK A（获得）',
	'T2: LOCK B（获得）',
	'T1: LOCK B → 已被 T2 持有，等待…',
	'T2: LOCK A → 已被 T1 持有，等待…（循环等待）',
	'检测到死锁 → 回滚代价小的事务（T2）',
	'T2 释放 B → T1 获得 B，继续执行'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'T2 请求 A 时发生了什么？',
		options: ['立即获得 A', 'A 被 T1 持有，T2 进入等待', 'A 被释放', '触发 T1 回滚'],
		correctAnswer: 'A 被 T1 持有，T2 进入等待',
		hint: '第 0 步 T1 已持有 A 且未释放',
		explanation:
			'T1 在第 0 步锁定 A 且尚未释放，T2 请求 A 时只能等待——此时 T1 也在等 T2 手里的 B，形成循环等待。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '为什么是回滚 T2 而不是 T1？',
		options: ['T2 字母靠后', '选做/回滚代价小的作牺牲者', 'T1 先到先得', '随机选择'],
		correctAnswer: '选做/回滚代价小的作牺牲者',
		hint: 'InnoDB 有 victim 选择策略',
		explanation:
			'InnoDB 检测到死锁后选择回滚量小的事务作为 victim，释放其锁打破循环等待，另一事务得以继续。'
	}
];

const TOTAL = 6;

export class LockGanttEngine extends EngineBase<void> {
	readonly name = '锁等待与死锁甘特图';
	readonly renderType = 'gantt' as const;
	readonly panelTitle = '时间线';
	readonly pseudocode = PSEUDOCODE;
	readonly practiceQuestions = PRACTICE;

	init(): void {
		this._stepId = 0;
		const base = {
			total: TOTAL,
			cursor: 0,
			resources: [
				{ name: 'A', holder: undefined as string | undefined },
				{ name: 'B', holder: undefined as string | undefined }
			],
			deadlock: false
		};
		const lane = (
			name: string,
			spans: { from: number; to: number; kind: 'grant' | 'wait' | 'rollback' }[]
		) => ({ name, spans });

		const mk = (d: Partial<LockGanttData>, type: AlgorithmStep['type']): AlgorithmStep => ({
			id: this._stepId++,
			type,
			description: '',
			data: [],
			highlights: [],
			pseudocodeLine: 0,
			gantt: {
				...base,
				lanes: [lane('T1', []), lane('T2', [])],
				...d
			}
		});

		this.steps = [
			{
				...mk(
					{
						cursor: 1,
						lanes: [lane('T1', [{ from: 0, to: 1, kind: 'grant' }]), lane('T2', [])],
						resources: [{ name: 'A', holder: 'T1' }, { name: 'B' }]
					},
					'init'
				),
				description: 't1 · T1 获得资源 A 的锁',
				detail: 'T1 锁定 A 后还要用 B——锁的获取顺序是死锁的第一诱因。',
				pseudocodeLine: 0
			},
			{
				...mk(
					{
						cursor: 2,
						lanes: [
							lane('T1', [{ from: 0, to: 2, kind: 'grant' }]),
							lane('T2', [{ from: 1, to: 2, kind: 'grant' }])
						],
						resources: [
							{ name: 'A', holder: 'T1' },
							{ name: 'B', holder: 'T2' }
						]
					},
					'compare'
				),
				description: 't2 · T2 获得资源 B 的锁（两事务各持其一）',
				detail: 'T1 持 A、T2 持 B——如果双方都以「A→B」同序加锁，就不会有下一步。',
				pseudocodeLine: 1
			},
			{
				...mk(
					{
						cursor: 3,
						lanes: [
							lane('T1', [
								{ from: 0, to: 3, kind: 'grant' },
								{ from: 3, to: 4, kind: 'wait' }
							]),
							lane('T2', [{ from: 1, to: 4, kind: 'grant' }])
						],
						resources: [
							{ name: 'A', holder: 'T1' },
							{ name: 'B', holder: 'T2' }
						]
					},
					'compare'
				),
				description: 't3 · T1 请求 B → 被 T2 持有，进入等待',
				detail: 'T1 的甘特条带转为「等待」色。B 的释放权在 T2 手里，而 T2 正忙着自己的事务。',
				pseudocodeLine: 2
			},
			{
				...mk(
					{
						cursor: 4,
						deadlock: true,
						lanes: [
							lane('T1', [
								{ from: 0, to: 3, kind: 'grant' },
								{ from: 3, to: 5, kind: 'wait' }
							]),
							lane('T2', [
								{ from: 1, to: 4, kind: 'grant' },
								{ from: 4, to: 5, kind: 'wait' }
							])
						],
						resources: [
							{ name: 'A', holder: 'T1' },
							{ name: 'B', holder: 'T2' }
						]
					},
					'edge-reject'
				),
				description: 't4 · T2 请求 A → 等待！循环等待形成 = 死锁',
				detail:
					'T1 等 B（T2 持有），T2 等 A（T1 持有）——等待图出现环。InnoDB 的死锁检测立即发现这个环。',
				pseudocodeLine: 3
			},
			{
				...mk(
					{
						cursor: 5,
						lanes: [
							lane('T1', [
								{ from: 0, to: 3, kind: 'grant' },
								{ from: 3, to: 5, kind: 'wait' }
							]),
							lane('T2', [
								{ from: 1, to: 4, kind: 'grant' },
								{ from: 4, to: 5, kind: 'rollback' }
							])
						],
						resources: [
							{ name: 'A', holder: 'T1' },
							{ name: 'B', holder: undefined }
						]
					},
					'swap'
				),
				description: 't5 · 死锁检测：回滚代价小的 T2（victim），B 被释放',
				detail:
					'牺牲者（victim）的未提交修改全部回滚。业务上可减小事务粒度、统一加锁顺序来降低死锁概率。',
				pseudocodeLine: 4
			},
			{
				...mk(
					{
						cursor: 6,
						lanes: [
							lane('T1', [
								{ from: 0, to: 3, kind: 'grant' },
								{ from: 3, to: 5, kind: 'wait' },
								{ from: 5, to: 6, kind: 'grant' }
							]),
							lane('T2', [
								{ from: 1, to: 4, kind: 'grant' },
								{ from: 4, to: 5, kind: 'rollback' }
							])
						],
						resources: [
							{ name: 'A', holder: 'T1' },
							{ name: 'B', holder: 'T1' }
						]
					},
					'complete'
				),
				description: 't6 · T1 获得 B，事务继续执行——死锁解除',
				detail: 'T1 的等待结束。预防死锁的核心：多资源按同一顺序加锁、事务尽量短小。',
				pseudocodeLine: 5
			}
		];
		this.totalSteps = this.steps.length;
		this.playbackPos = 0;
	}
}
