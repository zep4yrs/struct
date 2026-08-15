/**
 * SQL 左外连接引擎 — LeftJoinEngine
 *
 * 教材数据库篇：LEFT JOIN 保留左表所有行——右表匹配不到时，结果行右半部填 NULL。
 * 与内连接对比：内连接丢弃不匹配的左表行，左外连接保留。
 * 渲染用 sql-table：table 为逐步生长的结果表。
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
	'SELECT student.*, sc.cid, sc.score',
	'FROM student',
	'LEFT JOIN sc ON student.id = sc.sid',
	'',
	'// 执行过程',
	'for each row r in student:',
	'  for each row s in sc:',
	'    if r.id == s.sid then 输出合并行',
	'  end for',
	'  if 没有匹配 then 输出 (r, NULL, NULL)',
	'end for'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '左外连接（LEFT JOIN）与内连接的关键区别是什么？',
		options: [
			'左表所有行都保留，无匹配填 NULL',
			'只保留匹配行',
			'右表所有行都保留',
			'结果和笛卡尔积一样'
		],
		correctAnswer: '左表所有行都保留，无匹配填 NULL',
		hint: '左外连接以左表为主',
		explanation:
			'LEFT JOIN 以左表为主：左表每一行都会出现在结果中；右表没有匹配时，结果中右表字段填 NULL。RIGHT JOIN 相反，FULL JOIN 两边都保留。'
	}
];

const STUDENT: { id: number; name: string; dept: string }[] = [
	{ id: 20101, name: '张明', dept: '计算机' },
	{ id: 20102, name: '李华', dept: '软件工程' },
	{ id: 20103, name: '王芳', dept: '数学' },
	{ id: 20104, name: '赵强', dept: '计算机' }
];

const SC: { sid: number; cid: string; score: number }[] = [
	{ sid: 20101, cid: 'C01', score: 88 },
	{ sid: 20101, cid: 'C02', score: 92 },
	{ sid: 20102, cid: 'C01', score: 76 },
	{ sid: 20103, cid: 'C03', score: 85 }
];

export class LeftJoinEngine extends EngineBase<SqlTableData> {
	readonly name = 'SQL 左外连接 LEFT JOIN';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'左外连接：以左表 student 为主，每一行都保留。右表 sc 匹配不到时，结果行的右半部分填 NULL。'
		},
		{
			type: 'compare',
			narration: '取出左表的一行，去右表找匹配。'
		},
		{
			type: 'edge-candidate',
			narration: '比较右表一行的连接条件。'
		},
		{
			type: 'edge-select',
			narration: '匹配成功：合并进结果表。'
		},
		{
			type: 'edge-reject',
			narration: '右表没有匹配：左表行保留，右半部分填 NULL——这是与内连接最大的区别。'
		},
		{
			type: 'complete',
			narration:
				'左外连接完成：左表 4 行全部在结果中。和内连接对比，赵强虽然没有选课记录，但他的行仍然出现，只是课程和分数为 NULL。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: 'student LEFT JOIN sc' }];

	customConfig: EngineCustomConfig = { title: '连接查询', fields: [] };

	applyPreset(_name: string): void {
		this.init();
	}

	applyCustom(): void {
		this.init();
	}

	init(): void {
		this.steps = [];
		this._stepId = 0;

		const cols = ['id', 'name', 'dept', 'cid', 'score'];
		const resultRows: (string | number)[][] = [];

		this._emit(
			'init',
			'准备执行：SELECT ... FROM student LEFT JOIN sc ON student.id = sc.sid。',
			cols,
			resultRows,
			[]
		);

		for (let i = 0; i < STUDENT.length; i++) {
			const s = STUDENT[i];
			this._emit(
				'compare',
				'取左表第 ' + (i + 1) + ' 行：' + s.name + '（学号 ' + s.id + '）。',
				cols,
				resultRows,
				[]
			);
			let matched = false;
			for (let j = 0; j < SC.length; j++) {
				const c = SC[j];
				this._emit(
					'edge-candidate',
					'比较 sc 第 ' +
						(j + 1) +
						' 行：sid = ' +
						c.sid +
						' 与 ' +
						s.id +
						(s.id === c.sid ? ' 相等' : ' 不等') +
						'。',
					cols,
					resultRows,
					[]
				);
				if (s.id === c.sid) {
					resultRows.push([s.id, s.name, s.dept, c.cid, c.score]);
					this._emit(
						'edge-select',
						'匹配成功：' + s.name + ' 选了 ' + c.cid + '（' + c.score + ' 分）。',
						cols,
						resultRows,
						['match']
					);
					matched = true;
				}
			}
			if (!matched) {
				resultRows.push([s.id, s.name, s.dept, 'NULL', 'NULL']);
				this._emit(
					'edge-reject',
					s.name + '（学号 ' + s.id + '）没有选课记录：左外连接仍保留该行，右半部分填 NULL。',
					cols,
					resultRows,
					['match']
				);
			}
		}

		this._emit(
			'complete',
			'左外连接完成：结果 ' + resultRows.length + ' 行（左表 4 行全部保留，无匹配行补 NULL）。',
			cols,
			resultRows,
			[]
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		columns: string[],
		rows: (string | number)[][],
		marks: string[]
	): void {
		const highlights: Highlight[] = [];
		if (marks.includes('match'))
			highlights.push({ type: 'current', indices: [Math.max(0, rows.length - 1)] });
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
