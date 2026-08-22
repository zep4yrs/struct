/**
 * 连接家族引擎 — JoinFamilyEngine
 *
 * 用两张小表演示 SQL 中四种连接类型的结果差异：
 *   学生表(学号, 姓名) 3 行 + 成绩表(学号, 课程, 成绩) 4 行
 * 每种连接一个「结果表」比较步 + 一个「语义说明」步，逐类对比保留了哪些行。
 * 渲染用 sql-table（每步 table 为当前结果表快照）。
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

const PSEUDO: string[] = [
	'学生表 S(学号, 姓名) 3 行',
	'成绩表 T(学号, 课程, 成绩) 4 行',
	'INNER JOIN : 只保留两边都匹配的行',
	'LEFT JOIN  : 保留左表全部行',
	'RIGHT JOIN : 保留右表全部行',
	'CROSS JOIN : 笛卡尔积 S × T'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'INNER JOIN 会保留哪些行？',
		options: ['两表都匹配的行', '左表全部行', '右表全部行', '两表所有组合'],
		correctAnswer: '两表都匹配的行',
		hint: '按 ON 条件取交集',
		explanation:
			'INNER JOIN 先做两表乘积，再按 ON 条件剔除不匹配的行对，只保留两边都满足条件的行（交集）。'
	},
	{
		type: 'choose-next',
		stepIndex: 8,
		prompt: 'CROSS JOIN 的语义是？',
		options: [
			'笛卡尔积, 行数 = 两表行数之积',
			'只保留匹配的行',
			'保留左表全部行',
			'保留右表全部行'
		],
		correctAnswer: '笛卡尔积, 行数 = 两表行数之积',
		hint: '无 ON 条件, 每行两两组合',
		explanation:
			'CROSS JOIN 没有 ON 条件，把左表每一行与右表每一行组合，结果行数 = 左表行数 × 右表行数。'
	}
];

export class JoinFamilyEngine extends EngineBase<number[]> {
	readonly name = '连接家族';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '连接家族：先准备两张小表——学生表 3 行与成绩表 4 行，观察不同连接如何组合它们。'
		},
		{
			type: 'compare',
			narration: '当前连接类型的结果表已生成：注意每类连接保留了哪些行。'
		},
		{
			type: 'default',
			narration: '这一步说明该连接类型的语义与取舍。'
		},
		{
			type: 'complete',
			narration: '连接家族对比完成：INNER 取交集，LEFT 保左表，RIGHT 保右表，CROSS 是笛卡尔积。'
		}
	];

	presets: EnginePreset[] = [{ name: '连接家族总览', description: '四种 JOIN 结果对比' }];

	customConfig: EngineCustomConfig = { title: '连接演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const student: SqlTableData = {
			columns: ['学号', '姓名'],
			rows: [
				[101, '张三'],
				[102, '李四'],
				[103, '王五']
			]
		};
		const score: SqlTableData = {
			columns: ['学号', '课程', '成绩'],
			rows: [
				[101, '语文', 90],
				[101, '数学', 85],
				[102, '语文', 78],
				[104, '数学', 66]
			]
		};

		const inner: SqlTableData = {
			columns: ['学号', '姓名', '课程', '成绩'],
			rows: [
				[101, '张三', '语文', 90],
				[101, '张三', '数学', 85],
				[102, '李四', '语文', 78]
			]
		};
		const left: SqlTableData = {
			columns: ['学号', '姓名', '课程', '成绩'],
			rows: [
				[101, '张三', '语文', 90],
				[101, '张三', '数学', 85],
				[102, '李四', '语文', 78],
				[103, '王五', 'NULL', 'NULL']
			]
		};
		const right: SqlTableData = {
			columns: ['学号', '姓名', '课程', '成绩'],
			rows: [
				[101, '张三', '语文', 90],
				[101, '张三', '数学', 85],
				[102, '李四', '语文', 78],
				['NULL', 'NULL', '数学', 66]
			]
		};
		const cross: SqlTableData = {
			columns: ['学生学号', '姓名', '成绩学号', '课程', '成绩'],
			rows: [
				[101, '张三', 101, '语文', 90],
				[101, '张三', 101, '数学', 85],
				[101, '张三', 102, '语文', 78],
				[101, '张三', 104, '数学', 66],
				[102, '李四', 101, '语文', 90],
				[102, '李四', 101, '数学', 85],
				[102, '李四', 102, '语文', 78],
				[102, '李四', 104, '数学', 66],
				[103, '王五', 101, '语文', 90],
				[103, '王五', 101, '数学', 85],
				[103, '王五', 102, '语文', 78],
				[103, '王五', 104, '数学', 66]
			]
		};
		const summary: SqlTableData = {
			columns: ['连接类型', '语义', '结果行数'],
			rows: [
				['INNER JOIN', '只留两边都匹配', '3'],
				['LEFT JOIN', '保左表全行', '4'],
				['RIGHT JOIN', '保右表全行', '4'],
				['CROSS JOIN', '笛卡尔积', '12']
			]
		};

		const rowHigh = (n: number): Highlight[] => [
			{ type: 'compare', indices: Array.from({ length: n }, (_, i) => i) }
		];

		this._emit(
			'init',
			'连接家族：学生表(学号,姓名)3 行 + 成绩表(学号,课程,成绩)4 行。四种连接把这套小表按不同方式组合。',
			student,
			rowHigh(3),
			0
		);

		this._emit(
			'compare',
			'成绩表(学号, 课程, 成绩) 4 行：作为连接的另一张表, 学号 101 有两条成绩、102 一条、104 一条。',
			score,
			rowHigh(4),
			1
		);

		this._emit(
			'compare',
			'INNER JOIN (学生 JOIN 成绩 ON 学生.学号 = 成绩.学号)：只保留两表学号一致的行，共 3 行。',
			inner,
			rowHigh(3),
			2
		);
		this._emit(
			'default',
			'INNER JOIN 语义：先做两表乘积，再按 ON 条件剔除不匹配的行对，只留两边都有的学号。学号 103(有学生无成绩)与 104(有成绩无学生)都被丢弃。',
			inner,
			rowHigh(3),
			2
		);

		this._emit(
			'compare',
			'LEFT JOIN (学生 LEFT JOIN 成绩)：保留左表(学生)全部 3 行，右表未匹配字段补 NULL，共 4 行。',
			left,
			rowHigh(4),
			3
		);
		this._emit(
			'default',
			'LEFT JOIN 语义：保左表全行。学生 103(王五)没有任何成绩，右表字段补 NULL，因此仍出现在结果里。',
			left,
			rowHigh(4),
			3
		);

		this._emit(
			'compare',
			'RIGHT JOIN (学生 RIGHT JOIN 成绩)：保留右表(成绩)全部 4 行，左表未匹配字段补 NULL，共 4 行。',
			right,
			rowHigh(4),
			4
		);
		this._emit(
			'default',
			'RIGHT JOIN 语义：保右表全行。成绩 104(数学 66)没有对应学生，左表字段补 NULL，因此出现在结果里。',
			right,
			rowHigh(4),
			4
		);

		this._emit(
			'compare',
			'CROSS JOIN (学生 CROSS JOIN 成绩)：两表笛卡尔积，3 × 4 = 12 行。',
			cross,
			rowHigh(12),
			5
		);
		this._emit(
			'default',
			'CROSS JOIN 语义：没有 ON 条件，不去重，把每行学生与每行成绩都组合一次，行数 = 两表行数之积。',
			cross,
			rowHigh(12),
			5
		);

		this._emit(
			'complete',
			'连接家族对比：INNER 只留两边都匹配(交集)；LEFT 保左表全行；RIGHT 保右表全行；CROSS 是笛卡尔积(两表行数相乘)。',
			summary,
			rowHigh(4),
			5
		);

		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		table: SqlTableData,
		highlights: Highlight[],
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine,
			table: {
				columns: [...table.columns],
				rows: table.rows.map((r) => [...r])
			}
		});
	}
}
