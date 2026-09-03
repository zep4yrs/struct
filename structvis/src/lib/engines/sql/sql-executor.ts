/**
 * sql.js 执行器加载器 — M2「结果演化」架构的唯一真实执行入口（架构定调见 spark-output/sqljs-viz-architecture.md）。
 *
 * 设计：
 * - sql.js 为可选依赖（wasm 需随站点分发）：`npm install sql.js && node scripts/setup-sqljs.mjs`
 *   会把 dist 产物复制到 static/sqljs/，此后所有剧本页自动切换为真实 SQL 执行；
 * - 未安装时加载器返回 null，剧本引擎回落到各帧的 `expected` 静态结果表
 *   （帧数据本身经过单测校验，页面功能完整可用，仅标题注明「静态演示帧」）；
 * - 加载方式为同源静态脚本 <script> 注入（sql.js UMD 产物挂到 window.initSqlJs），
 *   不使用动态 import 裸说明符——未安装依赖时构建与运行均零影响；
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

/** 等待同源 sql-wasm.js 加载完成（UMD → window.initSqlJs） */
function injectScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const el = document.createElement('script');
		el.src = src;
		el.onload = () => resolve();
		el.onerror = () => reject(new Error('sql-wasm.js 加载失败'));
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
				await injectScript(`${base}/sqljs/sql-wasm.js`);
			}
			const factory = w.initSqlJs as
				((cfg: { locateFile: (f: string) => string }) => Promise<SqlJsModule>) | undefined;
			if (!factory) return null;
			return await factory({ locateFile: (f) => `${base}/sqljs/${f}` });
		} catch {
			return null; // sql.js 未安装（static/sqljs/ 不存在）→ 剧本引擎走静态帧
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
