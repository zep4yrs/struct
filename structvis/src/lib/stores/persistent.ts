import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

/** 当前存储格式版本：数据结构变更（增删字段）时 +1 并在 migrations 补迁移函数 */
const STORAGE_VERSION = 1;

/**
 * 版本迁移注册表：migrations[v] 把 v 版数据迁移到 v+1 版。
 * 无迁移需求时保持空表，机制就位即可。
 */
const migrations: Record<number, (data: unknown) => unknown> = {};

/** 存储信封：{ __sv: 版本号, data: 实际数据 }。旧版（无信封）数据视为 v1 原样读取。 */
interface StoredEnvelope {
	__sv: number;
	data: unknown;
}

/**
 * 读取并迁移到当前版本；任何解析/迁移失败都回退默认值。
 * 顶层字段缺失时与默认值浅合并——旧数据缺新字段（如 dailyActivity）也能正常读取。
 */
function readStored<T>(raw: string, fallback: T): T {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (parsed !== null && typeof parsed === 'object' && '__sv' in (parsed as object)) {
			const env = parsed as StoredEnvelope;
			let data = env.data;
			let v = env.__sv;
			if (!Number.isInteger(v) || v < 1) throw new Error('bad version');
			while (v < STORAGE_VERSION) {
				const migrate = migrations[v];
				if (!migrate) throw new Error('no migration for v' + v);
				data = migrate(data);
				v++;
			}
			return mergeDefaults(fallback, data);
		}
		// 旧格式（无信封）：视为当前版本，同样补默认字段
		return mergeDefaults(fallback, parsed);
	} catch {
		return fallback;
	}
}

/** 浅合并：data 缺失的顶层字段用默认值补齐（数组/对象字段整体保留原值） */
function mergeDefaults<T>(fallback: T, data: unknown): T {
	if (
		fallback !== null &&
		typeof fallback === 'object' &&
		!Array.isArray(fallback) &&
		data !== null &&
		typeof data === 'object' &&
		!Array.isArray(data)
	) {
		return { ...(fallback as object), ...(data as object) } as T;
	}
	return (data ?? fallback) as T;
}

/**
 * 带 localStorage 持久化的 writable store
 * 在服务端渲染时返回默认值，客户端挂载后从 localStorage 读取。
 * 写入采用版本信封 { __sv, data }；读取时对旧格式与迁移做兼容（见 readStored）。
 */
export function persistentStore<T>(key: string, initialValue: T): Writable<T> {
	const store = writable<T>(initialValue);

	// 只在浏览器环境读写 localStorage
	if (browser) {
		// 从 localStorage 读取初始值（含版本迁移）
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			store.set(readStored<T>(stored, initialValue));
		}

		// 订阅变化，写入 localStorage（版本信封格式）
		store.subscribe((value) => {
			try {
				const envelope: StoredEnvelope = { __sv: STORAGE_VERSION, data: value };
				localStorage.setItem(key, JSON.stringify(envelope));
			} catch {
				// 存储失败（比如空间不足）静默处理
			}
		});
	}

	return store;
}
