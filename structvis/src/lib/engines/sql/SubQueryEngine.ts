/**
 * SQL 子查询引擎 — SubQueryEngine
 *
 * 教材数据库篇：WHERE score > (SELECT AVG(score) FROM sc) 的执行过程。
 * 关键教学点：先执行子查询得到标量/集合，再供外层使用。
 * 渲染用 sql-table：table 为外层结果表（逐步过滤生长）。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType,
	SqlTableData
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';

const PSEUDO: string[] = [
	'SELECT name, score FROM sc',
	'WHERE score > (SELECT AVG(score) FROM sc)',
	'',
	'// 执行顺序',
	'1. 执行子查询：AVG(score)',
	'2. 得到标量值 avg',
	'3. 外层逐行比较 score > avg',
	'4. 输出满足条件的行'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '标量子查询的执行时机是？',
		options: ['和外层同时', '先于外层执行', '后于外层执行', '随机'],
		correctAnswer: '先于外层执行',
		hint: '外层 WHERE 需要子查询的结果',
		explanation:
			'标量子查询（返回单个值）先执行得到结果，外层查询再把它当作常量使用。相关子查询则每行执行一次，是例外。'
	}
];

const SC: { name: string; score: number }[] = [
	{ name: '张明', score: 88 },
	{ name: '李华', score: 92 },
	{ name: '王芳', score: 76 },
	{ name: '赵强', score: 85 },
	{ name: '钱进', score: 63 },
	{ name: '孙丽', score: 95 }
];

export class SubQueryEngine extends EngineBase<SqlTableData> {
	readonly name = 'SQL 子查询';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration: '子查询：先执行括号里的查询得到平均值，外层查询再用它过滤——分数大于平均分的同学。'
		},
		{
			type: 'compare',
			narration: '执行子查询：计算所有分数的平均值。'
		},
		{
			type: 'edge-candidate',
			narration: '外层逐行比较：该行分数是否大于平均分？'
		},
		{
			type: 'edge-select',
			narration: '大于平均分：该行进入结果集。'
		},
		{
			type: 'edge-reject',
			narration: '不大于平均分：该行被过滤掉。'
		},
		{
			type: 'complete',
			narration:
				'查询完成。子查询先执行（得到 AVG = 83.2），外层 SELECT 用这个常量过滤——这是非相关子查询的标准执行顺序。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '分数 > 平均分' }];

	customConfig: EngineCustomConfig = { title: '子查询演示', fields: [] };

	applyPreset(_name: string): void {
		this.init();
	}

	applyCustom(): void {
		this.init();
	}

	init(): void {
		this.steps = [];
		this._stepId = 0;

		const cols = ['name', 'score'];
		const resultRows: (string | number)[][] = [];

		// 初始：显示原始 sc 表（输入数据），与旧引擎"先读表"一致
		const srcRows: (string | number)[][] = SC.map((s) => [s.name, s.score]);
		this._emit(
			'init',
			'准备执行：SELECT name, score FROM sc WHERE score > (SELECT AVG(score) FROM sc)。原始表 ' +
				SC.length +
				' 行。',
			cols,
			srcRows,
			'init'
		);

		// 子查询：平均值
		const avg = SC.reduce((a, s) => a + s.score, 0) / SC.length;
		this._emit(
			'compare',
			'子查询执行：AVG(score) = ' +
				SC.map((s) => s.score).join(' + ') +
				' / ' +
				SC.length +
				' = ' +
				avg.toFixed(1) +
				'。',
			cols,
			resultRows,
			'init'
		);

		for (const s of SC) {
			if (s.score > avg) {
				resultRows.push([s.name, s.score]);
				this._emit(
					'edge-select',
					s.name + '（' + s.score + ' 分）> ' + avg.toFixed(1) + '：进入结果集。',
					cols,
					resultRows,
					'match'
				);
			} else {
				this._emit(
					'edge-reject',
					s.name + '（' + s.score + ' 分）≤ ' + avg.toFixed(1) + '：被过滤。',
					cols,
					resultRows,
					''
				);
			}
		}

		this._emit(
			'complete',
			'查询完成：' + resultRows.length + ' 名同学高于平均分。',
			cols,
			resultRows,
			''
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		columns: string[],
		rows: (string | number)[][],
		mark: string
	): void {
		const highlights: Highlight[] = [];
		if (mark === 'match' && rows.length > 0)
			highlights.push({ type: 'current', indices: [rows.length - 1] });
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine: 0,
			table: { columns, rows: rows.map((r) => [...r]) }
		});
	}
}
