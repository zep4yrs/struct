# 一次性：Level 接口加 sql 字段 + 21 关 hint 后插入对应骨架（驿站库 SQLite 方言）
import io
import re

p = 'src/lib/engines/sql/scripts/workbench-levels.ts'
s = io.open(p, encoding='utf-8').read()

old_iface = """interface Level {
	id: number;
	title: string;
	task: string;
	hint: string;
	topicId: string;"""
new_iface = """interface Level {
	id: number;
	title: string;
	task: string;
	hint: string;
	/** 编辑器预填骨架（SQLite 方言，驿站库） */
	sql: string;
	topicId: string;"""
assert old_iface in s, 'iface'
s = s.replace(old_iface, new_iface, 1)

stubs = {
	1: "SELECT tracking_no, recipient_name FROM packages\nWHERE /* 状态筛选 */\nORDER BY arrival_time ASC",
	2: "SELECT * FROM packages\nWHERE /* 快递公司等值 */",
	3: "SELECT tracking_no, recipient_name FROM packages\nWHERE tracking_no LIKE 'ZT%'",
	4: "SELECT recipient_name FROM packages\nWHERE pickup_code = '502847'",
	5: "SELECT * FROM packages\nWHERE recipient_name = '张三'",
	6: "SELECT tracking_no, recipient_name FROM packages\nWHERE status = '待取件'\n  AND julianday('2026-03-27') - julianday(arrival_time) > 1",
	7: "SELECT '【通知】' || recipient_name || '，单号' || tracking_no || '，取件码：' || pickup_code\nFROM packages\nWHERE status = '待取件'",
	8: "-- 先建索引（分号分隔可多句）\nCREATE INDEX idx_pickup ON packages(pickup_code);\n\nSELECT * FROM packages WHERE pickup_code = '502847'",
	9: "SELECT DISTINCT courier_company FROM packages",
	10: "SELECT tracking_no, courier_company FROM packages\nWHERE status = '待取件'\n  AND courier_company IN ('顺丰', '京东')",
	11: "SELECT package_id, tracking_no FROM packages\nWHERE package_id BETWEEN 5 AND 10",
	12: "SELECT tracking_no, COALESCE(pickup_time, '尚未取件') FROM packages\nWHERE status = '待取件'",
	13: "SELECT shelf_code, (capacity - current_count) AS space FROM shelves\nORDER BY space ASC",
	14: "SELECT tracking_no, CAST((julianday(pickup_time) - julianday(arrival_time)) * 24 AS INTEGER) AS hours\nFROM packages\nWHERE status = '已取件'",
	15: "SELECT p.tracking_no, c.complaint_type, c.status\nFROM complaints c\nJOIN packages p ON p.package_id = c.package_id\nWHERE c.status != '已解决'\nORDER BY c.created_at DESC",
	16: "SELECT recipient_name, CAST((julianday(pickup_time) - julianday(arrival_time)) * 24 AS INTEGER) AS diff\nFROM packages\nWHERE status = '已取件'\nORDER BY diff ASC\nLIMIT 1",
	17: "UPDATE packages SET status = '已取件', pickup_time = '2026-03-27 10:00:00'\nWHERE pickup_code = '173042';\n\nUPDATE shelves SET current_count = current_count - 1 WHERE shelf_id = 1;\n\nSELECT status FROM packages WHERE pickup_code = '173042'",
	18: "DELETE FROM complaints WHERE complaint_id = 2;\n\nSELECT COUNT(*) FROM complaints",
	19: "UPDATE packages SET shelf_id = 5 WHERE shelf_id = 6;\nDELETE FROM shelves WHERE shelf_id = 6;\n\nSELECT shelf_id, COUNT(*) FROM packages WHERE status = '待取件' GROUP BY shelf_id",
	20: "CREATE VIEW 待取件视图 AS\nSELECT tracking_no, recipient_name, pickup_code FROM packages\nWHERE status = '待取件';\n\nSELECT * FROM 待取件视图",
	21: "SELECT tracking_no FROM packages WHERE status = '待取件'\nUNION\nSELECT tracking_no FROM packages WHERE status = '超期'",
}

for lid, sql in stubs.items():
	block_re = re.compile(r'(id: ' + str(lid) + r',\n(?:.*\n)*?\t\thint: )(.*?\n)')
	m = block_re.search(s)
	assert m, f'hint for {lid}'
	sql_ts = sql.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
	s = s[: m.end(1)] + f"'{sql_ts}',\n\t\t" + s[m.end(1) :]

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('levels sql fields ok')

p2 = 'src/routes/db/workbench/+page.svelte'
s2 = io.open(p2, encoding='utf-8').read()
m2 = re.search(
	r'\tfunction defaultSqlFor\(l: \(typeof LEVELS\)\[number\]\): string \{.*?\n\t\}\n', s2, re.S
)
assert m2, 'defaultSqlFor block'
s2 = (
	s2[: m2.start()]
	+ """	function defaultSqlFor(l: (typeof LEVELS)[number]): string {
		// 骨架内聚在关卡定义（Level.sql），驿站库 SQLite 方言
		return l.sql ?? '-- 写你的 SQL';
	}
"""
	+ s2[m2.end() :]
)
io.open(p2, 'w', encoding='utf-8', newline='\n').write(s2)
print('page ok')
