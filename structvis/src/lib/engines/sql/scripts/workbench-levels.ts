/**
 * SQL 工作台关卡定义 — /db/workbench 的关卡池（M-欠债清偿）。
 *
 * 每关 = 业务任务卡 + 判分器（纯函数，可单测）：
 * - result 判分：结果集对比（列名不敏感、行序可选、值归一化）
 * - plan 判分：EXPLAIN QUERY PLAN 输出含关键字（如 SEARCH）
 * - state 判分：执行 SQL 后查表状态对比
 * 过关 → recordExercise(topicId, true)；失败不回写（可无限重试）。
 * seed 复用 school.sql（学生/选课教材数据）。
 */

import school from '../seeds/school.sql?raw';

export type JudgeResult = { ok: boolean; reason: string };

export interface Level {
	id: number;
	title: string;
	task: string;
	hint: string;
	topicId: string;
	/** 知识点分组（工作台章节筛选：查询基础/连接查询/进阶查询/数据更新/索引优化/视图与约束/集合运算） */
	chapter: string;
	/** 判分：对用户 SQL 的执行结果（columns/rows）+ eqp 输出 + 库状态查询钩子 */
	judge: (ctx: {
		columns: string[];
		rows: (string | number)[][];
		eqp: string;
		queryTable: (sql: string) => { columns: string[]; rows: (string | number)[][] };
	}) => JudgeResult;
}

/** 值归一化：数字字符串转 number，NULL 串保留 */
function norm(v: string | number): string | number {
	if (typeof v === 'number') return v;
	const n = Number(v);
	return v !== '' && !Number.isNaN(n) ? n : v;
}

/** 结果集对比：列数相等 + 行集合相等（默认行序敏感可关） */
export function resultSetEquals(
	actual: { columns: string[]; rows: (string | number)[][] },
	expected: (string | number)[][],
	{ ordered = true } = {}
): boolean {
	const a = actual.rows.map((r) => r.map(norm));
	const e = expected.map((r) => r.map(norm));
	if (a.length !== e.length) return false;
	if (ordered) return a.every((r, i) => r.every((v, j) => v === e[i][j]));
	const key = (r: (string | number)[]) => JSON.stringify(r);
	const sa = a.map(key).sort();
	const se = e.map(key).sort();
	return sa.every((k, i) => k === se[i]);
}

export const WORKBENCH_SEED = school;

export const LEVELS: Level[] = [
	{
		id: 1,
		title: '第一关 · 筛出优等生',
		task: '查出成绩 ≥ 85 的学生姓名与成绩，按成绩从高到低排列。',
		hint: 'WHERE + ORDER BY ... DESC',
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ columns, rows }) => {
			const ok = resultSetEquals({ columns, rows }, [
				['周八', 95],
				['李四', 92],
				['张三', 88],
				['赵六', 85]
			]);
			return ok
				? { ok: true, reason: '完全正确！4 名优等生按序取出。' }
				: {
						ok: false,
						reason:
							'结果应为 周八95 / 李四92 / 张三88 / 赵六85（按成绩降序）——检查 WHERE 阈值与 ORDER BY。'
					};
		}
	},
	{
		id: 2,
		title: '第二关 · 各专业点名',
		task: '统计每个专业的学生人数，按人数从多到少、专业名升序排列。',
		hint: 'GROUP BY + COUNT(*) + 多键 ORDER BY',
		topicId: 'group-by',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['计算机', 3],
				['软件工程', 2],
				['网络工程', 1]
			]);
			return ok
				? { ok: true, reason: '分组统计正确：计算机 3 · 软件工程 2 · 网络工程 1。' }
				: { ok: false, reason: '期望 计算机3 / 软件工程2 / 网工1——人数降序，同数时专业名升序。' };
		}
	},
	{
		id: 3,
		title: '第三关 · 谁还没选课',
		task: '找出从未选课的学生姓名（含 0 门者），按学号升序。',
		hint: 'LEFT JOIN ... IS NULL',
		topicId: 'left-join',
		chapter: '连接查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [['赵六'], ['周八']]);
			return ok
				? { ok: true, reason: '反查成功：赵六与周八没有选课记录。' }
				: { ok: false, reason: '应为 赵六、周八——LEFT JOIN 后用 IS NULL 过滤右表空值。' };
		}
	},
	{
		id: 4,
		title: '第四关 · 让查询走索引',
		task: '为「学生」表的姓名列建一个索引，然后查询姓名 = 王五 的行。要求执行计划走 SEARCH（索引查找）而非 SCAN。',
		hint: 'CREATE INDEX ... 然后 SELECT（看右侧 EXPLAIN 面板）',
		topicId: 'index-fail',
		chapter: '索引优化',
		judge: ({ eqp }) => {
			const ok = eqp.includes('SEARCH') && !eqp.includes('SCAN 学生');
			return ok
				? { ok: true, reason: '执行计划命中索引（SEARCH）——优化生效！' }
				: {
						ok: false,
						reason: `当前计划仍是全表扫描（${eqp.slice(0, 60)}…）——先 CREATE INDEX 再查。`
					};
		}
	},
	{
		id: 5,
		title: '第五关 · 给软工涨分',
		task: '给所有软件工程专业的学生加 5 分（UPDATE），然后查出软工学生的姓名与成绩（按学号升序）验证。',
		hint: 'UPDATE ... WHERE；验证查询 SELECT ... ORDER BY 学号',
		topicId: 'update',
		chapter: '数据更新',
		judge: ({ queryTable }) => {
			const r = queryTable("SELECT 姓名, 成绩 FROM 学生 WHERE 专业='软件工程' ORDER BY 学号");
			const ok = resultSetEquals(r, [
				['李四', 97],
				['孙七', 68]
			]);
			return ok
				? { ok: true, reason: '更新成功：李四 92→97 · 孙七 63→68。' }
				: {
						ok: false,
						reason: `软工成绩应为 李四97 / 孙七68（当前：${JSON.stringify(r.rows)}）——UPDATE 记得 WHERE 专业限定。`
					};
		}
	},
	{
		id: 6,
		title: '第六关 · 窗口函数排名',
		task: '用窗口函数给全部学生按成绩排名（同分同名次），输出姓名、成绩、名次，按名次升序。',
		hint: 'RANK() OVER (ORDER BY 成绩 DESC)',
		topicId: 'window-function',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['周八', 95, 1],
				['李四', 92, 2],
				['张三', 88, 3],
				['赵六', 85, 4],
				['王五', 76, 5],
				['孙七', 63, 6]
			]);
			return ok
				? { ok: true, reason: 'RANK 排名正确——窗口函数入门达成。' }
				: {
						ok: false,
						reason: '期望 6 行：周八95/1 · 李四92/2 · 张三88/3 · 赵六85/4 · 王五76/5 · 孙七63/6。'
					};
		}
	},
	{
		id: 7,
		title: '第七关 · 并集体检',
		task: '查出「选了 C001 或选了 C002 的学生姓名」并去重，按姓名排序。',
		hint: '两个 WHERE 用 UNION 连接',
		topicId: 'union-set',
		chapter: '集合运算',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [['张三'], ['李四'], ['王五'], ['孙七']], {
				ordered: true
			});
			return ok
				? { ok: true, reason: 'UNION 去重正确：张三/李四/王五/孙七。' }
				: { ok: false, reason: '应为 张三、李四、王五、孙七（UNION 自动去重）。' };
		}
	},
	{
		id: 8,
		title: '第八关 · HAVING 之门',
		task: '统计每个专业的平均成绩，只保留平均分 ≥ 80 的专业，按平均分降序。',
		hint: 'GROUP BY + AVG + HAVING',
		topicId: 'having-deep',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok =
				resultSetEquals({ columns: [], rows }, [
					['计算机', 86],
					['网络工程', 85]
				]) ||
				resultSetEquals({ columns: [], rows }, [
					['计算机', 86.3],
					['网络工程', 85]
				]);
			return ok
				? { ok: true, reason: 'HAVING 过滤正确：计算机与网络工程达标。' }
				: { ok: false, reason: '期望 计算机(≈86) / 网络工程(85)——HAVING 作用于分组后。' };
		}
	},
	{
		id: 9,
		title: '第九关 · 高于平均分',
		task: '用子查询查出成绩高于全体平均分的学生姓名与成绩（不限顺序）。',
		hint: 'WHERE 成绩 > (SELECT AVG(成绩) FROM 学生)',
		topicId: 'subquery',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals(
				{ columns: [], rows },
				[
					['张三', 88],
					['李四', 92],
					['赵六', 85],
					['周八', 95]
				],
				{ ordered: false }
			);
			return ok
				? { ok: true, reason: '子查询正确：4 人高于全体平均（约 83.2）。' }
				: { ok: false, reason: '应为 张三88 / 李四92 / 赵六85 / 周八95——平均分先在里层算出来。' };
		}
	},
	{
		id: 10,
		title: '第十关 · 每门课几人选',
		task: '统计每门课程的课程号与选课人数，按课程号升序。',
		hint: '选课表 GROUP BY 课程号 + COUNT(*)',
		topicId: 'join',
		chapter: '连接查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['C001', 3],
				['C002', 2]
			]);
			return ok
				? { ok: true, reason: '统计正确：C001 三人、C002 两人。' }
				: { ok: false, reason: '期望 C001→3 人、C002→2 人——只统计选课表即可。' };
		}
	},
	{
		id: 11,
		title: '第十一关 · 成绩分档',
		task: '按成绩给学生分档：大于等于 90 优秀、大于等于 80 良好、其余待提高。输出档名与人数，不限顺序。',
		hint: 'CASE WHEN 成绩>=90 THEN ... END AS 档次，再 GROUP BY 档次',
		topicId: 'case-expr',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals(
				{ columns: [], rows },
				[
					['优秀', 2],
					['良好', 2],
					['待提高', 2]
				],
				{ ordered: false }
			);
			return ok
				? { ok: true, reason: '分档正确：优秀 2 · 良好 2 · 待提高 2。' }
				: { ok: false, reason: '期望 优秀/良好/待提高 各 2 人——CASE 分段别漏 ELSE。' };
		}
	},
	{
		id: 12,
		title: '第十二关 · 翻到第二页',
		task: '查有选课记录的不同学号（升序），每页 2 条，取第二页。',
		hint: 'SELECT DISTINCT 学号 ... ORDER BY 学号 LIMIT 2 OFFSET 2',
		topicId: 'distinct-paging',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [[20103], [20105]]);
			return ok
				? { ok: true, reason: '分页正确：第二页是 20103、20105。' }
				: { ok: false, reason: '应为 20103、20105——先 DISTINCT 去重排序，再 LIMIT 2 OFFSET 2。' };
		}
	},
	{
		id: 13,
		title: '第十三关 · 清理低分记录',
		task: '从选课表删除成绩低于 70 的选课记录，然后查剩余选课记录数。',
		hint: 'DELETE FROM 选课 WHERE 成绩 < 70；再 SELECT COUNT(*)',
		topicId: 'update',
		chapter: '数据更新',
		judge: ({ queryTable }) => {
			const r = queryTable('SELECT COUNT(*) FROM 选课');
			const ok = resultSetEquals(r, [[4]]);
			return ok
				? { ok: true, reason: '删除成功：那条 60 分的选课记录已清理，剩 4 条。' }
				: {
						ok: false,
						reason: `剩余应为 4 条（当前 ${JSON.stringify(r.rows)}）——条件是 成绩 < 70。`
					};
		}
	},
	{
		id: 14,
		title: '第十四关 · 优秀生视图',
		task: '创建视图 v_good（成绩不低于 85 的学生姓名与成绩），再从视图查出全部行，按成绩降序。',
		hint: 'CREATE VIEW v_good AS SELECT ...；再 SELECT * FROM v_good ORDER BY 成绩 DESC',
		topicId: 'view',
		chapter: '视图与约束',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['周八', 95],
				['李四', 92],
				['张三', 88],
				['赵六', 85]
			]);
			return ok
				? { ok: true, reason: '视图创建并查询成功——虚拟表用起来和真表一样。' }
				: { ok: false, reason: '期望 4 行按成绩降序——视图里 WHERE 成绩 >= 85。' };
		}
	},
	{
		id: 15,
		title: '第十五关 · 带约束建表',
		task: '建一张「报名」表：考号 INTEGER PRIMARY KEY、姓名 TEXT NOT NULL；插入一行 (20107, 吴九)，然后查报名表全部行。',
		hint: 'CREATE TABLE 报名(考号 INTEGER PRIMARY KEY, 姓名 TEXT NOT NULL)；INSERT 后 SELECT',
		topicId: 'constraints',
		chapter: '视图与约束',
		judge: ({ queryTable }) => {
			const r = queryTable('SELECT 考号, 姓名 FROM 报名');
			const ok = resultSetEquals(r, [[20107, '吴九']]);
			return ok
				? { ok: true, reason: '建表与插入成功——主键与 NOT NULL 约束生效。' }
				: {
						ok: false,
						reason: `报名表应为 20107/吴九（当前 ${JSON.stringify(r.rows)}）——先建表再插入。`
					};
		}
	},
	{
		id: 16,
		title: '第十六关 · 让连接走索引',
		task: '为选课表的学号列建索引，然后连接查询每个学生的姓名与选课成绩。要求执行计划出现 SEARCH。',
		hint: 'CREATE INDEX idx ON 选课(学号)；再 学生 JOIN 选课 ON 学号',
		topicId: 'explain-detail',
		chapter: '索引优化',
		judge: ({ rows, eqp }) => {
			const ok = rows.length === 5 && eqp.includes('SEARCH');
			return ok
				? { ok: true, reason: '连接计划命中索引（SEARCH），5 条选课成绩全部取出。' }
				: {
						ok: false,
						reason: `期望 5 行且计划含 SEARCH（当前 ${rows.length} 行）——先建索引再看右侧计划。`
					};
		}
	},
	{
		id: 17,
		title: '第十七关 · 各专业状元',
		task: '查每个专业的最高成绩，按最高分降序排列。',
		hint: 'GROUP BY 专业 + MAX(成绩)',
		topicId: 'group-by',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['计算机', 95],
				['软件工程', 92],
				['网络工程', 85]
			]);
			return ok
				? { ok: true, reason: '聚合正确：计算机 95 · 软工 92 · 网工 85。' }
				: { ok: false, reason: '期望 计算机95 / 软工92 / 网工85——MAX 作用于组内成绩。' };
		}
	},
	{
		id: 18,
		title: '第十八关 · 指定专业名单',
		task: '查软件工程和计算机两个专业的学号与姓名，按学号升序。',
		hint: 'WHERE 专业 IN (软件工程, 计算机)',
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals(
				{ columns: [], rows },
				[
					[20101, '张三'],
					[20102, '李四'],
					[20103, '王五'],
					[20105, '孙七'],
					[20106, '周八']
				],
				{ ordered: true }
			);
			return ok
				? { ok: true, reason: 'IN 集合查询正确：5 名两专业学生按学号列出。' }
				: { ok: false, reason: '应 5 行（除赵六外）——IN 里写两个专业名，注意引号。' };
		}
	},
	{
		id: 19,
		title: '第十九关 · 没选 C001 的人',
		task: '查没有选课程 C001 的学生学号与姓名（含没选任何课的），按学号升序。',
		hint: '学号 NOT IN (SELECT 学号 FROM 选课 WHERE 课程号 = C001)',
		topicId: 'subquery',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals(
				{ columns: [], rows },
				[
					[20103, '王五'],
					[20104, '赵六']
				],
				{ ordered: true }
			);
			return ok
				? { ok: true, reason: '排除正确：王五（只选 C002）与赵六（没选课）。' }
				: { ok: false, reason: '应为 王五、赵六——NOT IN 的子查询只筛 C001 的选课记录。' };
		}
	},
	{
		id: 20,
		title: '第二十关 · 姓张的同学',
		task: '查姓「张」的学生的学号与姓名。',
		hint: "WHERE 姓名 LIKE '张%'",
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [[20101, '张三']]);
			return ok
				? { ok: true, reason: 'LIKE 前缀匹配正确。' }
				: { ok: false, reason: '应为 20101 张三——LIKE 张% 只匹配姓张的。' };
		}
	}
];
