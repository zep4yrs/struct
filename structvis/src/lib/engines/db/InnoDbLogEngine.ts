/**
 * InnoDB 日志体系引擎 — InnoDbLogEngine
 *
 * 一条 UPDATE 的日志旅程：Buffer Pool 修改 → undo log（回滚/MVCC）→
 * redo log buffer（崩溃恢复）→ binlog（复制/归档）→ 两阶段提交 → 刷盘。
 * 渲染用 graph chain 布局逐步高亮。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	GraphData,
	GraphNodeState,
	PracticeQuestion,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';

const PSEUDO: string[] = [
	'-- UPDATE account SET balance = balance - 100',
	'① Buffer Pool: 加载页 → 修改内存页',
	'② undo log: 记录旧值（回滚 + MVCC 读旧版本）',
	'③ redo log buffer: 记录物理变更（崩溃恢复）',
	'④ binlog: 记录逻辑变更（复制/归档）',
	'⑤ 两阶段提交: redo prepare → binlog write → redo commit',
	'⑥ 后台线程择机把脏页刷回磁盘'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'redo log 与 binlog 的最大区别是？',
		options: [
			'redo 物理日志保证崩溃恢复，binlog 逻辑日志用于复制',
			'没有区别',
			'binlog 比 redo 更重要',
			'redo 用于主从复制'
		],
		correctAnswer: 'redo 物理日志保证崩溃恢复，binlog 逻辑日志用于复制',
		hint: '一个对内一个对外',
		explanation:
			'redo log 是 InnoDB 的物理日志（哪个页哪个偏移改了什么），保证已提交事务不丢；binlog 是 Server 层逻辑日志（SQL/行变更），供主从复制与时间点恢复。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '为什么需要两阶段提交？',
		options: ['保证 redo 与 binlog 的一致性', '提高写入速度', '减少磁盘 IO', '为了兼容老版本'],
		correctAnswer: '保证 redo 与 binlog 的一致性',
		hint: '两份日志不能各说各话',
		explanation:
			'若先写 redo 后写 binlog，崩溃后主库有该变更而从库没有——数据不一致。两阶段提交（prepare→binlog→commit）保证两者要么都在、要么都不在。'
	}
];

const STAGES = ['Buffer Pool', 'undo log', 'redo log', 'binlog', '刷盘'];

export class InnoDbLogEngine extends EngineBase<number[]> {
	readonly name = 'InnoDB 日志体系';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'InnoDB 日志体系：一条 UPDATE 在 Buffer Pool 修改后，靠 undo/redo/binlog 三种日志分别实现回滚、崩溃恢复与复制。'
		},
		{
			type: 'compare',
			narration: '当前阶段：观察每种日志记录什么、为谁服务。'
		},
		{
			type: 'edge-select',
			narration: '两阶段提交串起 redo 与 binlog——这是数据一致性的关键。'
		},
		{
			type: 'complete',
			narration:
				'全链路完成。面试高频：redo 保证 crash-safe、undo 支撑 MVCC、binlog 服务复制——三者分工不同。'
		}
	];

	presets: EnginePreset[] = [{ name: 'UPDATE 全链路', description: '一条 UPDATE 的日志旅程' }];

	customConfig: EngineCustomConfig = { title: '日志演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const n = STAGES.length;
		const DETAILS = [
			'加载 id=1 数据页到 Buffer Pool，在内存中把 balance 减 100（脏页）。',
			'写入 undo log：记录旧值 balance=1100。作用：事务回滚 + MVCC 其他事务读旧版本。',
			'写入 redo log buffer：记录「页 X 偏移 Y 改了 1000」。作用：宕机后重放，保证已提交不丢（crash-safe）。',
			'写入 binlog（Statement/Row 格式）：逻辑变更。作用：主从复制、时间点恢复。',
			'两阶段提交完成后，后台 Master Thread 择机把脏页刷回磁盘（WAL：先写日志再刷页）。'
		];

		const mkGraph = (cur: number): GraphData => {
			const nodeState: Record<number, GraphNodeState> = {};
			for (let i = 0; i < n; i++) {
				nodeState[i] = i === cur ? 'current' : i < cur ? 'done' : 'unvisited';
			}
			return {
				nodes: STAGES.map((l, id) => ({ id, label: l })),
				edges: Array.from({ length: n - 1 }, (_, i) => ({
					from: i,
					to: i + 1,
					label: ''
				})),
				directed: true,
				layout: 'chain',
				nodeState,
				nodeNote: {}
			};
		};

		this._emit(
			'init',
			'一条 UPDATE 的完整旅程：Buffer Pool 修改 → 三种日志各司其职 → 两阶段提交 → 脏页刷盘。',
			mkGraph(0),
			0
		);

		for (let i = 0; i < n; i++) {
			const type: StepType = i === 2 || i === 3 ? 'edge-select' : 'compare';
			this._emit(
				type,
				STAGES[i] + '：' + DETAILS[i],
				mkGraph(i),
				Math.min(i + 1, PSEUDO.length - 1)
			);
		}

		this._emit(
			'complete',
			'链路完成。记忆口诀：undo 管回滚、redo 管恢复、binlog 管复制；两阶段提交是三者一致性的纽带。',
			mkGraph(n - 1),
			7
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		graph: GraphData,
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine,
			graph
		});
	}
}
