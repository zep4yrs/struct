/**
 * SQL GROUP BY 聚合引擎 — GroupByEngine
 *
 * 教材数据库篇：SELECT dept, COUNT(*) FROM student GROUP BY dept。
 * 逐步展示分组过程：扫描每行 → 归入对应分组 → 组内计数 → 输出分组结果表。
 * 渲染用 sql-table：table 为分组结果表（逐步生长）。
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
	'SELECT dept, COUNT(*) AS 人数',
	'FROM student',
	'GROUP BY dept',
	'',
	'// 执行过程',
	'for each row r in student:',
	'  把 r.dept 加入分组',
	'  该组人数 + 1',
	'end for',
	'输出每个分组 (dept, 人数)'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: 'GROUP BY dept 之后，SELECT 列表中能出现哪些列？',
		options: ['分组列 dept 和聚合函数', '任意列', '只有 COUNT(*)', '所有原始列'],
		correctAnswer: '分组列 dept 和聚合函数',
		hint: '分组后每行代表一个组',
		explanation:
			'GROUP BY 之后每个分组只输出一行，所以 SELECT 列表只能包含分组列（dept）和聚合函数（COUNT/SUM/AVG 等）。其他列无法确定取哪一行，MySQL 默认会报错。'
	}
];

const STUDENT: { id: number; name: string; dept: string }[] = [
	{ id: 20101, name: '张明', dept: '计算机' },
	{ id: 20102, name: '李华', dept: '软件工程' },
	{ id: 20103, name: '王芳', dept: '数学' },
	{ id: 20104, name: '赵强', dept: '计算机' },
	{ id: 20105, name: '钱进', dept: '软件工程' },
	{ id: 20106, name: '孙丽', dept: '计算机' }
];

export class GroupByEngine extends EngineBase<SqlTableData> {
	readonly name = 'SQL 分组聚合 GROUP BY';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'分组聚合：把 student 表按院系分组，统计每个院系的人数。分组后每个组输出一行：分组列 + 聚合函数结果。'
		},
		{
			type: 'compare',
			narration: '扫描一行记录，看它属于哪个分组。'
		},
		{
			type: 'edge-candidate',
			narration: '该院系已存在分组：组内人数加一。'
		},
		{
			type: 'edge-select',
			narration: '新院系：创建新分组，人数从 1 开始。'
		},
		{
			type: 'complete',
			narration:
				'分组完成：每个院系一行，显示人数。注意分组后只能输出分组列和聚合结果——这是 GROUP BY 的语法约束。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '教材示例', description: 'SELECT dept, COUNT(*) ... GROUP BY dept' }
	];

	customConfig: EngineCustomConfig = { title: '分组查询', fields: [] };

	applyPreset(_name: string): void {
		this.init();
	}

	applyCustom(): void {
		this.init();
	}

	init(): void {
		this.steps = [];
		this._stepId = 0;

		const cols = ['dept', '人数'];
		const resultRows: (string | number)[][] = [];

		// 初始：显示原始 student 表（输入数据），与旧引擎"先读表"一致
		const srcCols = ['id', 'name', 'dept'];
		const srcRows: (string | number)[][] = STUDENT.map((s) => [s.id, s.name, s.dept]);
		this._emit(
			'init',
			'准备执行：SELECT dept, COUNT(*) FROM student GROUP BY dept。原始表 ' +
				STUDENT.length +
				' 行。',
			srcCols,
			srcRows,
			[]
		);

		const groups = new Map<string, number>();
		for (let i = 0; i < STUDENT.length; i++) {
			const s = STUDENT[i];
			this._emit(
				'compare',
				'扫描第 ' + (i + 1) + ' 行：' + s.name + '（' + s.dept + '）。',
				cols,
				resultRows,
				[]
			);
			const count = groups.get(s.dept) ?? 0;
			if (count === 0) {
				groups.set(s.dept, 1);
				this._emit('edge-select', s.dept + ' 是新分组：人数 = 1。', cols, resultRows, []);
			} else {
				groups.set(s.dept, count + 1);
				this._emit(
					'edge-candidate',
					s.dept + ' 分组已存在：人数 ' + count + ' → ' + (count + 1) + '。',
					cols,
					resultRows,
					[]
				);
			}
			// 更新结果表（按首次出现顺序）
			resultRows.length = 0;
			for (const [d, c] of groups) resultRows.push([d, c]);
		}

		this._emit('complete', '分组完成：共 ' + groups.size + ' 个院系。', cols, resultRows, []);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		columns: string[],
		rows: (string | number)[][],
		_marks: string[]
	): void {
		const highlights: Highlight[] = [];
		if (rows.length > 0) highlights.push({ type: 'current', indices: [rows.length - 1] });
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
