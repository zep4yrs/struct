import type {
	AlgorithmEngine,
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
 * 窗口函数引擎 — 教学级 ROW_NUMBER/RANK/SUM OVER (PARTITION BY ... ORDER BY ...)
 * 演示：分组 → 组内排序 → 逐行计算窗口值 → 完成。renderType: sql-table。
 */
export interface WindowFunctionInput {
	sql: string;
	table: SqlTableData;
}

interface Parsed {
	selectCols: string[];
	partitionCol: string | null;
	orderCol: string | null;
	desc: boolean;
	func: 'ROW_NUMBER' | 'RANK' | 'SUM';
	alias: string;
}

export class WindowFunctionEngine extends EngineBase<WindowFunctionInput> {
	readonly name = '窗口函数';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = [
		'SELECT 列, 窗口函数() OVER (',
		'  PARTITION BY 分组列',
		'  ORDER BY 排序列',
		') AS 别名',
		'FROM 表'
	];

	readonly practiceQuestions: PracticeQuestion[] = [
		{
			type: 'choose-next',
			stepIndex: 1,
			prompt: '窗口函数中 PARTITION BY 的作用是？',
			options: ['分组：每个分组独立计算窗口', '对整表排序', '过滤行', '去重'],
			correctAnswer: '分组：每个分组独立计算窗口',
			hint: 'PARTITION 即"分区"',
			explanation: 'PARTITION BY 把表按列分成多个分区（组），窗口函数在每个分区内独立计算；没有 PARTITION BY 时整个结果集是一个分区。'
		},
		{
			type: 'choose-next',
			stepIndex: 3,
			prompt: 'ROW_NUMBER() 与 RANK() 的主要区别是？',
			options: ['RANK 并列时跳过名次，ROW_NUMBER 不跳过', '两者完全相同', 'ROW_NUMBER 可以求和', 'RANK 只能用于整数列'],
			correctAnswer: 'RANK 并列时跳过名次，ROW_NUMBER 不跳过',
			hint: '并列分数是常见考点',
			explanation: 'ROW_NUMBER 给每行一个唯一递增序号（并列也分先后）；RANK 对并列值给相同名次，但下一个名次会跳过（如 1,1,3）。'
		}
	];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '窗口函数在"分组 + 组内排序"的基础上逐行计算，是 SQL 高级查询的核心工具。' },
		{ type: 'compare', narration: '按 PARTITION BY 列把行分组：每个分组拥有独立的计算窗口。' },
		{ type: 'recurse-enter', narration: '组内按 ORDER BY 排序，随后逐行计算窗口函数值。' },
		{ type: 'complete', narration: '窗口函数计算完成：每行得到组内序号/排名/累计值，且不折叠行数（与 GROUP BY 不同）。' }
	];

	presets: EnginePreset[] = [
		{ name: '按专业排名（ROW_NUMBER）', description: 'PARTITION BY 专业 ORDER BY 成绩 DESC' },
		{ name: '并列名次（RANK）', description: '同分同名次、名次跳跃' },
		{ name: '组内累计分（SUM）', description: '按学号分区累加成绩' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义窗口查询',
		fields: [
			{
				key: 'sql',
				label: 'SQL 语句',
				type: 'textarea',
				placeholder: 'SELECT 学号, 专业, 成绩, ROW_NUMBER() OVER (PARTITION BY 专业 ORDER BY 成绩 DESC) AS 排名 FROM 学生',
				default: 'SELECT 学号, 专业, 成绩, ROW_NUMBER() OVER (PARTITION BY 专业 ORDER BY 成绩 DESC) AS 排名 FROM 学生'
			}
		]
	};

	private _table: SqlTableData = { columns: [], rows: [] };

	init(input: WindowFunctionInput): void {
		this._table = input.table;
		const parsed = this._parse(input.sql);
		this.steps = [];
		this._stepId = 0;
		this.totalSteps = 0;
		this.playbackPos = 0;

		const cols = this._table.columns;
		const rows = this._table.rows;

		this._emit('init', '读取表数据，准备执行窗口函数查询', { columns: [...cols], rows: rows.map((r) => [...r]) }, [], []);

		// 分组
		let partitionIdx: number[] = rows.map(() => 0);
		let groupNames: string[] = [];
		if (parsed.partitionCol) {
			const ci = cols.indexOf(parsed.partitionCol);
			if (ci < 0) throw new Error('分组列 ' + parsed.partitionCol + ' 不存在');
			const groups = new Map<string, number>();
			partitionIdx = rows.map((r) => {
				const key = String(r[ci]);
				if (!groups.has(key)) groups.set(key, groups.size);
				return groups.get(key)!;
			});
			groupNames = [...groups.keys()];
			for (const g of groupNames) {
				const members = rows.map((r, i) => ({ r, i })).filter((x) => partitionIdx[x.i] === groups.get(g));
				this._emit(
					'compare',
					'分区「' + g + '」：' + members.length + ' 行进入同一计算窗口。',
					{ columns: [...cols], rows: rows.map((r) => [...r]) },
					[],
					[{ type: 'compare', indices: members.map((m) => m.i) }]
				);
			}
		} else {
			this._emit('compare', '未指定 PARTITION BY：整个结果集作为单一分区。', { columns: [...cols], rows: rows.map((r) => [...r]) }, [], []);
		}

		// 组内排序 + 计算
		const orderCi = parsed.orderCol ? cols.indexOf(parsed.orderCol) : -1;
		if (orderCi < 0 && parsed.orderCol) throw new Error('排序列 ' + parsed.orderCol + ' 不存在');
		// SUM(col) 累加列：SUM 函数参数中的列，缺省回退排序列
		const sumMatch = this._parseSumCol(input.sql);
		const sumCi = sumMatch ? cols.indexOf(sumMatch) : orderCi;
		if (sumCi < 0) throw new Error('累加列不存在');

		const outRows = rows.map((r, i) => [...r]);
		const outCols = [...cols, parsed.alias || parsed.func.toLowerCase()];
		const groupIds = [...new Set(partitionIdx)];
		for (const g of groupIds) {
			const members = rows.map((r, i) => ({ r, i })).filter((x) => partitionIdx[x.i] === g);
			const sorted = [...members].sort((a, b) => {
				if (orderCi < 0) return 0;
				const va = Number(a.r[orderCi]);
				const vb = Number(b.r[orderCi]);
				return parsed.desc ? vb - va : va - vb;
			});
			let rank = 0;
			let prevVal: number | null = null;
			let runningSum = 0;
			for (let k = 0; k < sorted.length; k++) {
				const m = sorted[k];
				const val = orderCi >= 0 ? Number(m.r[orderCi]) : 0;
				if (parsed.func === 'RANK') {
					if (k === 0 || val !== prevVal) rank = k + 1;
				}
				runningSum += Number(m.r[sumCi]);
				prevVal = val;
				let cell: string | number;
				if (parsed.func === 'SUM') cell = runningSum;
				else if (parsed.func === 'RANK') cell = rank;
				else cell = k + 1;
				outRows[m.i] = [...outRows[m.i], cell];
				this._emit(
					parsed.func === 'SUM' ? 'compare' : 'recurse-enter',
					'分区 ' + (g + 1) + ' 内第 ' + (k + 1) + ' 行：' + parsed.func + '() = ' + cell,
					{ columns: outCols, rows: outRows.map((r) => [...r]) },
					[],
					[{ type: 'current', indices: [m.i] }]
				);
			}
		}

		this._emit(
			'complete',
			'窗口函数计算完成：每行都带有组内计算结果，且行数保持不变。',
			{ columns: outCols, rows: outRows.map((r) => [...r]) },
			[],
			[{ type: 'compare', indices: outRows.map((_, i) => i) }]
		);
		this.totalSteps = this.steps.length;
	}

	private _parseSumCol(sql: string): string | null {
		const m = sql.match(/SUM\s*\(\s*([\u4e00-\u9fa5\w*]+)\s*\)/i);
		if (!m || m[1] === '*') return null;
		return m[1];
	}

	private _parse(sql: string): Parsed {
		const fnMatch = sql.match(/\b(ROW_NUMBER|RANK|SUM)\s*\(/i);
		if (!fnMatch) throw new Error('仅支持 ROW_NUMBER / RANK / SUM 窗口函数');
		const func = fnMatch[1].toUpperCase() as Parsed['func'];
		const overMatch = sql.match(/OVER\s*\(\s*(?:PARTITION\s+BY\s+([\u4e00-\u9fa5\w]+))?\s*(?:ORDER\s+BY\s+([\u4e00-\u9fa5\w]+)\s*(DESC|ASC)?)?\s*\)/i);
		// SUM(col) 的累加列（与 ORDER BY 列可不同）
		const sumMatch = sql.match(/SUM\s*\(\s*([\u4e00-\u9fa5\w*]+)\s*\)/i);
		const aliasMatch = sql.match(/AS\s+([\u4e00-\u9fa5\w]+)\s+FROM/i);
		const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+([\u4e00-\u9fa5\w]+)\s*$/i);
		if (!selectMatch) throw new Error('仅支持 SELECT ... FROM 表 查询');
		const selectPart = selectMatch[1].trim();
		const cols = selectPart
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0 && !/OVER\s*\(/i.test(s))
			.map((s) => s.trim());
		return {
			selectCols: cols,
			partitionCol: overMatch?.[1] ?? null,
			orderCol: overMatch?.[2] ?? null,
			desc: (overMatch?.[3] ?? '').toUpperCase() === 'DESC',
			func,
			alias: aliasMatch?.[1] ?? ''
		};
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
