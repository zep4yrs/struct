/**
 * 主从复制引擎 — ReplicationEngine
 *
 * MySQL 主从复制链路：主库写 binlog → dump 线程推送 → 从库 IO 线程写 relay log →
 * SQL 线程重放 → 数据一致。渲染用 graph chain 布局。
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
	'-- 主从复制三线程',
	'主库: 事务提交 → 写 binlog → dump 线程推送',
	'从库: IO 线程接收 → 写 relay log（中继日志）',
	'从库: SQL 线程重放 relay log → 数据一致',
	'-- 异步复制（默认）/ 半同步（至少一从确认）/ 组复制'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'relay log（中继日志）的作用是？',
		options: [
			'从库暂存主库发来的 binlog 事件，等待 SQL 线程重放',
			'主库的事务日志',
			'崩溃恢复日志',
			'缓存查询结果'
		],
		correctAnswer: '从库暂存主库发来的 binlog 事件，等待 SQL 线程重放',
		hint: 'IO 与 SQL 两线程的解耦缓冲',
		explanation:
			'IO 线程只负责收（快），SQL 线程负责重放（可能慢）——relay log 作为解耦缓冲区，让两边速度解耦。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '默认的异步复制可能出现什么现象？',
		options: ['从库读到稍旧的数据（主从延迟）', '主库数据丢失', '从库永远追不上', '事务会失败'],
		correctAnswer: '从库读到稍旧的数据（主从延迟）',
		hint: '异步=不等待确认',
		explanation:
			'异步复制下主库提交不等从库确认，从库重放存在延迟。写后立即读从库可能读到旧值——半同步/组复制可缓解。'
	}
];

const NODES = [
	'客户端写主库',
	'binlog',
	'dump 线程',
	'IO 线程',
	'relay log',
	'SQL 线程',
	'从库数据'
];
const NOTES = ['', '逻辑变更事件', '推送到从库', '接收并落盘', '中继缓冲', '按序重放', '最终一致'];

export class ReplicationEngine extends EngineBase<number[]> {
	readonly name = '主从复制';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'MySQL 主从复制：主库写 binlog，dump 线程推送，从库 IO 线程收进 relay log，SQL 线程重放——读写分离与高可用的基础。'
		},
		{
			type: 'compare',
			narration: '当前阶段：观察事件如何一步步流向从库。'
		},
		{
			type: 'edge-select',
			narration: 'relay log 解耦了接收与重放的速度差。'
		},
		{
			type: 'complete',
			narration:
				'复制完成。主从延迟是异步复制的固有现象——半同步复制要求至少一个从库确认后才返回提交成功。'
		}
	];

	presets: EnginePreset[] = [{ name: '标准异步复制', description: '一主一从三线程' }];

	customConfig: EngineCustomConfig = { title: '复制演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const n = NODES.length;
		const DETAILS = [
			'业务事务在主库执行并提交。',
			'提交时事件写入 binlog（Row 格式最常用）。',
			'主库 dump 线程监听 binlog 变化，推送给订阅的从库。',
			'从库 IO 线程接收事件，写入本地 relay log。',
			'relay log 按序暂存事件——IO 与 SQL 线程在此解耦。',
			'SQL 线程读取 relay log，按序重放变更。',
			'重放完成，从库数据与主库最终一致。'
		];

		const mkGraph = (cur: number): GraphData => {
			const nodeState: Record<number, GraphNodeState> = {};
			for (let i = 0; i < n; i++) {
				nodeState[i] = i === cur ? 'current' : i < cur ? 'done' : 'unvisited';
			}
			return {
				nodes: NODES.map((l, id) => ({ id, label: l })),
				edges: Array.from({ length: n - 1 }, (_, i) => ({ from: i, to: i + 1 })),
				directed: true,
				layout: 'chain',
				nodeState,
				nodeNote: Object.fromEntries(NOTES.map((t, i) => [i, t]))
			};
		};

		this._emit(
			'init',
			'主从复制全链路：主库三件套（binlog/dump）+ 从库三件套（IO/relay/SQL）。',
			mkGraph(0),
			0
		);

		for (let i = 0; i < n; i++) {
			const type: StepType = i === 4 ? 'edge-select' : 'compare';
			this._emit(
				type,
				NODES[i] + '：' + DETAILS[i],
				mkGraph(i),
				Math.min(i + 1, PSEUDO.length - 1)
			);
		}

		this._emit(
			'complete',
			'复制链路完成。读写分离时注意主从延迟；高可用方案（MGR/MHA）都构建在这套复制之上。',
			mkGraph(n - 1),
			5
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
