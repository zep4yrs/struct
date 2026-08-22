/**
 * 深分页优化引擎 — DeepPaginationEngine
 *
 * 对比三种深分页方案：
 *   ① LIMIT 100000, 10   慢(排序后扫描并丢弃前 10 万行)
 *   ② 游标分页 WHERE id > last_id LIMIT 10   快
 *   ③ 子查询定位/延迟关联 先定位主键再回表
 * 表格列 [方案, SQL 形态, 扫描行数, 耗时], 逐步对比。渲染用 sql-table。
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
	'方案1: SELECT * FROM t ORDER BY id LIMIT 100000, 10',
	'方案2: SELECT * FROM t WHERE id > 100000 ORDER BY id LIMIT 10',
	'方案3: SELECT * FROM t WHERE id > (SELECT id FROM t ORDER BY id LIMIT 100000, 1) ORDER BY id LIMIT 10',
	'痛点: OFFSET 越深, 扫描行数越多',
	'优化: 深分页用游标或延迟关联'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'LIMIT 100000, 10 为什么慢？',
		options: [
			'要先排序并扫描/丢弃前 10 万行才能取到第 100001 页',
			'因为用了 ORDER BY',
			'因为 SELECT * 太多列',
			'因为没加索引'
		],
		correctAnswer: '要先排序并扫描/丢弃前 10 万行才能取到第 100001 页',
		hint: 'OFFSET 越大需要遍历的行越多',
		explanation:
			'LIMIT offset, n 需要先排序, 再逐行遍历并丢弃前 offset 行, 才能拿到第 offset+1 页。页越深, 无谓扫描的行越多, 复杂度接近 O(n)。'
	},
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '游标分页 WHERE id > last_id LIMIT 10 的优势是？',
		options: [
			'无 OFFSET, 直接走主键定位, 每次只读一页',
			'它不排序',
			'它返回更多的行',
			'它不需要索引'
		],
		correctAnswer: '无 OFFSET, 直接走主键定位, 每次只读一页',
		hint: '用上一页最后一条 id 做起点',
		explanation:
			'游标分页记住上一页最后一条 id, WHERE id > last_id ORDER BY id LIMIT n 直接走主键索引定位, 与分页深度无关, 每次只读一页。'
	}
];

export class DeepPaginationEngine extends EngineBase<number[]> {
	readonly name = '深分页优化';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '深分页场景: 订单表 10 万行, 要取第 100001 页的后 10 行。'
		},
		{
			type: 'compare',
			narration: '当前方案的结果与代价已给出: 扫描行数与耗时。'
		},
		{
			type: 'default',
			narration: '这一步分析该方案快或慢的原因。'
		},
		{
			type: 'complete',
			narration: '深分页优化: 能用游标就用游标, 不能游标时用延迟关联。'
		}
	];

	presets: EnginePreset[] = [{ name: '深分页对比', description: '三种取第 N 页方案' }];

	customConfig: EngineCustomConfig = { title: '深分页演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const context: SqlTableData = {
			columns: ['表', '行数', '目标'],
			rows: [['订单表 t', '100010', '第 100001 页(10 行)']]
		};

		const plan1: SqlTableData = {
			columns: ['方案', 'SQL 形态', '扫描行数', '耗时'],
			rows: [['偏移分页', 'SELECT * FROM t ORDER BY id LIMIT 100000, 10', '100010', '约 800ms']]
		};
		const plan2: SqlTableData = {
			columns: ['方案', 'SQL 形态', '扫描行数', '耗时'],
			rows: [
				['偏移分页', 'SELECT * FROM t ORDER BY id LIMIT 100000, 10', '100010', '约 800ms'],
				['游标分页', 'SELECT * FROM t WHERE id > 100000 ORDER BY id LIMIT 10', '约 10', '约 5ms']
			]
		};
		const plan3: SqlTableData = {
			columns: ['方案', 'SQL 形态', '扫描行数', '耗时'],
			rows: [
				['偏移分页', 'SELECT * FROM t ORDER BY id LIMIT 100000, 10', '100010', '约 800ms'],
				['游标分页', 'SELECT * FROM t WHERE id > 100000 ORDER BY id LIMIT 10', '约 10', '约 5ms'],
				[
					'子查询定位(延迟关联)',
					'SELECT * FROM t WHERE id > (SELECT id FROM t ORDER BY id LIMIT 100000, 1) ORDER BY id LIMIT 10',
					'约 100011',
					'约 480ms'
				]
			]
		};
		const summary: SqlTableData = {
			columns: ['结论', '说明'],
			rows: [
				['游标分页', '性能最稳, 无 OFFSET'],
				['延迟关联/子查询定位', '比偏移快, 次优'],
				['深分页优化', '能游标就用游标, 不能则延迟关联']
			]
		};

		const hl = (i: number): Highlight[] => [{ type: 'compare', indices: [i] }];
		const hlAll = (n: number): Highlight[] => [
			{ type: 'compare', indices: Array.from({ length: n }, (_, i) => i) }
		];

		this._emit(
			'init',
			'深分页场景：订单表 t 共 100010 行, 要取第 100001 页的后 10 行。对比三种写法。',
			context,
			hlAll(1),
			3
		);

		this._emit(
			'compare',
			'方案1 偏移分页：LIMIT 100000, 10。按 id 排序后扫描 100010 行, 丢弃前 10 万行, 只返回最后 10 行。',
			plan1,
			hl(0),
			0
		);
		this._emit(
			'default',
			'慢的原因：OFFSET 100000 意味着要先排序并遍历前 100000 行才能定位第 100001 页, 页越深代价越大, 接近 O(n)。',
			plan1,
			hl(0),
			3
		);

		this._emit(
			'compare',
			'方案2 游标分页：记住上页最后 id = 100000, WHERE id > 100000 ORDER BY id LIMIT 10, 直接走主键定位, 扫描约 10 行。',
			plan2,
			hl(1),
			1
		);
		this._emit(
			'default',
			'游标分页无 OFFSET, 天然走主键索引, 每次只读一页, 与分页深度无关, 稳定为 O(每页行数)。',
			plan2,
			hl(1),
			3
		);

		this._emit(
			'compare',
			'方案3 子查询定位(延迟关联)：先用子查询取索引上的起始 id, 外层再取 10 行; 内层仍要 LIMIT 100000, 1 扫索引。',
			plan3,
			hl(2),
			2
		);
		this._emit(
			'default',
			'相比方案1, 省去回表 10 万行的开销; 若内层能走覆盖索引会更快, 但仍比游标慢, 适合无法用游标的场景。',
			plan3,
			hl(2),
			3
		);

		this._emit(
			'complete',
			'深分页优化：能用游标就用游标(WHERE id > last_id LIMIT n); 不能游标时用延迟关联——先定位主键再回表取整行。',
			summary,
			hlAll(3),
			4
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
