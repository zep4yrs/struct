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
	}
];
