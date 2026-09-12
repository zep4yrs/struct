/**
 * SQL 工作台关卡定义 — /db/workbench 的关卡池。
 *
 * 场景库 = express_station 校园快递驿站（对齐王晨阳老师 sql2026 教参第04讲：
 * 货架 shelves / 包裹 packages / 投诉 complaints），schema 与初始数据 1:1 对齐
 * 教参（MySQL→SQLite 方言翻译见 seeds/express-station.sql）。
 * 21 关按教参进度编排：查询基础(Q1-Q7) → 索引 → 进阶(Q9-Q15) → 连接(Q8/Q10/
 * Q12/任务19) → 数据更新(Part4 场景一/三/四) → 视图 → 集合(UNION)。
 *
 * 每关 = 业务任务卡 + 骨架 SQL（编辑器预填）+ 判分器（纯函数，可单测）：
 * - result 判分：结果集对比（列名不敏感、行序可选、值归一化）
 * - plan 判分：EXPLAIN QUERY PLAN 输出含关键字（如 SEARCH）
 * - state 判分：执行 SQL 后查表状态对比
 * 过关 → recordExercise(topicId, true)；失败不回写（可无限重试）。
 */

import expressStation from '../seeds/express-station.sql?raw';

export type JudgeResult = { ok: boolean; reason: string };

export interface Level {
	id: number;
	title: string;
	task: string;
	hint: string;
	/** 编辑器预填骨架（SQLite 方言，驿站库；注释占位不给答案） */
	sql: string;
	topicId: string;
	/** 知识点分组（工作台章节筛选） */
	chapter: string;
	/** 判分：对用户 SQL 的执行结果（columns/rows）+ eqp 输出 + 库状态查询钩子 */
	judge: (ctx: {
		columns: string[];
		rows: (string | number | null)[][];
		eqp: string;
		queryTable: (sql: string) => { columns: string[]; rows: (string | number | null)[][] };
	}) => JudgeResult;
}

/** 值归一化：数字字符串转 number，NULL 原样保留 */
function norm(v: string | number | null): string | number | null {
	if (typeof v === 'number') return v;
	const n = Number(v);
	return v !== '' && v !== null && !Number.isNaN(n) ? n : v;
}

/** 结果集对比：列数相等 + 行集合相等（默认行序敏感可关） */
export function resultSetEquals(
	actual: { columns: string[]; rows: (string | number | null)[][] },
	expected: (string | number | null)[][],
	{ ordered = true } = {}
): boolean {
	const a = actual.rows.map((r) => r.map(norm));
	const e = expected.map((r) => r.map(norm));
	if (a.length !== e.length) return false;
	if (ordered) return a.every((r, i) => r.every((v, j) => v === e[i][j]));
	const key = (r: (string | number | null)[]) => JSON.stringify(r);
	const sa = a.map(key).sort();
	const se = e.map(key).sort();
	return sa.every((k, i) => k === se[i]);
}

export const WORKBENCH_SEED = expressStation;

export const LEVELS: Level[] = [
	{
		id: 1,
		title: '第一关 · 待取件看板',
		task: '站长大屏：列出所有「待取件」包裹的快递单号与收件人，按到达时间先后排列。',
		hint: "WHERE status = '待取件' ORDER BY arrival_time ASC",
		sql: "SELECT tracking_no, recipient_name FROM packages\nWHERE /* 状态筛选 */\nORDER BY arrival_time ASC",
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['ZT2026001', '李四'],
				['YT2026001', '王五'],
				['SF2026002', '周八'],
				['YT2026002', '郑十'],
				['SF2026003', '张三'],
				['JD2026002', '李四'],
				['YD2026002', '林十二'],
				['ZT2026004', '赵六'],
				['YT2026003', '张三']
			]);
			return ok
				? { ok: true, reason: '9 件待取件按到达顺序上屏，看板就绪。' }
				: { ok: false, reason: '应为 9 行且按 arrival_time 升序——检查 WHERE status 与 ORDER BY 方向。' };
		}
	},
	{
		id: 2,
		title: '第二关 · 顺丰专场',
		task: '把顺丰的所有包裹整行调出（SELECT *），核对运单信息。',
		hint: "WHERE courier_company = '顺丰'",
		sql: 'SELECT * FROM packages\nWHERE /* 快递公司等值 */',
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				[1, 'SF2026001', '张三', '13800001111', 1, '顺丰', '已取件', '2026-03-25 09:00:00', '2026-03-25 14:30:00', '582916'],
				[6, 'SF2026002', '周八', '13800006666', 3, '顺丰', '待取件', '2026-03-26 09:00:00', null, '715384'],
				[9, 'SF2026003', '张三', '13800001111', 5, '顺丰', '待取件', '2026-03-26 11:00:00', null, '502847'],
				[13, 'SF2026004', '王五', '13800003333', 6, '顺丰', '已取件', '2026-03-24 09:00:00', '2026-03-24 18:00:00', '816394']
			]);
			return ok
				? { ok: true, reason: '4 件顺丰包裹全字段调出，明细无误。' }
				: { ok: false, reason: '应为 4 行（SF2026001/002/003/004）整行数据——SELECT * 且等值条件写对。' };
		}
	},
	{
		id: 3,
		title: '第三关 · 中通四连',
		task: '中通本周件量激增：列出所有单号以 ZT 开头的包裹的单号与收件人。',
		hint: "WHERE tracking_no LIKE 'ZT%'",
		sql: "SELECT tracking_no, recipient_name FROM packages\nWHERE tracking_no LIKE 'ZT%'",
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['ZT2026001', '李四'],
				['ZT2026002', '吴九'],
				['ZT2026003', '陈十一'],
				['ZT2026004', '赵六']
			]);
			return ok
				? { ok: true, reason: 'LIKE 前缀匹配命中 4 件中通。' }
				: { ok: false, reason: '应为 ZT2026001-004 四行——LIKE ZT% 只匹配单号前缀。' };
		}
	},
	{
		id: 4,
		title: '第四关 · 取件码反查',
		task: '学生凭取件码 502847 来找件：查出这个取件码对应的收件人姓名。',
		hint: "WHERE pickup_code = '502847'",
		sql: "SELECT recipient_name FROM packages\nWHERE pickup_code = '502847'",
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [['张三']]);
			return ok
				? { ok: true, reason: '反查成功：502847 是张三的件。' }
				: { ok: false, reason: '应只返回 张三——注意取件码是文本，要加引号。' };
		}
	},
	{
		id: 5,
		title: '第五关 · 一个人的所有件',
		task: '把收件人为「张三」的所有包裹整行列出。',
		hint: "WHERE recipient_name = '张三'",
		sql: "SELECT * FROM packages\nWHERE recipient_name = '张三'",
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				[1, 'SF2026001', '张三', '13800001111', 1, '顺丰', '已取件', '2026-03-25 09:00:00', '2026-03-25 14:30:00', '582916'],
				[9, 'SF2026003', '张三', '13800001111', 5, '顺丰', '待取件', '2026-03-26 11:00:00', null, '502847'],
				[15, 'YT2026003', '张三', '13800001111', 3, '圆通', '待取件', '2026-03-26 16:00:00', null, '657238']
			]);
			return ok
				? { ok: true, reason: '张三名下 3 件包裹全部调出。' }
				: { ok: false, reason: '应为 3 行（SF2026001/SF2026003/YT2026003）——收件人等值匹配。' };
		}
	},
	{
		id: 6,
		title: '第六关 · 在途超时预警',
		task: '以 2026-03-27 为基准日，找出「待取件」且到达已超过 1 天的包裹（单号+收件人）。SQLite 里日期差用 julianday(a) - julianday(b)。',
		hint: "julianday('2026-03-27') - julianday(arrival_time) > 1",
		sql: "SELECT tracking_no, recipient_name FROM packages\nWHERE status = '待取件'\n  AND julianday('2026-03-27') - julianday(arrival_time) > 1",
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['ZT2026001', '李四'],
				['YT2026001', '王五']
			]);
			return ok
				? { ok: true, reason: '2 件超时包裹预警成功（李四/王五）。' }
				: { ok: false, reason: '应为 ZT2026001 李四 与 YT2026001 王五——julianday 差值要 > 1。' };
		}
	},
	{
		id: 7,
		title: '第七关 · 群发取件通知',
		task: '给所有待取件包裹生成通知文案：形如【通知】李四，单号ZT2026001，取件码：173042（单列即可）。SQLite 拼接用 ||。',
		hint: "SELECT '【通知】' || recipient_name || '，单号' || tracking_no || '，取件码：' || pickup_code ...",
		sql: "SELECT '【通知】' || recipient_name || '，单号' || tracking_no || '，取件码：' || pickup_code\nFROM packages\nWHERE /* 状态筛选 */",
		topicId: 'sql',
		chapter: '查询基础',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['【通知】李四，单号ZT2026001，取件码：173042'],
				['【通知】王五，单号YT2026001，取件码：294518'],
				['【通知】周八，单号SF2026002，取件码：715384'],
				['【通知】郑十，单号YT2026002，取件码：346172'],
				['【通知】张三，单号SF2026003，取件码：502847'],
				['【通知】李四，单号JD2026002，取件码：693157'],
				['【通知】林十二，单号YD2026002，取件码：275483'],
				['【通知】赵六，单号ZT2026004，取件码：429561'],
				['【通知】张三，单号YT2026003，取件码：657238']
			]);
			return ok
				? { ok: true, reason: '9 条通知文案拼接完成，|| 连接符用对了。' }
				: { ok: false, reason: '应为 9 条【通知】文案——字符串拼接用 ||（不是 CONCAT）。' };
		}
	},
	{
		id: 8,
		title: '第八关 · 给取件码建索引',
		task: '取件码反查是最高频操作：给 packages 的 pickup_code 建一个索引，然后按取件码 502847 查询。要求 EXPLAIN 里出现 SEARCH（索引查找）。',
		hint: 'CREATE INDEX idx_pickup ON packages(pickup_code) 然后查询（看右侧 EXPLAIN 面板）',
		sql: "-- 先建索引（分号分隔可多句）\nCREATE INDEX idx_pickup ON packages(pickup_code);\n\nSELECT * FROM packages WHERE pickup_code = '502847'",
		topicId: 'index-fail',
		chapter: '索引优化',
		judge: ({ eqp }) => {
			const ok = eqp.includes('SEARCH');
			return ok
				? { ok: true, reason: '执行计划命中索引（SEARCH）——取件码反查从此毫秒级。' }
				: { ok: false, reason: `计划仍是全表扫描（${eqp.slice(0, 60)}…）——先 CREATE INDEX 再查。` };
		}
	},
	{
		id: 9,
		title: '第九关 · 合作公司名录',
		task: '驿站对接了哪几家快递公司？去重列出 courier_company。',
		hint: 'SELECT DISTINCT ...',
		sql: 'SELECT DISTINCT courier_company FROM packages',
		topicId: 'distinct-paging',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['顺丰'],
				['中通'],
				['圆通'],
				['京东'],
				['韵达']
			]);
			return ok
				? { ok: true, reason: '5 家合作公司去重列出。' }
				: { ok: false, reason: '应为 顺丰/中通/圆通/京东/韵达 五行——DISTINCT 去重。' };
		}
	},
	{
		id: 10,
		title: '第十关 · 双雄专列',
		task: '找出「待取件」且快递公司为顺丰或京东的包裹（单号+快递公司）。IN 一下就够。',
		hint: "WHERE status = '待取件' AND courier_company IN ('顺丰', '京东')",
		sql: "SELECT tracking_no, courier_company FROM packages\nWHERE status = '待取件'\n  AND courier_company IN ('顺丰', '京东')",
		topicId: 'distinct-paging',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['SF2026002', '顺丰'],
				['SF2026003', '顺丰'],
				['JD2026002', '京东']
			]);
			return ok
				? { ok: true, reason: 'IN 列表过滤命中 3 件。' }
				: { ok: false, reason: '应为 3 行（两件顺丰+一件京东）——IN 括号里枚举多个值。' };
		}
	},
	{
		id: 11,
		title: '第十一关 · 单号区间盘点',
		task: '盘点 package_id 在 5 到 10 之间的包裹（编号+单号）。BETWEEN 含两端。',
		hint: 'WHERE package_id BETWEEN 5 AND 10',
		sql: 'SELECT package_id, tracking_no FROM packages\nWHERE package_id BETWEEN 5 AND 10',
		topicId: 'distinct-paging',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				[5, 'YD2026001'],
				[6, 'SF2026002'],
				[7, 'ZT2026002'],
				[8, 'YT2026002'],
				[9, 'SF2026003'],
				[10, 'JD2026002']
			]);
			return ok
				? { ok: true, reason: 'BETWEEN 区间盘点 6 件无误。' }
				: { ok: false, reason: '应为 package_id 5-10 共 6 行——BETWEEN 含边界。' };
		}
	},
	{
		id: 12,
		title: '第十二关 · 取件状态温馨提示',
		task: '列出待取件包裹的单号与取件时间；没取过的用「尚未取件」占位。空值兜底用 COALESCE。',
		hint: "SELECT tracking_no, COALESCE(pickup_time, '尚未取件') ...",
		sql: "SELECT tracking_no, COALESCE(pickup_time, '尚未取件') FROM packages\nWHERE status = '待取件'",
		topicId: 'sql-functions',
		chapter: '进阶查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['ZT2026001', '尚未取件'],
				['YT2026001', '尚未取件'],
				['SF2026002', '尚未取件'],
				['YT2026002', '尚未取件'],
				['SF2026003', '尚未取件'],
				['JD2026002', '尚未取件'],
				['YD2026002', '尚未取件'],
				['ZT2026004', '尚未取件'],
				['YT2026003', '尚未取件']
			]);
			return ok
				? { ok: true, reason: 'COALESCE 空值兜底 9 行全部命中。' }
				: { ok: false, reason: '应为 9 行且第二列全为 尚未取件——COALESCE(pickup_time, ...)。' };
		}
	},
	{
		id: 13,
		title: '第十三关 · 货架空位盘点',
		task: '列出每个货架的编码与剩余空位（capacity - current_count）计算列，按空位从少到多排序。建议给计算列起别名 space。',
		hint: 'SELECT shelf_code, (capacity - current_count) AS space FROM shelves ORDER BY space ASC',
		sql: 'SELECT shelf_code, (capacity - current_count) AS space FROM shelves\nORDER BY space ASC',
		topicId: 'sql',
		chapter: '连接查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['C-01', 28],
				['C-02', 29],
				['B-01', 37],
				['B-02', 39],
				['A-01', 48],
				['A-02', 48]
			]);
			return ok
				? { ok: true, reason: '6 组货架空位计算+排序正确。' }
				: { ok: false, reason: '应为 C-01 28 / C-02 29 / B-01 37 / B-02 39 / A-01 48 / A-02 48——表达式列 + ORDER BY 别名。' };
		}
	},
	{
		id: 14,
		title: '第十四关 · 取件耗时分析',
		task: '算出每个「已取件」包裹从到达到取件经过的小时数（单号+小时数）。SQLite 用 (julianday(pickup_time) - julianday(arrival_time)) * 24。',
		hint: 'CAST((julianday(pickup_time) - julianday(arrival_time)) * 24 AS INTEGER)',
		sql: "SELECT tracking_no, CAST((julianday(pickup_time) - julianday(arrival_time)) * 24 AS INTEGER) AS hours\nFROM packages\nWHERE status = '已取件'",
		topicId: 'sql',
		chapter: '连接查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['SF2026001', 5],
				['JD2026001', 5],
				['SF2026004', 9]
			]);
			return ok
				? { ok: true, reason: '3 件已取件包裹的耗时计算正确（5/5/9 小时）。' }
				: { ok: false, reason: '应为 SF2026001 5 / JD2026001 5 / SF2026004 9——julianday 差值 ×24 再取整。' };
		}
	},
	{
		id: 15,
		title: '第十五关 · 投诉追踪单',
		task: '运营要追每一条未解决投诉对应的包裹：列出快递单号、投诉类型、投诉状态，按投诉时间倒序。（需要 JOIN complaints 与 packages）',
		hint: "FROM complaints c JOIN packages p ON p.package_id = c.package_id WHERE c.status != '已解决' ORDER BY c.created_at DESC",
		sql: "SELECT p.tracking_no, c.complaint_type, c.status\nFROM complaints c\nJOIN packages p ON p.package_id = c.package_id\nWHERE c.status != '已解决'\nORDER BY c.created_at DESC",
		topicId: 'join',
		chapter: '连接查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['ZT2026003', '通知不及时', '处理中'],
				['YD2026001', '超时未处理', '待处理'],
				['YD2026001', '通知不及时', '待处理']
			]);
			return ok
				? { ok: true, reason: 'JOIN 联查 3 条未解决投诉，附带包裹单号。' }
				: { ok: false, reason: '应为 3 行且按投诉时间倒序——两表用 package_id 连接，排除已解决。' };
		}
	},
	{
		id: 16,
		title: '第十六关 · 闪电取件冠军',
		task: '谁取件最快？找出「已取件」包裹里从到达到取件耗时最短的一人（姓名+小时数），LIMIT 1。',
		hint: 'ORDER BY 计算列 ASC LIMIT 1',
		sql: "SELECT recipient_name, CAST((julianday(pickup_time) - julianday(arrival_time)) * 24 AS INTEGER) AS diff\nFROM packages\nWHERE status = '已取件'\nORDER BY diff ASC\nLIMIT 1",
		topicId: 'sql',
		chapter: '连接查询',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [['张三', 5]]);
			return ok
				? { ok: true, reason: '闪电冠军：张三（5 小时取件）。' }
				: { ok: false, reason: '应为 张三 5 小时——ORDER BY 耗时升序 + LIMIT 1。' };
		}
	},
	{
		id: 17,
		title: '第十七关 · 学生取件（写）',
		task: '李四凭取件码 173042 取件：把该包裹状态改为「已取件」、取件时间写 2026-03-27 10:00:00，并把 1 号货架的 current_count 减 1。',
		hint: "UPDATE packages SET ... WHERE pickup_code = '173042'；再 UPDATE shelves ...",
		sql: "UPDATE packages SET status = '已取件', pickup_time = '2026-03-27 10:00:00'\nWHERE pickup_code = '173042';\n\nUPDATE shelves SET current_count = current_count - 1 WHERE shelf_id = 1;\n\nSELECT status FROM packages WHERE pickup_code = '173042'",
		topicId: 'update',
		chapter: '数据更新',
		judge: ({ queryTable }) => {
			const pkg = queryTable(`SELECT status FROM packages WHERE pickup_code = '173042'`);
			const shelf = queryTable(`SELECT current_count FROM shelves WHERE shelf_id = 1`);
			const ok = resultSetEquals(pkg, [['已取件']]) && resultSetEquals(shelf, [[1]]);
			return ok
				? { ok: true, reason: '取件完成：包裹状态与货架库存同步更新。' }
				: { ok: false, reason: '包裹状态应为 已取件，且 1 号货架 current_count 减为 1——两条 UPDATE 都要执行。' };
		}
	},
	{
		id: 18,
		title: '第十八关 · 清理已解决投诉（删）',
		task: '已解决的投诉不用留：删除 complaint_id = 2 的投诉记录。',
		hint: 'DELETE FROM complaints WHERE complaint_id = 2',
		sql: 'DELETE FROM complaints WHERE complaint_id = 2;\n\nSELECT COUNT(*) FROM complaints',
		topicId: 'update',
		chapter: '数据更新',
		judge: ({ queryTable }) => {
			const total = queryTable('SELECT COUNT(*) FROM complaints');
			const gone = queryTable('SELECT COUNT(*) FROM complaints WHERE complaint_id = 2');
			const ok = resultSetEquals(total, [[3]]) && resultSetEquals(gone, [[0]]);
			return ok
				? { ok: true, reason: '删除成功：投诉表剩 3 条，2 号已清除。' }
				: { ok: false, reason: '投诉表应剩 3 条且不再有 complaint_id=2——检查 DELETE 的 WHERE。' };
		}
	},
	{
		id: 19,
		title: '第十九关 · 货架撤并（写）',
		task: 'C-02 货架要撤了：把 6 号货架上的所有「待取件」包裹转移到 5 号货架，然后删除 6 号货架。完成后待取件在 5 号货架的应有 3 件。',
		hint: 'UPDATE packages SET shelf_id = 5 WHERE shelf_id = 6；再 DELETE FROM shelves WHERE shelf_id = 6',
		sql: 'UPDATE packages SET shelf_id = 5 WHERE shelf_id = 6;\nDELETE FROM shelves WHERE shelf_id = 6;\n\nSELECT shelf_id, COUNT(*) FROM packages WHERE status = \'待取件\' GROUP BY shelf_id',
		topicId: 'update',
		chapter: '数据更新',
		judge: ({ queryTable }) => {
			const moved = queryTable(
				`SELECT COUNT(*) FROM packages WHERE shelf_id = 5 AND status = '待取件'`
			);
			const gone = queryTable('SELECT COUNT(*) FROM shelves WHERE shelf_id = 6');
			const ok = resultSetEquals(moved, [[3]]) && resultSetEquals(gone, [[0]]);
			return ok
				? { ok: true, reason: '撤并完成：3 件待取件转移至 5 号货架，6 号货架已删。' }
				: { ok: false, reason: '应先 UPDATE 转移包裹（5 号货架待取件 3 件），再 DELETE 6 号货架——顺序不能反。' };
		}
	},
	{
		id: 20,
		title: '第二十关 · 待取件视图',
		task: '前台常用「待取件」清单：创建一个名为 待取件视图 的视图（含 tracking_no, recipient_name, pickup_code 三列，只看待取件），然后 SELECT 全部验证。',
		hint: "CREATE VIEW 待取件视图 AS SELECT tracking_no, recipient_name, pickup_code FROM packages WHERE status = '待取件'",
		sql: "CREATE VIEW 待取件视图 AS\nSELECT tracking_no, recipient_name, pickup_code FROM packages\nWHERE /* 状态筛选 */;\n\nSELECT * FROM 待取件视图",
		topicId: 'subquery',
		chapter: '视图与约束',
		judge: ({ rows }) => {
			const ok = resultSetEquals({ columns: [], rows }, [
				['ZT2026001', '李四', '173042'],
				['YT2026001', '王五', '294518'],
				['SF2026002', '周八', '715384'],
				['YT2026002', '郑十', '346172'],
				['SF2026003', '张三', '502847'],
				['JD2026002', '李四', '693157'],
				['YD2026002', '林十二', '275483'],
				['ZT2026004', '赵六', '429561'],
				['YT2026003', '张三', '657238']
			]);
			return ok
				? { ok: true, reason: '视图创建并查询成功：9 件待取件一屏掌握。' }
				: { ok: false, reason: '应为 9 行待取件（单号/收件人/取件码）——CREATE VIEW 后直接 SELECT * FROM 待取件视图。' };
		}
	},
	{
		id: 21,
		title: '第二十一关 · 待取与超期合集',
		task: '用 UNION 把「待取件」和「超期」包裹的单号合成一份去重清单。',
		hint: "SELECT tracking_no FROM packages WHERE status = '待取件' UNION SELECT tracking_no FROM packages WHERE status = '超期'",
		sql: "SELECT tracking_no FROM packages WHERE status = '待取件'\nUNION\nSELECT tracking_no FROM packages WHERE status = '超期'",
		topicId: 'union-set',
		chapter: '集合与视图',
		judge: ({ rows }) => {
			const ok = resultSetEquals(
				{ columns: [], rows },
				[
					['YD2026001'],
					['ZT2026001'],
					['ZT2026003'],
					['YT2026001'],
					['YT2026002'],
					['YT2026003'],
					['SF2026002'],
					['SF2026003'],
					['JD2026002'],
					['YD2026002'],
					['ZT2026004']
				],
				{ ordered: false }
			);
			return ok
				? { ok: true, reason: 'UNION 去重合并 11 个单号（9 待取 + 2 超期）。' }
				: { ok: false, reason: '应为 11 个去重单号（9 待取 + 2 超期）——UNION 自动去重。' };
		}
	}
];
