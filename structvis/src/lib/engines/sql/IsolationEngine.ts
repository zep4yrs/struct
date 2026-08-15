/**
 * 事务隔离级别动画引擎 — IsolationEngine
 *
 * 教材数据库篇：演示四种隔离级别下并发事务产生的异常（脏读/不可重复读/幻读）。
 * 两个并发事务 T1（写）和 T2（读）在同一张表上交错执行，
 * 每步显示数据表当前状态 + 描述当前隔离级别下会发生什么。
 * 渲染用 sql-table：table 为账户表快照。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType,
	SqlTableData
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';

const PSEUDO: string[] = [
	'-- 并发事务示例（账户表）',
	'T1: UPDATE account SET balance = 500 WHERE id = 1',
	'T2: SELECT balance FROM account WHERE id = 1',
	'',
	'-- 隔离级别决定 T2 看到什么：',
	'-- 读未提交：可能读到 T1 未提交的值（脏读）',
	'-- 读已提交：T1 提交后才可见（不可重复读）',
	'-- 可重复读：事务内快照一致（MySQL 默认）',
	'-- 串行化：事务排队，无并发异常'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '脏读发生在哪个隔离级别？',
		options: ['读未提交', '读已提交', '可重复读', '串行化'],
		correctAnswer: '读未提交',
		hint: '最低隔离级别',
		explanation:
			'读未提交允许读到其他事务未提交的数据——如果 T1 回滚，T2 读到的就是脏数据。读已提交开始禁止脏读。'
	}
];

interface TxOp {
	label: string;
	desc: string;
	balance: number; // 操作后的余额
	uncommitted: boolean; // 该值是否未提交（脏数据）
}

export class IsolationEngine extends EngineBase<SqlTableData> {
	readonly name = '事务隔离级别';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'并发事务演示：T1 修改账户余额，T2 同时读取。隔离级别决定了 T2 能看到什么，也决定了会发生哪种并发异常。'
		},
		{
			type: 'compare',
			narration: 'T1 修改数据但尚未提交——此时另一个事务能否看到这个未提交的值？'
		},
		{
			type: 'edge-candidate',
			narration: 'T2 读取数据：不同隔离级别下看到的版本不同。'
		},
		{
			type: 'edge-select',
			narration: 'T1 提交：修改生效，数据对所有事务可见。'
		},
		{
			type: 'edge-reject',
			narration: 'T1 回滚：修改撤销，之前读到该值的事务就遇到了脏读。'
		},
		{
			type: 'complete',
			narration:
				'演示结束。读未提交会产生脏读；读已提交每次读最新已提交值（不可重复读）；可重复读（MySQL 默认）事务内快照一致；串行化彻底隔离但并发度最低。'
		}
	];

	presets: EnginePreset[] = [{ name: '脏读演示', description: '读未提交级别下的交错读写' }];

	customConfig: EngineCustomConfig = { title: '并发演示', fields: [] };

	applyPreset(_name: string): void {
		this.init();
	}

	applyCustom(): void {
		this.init();
	}

	init(): void {
		this.steps = [];
		this._stepId = 0;

		const cols = ['id', '户主', '余额', '状态'];
		// 操作序列：T1 改未提交 → T2 读到（脏）→ T1 回滚 → 重来一遍 T1 提交版本
		const ops: TxOp[] = [
			{
				label: 'T1 开始',
				desc: 'T1 开启事务，准备修改账户 1。',
				balance: 1000,
				uncommitted: false
			},
			{
				label: 'T1 UPDATE',
				desc: 'T1：UPDATE balance = 500（未提交）。读未提交级别下，T2 现在能看到 500。',
				balance: 500,
				uncommitted: true
			},
			{
				label: 'T2 SELECT',
				desc: 'T2：读到 500——这是未提交数据（脏读！）。若 T1 随后回滚，500 就是脏数据。',
				balance: 500,
				uncommitted: true
			},
			{
				label: 'T1 ROLLBACK',
				desc: 'T1 回滚：余额恢复 1000。T2 之前读到的 500 变成了不存在的值——脏读。',
				balance: 1000,
				uncommitted: false
			},
			{
				label: 'T1 重试',
				desc: 'T1 再次开启事务并 UPDATE = 500。',
				balance: 500,
				uncommitted: true
			},
			{
				label: 'T2 再读（读已提交）',
				desc: '读已提交级别：T2 看不到未提交的 500，仍读 1000。',
				balance: 1000,
				uncommitted: false
			},
			{
				label: 'T1 COMMIT',
				desc: 'T1 提交：500 生效。读已提交下 T2 下次读到 500——同一事务内两次读不同（不可重复读）。',
				balance: 500,
				uncommitted: false
			}
		];

		this._emit('init', '事务隔离演示：T1 写、T2 读，逐步观察各隔离级别下的可见性。', cols, [], '');

		for (const op of ops) {
			const rows: (string | number)[][] = [
				[1, '张明', op.balance, op.uncommitted ? 'T1 未提交（脏数据）' : '已提交']
			];
			const type: StepType = op.uncommitted
				? 'edge-candidate'
				: op.label.includes('ROLLBACK')
					? 'edge-reject'
					: op.label.includes('COMMIT')
						? 'edge-select'
						: 'compare';
			this._emit(type, op.label + '：' + op.desc, cols, rows, op.uncommitted ? 'dirty' : 'clean');
		}

		this._emit(
			'complete',
			'演示结束：脏读只发生在读未提交；读已提交消除脏读但允许不可重复读。',
			cols,
			[[1, '张明', 500, '已提交']],
			''
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		columns: string[],
		rows: (string | number)[][],
		mark: string
	): void {
		const highlights: Highlight[] = [];
		if (mark === 'dirty' && rows.length > 0) highlights.push({ type: 'current', indices: [0] });
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine: 0,
			table: { columns, rows: rows.map((r) => [...r]) }
		});
	}
}
