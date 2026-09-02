/**
 * sql.js 可选依赖安装脚本 — 把 sql.js 的 dist 产物复制到 static/sqljs/，
 * 供浏览器端加载（见 src/lib/engines/sql/sql-executor.ts）。
 *
 * 用法：npm install sql.js && node scripts/setup-sqljs.mjs
 * 未安装 sql.js 时此脚本静默退出（剧本页回落静态演示帧）。
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'node_modules', 'sql.js', 'dist');
const dest = path.join(root, 'static', 'sqljs');

if (!existsSync(path.join(src, 'sql-wasm.js'))) {
	console.log('[setup-sqljs] sql.js 未安装 — 跳过（剧本页使用静态演示帧）。');
	console.log('[setup-sqljs] 启用真实执行：npm install sql.js && node scripts/setup-sqljs.mjs');
	process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const f of ['sql-wasm.js', 'sql-wasm.wasm']) {
	copyFileSync(path.join(src, f), path.join(dest, f));
	console.log('[setup-sqljs] 已复制', f, '→ static/sqljs/');
}
console.log('[setup-sqljs] 完成：所有 SQL 剧本页现已逐帧真实执行。');
