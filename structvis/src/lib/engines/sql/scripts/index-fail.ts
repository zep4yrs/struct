/**
 * M2.9 索引失效实验 — 用真实 EXPLAIN QUERY PLAN 输出对照「命中 vs 失效」。
 * EQP 文本随 SQLite 版本可能微调；真实执行与静态帧不一致时自动回落静态帧（教学文案兜底）。
 */

import seed from '../seeds/index-fail.sql?raw';
import { createScriptedEngine, type ScriptSpec } from '../ScriptEngine';

const EQP_COLS = ['id', 'parent', 'notused', 'detail'];

export const INDEX_FAIL_SPEC: ScriptSpec = {
	name: '索引失效实验',
	seedSql: seed,
	stages: [
		'基线：命中索引（SEARCH）',
		'失效场景：函数包裹 / LIKE 前导 % / OR 无索引侧 / 跳过最左前缀',
		'小结：SEARCH vs SCAN 对照'
	],
	frames: [
		{
			sql: "EXPLAIN QUERY PLAN SELECT * FROM \"订单\" WHERE 区域 = '华东';",
			description: '基线：区域 = 常量 → SEARCH USING INDEX（索引命中）',
			detail:
				'EXPLAIN QUERY PLAN 是判别索引命中的唯一权威：看到 SEARCH = 按索引定位；看到 SCAN = 全表扫描。MySQL 的 EXPLAIN type 列（ref/range/ALL）是同一件事的另一种表述。',
			stage: 0,
			type: 'init',
			expected: {
				columns: EQP_COLS,
				rows: [[4, 0, 0, 'SEARCH 订单 USING INDEX idx_订单_区域 (区域=?)']]
			},
			rowTags: { 0: '命中索引' }
		},
		{
			sql: "EXPLAIN QUERY PLAN SELECT * FROM \"订单\" WHERE UPPER(区域) = '华东';",
			description: '失效① 函数包裹列：UPPER(区域) 让索引失效 → SCAN',
			detail:
				'索引存的是「区域」原值，对列套函数后必须逐行计算再比较，索引无从下手。解法：改为对常量做函数（区域 = LOWER(‘华东’) 的反向思路）或建函数索引（MySQL 8 函数索引）。',
			stage: 1,
			type: 'edge-select',
			expected: { columns: EQP_COLS, rows: [[3, 0, 0, 'SCAN 订单']] },
			rowTags: { 0: '全表扫描' }
		},
		{
			sql: "EXPLAIN QUERY PLAN SELECT * FROM \"订单\" WHERE 区域 LIKE '%东';",
			description: '失效② LIKE 前导 %：通配符打头 → SCAN',
			detail:
				'B+ 树按前缀有序组织，「%开头」意味着任意前缀都可能命中，只能全表扫。改成前缀匹配「华%」即可重新命中索引。',
			stage: 1,
			type: 'edge-select',
			expected: { columns: EQP_COLS, rows: [[3, 0, 0, 'SCAN 订单']] },
			rowTags: { 0: '全表扫描' }
		},
		{
			sql: "EXPLAIN QUERY PLAN SELECT * FROM \"订单\"\nWHERE 区域 = '华东' OR 金额 > 800;",
			description: '失效③ OR 另一侧无索引：整体退化为 SCAN',
			detail:
				'OR 要两侧都能走索引优化器才可能用 index merging；金额列没有索引，直接全表扫更划算。为 OR 两侧分别建索引（或改写为 UNION）才能救回。',
			stage: 1,
			type: 'edge-select',
			expected: { columns: EQP_COLS, rows: [[3, 0, 0, 'SCAN 订单']] },
			rowTags: { 0: '全表扫描' }
		},
		{
			sql: 'EXPLAIN QUERY PLAN SELECT * FROM "订单" WHERE 金额 > 800;',
			description: '失效④ 跳过联合索引最左前缀：只查金额 → SCAN',
			detail:
				'联合索引 (区域, 金额) 按「区域→金额」排序，跳过区域直接查金额等于查一本没有目录的书的第二章——最左前缀法则。需要建 (金额) 单列索引。',
			stage: 1,
			type: 'edge-select',
			expected: { columns: EQP_COLS, rows: [[3, 0, 0, 'SCAN 订单']] },
			rowTags: { 0: '全表扫描' }
		},
		{
			sql: "SELECT '区域 = 常量' AS 场景, 'SEARCH 命中索引' AS 计划\nUNION ALL SELECT '函数包裹列', 'SCAN 全表扫描'\nUNION ALL SELECT 'LIKE ''%xx''', 'SCAN 全表扫描'\nUNION ALL SELECT 'OR 另一侧无索引', 'SCAN 全表扫描'\nUNION ALL SELECT '跳过最左前缀', 'SCAN 全表扫描'\nORDER BY 场景;",
			description: '小结：五种场景的计划对照——SEARCH 一枝独秀',
			detail:
				'写完 SQL 别猜，跑一下 EXPLAIN QUERY PLAN（SQLite）/ EXPLAIN（MySQL）看计划。ORDER BY 场景让小结顺序稳定（按编码序）。',
			stage: 2,
			type: 'complete',
			expected: {
				columns: ['场景', '计划'],
				rows: [
					['LIKE %xx', 'SCAN 全表扫描'],
					['OR 另一侧无索引', 'SCAN 全表扫描'],
					['函数包裹列', 'SCAN 全表扫描'],
					['区域 = 常量', 'SEARCH 命中索引'],
					['跳过最左前缀', 'SCAN 全表扫描']
				]
			}
		}
	],
	practiceQuestions: [
		{
			type: 'choose-next',
			stepIndex: 1,
			prompt: '想让 WHERE UPPER(区域) = ? 走索引，下面哪种做法有效？',
			options: ['再加一个普通索引', '把函数移到常量一侧', '把列改成 TEXT', '多插几行数据'],
			correctAnswer: '把函数移到常量一侧',
			hint: '索引存的是列的原值',
			explanation:
				'对「列」套函数后索引失效；对「常量」套函数不影响。本例区域都是中文，UPPER 恒等——真实场景如邮箱应存小写或查询写 区域 = LOWER(?)。'
		},
		{
			type: 'choose-next',
			stepIndex: 4,
			prompt: '联合索引 (区域, 金额)， WHERE 金额 > 800 为什么不走索引？',
			options: ['金额是数字列', '违反最左前缀法则', '行数太少', '金额没有 WHERE 条件'],
			correctAnswer: '违反最左前缀法则',
			hint: '索引先按区域排序，再按金额排',
			explanation: '联合索引的排序键是（区域, 金额）：区域不同时金额无序。跳过区域列单独查金额，等于对无序数据做查找，只能全表扫描。'
		}
	]
};

export function createIndexFailEngine() {
	return createScriptedEngine(INDEX_FAIL_SPEC);
}
