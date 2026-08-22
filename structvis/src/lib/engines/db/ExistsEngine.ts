/**
 * EXISTS 与 IN 引擎 — ExistsEngine
 *
 * 演示 WHERE EXISTS (SELECT 1 FROM 成绩 WHERE ...) 的半连接语义：
 * 外表(学生表)逐行 → 子查询探测 → 输出保留/剔除，直到扫完外表。
 * 再对比 IN 的区别：IN 会先把子查询物化成结果集，再一次性匹配。
 * 渲染用 sql-table（每步 table 展示外表判定进度或结果集）。
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
	'SELECT 姓名 FROM 学生',
	'WHERE EXISTS (SELECT 1 FROM 成绩',
	'              WHERE 成绩.学号 = 学生.学号',
	'                AND 成绩.成绩 > 80)',
	'外表逐行 → 子查询探测 → 保留/剔除',
	'对比 IN: 子查询先物化结果集再匹配'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'WHERE EXISTS 子查询与外表的关键关系是？',
		options: [
			'子查询引用外表列, 形成相关(逐行执行)',
			'子查询先算一次与外表无关',
			'子查询永远返回空',
			'子查询只在最后执行'
		],
		correctAnswer: '子查询引用外表列, 形成相关(逐行执行)',
		hint: 'EXISTS 的子查询用到 学生.学号',
		explanation:
			'EXISTS 是相关子查询：子查询里引用外表列(学生.学号)，因此要针对外表每一行探测一次，形成半连接语义。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: 'IN (SELECT ...) 与 EXISTS 的执行差异是？',
		options: [
			'IN 先物化子查询结果集, 再一次性匹配',
			'IN 也是逐行探测结果',
			'两者完全一样',
			'IN 只能用在 WHERE 之后'
		],
		correctAnswer: 'IN 先物化子查询结果集, 再一次性匹配',
		hint: 'IN 的子查询不依赖外表, 先求结果集',
		explanation:
			'IN 的子查询与外表无关，先执行一次并把结果物化成一个集合，再对每行做成员判断；而 EXISTS 是逐行探测子查询。'
	}
];

export class ExistsEngine extends EngineBase<number[]> {
	readonly name = 'EXISTS 与 IN';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: 'EXISTS 半连接：外表(学生表)逐行进入子查询探测。'
		},
		{
			type: 'compare',
			narration: '当前外表行正在探测子查询，判定保留还是剔除。'
		},
		{
			type: 'default',
			narration: '这一步对比 EXISTS 与 IN 的差异。'
		},
		{
			type: 'complete',
			narration: 'EXISTS 是半连接(外表逐行探测)，IN 先物化子查询结果集。'
		}
	];

	presets: EnginePreset[] = [{ name: 'EXISTS 半连接', description: '逐行探测子查询' }];

	customConfig: EngineCustomConfig = { title: 'EXISTS 演示', fields: [] };

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

		const judge101: SqlTableData = {
			columns: ['学号', '姓名', '子查询判定'],
			rows: [[101, '张三', '保留']]
		};
		const judge102: SqlTableData = {
			columns: ['学号', '姓名', '子查询判定'],
			rows: [
				[101, '张三', '保留'],
				[102, '李四', '剔除']
			]
		};
		const judge103: SqlTableData = {
			columns: ['学号', '姓名', '子查询判定'],
			rows: [
				[101, '张三', '保留'],
				[102, '李四', '剔除'],
				[103, '王五', '剔除']
			]
		};

		const existsRes: SqlTableData = {
			columns: ['姓名'],
			rows: [['张三']]
		};
		const inSet: SqlTableData = {
			columns: ['学号'],
			rows: [[101]]
		};
		const inRes: SqlTableData = {
			columns: ['姓名'],
			rows: [['张三']]
		};
		const summary: SqlTableData = {
			columns: ['方式', '语义', '子查询执行'],
			rows: [
				['EXISTS', '外表逐行探测(半连接)', '与外表相关, 逐行执行'],
				['IN', '先物化结果集再匹配', '子查询只算一次']
			]
		};

		const hl = (i: number): Highlight[] => [{ type: 'compare', indices: [i] }];

		this._emit(
			'init',
			'EXISTS 半连接：SELECT 姓名 FROM 学生 WHERE EXISTS (SELECT 1 FROM 成绩 WHERE 成绩.学号 = 学生.学号 AND 成绩.成绩 > 80)。外表(学生表)逐行进入子查询探测。',
			student,
			[],
			0
		);

		this._emit(
			'compare',
			'外表行 101(张三)：子查询探测「成绩.学号 = 101 且 成绩 > 80」。命中 语文 90(>80)，EXISTS 为真 → 保留。',
			judge101,
			hl(0),
			1
		);
		this._emit(
			'compare',
			'外表行 102(李四)：探测「成绩.学号 = 102 且 成绩 > 80」。只有 语文 78(≤80)，无满足行 → EXISTS 为假 → 剔除。',
			judge102,
			hl(1),
			1
		);
		this._emit(
			'compare',
			'外表行 103(王五)：成绩表中没有学号 103 的记录，子查询返回空 → EXISTS 为假 → 剔除。',
			judge103,
			hl(2),
			1
		);

		this._emit(
			'compare',
			'EXISTS 输出：半连接只把满足的行保留下来，最终保留 1 行，张三。外表 102/103 被剔除。',
			existsRes,
			hl(0),
			4
		);

		this._emit(
			'compare',
			'对比 IN：WHERE 学号 IN (SELECT 学号 FROM 成绩 WHERE 成绩 > 80)。子查询与外表无关，先物化一次得到结果集 {101}。',
			inSet,
			hl(0),
			5
		);
		this._emit(
			'compare',
			'IN 再按 学号 IN {101} 过滤学生表，得到 张三。与 EXISTS 结果相同，但子查询只算一次。',
			inRes,
			hl(0),
			5
		);

		this._emit(
			'complete',
			'EXISTS 是半连接：外表逐行探测子查询，子查询与外表相关；IN 先物化子查询结果集再一次性匹配。NOT EXISTS 是反连接(取不在子查询结果中的行)，且对 NULL 安全——IN 遇见 NULL 可能得到「未知」，用 NOT EXISTS 更稳。',
			summary,
			[],
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
