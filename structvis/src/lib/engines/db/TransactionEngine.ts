/**
 * 事务与并发控制引擎 — TransactionEngine
 *
 * 教材第 8 章：事务 ACID 特性与并发问题的分步可视化。
 * 核心教学点：
 * 1. 原子性（Atomicity）——要么全做，要么全不做（失败回滚）；
 * 2. 一致性（Consistency）——事务前后数据库完整性不变（转账总额守恒）；
 * 3. 隔离性（Isolation）——并发事务互不干扰（无隔离导致丢失更新）；
 * 4. 持久性（Durability）——提交后修改永久生效。
 * 表格内容在 step.table 中（账户余额表，含「状态」列标注未提交/已提交/回滚）。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import type { SqlTable } from '../sql/SelectEngine';

export interface TransactionInput {
	/** 演示模式名：commit（转账提交）/ rollback（失败回滚）/ lost-update（丢失更新） */
	mode: string;
	/** 账户初始余额表 */
	tables: Record<string, SqlTable>;
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '事务的原子性（Atomicity）含义是？',
		options: [
			'事务中的所有操作要么全部成功，要么全部回滚',
			'事务之间互不干扰',
			'事务提交后永久保存',
			'事务前后数据一致'
		],
		correctAnswer: '事务中的所有操作要么全部成功，要么全部回滚',
		hint: '原子 = 不可再分',
		explanation:
			'原子性要求事务是一个不可分割的整体：中途任何一步失败，之前所有修改都要回滚，数据库像什么都没发生一样。'
	},
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '两个事务先后修改同一数据，后写覆盖先写导致先写丢失，属于？',
		options: ['丢失更新', '脏读', '不可重复读', '幻读'],
		correctAnswer: '丢失更新',
		hint: '两次写，后写覆盖前写',
		explanation:
			'T1 读 A=100 并修改，T2 也读 A=100 并修改，T2 后提交覆盖了 T1 的修改——T1 的更新「丢失」。根因是缺少隔离。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '隔离级别从低到高的正确顺序是？',
		options: [
			'读未提交 → 读已提交 → 可重复读 → 串行化',
			'串行化 → 可重复读 → 读已提交 → 读未提交',
			'读已提交 → 读未提交 → 串行化 → 可重复读',
			'可重复读 → 串行化 → 读未提交 → 读已提交'
		],
		correctAnswer: '读未提交 → 读已提交 → 可重复读 → 串行化',
		hint: '越靠后隔离越强、并发越弱',
		explanation:
			'读未提交（允许脏读）→ 读已提交（防脏读）→ 可重复读（防不可重复读，MySQL 默认）→ 串行化（防幻读，完全互斥）。'
	}
];

/** 演示预设（mode → 分步演示） */
export const TX_PRESETS: { name: string; description: string; mode: string }[] = [
	{ name: '转账提交（原子+一致）', description: 'A 扣 100、B 加 100，提交成功', mode: 'commit' },
	{ name: '转账失败回滚（原子性）', description: '中间语句失败，全部回滚', mode: 'rollback' },
	{ name: '并发丢失更新（隔离性）', description: '无隔离时后写覆盖先写', mode: 'lost-update' }
];

export class TransactionEngine extends EngineBase<TransactionInput> {
	readonly name = '事务与并发控制';
	readonly renderType = 'sql-table' as const;

	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'compare',
			narration: '事务把一组操作打包：要么全部生效（COMMIT），要么全部撤销（ROLLBACK）。'
		},
		{
			type: 'recurse-enter',
			narration: '观察余额变化与状态列：未提交的修改仅对当前事务可见，提交后才对外生效。'
		},
		{
			type: 'complete',
			narration: 'ACID：原子性要么全做要么全不做、一致性守恒、隔离性互不干扰、持久性提交即永存。'
		}
	];

	private _tables: Record<string, SqlTable> = {};

	presets: EnginePreset[] = TX_PRESETS.map((p) => ({
		name: p.name,
		description: p.description
	}));

	customConfig: EngineCustomConfig = {
		title: '自定义事务演示',
		fields: [
			{
				key: 'mode',
				label: '演示模式',
				type: 'text',
				placeholder: 'commit / rollback / lost-update',
				default: 'commit'
			}
		]
	};

	applyPreset(name: string): void {
		const p = TX_PRESETS.find((x) => x.name === name);
		if (p) this.init({ mode: p.mode, tables: this._tables });
	}

	applyCustom(values: Record<string, string>): void {
		const mode = (values.mode ?? '').trim().toLowerCase();
		if (mode.length === 0) throw new Error('演示模式不能为空');
		this.init({ mode, tables: this._tables });
	}

	init(input: TransactionInput): void {
		const { mode, tables } = input;
		this._tables = tables;
		const account = tables['账户'] ?? { columns: [], rows: [] };

		this.steps = [];
		this._stepId = 0;

		switch (mode) {
			case 'commit':
				this._buildCommit(account);
				break;
			case 'rollback':
				this._buildRollback(account);
				break;
			case 'lost-update':
				this._buildLostUpdate(account);
				break;
			default:
				throw new Error('未知演示模式：仅支持 commit / rollback / lost-update');
		}

		this.totalSteps = this.steps.length;
	}

	// === 转账提交：原子性 + 一致性 ===

	private _buildCommit(account: SqlTable): void {
		this.pseudocode = [
			`BEGIN TRANSACTION`,
			`UPDATE A SET 余额 = 余额 - 100`,
			`一致性检查：Σ 余额 不变`,
			`UPDATE B SET 余额 = 余额 + 100`,
			`COMMIT —— 提交生效，永久保存`
		];

		const rows = account.rows.map((r) => [...r]);
		const cols = [...account.columns];

		// 1. 初始
		this._emit(
			'init',
			`初始状态：${this._fmt(rows)}。转账事务：A 扣 100 → B 加 100。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [0, 1] }],
			0
		);

		// 2. BEGIN
		this._emit(
			'compare',
			`BEGIN TRANSACTION：事务开始。之后的修改先写入日志与临时区，对事务外不可见。`,
			{ columns: cols, rows },
			[],
			[],
			0,
			`事务是原子的最小工作单元：从 BEGIN 到 COMMIT/ROLLBACK 之间的所有语句作为一个整体。`
		);

		// 3. UPDATE A
		rows[0][1] = Number(rows[0][1]) - 100;
		this._emit(
			'compare',
			`UPDATE A：余额 ${Number(account.rows[0][1])} → ${Number(rows[0][1])}（未提交，状态=未提交）。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [0] }],
			1,
			`此时数据库里的 A 尚未真正修改——只是写了日志（undo 日志记录原值，用于回滚）。`
		);

		// 4. 一致性检查
		this._emit(
			'compare',
			`一致性检查：Σ 余额 = ${Number(rows[0][1]) + Number(rows[1][1])}，与事务前相同——A 扣的 100 还没到 B 账上，临时「少」100，但不破坏约束。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [0, 1] }],
			2,
			`一致性：事务执行前后的数据库都必须满足完整性约束（本例：总余额守恒）。中途允许中间态，但提交前后必须一致。`
		);

		// 5. UPDATE B
		rows[1][1] = Number(rows[1][1]) + 100;
		this._emit(
			'compare',
			`UPDATE B：余额 ${Number(account.rows[1][1])} → ${Number(rows[1][1])}（未提交）。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [1] }],
			3
		);

		// 6. COMMIT
		this._emit(
			'complete',
			`COMMIT：全部修改写入数据库并持久化——A=900、B=1100，Σ=2000 守恒。事务原子完成 ✓。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [0, 1] }],
			4,
			`持久性：COMMIT 后修改写入磁盘日志，即使断电也不会丢失。ACID 的 A（原子）与 C（一致）在这里体现：要么 A、B 都变，要么都不变。`
		);
	}

	// === 转账失败回滚：原子性 ===

	private _buildRollback(account: SqlTable): void {
		this.pseudocode = [
			`BEGIN TRANSACTION`,
			`UPDATE A SET 余额 = 余额 - 100`,
			`UPDATE B SET 余额 = 余额 + 100`,
			`!! 语句执行出错（如余额不足/断网）`,
			`ROLLBACK —— 撤销全部修改，回到事务前`
		];

		const cols = [...account.columns];
		const rows = account.rows.map((r) => [...r]);

		this._emit(
			'init',
			`初始状态：${this._fmt(rows)}。演示：事务中途失败，如何保证原子性。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [0, 1] }],
			0
		);

		this._emit(
			'compare',
			`BEGIN TRANSACTION：A 扣 100、B 加 100，两步组成一个事务。`,
			{ columns: cols, rows },
			[],
			[],
			0
		);

		rows[0][1] = Number(rows[0][1]) - 100;
		this._emit(
			'compare',
			`UPDATE A：余额 ${Number(account.rows[0][1])} → ${Number(rows[0][1])}（未提交）。写 undo 日志：A 原值 ${Number(account.rows[0][1])}。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [0] }],
			1
		);

		this._emit(
			'compare',
			`UPDATE B 执行前发生错误（示例：转账语句语法错误 / 网络中断）。此时 A 已被扣 100，数据库处于「一半完成」状态。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [0] }],
			3,
			`如果到此为止，A 少了 100 而 B 没加——破坏了原子性与一致性。事务机制必须处理这种情况。`
		);

		rows[0][1] = Number(account.rows[0][1]);
		this._emit(
			'swap',
			`ROLLBACK：根据 undo 日志把 A 恢复为原值 ${Number(rows[0][1])}，撤销全部修改。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [0, 1] }],
			4
		);

		this._emit(
			'complete',
			`回滚完成：A、B 都与事务前完全一致，就像事务从未发生。原子性 = 要么全做，要么全不做 ✓。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [0, 1] }],
			4,
			`这就是原子性的实现：数据库为每个事务维护 undo/redo 日志，失败时按 undo 日志逆序回滚，保证数据库永远处于「全做」或「全不做」的状态。`
		);
	}

	// === 并发丢失更新：隔离性 ===

	private _buildLostUpdate(account: SqlTable): void {
		this.pseudocode = [
			`T1: BEGIN; 读 A = 1000`,
			`T2: BEGIN; 读 A = 1000`,
			`T1: 写 A = 900; COMMIT`,
			`T2: 写 A = 800; COMMIT`,
			`!! T1 的更新被 T2 覆盖 —— 丢失更新`
		];

		const cols = [...account.columns];
		const rows = account.rows.map((r) => [...r]);
		const A = 0;

		this._emit(
			'init',
			`并发场景：T1（转账）与 T2（扣费）同时操作账户 A，初始余额 ${Number(rows[A][1])}。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [A] }],
			0
		);

		this._emit(
			'compare',
			`T1 开始：读 A = ${Number(rows[A][1])}（T1 的本地副本）。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [A] }],
			0,
			`并发控制研究多个事务同时执行时的正确性。没有隔离时，一个事务的修改会被另一个覆盖。`
		);

		this._emit(
			'compare',
			`T2 开始：读 A = ${Number(rows[A][1])}（T2 也读到 1000——此时 T1 还未写）。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [A] }],
			1
		);

		rows[A][1] = 900;
		this._emit(
			'compare',
			`T1 写 A = 900 并提交。此刻数据库里 A = 900。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [A] }],
			2
		);

		rows[A][1] = 800;
		this._emit(
			'compare',
			`T2 写 A = 800 并提交——T2 基于旧值 1000 计算，覆盖了 T1 的 900。`,
			{ columns: cols, rows },
			[],
			[{ type: 'current', indices: [A] }],
			3
		);

		this._emit(
			'complete',
			`结果：A = 800，T1 的更新「丢失」✗。解决：加锁或隔离级别——T1 提交前锁住 A，T2 只能等 T1 结束再写。`,
			{ columns: cols, rows },
			[],
			[{ type: 'compare', indices: [A] }],
			4,
			`隔离级别：读未提交（脏读）/ 读已提交 / 可重复读（MySQL 默认，防丢失更新与不可重复读）/ 串行化（防幻读）。隔离越强并发越弱，需权衡。`
		);
	}

	// === 工具 ===

	private _fmt(rows: (string | number)[][]): string {
		return rows.map((r) => `${r[0]}=${r[1]}`).join('、');
	}

	// === 步骤生成 ===

	private _emit(
		type: StepType,
		description: string,
		table: SqlTableData,
		data: number[],
		highlights: Highlight[],
		pseudocodeLine: number,
		presenterNote?: string
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...data],
			highlights,
			pseudocodeLine,
			presenterNote,
			table: {
				columns: [...table.columns],
				rows: table.rows.map((r) => [...r])
			}
		});
	}
}
