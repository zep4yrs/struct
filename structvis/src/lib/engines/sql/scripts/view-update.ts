/**
 * M2.12 视图更新限制 — 视图默认只读 → INSTEAD OF 触发器打通写入 →
 * 数据真正落在基础表。MySQL 的 WITH CHECK OPTION 方言差异在 detail 中对照说明。
 */

import seed from '../seeds/view-update.sql?raw';
import { createScriptedEngine, type ScriptSpec } from '../ScriptEngine';

export const VIEW_UPDATE_SPEC: ScriptSpec = {
	name: '视图更新限制',
	seedSql: seed,
	stages: [
		'CREATE VIEW：虚表不存数据',
		'只读限制：直接写视图被拒绝',
		'INSTEAD OF：把写操作翻译回基础表'
	],
	frames: [
		{
			sql: 'SELECT * FROM "数学好成绩" ORDER BY 学号;',
			description: '视图查询：数学 80 分以上 → 当前只有张三一行',
			detail:
				'视图是「存起来的 SELECT」：不占存储，每次查询实时计算。WHERE 课程=数学 AND 分数>=80 是它的过滤基因。',
			stage: 0,
			type: 'init',
			expected: { columns: ['学号', '课程', '分数'], rows: [[1, '数学', 90]] }
		},
		{
			sql: "SELECT COUNT(*) AS 库中视图对象数\nFROM sqlite_master\nWHERE type = 'view';",
			description: '视图在数据字典里只是一段 SQL 文本（sqlite_master）',
			detail:
				'查 sqlite_master 可见视图本质：一条 CREATE VIEW 语句 + 名字。MySQL 里对应 information_schema.views。',
			stage: 0,
			expected: { columns: ['库中视图对象数'], rows: [[1]] }
		},
		{
			sql: "SELECT CASE WHEN (SELECT COUNT(*) FROM sqlite_master\n              WHERE type = 'trigger' AND tbl_name = '数学好成绩') = 0\n      THEN '视图默认只读：直接 INSERT / UPDATE 会被拒绝'\n      ELSE '已挂 INSTEAD OF 触发器，可以写入' END AS 写入状态;",
			description: '只读限制：没有 INSTEAD OF 触发器时，写视图直接报错',
			detail:
				'SQLite 中视图默认只读——INSERT INTO 视图 会报「cannot modify 视图 because it is a view」。MySQL 的简单视图可直接更新，且用 WITH CHECK OPTION 保证写入行仍在视图可见范围内（SQLite 无此子句，属方言差异）。',
			stage: 1,
			type: 'edge-select',
			expected: {
				columns: ['写入状态'],
				rows: [['视图默认只读：直接 INSERT / UPDATE 会被拒绝']]
			}
		},
		{
			sql: 'CREATE TRIGGER "数学好成绩_写入"\nINSTEAD OF INSERT ON "数学好成绩"\nBEGIN\n  INSERT INTO "成绩" (学号, 课程, 分数) VALUES (NEW.学号, NEW.课程, NEW.分数);\nEND;\nSELECT \'INSTEAD OF 触发器已创建\' AS 结果;',
			description: 'INSTEAD OF 触发器：把「写视图」翻译成「写基础表」',
			detail:
				'INSTEAD OF 的语义是「代替」：对视图的 INSERT 不再被拒绝，而是执行触发器体里的语句。怎么写、写到哪里，完全由触发器定义决定。',
			stage: 2,
			type: 'edge-select',
			expected: { columns: ['结果'], rows: [['INSTEAD OF 触发器已创建']] }
		},
		{
			sql: 'INSERT INTO "数学好成绩" VALUES (3, \'数学\', 95);\nSELECT * FROM "数学好成绩" ORDER BY 学号;',
			description: '经视图插入成功：学号 3 · 95 分出现在视图中',
			detail:
				'95 >= 80 满足视图的 WHERE，所以插入后立刻可见；若经视图写入 60 分（MySQL WITH CHECK OPTION 会拒绝），SQLite 只要不写检查逻辑就会插进基础表却永远看不见——这正是「可更新视图」的核心考点。',
			stage: 2,
			type: 'edge-select',
			expected: {
				columns: ['学号', '课程', '分数'],
				rows: [
					[1, '数学', 90],
					[3, '数学', 95]
				]
			},
			rowTags: { 1: '新插入' }
		},
		{
			sql: 'SELECT * FROM "成绩" ORDER BY 学号, 课程;',
			description: '验证：基础表「成绩」多了一行——数据真正落在基础表',
			detail: '视图本身永远不存数据：经视图写入的行落在基础表里。这就是「视图是虚表」的完整闭环。',
			stage: 2,
			type: 'complete',
			expected: {
				columns: ['学号', '课程', '分数'],
				rows: [
					[1, '数学', 90],
					[1, '英语', 85],
					[2, '数学', 75],
					[2, '英语', 60],
					[3, '数学', 95]
				]
			},
			rowTags: { 4: '经视图新增' }
		}
	],
	practiceQuestions: [
		{
			type: 'choose-next',
			stepIndex: 2,
			prompt: 'SQLite 里不挂触发器直接 INSERT INTO 视图，会发生什么？',
			options: ['插入成功', '报错：视图默认只读', '插入到 sqlite_master', '自动建基础表'],
			correctAnswer: '报错：视图默认只读',
			hint: '视图自己不存数据，写入没有落点',
			explanation:
				'视图是虚表，没有存储位置。SQLite 直接报错拒绝；想打通必须定义 INSTEAD OF 触发器来「代替」执行写入。'
		},
		{
			type: 'choose-next',
			stepIndex: 5,
			prompt: '经视图插入的 95 分那一行，实际存储在哪里？',
			options: ['视图里', '基础表「成绩」里', 'sqlite_master 里', '临时表里'],
			correctAnswer: '基础表「成绩」里',
			hint: '视图是虚表，永远不存数据',
			explanation:
				'INSTEAD OF 触发器把插入翻译成对基础表的 INSERT。最后一帧查询基础表可见新行——视图只是看数据的窗口。'
		}
	]
};

export function createViewUpdateEngine() {
	return createScriptedEngine(VIEW_UPDATE_SPEC);
}
