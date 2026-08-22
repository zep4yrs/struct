/**
 * 最左前缀法则引擎 — IndexPrefixEngine
 *
 * 联合索引 idx(a, b, c)：演示不同 WHERE 组合是否命中索引。
 * 表格列 [查询条件, 是否命中, 使用索引列, 扫描方式], 逐行判定并给出结论。
 * 渲染用 sql-table（每步 table 为累积的判定表, 高亮当前行）。
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
	'idx(a, b, c) 联合索引',
	'最左匹配: 必须从最左列 a 开始',
	'等值连续: 中间列连续有序才用得上',
	'跳过中间列: 后续列失效',
	'范围之后: 范围条件之后的列全部失效',
	'口诀: 最左匹配, 范围之后全失效'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'idx(a, b, c) 下, WHERE b = 2 能否用索引？',
		options: ['不能, 最左列 a 缺失导致失效', '能, 走 b 列', '能, 走 b 和 c', '总要全表扫描'],
		correctAnswer: '不能, 最左列 a 缺失导致失效',
		hint: '联合索引必须先匹配最左列 a',
		explanation:
			'联合索引最左前缀: 查询条件必须从最左列 a 开始。跳过 a 直接用 b, 索引无法定位, 只能全表扫描。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: 'a = 1 AND b > 1 AND c = 3 中, c 列为何失效？',
		options: [
			'范围条件 b > 1 之后的列无法再用索引',
			'c 列没有加进索引',
			'等值条件 c 不能用',
			'a 列也失效'
		],
		correctAnswer: '范围条件 b > 1 之后的列无法再用索引',
		hint: '范围之后的列会破坏有序性',
		explanation:
			'联合索引按列有序。一旦某列出现范围条件(>,<,BETWEEN), 其后的列无法再利用索引的有序性, 需回表过滤。'
	}
];

export class IndexPrefixEngine extends EngineBase<number[]> {
	readonly name = '最左前缀法则';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '联合索引 idx(a,b,c)：看不同 WHERE 组合能否命中索引。'
		},
		{
			type: 'compare',
			narration: '当前查询条件逐条判定能否命中索引, 及使用了哪些索引列。'
		},
		{
			type: 'default',
			narration: '这一步汇总命中与失效的规则。'
		},
		{
			type: 'complete',
			narration: '口诀：最左匹配, 范围之后全失效。'
		}
	];

	presets: EnginePreset[] = [{ name: '联合索引命中', description: '最左匹配演示' }];

	customConfig: EngineCustomConfig = { title: '最左前缀演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const header: SqlTableData = {
			columns: ['查询条件', '是否命中', '使用索引列', '扫描方式'],
			rows: []
		};

		const row1: SqlTableData = {
			columns: ['查询条件', '是否命中', '使用索引列', '扫描方式'],
			rows: [['a = 1', '命中 ✓', '[a]', '索引等值定位']]
		};
		const row2: SqlTableData = {
			columns: ['查询条件', '是否命中', '使用索引列', '扫描方式'],
			rows: [
				['a = 1', '命中 ✓', '[a]', '索引等值定位'],
				['a = 1 AND b = 2', '命中 ✓', '[a, b]', '索引等值(全命中)']
			]
		};
		const row3: SqlTableData = {
			columns: ['查询条件', '是否命中', '使用索引列', '扫描方式'],
			rows: [
				['a = 1', '命中 ✓', '[a]', '索引等值定位'],
				['a = 1 AND b = 2', '命中 ✓', '[a, b]', '索引等值(全命中)'],
				['b = 2', '失效 ✗', '无', '全表扫描']
			]
		};
		const row4: SqlTableData = {
			columns: ['查询条件', '是否命中', '使用索引列', '扫描方式'],
			rows: [
				['a = 1', '命中 ✓', '[a]', '索引等值定位'],
				['a = 1 AND b = 2', '命中 ✓', '[a, b]', '索引等值(全命中)'],
				['b = 2', '失效 ✗', '无', '全表扫描'],
				['a = 1 AND c = 3', '部分命中', '[a]', '索引前缀定位 + 回表过滤 c']
			]
		};
		const row5: SqlTableData = {
			columns: ['查询条件', '是否命中', '使用索引列', '扫描方式'],
			rows: [
				['a = 1', '命中 ✓', '[a]', '索引等值定位'],
				['a = 1 AND b = 2', '命中 ✓', '[a, b]', '索引等值(全命中)'],
				['b = 2', '失效 ✗', '无', '全表扫描'],
				['a = 1 AND c = 3', '部分命中', '[a]', '索引前缀定位 + 回表过滤 c'],
				['a = 1 AND b > 1 AND c = 3', '部分命中', '[a, b]', '范围后 c 失效, 回表过滤']
			]
		};

		const hl = (i: number): Highlight[] => [{ type: 'compare', indices: [i] }];
		const hlAll = (n: number): Highlight[] => [
			{ type: 'compare', indices: Array.from({ length: n }, (_, i) => i) }
		];

		this._emit(
			'init',
			'联合索引 idx(a, b, c)：a 为首列, 依次 b、c。判定不同 WHERE 组合能否命中索引。',
			header,
			[],
			0
		);

		this._emit(
			'compare',
			'条件 a = 1：从最左列 a 开始等值, 命中索引, 使用列 [a], 索引等值定位。',
			row1,
			hl(0),
			1
		);
		this._emit(
			'compare',
			'条件 a = 1 AND b = 2：a、b 连续等值有序, 全命中 [a, b], 无需回表。',
			row2,
			hl(1),
			2
		);
		this._emit(
			'compare',
			'条件 b = 2：跳过最左列 a, 索引无法定位, 失效 —— 全表扫描。',
			row3,
			hl(2),
			1
		);
		this._emit(
			'compare',
			'条件 a = 1 AND c = 3：只用到了 a 列定位, 跳过 b 后 c 无法利用索引, 部分命中, 需回表过滤 c。',
			row4,
			hl(3),
			3
		);
		this._emit(
			'compare',
			'条件 a = 1 AND b > 1 AND c = 3：a 等值、b 范围, 范围之后的 c 失效 —— 使用 [a, b], 回表过滤 c。',
			row5,
			hl(4),
			4
		);
		this._emit(
			'default',
			'规律汇总：① 必须从最左列起; ② 等值连续才全用; ③ 跳过中间列则后续失效; ④ 范围条件之后的列全部失效。',
			row5,
			hlAll(5),
			5
		);

		this._emit(
			'complete',
			'口诀：最左匹配, 范围之后全失效。联合索引要尽量把等值列放左边, 把范围条件列放右边。',
			row5,
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
