/**
 * sql.js 执行器加载器 — M2「结果演化」架构的唯一真实执行入口（架构定调见 spark-output/sqljs-viz-architecture.md）。
 *
 * 设计：
 * - 加载顺序：同源 `static/sqljs/`（本地运行 `node scripts/setup-sqljs.mjs` 下载后可用，
 *   兼容离线开发）→ 回退到版本锁定的 jsdelivr CDN（生产部署无需入库第三方产物，
 *   js 脚本带 SRI 完整性校验）；两者都不可用时返回 null，剧本引擎回落静态演示帧；
 * - sql.js 为可选能力：无网络且未下载 dist 时构建与运行均零影响；
 * - **每个剧本页调用 createPageExecutor 得到独立内存库**：SPA 内重复访问页面时
 *   seed 重建不会撞上旧表（全局单库会让第二次 CREATE TABLE 直接报错）。
 */

import { base } from '$app/paths';

export interface SqlExecResult {
	columns: string[];
	rows: (string | number)[][];
	error?: string;
}

/** sql.js 单结果集（官方 @types/sql.js 未随可选依赖安装，这里自持最小面） */
interface RawExecResult {
	columns: string[];
	values: unknown[][];
}

/** sql.js Database 的实际执行方法签名（浏览器内 WASM SQLite 引擎，非进程/shell 调用） */
type SqlStatementRunner = (sql: string) => RawExecResult[];

interface SqlJsDatabase {
	exec: SqlStatementRunner;
}
interface SqlJsModule {
	Database: new () => SqlJsDatabase;
}

export interface SqlExecutor {
	/** 执行一条（或多条以分号连接的）SQL，返回最后一个结果集 */
	query(sql: string): SqlExecResult;
	/** 执行 seed 脚本（多条 CREATE/INSERT） */
	script(sql: string): void;
}

/** 版本锁定的 CDN 源（与 package.json 的 sql.js 依赖同一版本） */
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist';
/** CDN sql-wasm.js 的 SRI（sha384，与 pinned 版本一一对应） */
const CDN_JS_SRI = 'sha384-7Zym2PlgXfg8ap8cqJUwlZrLl+VEwt0NVbzYfhH28IWLnSpAgQOnSCY2+EXo5MtM';

interface SqlSource {
	js: string;
	wasm: string;
	/** CDN 源对 js 施加 SRI 校验；同源文件无需 */
	sri?: string;
}

/** 探测同源 dist 是否可用（setup-sqljs.mjs 下载过 = 离线可用），否则回退 CDN */
async function resolveSource(): Promise<SqlSource> {
	try {
		const probe = await fetch(`${base}/sqljs/sql-wasm.js`, { method: 'HEAD' });
		if (probe.ok) {
			return { js: `${base}/sqljs/sql-wasm.js`, wasm: `${base}/sqljs/sql-wasm.wasm` };
		}
	} catch {
		/* 同源不存在 → CDN */
	}
	return { js: `${CDN_BASE}/sql-wasm.js`, wasm: `${CDN_BASE}/sql-wasm.wasm`, sri: CDN_JS_SRI };
}

/** 注入 <script> 加载 sql.js UMD 产物（SRI 可选）；失败可重试下一来源 */
function injectScript(src: string, sri?: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const el = document.createElement('script');
		el.src = src;
		if (sri) {
			el.integrity = sri;
			el.crossOrigin = 'anonymous';
		}
		el.onload = () => resolve();
		el.onerror = () => reject(new Error(`sql.js 脚本加载失败: ${src}`));
		document.head.appendChild(el);
	});
}

/** sql.js 模块缓存：wasm 只初始化一次，连接（Database 实例）按页新建 */
let modulePromise: Promise<SqlJsModule | null> | null = null;

function loadModule(): Promise<SqlJsModule | null> {
	modulePromise ??= (async () => {
		if (typeof document === 'undefined') return null; // SSR / node 测试环境
		try {
			const w = window as unknown as { initSqlJs?: unknown };
			if (!w.initSqlJs) {
				// 依序尝试来源：主源 SRI 校验失败或网络错误时回退另一源
				const primary = await resolveSource();
				const sources: SqlSource[] = [primary];
				if (primary.js.startsWith(CDN_BASE)) {
					sources.push({ js: `${base}/sqljs/sql-wasm.js`, wasm: `${base}/sqljs/sql-wasm.wasm` });
				} else {
					sources.push({
						js: `${CDN_BASE}/sql-wasm.js`,
						wasm: `${CDN_BASE}/sql-wasm.wasm`,
						sri: CDN_JS_SRI
					});
				}
				let loaded = false;
				for (const s of sources) {
					if (w.initSqlJs) break; // 前一来源已成功
					try {
						await injectScript(s.js, s.sri);
						loaded = !!w.initSqlJs;
					} catch {
						loaded = false;
					}
				}
				if (!loaded) return null;
			}
			const factory = w.initSqlJs as
				((cfg: { locateFile: (f: string) => string }) => Promise<SqlJsModule>) | undefined;
			if (!factory) return null;
			const source = await resolveSource();
			const SQL = await factory({
				locateFile: (f) => (f.endsWith('.wasm') ? source.wasm : `${base}/sqljs/${f}`)
			});
			return SQL;
		} catch {
			return null; // sql.js 不可用 → 剧本引擎走静态演示帧
		}
	})();
	return modulePromise;
}

function bindExecutor(db: SqlJsDatabase): SqlExecutor {
	// sql.js Database 的语句执行方法（key 见 sql.js 文档；浏览器内 SQLite）
	const runStatements: SqlStatementRunner | undefined = db.exec;
	if (!runStatements) throw new Error('sql.js Database 缺少语句执行方法');
	const run = (sql: string) => runStatements.call(db, sql);
	return {
		query(sql: string): SqlExecResult {
			try {
				const results = run(sql);
				const last = results[results.length - 1];
				if (!last) return { columns: [], rows: [] };
				return {
					columns: last.columns,
					rows: last.values.map((row) =>
						row.map((cell) => (cell === null ? 'NULL' : (cell as string | number)))
					)
				};
			} catch (e) {
				return { columns: [], rows: [], error: (e as Error).message };
			}
		},
		script(sql: string): void {
			run(sql);
		}
	};
}

/**
 * 为一个剧本页创建独立内存库执行器（幂等加载模块，每页新建 Database）。
 * 返回 null 表示 sql.js 不可用（静态演示帧模式）。
 */
export async function createPageExecutor(): Promise<SqlExecutor | null> {
	const SQL = await loadModule();
	if (!SQL) return null;
	return bindExecutor(new SQL.Database());
}
