/**
 * 视图创建与使用引擎 — ViewEngine
 *
 * 教材第 9 章：CREATE VIEW 的分步可视化。
 * 核心教学点：
 * 1. 视图是「保存的查询」——不存数据，只存 SELECT 定义（虚拟表）；
 * 2. 查询视图 = 执行其保存的 SELECT；
 * 3. 基表数据变化 → 视图结果自动反映（动态性）；
 * 4. 优点：简化查询、隐藏敏感列、逻辑独立性。
 * 底层 SELECT 的分步执行复用 SelectEngine，本引擎只负责包壳：解析视图定义、
 * 展示基表、嵌入底层步骤、演示「查询视图」与「基表更新后视图自动变化」。
 * 表格内容在 step.table 中；data 快照为当前可见行的行号集合。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	SqlTableData,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import { SelectEngine, type SqlTable } from './SelectEngine';

export interface ViewEngineInput {
	/** CREATE VIEW 语句 */
	sql: string;
	/** 表名 → 表数据（视图定义涉及的基表） */
	tables: Record<string, SqlTable>;
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '视图（VIEW）在数据库中保存的是什么？',
		options: ['一条 SELECT 查询定义', '一份数据的副本', '一张物理表', '一个索引结构'],
		correctAnswer: '一条 SELECT 查询定义',
		hint: '视图本身不占存储空间',
		explanation:
			'视图是虚拟表：数据库只保存 CREATE VIEW 中的 SELECT 定义，不复制任何数据。查询视图时实时执行这条查询。'
	},
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: '查询视图时，数据库实际执行的是什么？',
		options: ['视图保存的 SELECT 语句', '直接读取视图的存储数据', '重建基表', '刷新索引'],
		correctAnswer: '视图保存的 SELECT 语句',
		hint: '视图没有自己的数据',
		explanation:
			'视图不缓存数据。每次查询视图，数据库都现场执行视图保存的 SELECT，所以结果与基表当前数据完全一致。'
	},
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '视图的主要优点不包括？',
		options: ['加快查询速度', '简化复杂查询', '隐藏敏感列', '提供逻辑独立性'],
		correctAnswer: '加快查询速度',
		hint: '视图是逻辑概念，不涉及物理存储优化',
		explanation:
			'视图的优点是把复杂查询封装复用、通过投影隐藏敏感列、基表结构变化时应用层不受影响；但它不加速查询——每次访问仍要执行底层 SELECT。'
	}
];

/** 演示数据预设（含 sql，供头部「演示数据」弹窗使用） */
export const VIEW_PRESETS: { name: string; description: string; sql: string }[] = [
	{
		name: '筛选视图',
		description: 'WHERE 条件封装为视图',
		sql: 'CREATE VIEW v_优秀成绩 AS SELECT 学号, 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85'
	},
	{
		name: '隐藏列视图',
		description: '只暴露部分列，隐藏敏感字段',
		sql: 'CREATE VIEW v_学生公开 AS SELECT 学号, 姓名, 专业 FROM 学生'
	},
	{
		name: '聚合视图',
		description: 'GROUP BY + COUNT 封装为视图',
		sql: 'CREATE VIEW v_专业人数 AS SELECT 专业, COUNT(*) FROM 学生 GROUP BY 专业'
	},
	{
		name: '连接视图',
		description: '两表 JOIN 封装为视图',
		sql: 'CREATE VIEW v_选课成绩 AS SELECT 学生.姓名, 选课.成绩 FROM 学生 JOIN 选课 ON 学生.学号 = 选课.学号'
	}
];

interface ParsedView {
	viewName: string;
	selectSql: string;
}

export class ViewEngine extends EngineBase<ViewEngineInput> {
	readonly name = '视图创建与使用';
	readonly renderType = 'sql-table' as const;

	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'compare',
			narration: '视图定义只保存查询语句，不保存数据。查询视图时，数据库实时执行这条 SELECT。'
		},
		{
			type: 'recurse-enter',
			narration: '底层 SELECT 按 FROM → WHERE → SELECT 投影的顺序执行，逐步得到视图的结果集。'
		},
		{
			type: 'complete',
			narration:
				'视图完成：基表数据变化会自动反映到视图结果中。视图用于简化查询、隐藏敏感列、提供逻辑独立性。'
		}
	];

	private _tables: Record<string, SqlTable> = {};

	presets: EnginePreset[] = VIEW_PRESETS.map((p) => ({
		name: p.name,
		description: p.description
	}));

	customConfig: EngineCustomConfig = {
		title: '自定义视图',
		fields: [
			{
				key: 'sql',
				label: 'SQL 语句',
				type: 'textarea',
				placeholder:
					'例如：CREATE VIEW v_优秀 AS SELECT 学号, 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85',
				default: 'CREATE VIEW v_优秀 AS SELECT 学号, 姓名, 成绩 FROM 学生 WHERE 成绩 >= 85'
			}
		]
	};

	applyPreset(name: string): void {
		const p = VIEW_PRESETS.find((x) => x.name === name);
		if (p) this.init({ sql: p.sql, tables: this._tables });
	}

	applyCustom(values: Record<string, string>): void {
		const sql = (values.sql ?? '').trim();
		if (sql.length === 0) throw new Error('SQL 不能为空');
		this.init({ sql, tables: this._tables });
	}

	// === 视图定义解析 ===

	private _parse(sql: string): ParsedView {
		const clean = sql.replace(/\s+/g, ' ').trim();
		const m = clean.match(/^CREATE\s+VIEW\s+([\u4e00-\u9fa5\w]+)\s+AS\s+(SELECT[\s\S]+)$/i);
		if (!m) throw new Error('仅支持 CREATE VIEW 视图名 AS SELECT ... 语句');
		const viewName = m[1];
		const selectSql = m[2].trim();
		if (selectSql.length === 0) throw new Error('视图定义缺少 SELECT 查询');
		return { viewName, selectSql };
	}

	init(input: ViewEngineInput): void {
		const { sql, tables } = input;
		this._tables = tables;
		const view = this._parse(sql);

		// 底层 SELECT 分步执行（视图定义体）
		const sub = new SelectEngine();
		sub.init({ sql: view.selectSql, tables });
		const baseSteps = sub.steps;

		// 伪代码/执行计划：CREATE VIEW 声明 + 底层算子链 + 视图访问说明
		this.pseudocode = [
			`CREATE VIEW ${view.viewName} AS SELECT ...`,
			...sub.pseudocode.map((line) => `  ${line}`),
			`SELECT * FROM ${view.viewName} → 执行保存的查询`
		];

		this.steps = [];
		this._stepId = 0;

		// 视图定义中用到的基表名（展示基表快照用）
		const baseTableName = Object.keys(tables)[0];

		// === 1. CREATE VIEW 声明 ===
		this._emit(
			'init',
			`CREATE VIEW ${view.viewName} AS ${view.selectSql}。视图不复制数据，只把这条 SELECT 定义保存到数据字典。`,
			tables[baseTableName] ?? { columns: [], rows: [] },
			[],
			[{ type: 'compare', indices: tables[baseTableName]?.rows.map((_, i) => i) ?? [] }],
			0,
			`CREATE VIEW 把一段 SELECT 查询保存为一个逻辑表（视图）。视图名 ${view.viewName} 像真实表一样可以被查询，但本身不存放任何数据。`
		);

		// === 2. 基表展示 ===
		this._emit(
			'compare',
			`基表：数据真实存放在 ${Object.keys(tables).join('、')} 中。视图只是 ${view.viewName} 的一扇“窗口”，不占存储。`,
			tables[baseTableName] ?? { columns: [], rows: [] },
			[],
			[{ type: 'compare', indices: tables[baseTableName]?.rows.map((_, i) => i) ?? [] }],
			1,
			`视图与基表的区别：基表存数据，视图存查询。查询视图时，相当于把这段 SELECT 现场执行一遍。`
		);

		// === 3. 底层 SELECT 分步执行（复用 SelectEngine 关键帧）===
		for (const s of baseSteps) {
			this._emit(
				s.type,
				`视图查询执行：${s.description}`,
				s.table ?? { columns: [], rows: [] },
				s.data,
				s.highlights,
				s.pseudocodeLine + 1
			);
		}

		// === 4. 视图创建完成 ===
		const viewResult = baseSteps[baseSteps.length - 1]?.table ?? { columns: [], rows: [] };
		this._emit(
			'recurse-exit',
			`视图 ${view.viewName} 创建完成：数据字典记录“${view.viewName} → ${view.selectSql}”。视图逻辑结果 ${viewResult.rows.length} 行。`,
			viewResult,
			[],
			[{ type: 'compare', indices: viewResult.rows.map((_, i) => i) }],
			this.pseudocode.length - 1,
			`视图创建完成。此后可以把 ${view.viewName} 当作表使用：SELECT * FROM ${view.viewName}。`
		);

		// === 5. 查询视图 ===
		this._emit(
			'recurse-enter',
			`查询视图：SELECT * FROM ${view.viewName} —— 数据库现场执行保存的查询，返回 ${viewResult.rows.length} 行。`,
			viewResult,
			[],
			[{ type: 'compare', indices: viewResult.rows.map((_, i) => i) }],
			this.pseudocode.length - 1,
			`每次查询视图都会重新执行底层 SELECT，因此视图结果永远与基表当前数据一致。`
		);

		// === 6. 基表更新 → 视图自动反映（动态性演示）===
		const updated = this._updateBaseAndRefresh(view, tables);
		this._emit(
			'swap',
			`基表更新：往 ${baseTableName} 插入新记录 ${this._fmtRow(updated.added)}。视图不改变，但再查询时自动包含新行（结果 ${updated.view.rows.length} 行）。`,
			updated.view,
			[],
			[{ type: 'current', indices: updated.newIndices }],
			this.pseudocode.length - 1,
			`视图的动态性：基表发生 INSERT / UPDATE / DELETE 后，视图结果随之下一次查询自动更新——因为视图每次都重新执行保存的 SELECT。`
		);

		// === 7. complete ===
		this._emit(
			'complete',
			`演示结束：视图 = 保存的查询，不存数据、随基表动态更新。适合：简化复杂查询、隐藏敏感列、应用层逻辑独立。`,
			updated.view,
			[],
			[{ type: 'compare', indices: updated.view.rows.map((_, i) => i) }],
			this.pseudocode.length - 1,
			`视图三大优点：① 简化查询——复杂 JOIN/聚合封装一次、到处复用；② 安全性——只暴露需要的列；③ 逻辑独立性——基表结构调整时应用无感。`
		);

		this.totalSteps = this.steps.length;
	}

	// === 基表插入一行并重算视图结果 ===

	private _updateBaseAndRefresh(
		view: ParsedView,
		tables: Record<string, SqlTable>
	): { view: SqlTableData; added: (string | number)[]; newIndices: number[] } {
		const baseName = Object.keys(tables)[0];
		const base = tables[baseName];
		const baseCols = base.columns;
		const maxId = Math.max(...base.rows.map((r) => Number(r[0]) || 0));
		const added: (string | number)[] = [maxId + 1, '新同学', '软件工程', 88].slice(
			0,
			baseCols.length
		);
		const newBase: SqlTable = {
			columns: [...base.columns],
			rows: [...base.rows.map((r) => [...r]), [...added]]
		};
		const refreshed = new SelectEngine();
		refreshed.init({ sql: view.selectSql, tables: { ...tables, [baseName]: newBase } });
		const result = refreshed.steps[refreshed.steps.length - 1]?.table ?? {
			columns: [],
			rows: []
		};
		const newIndices = result.rows
			.map((r, i) => ({ r, i }))
			.filter(({ r }) => r.includes(maxId + 1))
			.map(({ i }) => i);
		return { view: result, added, newIndices };
	}

	private _fmtRow(row: (string | number)[]): string {
		return `(${row.join(', ')})`;
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
