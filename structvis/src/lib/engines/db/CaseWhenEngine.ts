/**
 * CASE WHEN 与常用函数引擎 — CaseWhenEngine
 *
 * 演示成绩表按分数段打标签：CASE WHEN 成绩 >= 90 THEN '优' END 逐行转换;
 * 再演示常用函数步骤：CONCAT/UPPER、YEAR(date)、ROUND(AVG)、IFNULL。
 * 表格展示原始行 → 转换后行。渲染用 sql-table。
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
	'CASE WHEN 成绩 >= 90 THEN 优',
	'     WHEN 成绩 >= 80 THEN 良',
	'     WHEN 成绩 >= 60 THEN 中',
	'     ELSE 差 END',
	'常用函数: CONCAT/UPPER、YEAR、ROUND(AVG)、IFNULL',
	'先按条件转换, 再投影统计'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'CASE WHEN 的判定顺序是？',
		options: ['自上而下, 命中第一个满足的 WHEN', '所有分支都执行', '随机取一个', '只匹配最后一个'],
		correctAnswer: '自上而下, 命中第一个满足的 WHEN',
		hint: 'CASE 按书写顺序逐个判断',
		explanation:
			'CASE WHEN 自上而下逐一判断每个 WHEN 条件, 一旦某个条件为真就返回对应 THEN 并结束, 不再看后续分支。'
	},
	{
		type: 'choose-next',
		stepIndex: 8,
		prompt: 'ROUND(AVG(成绩), 1) 的组合含义是？',
		options: [
			'先算平均分, 再四舍五入保留 1 位小数',
			'先取整再平均',
			'对成绩求和',
			'只保留 1 行成绩'
		],
		correctAnswer: '先算平均分, 再四舍五入保留 1 位小数',
		hint: 'ROUND 作用于 AVG 的结果',
		explanation: 'AVG(成绩) 先对整列求平均(得 79), ROUND(x, 1) 再把这个结果四舍五入保留 1 位小数。'
	}
];

export class CaseWhenEngine extends EngineBase<number[]> {
	readonly name = 'CASE WHEN 与常用函数';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '成绩表原始 4 行, 先用 CASE WHEN 按分数段打标签。'
		},
		{
			type: 'compare',
			narration: '当前行正在按 CASE WHEN 规则转换为 等级 标签。'
		},
		{
			type: 'default',
			narration: '这一步再演示一个常用函数对列做转换或统计。'
		},
		{
			type: 'complete',
			narration: 'CASE WHEN 做条件转换, 配合 CONCAT/UPPER、YEAR、ROUND(AVG)、IFNULL 做投影与统计。'
		}
	];

	presets: EnginePreset[] = [{ name: '成绩分段', description: 'CASE WHEN 打标签' }];

	customConfig: EngineCustomConfig = { title: 'CASE WHEN 演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const baseTable: SqlTableData = {
			columns: ['学号', '姓名', '科目', '成绩', '日期', '电话'],
			rows: [
				[101, '张三', 'math', 92, '2024-03-05', '13800000001'],
				[102, '李四', 'english', 78, '2024-04-12', 'NULL'],
				[103, '王五', 'math', 85, '2024-05-20', '13900000002'],
				[104, '赵六', 'chinese', 61, '2024-06-01', 'NULL']
			]
		};

		const case1: SqlTableData = {
			columns: ['学号', '姓名', '成绩', '等级'],
			rows: [[101, '张三', 92, '优']]
		};
		const case2: SqlTableData = {
			columns: ['学号', '姓名', '成绩', '等级'],
			rows: [
				[101, '张三', 92, '优'],
				[102, '李四', 78, '中']
			]
		};
		const case3: SqlTableData = {
			columns: ['学号', '姓名', '成绩', '等级'],
			rows: [
				[101, '张三', 92, '优'],
				[102, '李四', 78, '中'],
				[103, '王五', 85, '良']
			]
		};
		const case4: SqlTableData = {
			columns: ['学号', '姓名', '成绩', '等级'],
			rows: [
				[101, '张三', 92, '优'],
				[102, '李四', 78, '中'],
				[103, '王五', 85, '良'],
				[104, '赵六', 61, '中']
			]
		};

		const concat: SqlTableData = {
			columns: ['学号', '姓名', '称呼', '科目大写'],
			rows: [
				[101, '张三', '张三 同学', 'MATH'],
				[102, '李四', '李四 同学', 'ENGLISH'],
				[103, '王五', '王五 同学', 'MATH'],
				[104, '赵六', '赵六 同学', 'CHINESE']
			]
		};
		const yearTab: SqlTableData = {
			columns: ['学号', '日期', '年'],
			rows: [
				[101, '2024-03-05', '2024'],
				[102, '2024-04-12', '2024'],
				[103, '2024-05-20', '2024'],
				[104, '2024-06-01', '2024']
			]
		};
		const avgTab: SqlTableData = {
			columns: ['统计项', '值'],
			rows: [['ROUND(AVG(成绩), 1)', '79']]
		};
		const ifnullTab: SqlTableData = {
			columns: ['学号', '电话'],
			rows: [
				[101, '13800000001'],
				[102, '未知'],
				[103, '13900000002'],
				[104, '未知']
			]
		};
		const summary: SqlTableData = {
			columns: ['函数', '作用'],
			rows: [
				['CASE WHEN', '按分数段打标签'],
				['CONCAT / UPPER', '字符串拼接与大小写'],
				['YEAR', '提取年份'],
				['ROUND(AVG)', '聚合取整'],
				['IFNULL', '空值填充']
			]
		};

		const hl = (i: number): Highlight[] => [{ type: 'compare', indices: [i] }];
		const hlAll = (n: number): Highlight[] => [
			{ type: 'compare', indices: Array.from({ length: n }, (_, i) => i) }
		];

		this._emit(
			'init',
			'成绩表原始 4 行。先用 CASE WHEN 按分数段打标签：90 分以上得 优, 80~89 得 良, 60~79 得 中, 否则差。',
			baseTable,
			hlAll(4),
			0
		);

		this._emit(
			'compare',
			'CASE WHEN: 张三 成绩 92 >= 90, 满足第一个 WHEN, 标记为 优。',
			case1,
			hl(0),
			0
		);
		this._emit('compare', 'CASE WHEN: 李四 成绩 78, 落在 60~79, 得 中。', case2, hl(1), 2);
		this._emit('compare', 'CASE WHEN: 王五 成绩 85, 落在 80~89, 得 良。', case3, hl(2), 1);
		this._emit('compare', 'CASE WHEN: 赵六 成绩 61, 落在 60~79, 得 中。', case4, hl(3), 2);

		this._emit(
			'compare',
			'CASE WHEN 打标签完成：新增 等级 列, 逐行按分数段转换。',
			case4,
			hlAll(4),
			3
		);

		this._emit(
			'compare',
			'CONCAT(姓名, 空格+同学) 拼出称呼; UPPER(科目) 把 math/english/chinese 转大写。',
			concat,
			hlAll(4),
			4
		);
		this._emit('compare', 'YEAR(日期) 提取年份, 四条记录均为 2024。', yearTab, hlAll(4), 4);
		this._emit(
			'compare',
			'ROUND(AVG(成绩), 1)：平均 (92+78+85+61)/4 = 79, 四舍五入保留 1 位得 79。',
			avgTab,
			hl(0),
			4
		);
		this._emit(
			'compare',
			'IFNULL(电话, 未知)：把空值(NULL)的电话填充为 未知。',
			ifnullTab,
			hlAll(4),
			4
		);

		this._emit(
			'complete',
			'CASE WHEN 做条件转换；再配合 CONCAT/UPPER(拼接大小写)、YEAR(日期)、ROUND(AVG)(统计)、IFNULL(空值填充)做投影与统计。',
			summary,
			hlAll(5),
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
