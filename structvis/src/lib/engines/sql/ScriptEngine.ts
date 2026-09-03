/**
 * 剧本引擎 — M2「结果演化」通用播放器（sqljs-viz-architecture.md §3 统一配方）。
 *
 * 每个主题一份剧本（ScriptSpec：seed + 帧）；帧 = 一条 SQL + 文案 + 标注。
 * sql.js 可用时每帧都是真实执行（终态与中间态全部真实，无需对拍）；
 * 不可用时回落到帧内 `expected` 静态结果（数据经单测校验，页面完整可用）。
 *
 * 引擎实现 AlgorithmEngine 契约：init 同步、steps 预构建，
 * 因此真实执行发生在异步工厂 createScriptedEngine 内。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import { createPageExecutor, type SqlExecutor } from './sql-executor';

export interface ScriptFrame {
	/** 本帧执行的 SQL（真实执行；静态回落时仅展示） */
	sql: string;
	/** 状态栏一句话说明 */
	description: string;
	/** 详细解释（投影旁白优先用 presenterNote） */
	detail?: string;
	/** 对应逻辑阶段（stages 下标，伪代码面板高亮） */
	stage: number;
	/** 静态回落帧（sql.js 未启用时展示；单测校验基准） */
	expected?: SqlTableData;
	/** 行标签（如 '仅A'/'共有'/'NULL'），渲染器在行尾绘制徽标 */
	rowTags?: Record<number, string>;
	/** 步骤类型（影响节奏；缺省 default） */
	type?: StepType;
	presenterNote?: string;
}

export interface ScriptSpec {
	name: string;
	/** SQLite 方言建库脚本（CREATE + INSERT），sql.js 内存库加载 */
	seedSql: string;
	/** SQL 逻辑阶段叙事（伪代码面板展示） */
	stages: string[];
	frames: ScriptFrame[];
	practiceQuestions?: PracticeQuestion[];
	demoScript?: DemoScriptItem[];
	/**
	 * 自定义 SQL（架构定调 §3：用户输入 → 直接执行 → 单帧真实结果）。
	 * 仅在 sql.js 可用时由工厂挂到引擎——静态回落模式没有执行能力，不展示入口。
	 */
	customConfig?: EngineCustomConfig;
	/** 目标语法超出 SQLite 支持范围（如存储过程）：帧 SQL 仅展示，始终使用静态演示帧 */
	staticOnly?: boolean;
}

export class ScriptedResultEngine extends EngineBase<void> {
	readonly renderType = 'sql-table' as const;
	readonly panelTitle = 'SQL 逻辑阶段';
	readonly practiceQuestions: PracticeQuestion[];
	readonly demoScript?: DemoScriptItem[];
	readonly name: string;
	/** sql.js 可用时才存在（AlgoPlayer 据此显示「自定义」按钮） */
	customConfig?: EngineCustomConfig;

	/** 自定义 SQL 的执行结果（applyCustom 后 init 走单帧模式） */
	private customTable: SqlTableData | null = null;
	private customSql = '';

	constructor(
		private spec: ScriptSpec,
		private tables: SqlTableData[],
		/** sql.js 是否真实执行（页面据此标注「真实执行/静态演示帧」） */
		readonly liveSql: boolean,
		/** 真实执行器（applyCustom 用；静态模式下为 null） */
		private executor: SqlExecutor | null = null
	) {
		super();
		this.name = spec.name;
		this.pseudocode = [];
		this.practiceQuestions = spec.practiceQuestions ?? [];
		this.demoScript = spec.demoScript;
		this.init();
	}

	init(): void {
		this._stepId = 0;
		// 自定义 SQL 单帧模式（架构定调 §3）：真实执行结果直接成为唯一一帧
		if (this.customTable) {
			this.steps = [
				{
					id: this._stepId++,
					type: 'complete',
					description: `自定义 SQL 执行结果（${this.customTable.rows.length} 行）`,
					detail: 'SQL: ' + (this.customSql ?? ''),
					data: [],
					highlights: [],
					pseudocodeLine: 0,
					presenterNote: '自定义 SQL 每次实时执行，结果即真实数据。',
					table: this.customTable
				}
			];
			this.totalSteps = this.steps.length;
			this.playbackPos = 0;
			this.refreshPseudocode();
			return;
		}
		this.steps = this.spec.frames.map((f, i) => {
			const table = { ...this.tables[i] };
			if (f.rowTags) table.rowTags = f.rowTags;
			const step: AlgorithmStep = {
				id: this._stepId++,
				type: f.type ?? 'default',
				description: f.description + (this.liveSql ? '' : '（静态演示帧）'),
				detail: f.detail ? `${f.detail}\nSQL: ${f.sql}` : `SQL: ${f.sql}`,
				data: [],
				highlights: [],
				pseudocodeLine: 0,
				presenterNote: f.presenterNote ?? f.detail ?? f.description,
				table
			};
			return step;
		});
		this.totalSteps = this.steps.length;
		this.playbackPos = 0;
		this.refreshPseudocode();
	}

	/**
	 * 自定义输入（仅 sql.js 活跃时可用）：执行用户 SQL → 单帧模式。
	 * 校验失败抛 Error（AlgoPlayer 弹窗内展示，不关弹窗）。
	 */
	applyCustom(values: Record<string, string>): void {
		if (!this.executor || !this.spec.customConfig) {
			throw new Error('自定义 SQL 需要 sql.js 真实执行环境（未启用静态演示入口）');
		}
		const sql = (values.sql ?? '').trim();
		if (!sql) throw new Error('请输入 SQL 语句');
		const r = this.executor.query(sql);
		if (r.error) throw new Error(r.error);
		this.customTable = { columns: r.columns, rows: r.rows };
		this.customSql = sql;
		this.init();
	}

	/** 伪代码面板 = 本帧 SQL + 逻辑阶段表（当前阶段 ▶ 标记），随播放头刷新 */
	private refreshPseudocode(): void {
		if (this.customTable) {
			this.pseudocode = [
				'-- 自定义 SQL（已真实执行）',
				...this.customSql.split('\n').map((l) => l.trimEnd())
			];
			return;
		}
		const idx = Math.min(this.spec.frames.length - 1, Math.floor(this.playbackPos));
		const f = this.spec.frames[idx];
		if (!f) {
			this.pseudocode = this.spec.stages.map((s) => '  ' + s);
			return;
		}
		this.pseudocode = [
			'-- 本帧 SQL' + (this.liveSql ? '（已真实执行）' : '（静态演示）'),
			...f.sql.split('\n').map((l) => l.trimEnd()),
			'',
			...this.spec.stages.map((s, i) => (i === f.stage ? '▶ ' + s : '  ' + s))
		];
	}

	setProgress(pos: number): void {
		super.setProgress(pos);
		this.refreshPseudocode();
	}

	reset(): void {
		super.reset();
		this.refreshPseudocode();
	}
}

/**
 * 异步工厂：加载 sql.js → 装载 seed → 逐帧执行 → 引擎就绪。
 * sql.js 不可用时回落静态帧（liveSql=false）。
 */
export async function createScriptedEngine(spec: ScriptSpec): Promise<ScriptedResultEngine> {
	const executor: SqlExecutor | null = spec.staticOnly ? null : await createPageExecutor();
	if (!executor) {
		const tables = spec.frames.map(
			(f) => ({ columns: f.expected?.columns ?? [], rows: f.expected?.rows ?? [] }) as SqlTableData
		);
		return new ScriptedResultEngine(spec, tables, false);
	}
	executor.script(spec.seedSql);
	const tables = spec.frames.map((f) => {
		const r = executor.query(f.sql);
		if (r.error) {
			// 真实执行失败（方言差异等）→ 回落该帧静态数据，不中断教学
			console.warn('[script-engine] 帧执行失败，回落静态帧:', r.error);
			return { columns: f.expected?.columns ?? [], rows: f.expected?.rows ?? [] } as SqlTableData;
		}
		return { columns: r.columns, rows: r.rows } as SqlTableData;
	});
	const engine = new ScriptedResultEngine(spec, tables, true, executor);
	// 自定义 SQL 需要 sqlite 执行器，仅在真实环境开放入口
	engine.customConfig = spec.customConfig;
	return engine;
}
