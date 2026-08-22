/**
 * 递归 CTE 引擎 — RecursiveCteEngine
 *
 * 演示组织架构树查询：WITH RECURSIVE emp_tree AS (
 *   锚点: 上级 IS NULL 的根节点
 *   UNION ALL
 *   递归: 上一轮员工的下属(上级 = 员工)
 * )
 * 步骤：锚点产出根节点 → 每轮递归展开下一层员工 → 直到本轮不产生新行。
 * 表格列 [层级, 员工, 上级]。渲染用 sql-table。
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
	'WITH RECURSIVE emp_tree AS (',
	'  锚点: SELECT 员工, 0 AS 层级 FROM 员工表 WHERE 上级 IS NULL',
	'  UNION ALL',
	'  递归: SELECT 员工表.员工, emp_tree.层级 + 1',
	'         FROM 员工表 JOIN emp_tree ON 员工表.上级 = emp_tree.员工',
	')',
	'SELECT * FROM emp_tree'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '递归 CTE 的「锚点」子句作用是什么？',
		options: ['给出递归的初始行, 通常是根节点', '做递归终止判断', '对结果排序', '限制递归层数'],
		correctAnswer: '给出递归的初始行, 通常是根节点',
		hint: '锚点不引用自身, 提供起始集',
		explanation: '锚点(非递归部分)是递归的起点, 通常取出树的根节点或叶子基元, 不引用 CTE 自身。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '递归终止(不再产生新行)是因为？',
		options: [
			'本轮连接没有新行可加入, 迭代自然停下',
			'递归部分自己设了 LIMIT',
			'锚点被删除了',
			'UNION ALL 强制结束'
		],
		correctAnswer: '本轮连接没有新行可加入, 迭代自然停下',
		hint: '当上层员工都没有下属时连接为空',
		explanation:
			'递归每轮把上一轮新行与员工表做连接, 当连接不产生任何新行时迭代结束; 但若存在循环引用(如 A 上级 B, B 上级 A), 需用 UNION DISTINCT 或深度限制防死循环。'
	}
];

export class RecursiveCteEngine extends EngineBase<number[]> {
	readonly name = '递归 CTE';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '递归 CTE：先看员工表, 再用锚点+递归展开组织架构树。'
		},
		{
			type: 'compare',
			narration: '锚点子句产出了根节点, 递归从这里开始。'
		},
		{
			type: 'recurse-enter',
			narration: '进入下一轮递归：把上一层员工的下属逐层展开。'
		},
		{
			type: 'recurse-exit',
			narration: '本轮连接不再产生新行, 递归到此终止。'
		},
		{
			type: 'complete',
			narration: '递归 CTE 展开完成, 得到完整组织架构树。'
		}
	];

	presets: EnginePreset[] = [{ name: '组织架构树', description: '递归展开上下级' }];

	customConfig: EngineCustomConfig = { title: '递归 CTE 演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const emp: SqlTableData = {
			columns: ['员工', '上级'],
			rows: [
				['张三', 'NULL'],
				['李四', '张三'],
				['王五', '张三'],
				['赵六', '李四'],
				['钱七', '王五'],
				['孙八', '李四']
			]
		};

		const tree0: SqlTableData = {
			columns: ['层级', '员工', '上级'],
			rows: [[0, '张三', 'NULL']]
		};
		const tree1: SqlTableData = {
			columns: ['层级', '员工', '上级'],
			rows: [
				[0, '张三', 'NULL'],
				[1, '李四', '张三'],
				[1, '王五', '张三']
			]
		};
		const tree2: SqlTableData = {
			columns: ['层级', '员工', '上级'],
			rows: [
				[0, '张三', 'NULL'],
				[1, '李四', '张三'],
				[1, '王五', '张三'],
				[2, '赵六', '李四'],
				[2, '钱七', '王五'],
				[2, '孙八', '李四']
			]
		};

		const hlAll = (): Highlight[] => [
			{ type: 'compare', indices: Array.from({ length: 6 }, (_, i) => i) }
		];
		const hl = (indices: number[]): Highlight[] => [{ type: 'compare', indices }];

		this._emit(
			'init',
			'WITH RECURSIVE emp_tree AS (锚点 UNION ALL 递归)。先看员工表(员工, 上级), 锚点取上级为空的根, 递归逐层找出下属。',
			emp,
			hlAll(),
			0
		);

		this._emit(
			'compare',
			'锚点子句：SELECT 员工, 0 AS 层级 FROM 员工表 WHERE 上级 IS NULL → 根节点 张三, 层级 0。',
			tree0,
			hl([0]),
			1
		);

		this._emit(
			'recurse-enter',
			'第 1 轮递归：把当前树(张三)与员工表按「上级 = 员工」连接, 找到 李四、王五(上级=张三), 层级 +1。',
			tree1,
			hl([1, 2]),
			3
		);

		this._emit(
			'recurse-enter',
			'第 2 轮递归：上一轮新行 李四、王五 继续展开 → 赵六、孙八(上级=李四)、钱七(上级=王五), 层级 2。',
			tree2,
			hl([3, 4, 5]),
			3
		);

		this._emit(
			'recurse-exit',
			'第 3 轮递归：上一轮新增 赵六、钱七、孙八 都没有下属, 连接不再产生新行 → 递归终止。',
			tree2,
			hl([3, 4, 5]),
			3
		);

		this._emit(
			'complete',
			'递归 CTE 完成：组织架构树共 6 条。终止条件是「本轮不再产生新行」；为防止循环引用(如 A 上级 B, B 上级 A)导致死循环, 可用 UNION DISTINCT 去重、加截止层级或自增深度限制。',
			tree2,
			hlAll(),
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
