/**
 * M3.1 迁移 — SQL 左外连接 LEFT JOIN（原 LeftJoinEngine → 结果演化剧本）。
 */

import school from '../seeds/school.sql?raw';
import { createScriptedEngine, type ScriptSpec } from '../ScriptEngine';

export const LEFT_JOIN_FLOW_SPEC: ScriptSpec = {
	name: 'SQL 左外连接 LEFT JOIN',
	seedSql: school,
	stages: ['INNER 基线：无匹配即丢弃', 'LEFT JOIN：左表全保留', 'IS NULL：反查「没有匹配」的行'],
	frames: [
		{
			sql: 'SELECT 学生.姓名 AS 姓名, 选课.课程号 AS 课程号\nFROM "学生"\nJOIN "选课" ON 学生.学号 = 选课.学号\nORDER BY 学生.学号, 选课.课程号;',
			description: '内连接基线：只保留有选课的学生（5 行）',
			detail: '赵六、周八没有选课记录，在内连接中直接消失——这是对照的起点。',
			stage: 0,
			type: 'init',
			expected: {
				columns: ['姓名', '课程号'],
				rows: [
					['张三', 'C001'],
					['张三', 'C002'],
					['李四', 'C001'],
					['王五', 'C002'],
					['孙七', 'C001']
				]
			}
		},
		{
			sql: 'SELECT 学生.姓名 AS 姓名, 选课.课程号 AS 课程号\nFROM "学生"\nLEFT JOIN "选课" ON 学生.学号 = 选课.学号\nORDER BY 学生.学号, 选课.课程号;',
			description: 'LEFT JOIN：左表 6 人全部保留，赵六/周八右侧补 NULL',
			detail:
				'LEFT JOIN = 匹配成功的行 + 左表无匹配的行（右半部填 NULL）。「每个学生 + 其选课（可能没有）」这类问题必须用它。',
			stage: 1,
			type: 'edge-select',
			expected: {
				columns: ['姓名', '课程号'],
				rows: [
					['张三', 'C001'],
					['张三', 'C002'],
					['李四', 'C001'],
					['王五', 'C002'],
					['赵六', 'NULL'],
					['孙七', 'C001'],
					['周八', 'NULL']
				]
			},
			rowTags: { 4: '补NULL', 6: '补NULL' }
		},
		{
			sql: 'SELECT 学生.姓名 AS 姓名, 学生.专业 AS 专业\nFROM "学生"\nLEFT JOIN "选课" ON 学生.学号 = 选课.学号\nWHERE 选课.课程号 IS NULL\nORDER BY 学生.学号;',
			description: '经典套路：WHERE 右表 IS NULL → 反查「从未选课」的学生',
			detail:
				'补进来的 NULL 正是「无匹配」的标志。IS NULL 过滤后剩下的就是左表独有行——「找没下过单的用户」全是这个模式。',
			stage: 2,
			type: 'edge-select',
			expected: {
				columns: ['姓名', '专业'],
				rows: [
					['赵六', '网络工程'],
					['周八', '计算机']
				]
			},
			rowTags: { 0: '未选课', 1: '未选课' }
		},
		{
			sql: 'SELECT 学生.姓名 AS 姓名, COUNT(选课.课程号) AS 选课门数\nFROM "学生"\nLEFT JOIN "选课" ON 学生.学号 = 选课.学号\nGROUP BY 学生.姓名\nORDER BY 选课门数 DESC, 姓名;',
			description: 'LEFT JOIN + COUNT(右表列)：没选课的学生计 0 而非消失',
			detail:
				'数行数要用 COUNT(选课.课程号) 而不是 COUNT(*)——NULL 不被计数，赵六/周八才能得到 0；COUNT(*) 会把他们数成 1。',
			stage: 2,
			type: 'complete',
			expected: {
				columns: ['姓名', '选课门数'],
				rows: [
					['张三', 2],
					['孙七', 1],
					['李四', 1],
					['王五', 1],
					['周八', 0],
					['赵六', 0]
				]
			},
			rowTags: { 4: '0门', 5: '0门' }
		}
	],
	practiceQuestions: [
		{
			type: 'choose-next',
			stepIndex: 1,
			prompt: 'LEFT JOIN 与内连接的关键区别是什么？',
			options: ['速度快', '左表无匹配的行也保留，右半部补 NULL', '会去重', '右表全保留'],
			correctAnswer: '左表无匹配的行也保留，右半部补 NULL',
			hint: '「以左表为主」体现在哪？',
			explanation:
				'LEFT JOIN 保证左表行数视角完整：匹配的填数据，无匹配的右侧补 NULL——内连接则会丢弃这些行。'
		},
		{
			type: 'choose-next',
			stepIndex: 3,
			prompt: '统计每人选课门数时，为什么用 COUNT(选课.课程号) 而不是 COUNT(*)？',
			options: ['没有区别', 'COUNT(*) 会把 NULL 行也数成 1', 'COUNT 更快', '课程号是主键'],
			correctAnswer: 'COUNT(*) 会把 NULL 行也数成 1',
			hint: 'COUNT(列) 不数 NULL，COUNT(*) 数行',
			explanation:
				'赵六那行课程号为 NULL：COUNT(选课.课程号) 得 0（真实反映没选课），COUNT(*) 得 1（错误）。这是 LEFT JOIN 统计的经典陷阱。'
		}
	]
};

export function createLeftJoinFlowEngine() {
	return createScriptedEngine(LEFT_JOIN_FLOW_SPEC);
}
