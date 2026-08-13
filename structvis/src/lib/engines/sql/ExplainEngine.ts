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

/**
 * 执行计划与索引选择引擎 — 教学级"优化器如何选计划"演示。
 * 对一条简单 WHERE 查询比较两种候选执行计划（全表扫描 vs 索引查找），
 * 用估算代价决定最优计划。renderType: sql-table（计划对比表）。
 */
export interface ExplainInput {
	sql: string;
	table: SqlTableData;
	/** 已建索引的列名（学号等） */
	indexedCols: string[];
}

interface Plan {
	name: string;
	rows: number;
	cost: number;
	detail: string;
}

export class ExplainEngine extends EngineBase<ExplainInput> {
	readonly name = '执行计划与索引选择';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = [
		'优化器生成候选执行计划',
		'  计划 A：全表扫描（顺序读取每一行）',
		'  计划 B：索引查找（B+ 树定位 + 回表）',
		'估算每个计划的代价',
		'选择代价最小的计划执行'
	];

	readonly practiceQuestions: PracticeQuestion[] = [
		{
			type: 'choose-next',
			stepIndex: 1,
			prompt: '全表扫描的代价主要取决于？',
			options: ['表中的总行数', '查询条件个数', '索引数量', '列的数量'],
			correctAnswer: '表中的总行数',
			hint: '扫描要读取每一行',
			explanation: '全表扫描需要顺序读取全部数据页，代价与表的总行数成正比；数据越多扫描越慢。'
		},
		{
			type: 'choose-next',
			stepIndex: 3,
			prompt: '等值查询（WHERE 学号 = 20103）走索引的优势是？',
			options: ['只需沿 B+ 树定位少量行，避免全表扫描', '索引可以修改数据', '索引不需要存储空间', '等值查询不能走索引'],
			correctAnswer: '只需沿 B+ 树定位少量行，避免全表扫描',
			hint: 'B+ 树查找是 O(log n)',
			explanation: 'B+ 树索引把查找从"扫描全部行"变成"沿树定位"，命中行数极少时代价远低于全表扫描；但选择性差（如性别列）时索引反而低效。'
		}
	];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '优化器根据统计信息为查询生成候选执行计划，并选择代价最小的一个。' },
		{ type: 'compare', narration: '估算候选计划：读取的行数与代价。' },
		{ type: 'recurse-enter', narration: '对比各计划代价，选择最优执行方案。' },
		{ type: 'complete', narration: '执行选中的计划并返回结果。索引不是越多越好——写多读少的表要考虑维护成本。' }
	];

	presets: EnginePreset[] = [
		{ name: '等值查询（索引胜）', description: 'WHERE 学号 = 20103：索引查找 1 行' },
		{ name: '范围查询（索引胜）', description: 'WHERE 成绩 >= 85：索引定位后扫描 3 行' },
		{ name: '无索引列查询', description: 'WHERE 专业 = 计算机：全表扫描 5 行' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义查询',
		fields: [
			{
				key: 'sql',
				label: 'SQL 语句',
				type: 'textarea',
				placeholder: 'SELECT * FROM 学生 WHERE 学号 = 20103',
				default: 'SELECT * FROM 学生 WHERE 学号 = 20103'
			}
		]
	};

	private _table: SqlTableData = { columns: [], rows: [] };
	private _indexedCols: string[] = [];

	init(input: ExplainInput): void {
		this._table = input.table;
		this._indexedCols = input.indexedCols;
		this.steps = [];
		this._stepId = 0;
		this.totalSteps = 0;
		this.playbackPos = 0;

		const cols = this._table.columns;
		const rows = this._table.rows;
		const m = this._parseWhere(input.sql);
		if (!m) throw new Error('仅支持 WHERE 单条件查询，如：SELECT * FROM 学生 WHERE 学号 = 20103');
		const col = m.col;
		const ci = cols.indexOf(col);
		if (ci < 0) throw new Error('条件列 ' + col + ' 不存在');

		// 命中行数（教学简化：数值比较；字符串按全等）
		const op = m.op;
		const val = m.val;
		const matches = rows.filter((r) => this._evalCond(r[ci], op, val));
		const hitRows = matches.length;

		this._emit('init', '查询：SELECT * FROM 学生 WHERE ' + col + ' ' + op + ' ' + val, { columns: [...cols], rows: rows.map((r) => [...r]) }, [], []);

		const indexed = this._indexedCols.includes(col);
		const n = rows.length;

		// 计划 A：全表扫描
		const scanRows = op === '=' ? n : Math.ceil(n * 0.8);
		this._emit(
			'compare',
			'候选计划 A：全表扫描 —— 顺序读取全部 ' + n + ' 行，逐行判断条件。',
			{ columns: ['计划', '读取行数', '估算代价', '说明'], rows: [['全表扫描', scanRows, scanRows, '代价 = 读取行数']] },
			[],
			[]
		);

		// 计划 B：索引查找（仅条件列有索引时）
		if (indexed) {
			const indexRows = op === '=' ? 1 : Math.max(1, Math.min(hitRows + 1, n));
			const indexCost = op === '=' ? 3 : 3 + indexRows; // 树深定位 + 扫描命中
			this._emit(
				'recurse-enter',
				'候选计划 B：索引查找 —— B+ 树定位（代价 3）+ 读取命中行 ' + indexRows + ' 行。',
				{ columns: ['计划', '读取行数', '估算代价', '说明'], rows: [['索引查找(' + col + ')', indexRows, indexCost, 'B+ 树定位 + 命中行']] },
				[],
				[]
			);
			// 对比 + 选择
			const better = indexCost < scanRows;
			this._emit(
				'compare',
				'对比代价：全表扫描 ' + scanRows + ' vs 索引查找 ' + indexCost + ' —— ' + (better ? '索引查找胜出' : '全表扫描胜出（行数少时索引优势小）'),
				{ columns: ['计划', '读取行数', '估算代价', '结论'], rows: [['全表扫描', scanRows, scanRows, better ? '放弃' : '✓ 选中'], ['索引查找(' + col + ')', indexRows, indexCost, better ? '✓ 选中' : '放弃']] },
				[],
				[]
			);
			this._emit(
				'complete',
				'优化器选择：' + (better ? '索引查找' : '全表扫描') + '。实际命中 ' + hitRows + ' 行，结果如下。',
				{ columns: [...cols], rows: matches.map((r) => [...r]) },
				[],
				[{ type: 'compare', indices: matches.map((_, i) => i) }]
			);
		} else {
			this._emit(
				'compare',
				'列「' + col + '」没有索引 —— 只有全表扫描一种候选计划。',
				{ columns: ['计划', '读取行数', '估算代价', '结论'], rows: [['全表扫描', scanRows, scanRows, '✓ 选中']] },
				[],
				[]
			);
			this._emit(
				'complete',
				'执行全表扫描，实际命中 ' + hitRows + ' 行。',
				{ columns: [...cols], rows: matches.map((r) => [...r]) },
				[],
				[{ type: 'compare', indices: matches.map((_, i) => i) }]
			);
		}
		this.totalSteps = this.steps.length;
	}

	private _parseWhere(sql: string): { col: string; op: string; val: string } | null {
		const m = sql.match(/WHERE\s+([\u4e00-\u9fa5\w]+)\s*(>=|<=|<>|!=|=|>|<)\s*['"]?([\u4e00-\u9fa5\w.]+)['"]?/i);
		if (!m) return null;
		return { col: m[1], op: m[2], val: m[3] };
	}

	private _evalCond(cell: string | number, op: string, val: string): boolean {
		const a = typeof cell === 'number' ? cell : parseFloat(String(cell));
		const b = parseFloat(val);
		if (!isNaN(a) && !isNaN(b)) {
			switch (op) {
				case '=': return a === b;
				case '>=': return a >= b;
				case '<=': return a <= b;
				case '>': return a > b;
				case '<': return a < b;
				case '<>': case '!=': return a !== b;
			}
		}
		const sa = String(cell);
		switch (op) {
			case '=': return sa === val;
			case '<>': case '!=': return sa !== val;
			default: return false;
		}
	}

	private _emit(
		type: StepType,
		description: string,
		table: SqlTableData,
		data: number[],
		highlights: Highlight[],
		presenterNote?: string
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data,
			highlights,
			pseudocodeLine: 0,
			presenterNote,
			table: {
				columns: [...table.columns],
				rows: table.rows.map((r) => [...r])
			}
		});
	}
}
