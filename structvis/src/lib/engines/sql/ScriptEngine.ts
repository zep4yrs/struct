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
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import { loadSqlExecutor, type SqlExecutor } from './sql-executor';

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
	/** 投影模式演示剧本（缺省由 frames 生成） */
}

export class ScriptedResultEngine extends EngineBase<void> {
	readonly renderType = 'sql-table' as const;
	readonly panelTitle = 'SQL 逻辑阶段';
	readonly practiceQuestions: PracticeQuestion[];
	readonly demoScript?: DemoScriptItem[];
	readonly name: string;

	constructor(
		private spec: ScriptSpec,
		private tables: SqlTableData[],
		/** sql.js 是否真实执行（页面据此标注「真实执行/静态演示帧」） */
		readonly liveSql: boolean
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

	/** 伪代码面板 = 本帧 SQL + 逻辑阶段表（当前阶段 ▶ 标记），随播放头刷新 */
	private refreshPseudocode(): void {
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
	const executor: SqlExecutor | null = await loadSqlExecutor();
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
	return new ScriptedResultEngine(spec, tables, true);
}
