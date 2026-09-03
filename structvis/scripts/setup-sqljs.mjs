/**
 * sql.js 本地启用脚本 — 把官方 dist 产物复制到 static/sqljs/（gitignored，不入库），
 * 供离线开发与 e2e 使用（见 src/lib/engines/sql/sql-executor.ts）。
 *
 * 用法：npm install sql.js && node scripts/setup-sqljs.mjs
 * 或直接从 CDN 下载：见脚本内 SQLJS_CDN。
 * 未下载时此脚本静默退出——加载器会自动回退版本锁定的 CDN（带 SRI 校验）。
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SQLJS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'node_modules', 'sql.js', 'dist');
const dest = path.join(root, 'static', 'sqljs');

if (!existsSync(path.join(src, 'sql-wasm.js'))) {
	console.log('[setup-sqljs] node_modules 内无 sql.js — 跳过（生产运行时自动回退 pinned CDN）。');
	console.log(`[setup-sqljs] 离线启用方式：npm install sql.js && node scripts/setup-sqljs.mjs`);
	console.log(`[setup-sqljs] 或直接下载 ${SQLJS_CDN}/{sql-wasm.js,sql-wasm.wasm} 到 static/sqljs/`);
	process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const f of ['sql-wasm.js', 'sql-wasm.wasm']) {
	copyFileSync(path.join(src, f), path.join(dest, f));
	console.log('[setup-sqljs] 已复制', f, '→ static/sqljs/');
}
console.log(
	'[setup-sqljs] 完成：本地（含离线）剧本页真实执行已就绪；生产环境由加载器自动回退 pinned CDN。'
);
