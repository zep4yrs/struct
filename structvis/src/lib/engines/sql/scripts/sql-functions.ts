/**
 * M2.5 SQL 函数演练台 — 字符串 / 数值 / 日期 / NULL 处理四组常用函数。
 */

import seed from '../seeds/sql-functions.sql?raw';
import { createScriptedEngine, type ScriptSpec } from '../ScriptEngine';

export const SQL_FUNCTIONS_SPEC: ScriptSpec = {
	name: 'SQL 函数演练',
	seedSql: seed,
	stages: ['FROM：取原始行', '标量函数：逐行求值', 'COALESCE：NULL 兜底'],
	frames: [
		{
			sql: `SELECT 姓名, 邮箱,\n  UPPER(邮箱) AS 邮箱大写,\n  SUBSTR(邮箱, 1, INSTR(邮箱, '@') - 1) AS 账号名,\n  LENGTH(邮箱) AS 长度\nFROM "员工" ORDER BY 工号;`,
			description: '字符串函数：UPPER / INSTR 定位 @ / SUBSTR 截取账号 / LENGTH',
			detail:
				"INSTR(邮箱,'@') 返回 @ 的位置（1-based），减 1 得账号长度——配合 SUBSTR 拆出登录名，是字符串函数的经典组合拳。",
			stage: 1,
			type: 'init',
			expected: {
				columns: ['姓名', '邮箱', '邮箱大写', '账号名', '长度'],
				rows: [
					['张三', 'zhangsan@corp.com', 'ZHANGSAN@CORP.COM', 'zhangsan', 17],
					['李四', 'lisi@corp.com', 'LISI@CORP.COM', 'lisi', 13],
					['王五', 'wangwu@corp.com', 'WANGWU@CORP.COM', 'wangwu', 15],
					['赵六', 'zhaoliu@corp.com', 'ZHAOLIU@CORP.COM', 'zhaoliu', 16],
					['孙七', 'sunqi@corp.com', 'SUNQI@CORP.COM', 'sunqi', 14],
					['周八', 'zhouba@corp.com', 'ZHOUBA@CORP.COM', 'zhouba', 15]
				]
			}
		},
		{
			sql: `SELECT 姓名, 工资,\n  ROUND(工资 * 1.1, 1) AS 调薪后,\n  ABS(工资 - 10000) AS 距万元\nFROM "员工" ORDER BY 工号;`,
			description: '数值函数：ROUND 四舍五入 / ABS 绝对距离',
			detail: 'ROUND(x, 1) 保留 1 位小数；ABS 把「差多少」变成非负数，适合做偏差展示。',
			stage: 1,
			expected: {
				columns: ['姓名', '工资', '调薪后', '距万元'],
				rows: [
					['张三', 12000, 13200, 2000],
					['李四', 9000, 9900, 1000],
					['王五', 8500, 9350, 1500],
					['赵六', 9500, 10450, 500],
					['孙七', 7000, 7700, 3000],
					['周八', 15000, 16500, 5000]
				]
			}
		},
		{
			sql: `SELECT 姓名, 入职日,\n  strftime('%Y', 入职日) AS 入职年,\n  SUBSTR(入职日, 1, 7) AS 年月\nFROM "员工" ORDER BY 工号;`,
			description: '日期函数：strftime 取年份 / SUBSTR 取年月（ISO 日期即文本）',
			detail:
				'SQLite 把 ISO 日期存为 TEXT，strftime(「%Y」, 列) 提取年份；前 7 位用 SUBSTR 就是「年-月」。MySQL 对应 DATE_FORMAT，注意方言差异。',
			stage: 1,
			expected: {
				columns: ['姓名', '入职日', '入职年', '年月'],
				rows: [
					['张三', '2021-03-15', '2021', '2021-03'],
					['李四', '2022-07-01', '2022', '2022-07'],
					['王五', '2020-11-20', '2020', '2020-11'],
					['赵六', '2023-05-09', '2023', '2023-05'],
					['孙七', '2019-12-01', '2019', '2019-12'],
					['周八', '2024-02-18', '2024', '2024-02']
				]
			}
		},
		{
			sql: `SELECT 姓名, 奖金,\n  COALESCE(奖金, 0) AS 奖金兜底,\n  工资 + COALESCE(奖金, 0) AS 总收入\nFROM "员工" ORDER BY 工号;`,
			description: 'NULL 处理：COALESCE(奖金, 0) 把空奖金当 0 参与加法',
			detail:
				'任何值与 NULL 运算结果都是 NULL（李四直接 工资+奖金 会得 NULL）；COALESCE 返回第一个非 NULL 参数，是 NULL 兜底的标准写法。',
			stage: 2,
			type: 'complete',
			expected: {
				columns: ['姓名', '奖金', '奖金兜底', '总收入'],
				rows: [
					['张三', 5000, 5000, 17000],
					['李四', 'NULL', 0, 9000],
					['王五', 3000, 3000, 11500],
					['赵六', 'NULL', 0, 9500],
					['孙七', 2000, 2000, 9000],
					['周八', 8000, 8000, 23000]
				]
			},
			rowTags: { 1: '原NULL', 3: '原NULL' }
		}
	],
	practiceQuestions: [
		{
			type: 'choose-next',
			stepIndex: 3,
			prompt: '李四的 奖金 为 NULL，表达式 工资 + 奖金 的结果是？',
			options: ['9000', 'NULL', '0', '报错'],
			correctAnswer: 'NULL',
			hint: 'NULL 参与四则运算会怎样？',
			explanation:
				'NULL 表示「未知」，与任何数运算结果仍是未知（NULL）。所以要先 COALESCE(奖金, 0) 再参与计算。'
		},
		{
			type: 'choose-next',
			stepIndex: 0,
			prompt: "SUBSTR(邮箱, 1, INSTR(邮箱, '@') - 1) 对 'lisi@corp.com' 返回？",
			options: ['lisi', 'lisi@', 'corp.com', 'lisi@corp'],
			correctAnswer: 'lisi',
			hint: 'INSTR 找到 @ 在第 5 位',
			explanation:
				"INSTR 返回 @ 的位置 5，减 1 得截取长度 4，SUBSTR 从第 1 位取 4 个字符 → 'lisi'。"
		}
	]
};

export function createSqlFunctionsEngine() {
	return createScriptedEngine(SQL_FUNCTIONS_SPEC);
}
