/**
 * SQL 内连接（JOIN）引擎 — JoinEngine
 *
 * 教材数据库篇：SELECT ... FROM student JOIN sc ON student.id = sc.sid。
 * 内连接 = 拿左表每一行去右表找匹配行（嵌套循环），匹配成功的行对合并进结果表。
 * 渲染用 sql-table：table 为逐步生长的结果表，highlights.current 标记刚匹配的行。
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
	'JOIN sc ON student.id = sc.sid',
	'',
	'// 执行过程（嵌套循环连接）',
	'for each row r in student:',
	'  for each row s in sc:',
	'    if r.id == s.sid then',
	'      输出合并行 (r, s)',
	'    end if',
	'  end for',
	'end for'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: '内连接（INNER JOIN）的结果集包含哪些行？',
		options: ['左右表匹配成功的行对', '左表所有行', '右表所有行', '左右表全部行的笛卡尔积'],
		correctAnswer: '左右表匹配成功的行对',
		hint: '不匹配的行不会出现在结果中',
		explanation:
			'内连接只保留满足 ON 条件的行对：左表某行在右表找不到匹配就丢弃，右表没有左表匹配的行也不出现。外连接（LEFT/RIGHT）才会保留不匹配的行。'
	}
];

// 教材示例数据
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
	{ sid: 20103, cid: 'C03', score: 85 },
	{ sid: 20105, cid: 'C01', score: 63 } // 20105 在 student 中不存在 → 不匹配
];

export class JoinEngine extends EngineBase<SqlTableData> {
	readonly name = 'SQL 内连接 JOIN';
	readonly renderType = 'sql-table' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'内连接（INNER JOIN）：拿左表 student 的每一行，去右表 sc 中找学号相同的行，匹配成功的行对合并为结果的一行。'
		},
		{
			type: 'compare',
			narration: '取出左表的一行，准备与右表的每一行比较连接条件。'
		},
		{
			type: 'edge-candidate',
			narration: '拿右表的一行做匹配：比较学号是否相等。'
		},
		{
			type: 'edge-select',
			narration: '匹配成功！左右两行合并，追加到结果表中。'
		},
		{
			type: 'edge-reject',
			narration: '不匹配，跳过这一行，继续比较右表的下一行。'
		},
		{
			type: 'complete',
			narration:
				'内连接完成：结果集包含所有匹配成功的行对。注意赵强的学号 20105 没有选课记录，而 sc 中的 20105 在 student 中不存在——两边不匹配的行都被丢弃。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: 'student ⋈ sc（学号相等）' }];

	customConfig: EngineCustomConfig = {
		title: '连接查询',
		fields: []
	};

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

		// 初始：空结果表
		this._emit(
			'init',
			'准备执行：SELECT ... FROM student JOIN sc ON student.id = sc.sid。',
			cols,
			resultRows,
			[]
		);

		for (let i = 0; i < STUDENT.length; i++) {
			const s = STUDENT[i];
			this._emit(
				'compare',
				'取左表第 ' + (i + 1) + ' 行：' + s.name + '（学号 ' + s.id + '），去右表 sc 找匹配。',
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
					[s.id === c.sid ? 'match' : 'skip']
				);
				if (s.id === c.sid) {
					resultRows.push([s.id, s.name, s.dept, c.cid, c.score]);
					this._emit(
						'edge-select',
						'匹配成功：' + s.name + ' 选了 ' + c.cid + '（' + c.score + ' 分），合并进结果表。',
						cols,
						resultRows,
						['match']
					);
					matched = true;
				} else {
					this._emit(
						'edge-reject',
						'sid 不等，跳过 sc 第 ' + (j + 1) + ' 行。',
						cols,
						resultRows,
						[]
					);
				}
			}
			if (!matched) {
				this._emit(
					'edge-reject',
					s.name + '（学号 ' + s.id + '）没有选课记录，内连接中整行丢弃。',
					cols,
					resultRows,
					[]
				);
			}
		}

		this._emit(
			'complete',
			'内连接完成：结果 ' +
				resultRows.length +
				' 行。student 与 sc 中不匹配的行（无选课记录 / 学号不存在）都不在结果中。',
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
		if (marks.includes('skip')) highlights.push({ type: 'compare', indices: [] });
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
