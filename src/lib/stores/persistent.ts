import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

/**
 * 带 localStorage 持久化的 writable store
 * 在服务端渲染时返回默认值，客户端挂载后从 localStorage 读取
 */
export function persistentStore<T>(key: string, initialValue: T): Writable<T> {
	const store = writable<T>(initialValue);

	// 只在浏览器环境读写 localStorage
	if (browser) {
		// 从 localStorage 读取初始值
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			try {
				store.set(JSON.parse(stored) as T);
			} catch {
				// 解析失败用默认值
				store.set(initialValue);
			}
		}

		// 订阅变化，写入 localStorage
		store.subscribe((value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {
				// 存储失败（比如空间不足）静默处理
			}
		});
	}

	return store;
}
