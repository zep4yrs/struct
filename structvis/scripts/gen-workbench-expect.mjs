// 一次性工具：用 sql.js 实跑 express-station 种子 + 各关 reference SQL，输出判分期望结果集
import { readFileSync } from 'node:fs';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();
db.run(readFileSync('src/lib/engines/sql/seeds/express-station.sql', 'utf-8'));

function q(sql) {
	const stmt = db.prepare(sql);
	const columns = stmt.getColumnNames();
	const rows = [];
	while (stmt.step()) rows.push(stmt.get());
	stmt.free();
	return { columns, rows };
}

const REFS = {
	L1: `SELECT tracking_no, recipient_name FROM packages WHERE status = '待取件' ORDER BY arrival_time ASC`,
	L2: `SELECT * FROM packages WHERE courier_company = '顺丰'`,
	L3: `SELECT tracking_no, recipient_name FROM packages WHERE status = '待取件' AND julianday('2026-03-27') - julianday(arrival_time) > 3`,
	L4: `SELECT recipient_name FROM packages WHERE pickup_code = '502847'`,
	L5: `SELECT package_id, tracking_no, courier_company, shelf_id FROM packages WHERE recipient_name = '张三'`,
	L6: `SELECT tracking_no, recipient_name, recipient_phone FROM packages WHERE recipient_phone LIKE '138000%'`,
	L7: `SELECT tracking_no, recipient_name FROM packages WHERE pickup_code = '173042'`,
	L8: `SELECT DISTINCT courier_company FROM packages`,
	L9: `SELECT tracking_no, courier_company FROM packages WHERE status = '待取件' AND courier_company IN ('顺丰', '京东')`,
	L10: `SELECT package_id, tracking_no FROM packages WHERE package_id BETWEEN 5 AND 10`,
	L11: `SELECT '【通知】' || recipient_name || '，单号' || tracking_no || '，取件码：' || pickup_code FROM packages WHERE status = '待取件'`,
	L12: `SELECT tracking_no, COALESCE(pickup_time, '尚未取件') FROM packages WHERE status = '待取件'`,
	L13: `SELECT s.shelf_code, (s.capacity - s.current_count) AS space FROM shelves s ORDER BY space ASC`,
	L14: `SELECT p.tracking_no, CAST((julianday(p.pickup_time) - julianday(p.arrival_time)) * 24 AS INTEGER) AS hours FROM packages p WHERE p.status = '已取件'`,
	L15: `SELECT p.tracking_no, c.complaint_type, c.status FROM complaints c JOIN packages p ON p.package_id = c.package_id WHERE c.status != '已解决' ORDER BY c.created_at DESC`,
	L16: `SELECT recipient_name, CAST((julianday(pickup_time) - julianday(arrival_time)) * 24 AS INTEGER) AS diff FROM packages WHERE status = '已取件' ORDER BY diff ASC LIMIT 1`,
	L20: `CREATE VIEW 待取件视图 AS SELECT tracking_no, recipient_name, pickup_code FROM packages WHERE status = '待取件'`
};

for (const [k, sql] of Object.entries(REFS)) {
	try {
		if (k === 'L20') {
			db.run(sql);
			const r = q('SELECT tracking_no, recipient_name, pickup_code FROM 待取件视图');
			console.log(k, JSON.stringify(r));
			continue;
		}
		const r = q(sql);
		console.log(k, JSON.stringify(r));
	} catch (e) {
		console.log(k, 'ERR:', String(e).slice(0, 120));
	}
}

// state 判分基准（L17/L18/L19 数据更新后的表状态）
db.run(`UPDATE packages SET status = '已取件', pickup_time = '2026-03-27 10:00:00' WHERE pickup_code = '173042'`);
db.run(`UPDATE shelves SET current_count = current_count - 1 WHERE shelf_id = 1`);
console.log('L17_packages_1:', JSON.stringify(q(`SELECT status, pickup_time FROM packages WHERE pickup_code = '173042'`)));
console.log('L17_shelf1:', JSON.stringify(q(`SELECT current_count FROM shelves WHERE shelf_id = 1`)));
db.run(`DELETE FROM complaints WHERE complaint_id = 2`);
console.log('L18_complaints:', JSON.stringify(q(`SELECT COUNT(*) FROM complaints`)));
console.log('L18_id2:', JSON.stringify(q(`SELECT COUNT(*) FROM complaints WHERE complaint_id = 2`)));
db.run(`UPDATE packages SET shelf_id = 5 WHERE shelf_id = 6`);
db.run(`DELETE FROM shelves WHERE shelf_id = 6`);
console.log('L19_moved:', JSON.stringify(q(`SELECT COUNT(*) FROM packages WHERE shelf_id = 5 AND status = '待取件'`)));
console.log('L19_shelf6:', JSON.stringify(q(`SELECT COUNT(*) FROM shelves WHERE shelf_id = 6`)));
