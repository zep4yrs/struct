import type { DemoScriptItem } from '$lib/engines/algorithm/types';

/**
 * 讲授剧本外部化 — 教师可导出/导入自定义讲解词 JSON（纯文件级分享，静态部署友好）。
 *
 * 剧本文件格式：
 * {
 *   "version": 1,
 *   "name": "我的快速排序讲法",
 *   "items": [{ "type": "compare", "narration": "比较两个数…" }, ...]
 * }
 */

export interface ScriptFile {
	version: number;
	name?: string;
	items: DemoScriptItem[];
}

const VALID_TYPES = new Set([
	'init',
	'compare',
	'swap',
	'pivot-select',
	'partition-start',
	'partition-end',
	'recurse-enter',
	'recurse-exit',
	'edge-candidate',
	'edge-select',
	'edge-reject',
	'complete',
	'default'
]);

/** localStorage key：按引擎名隔离（引擎名在播放器生命周期内稳定） */
export const scriptStorageKey = (engineName: string): string => `structvis:script:${engineName}`;

/** 解析并校验剧本 JSON；失败抛 Error（展示在 UI） */
export function parseScript(json: string): ScriptFile {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		throw new Error('剧本文件不是有效的 JSON');
	}
	if (parsed === null || typeof parsed !== 'object') throw new Error('剧本格式不正确');
	const obj = parsed as Record<string, unknown>;
	if (obj.version !== 1) throw new Error('不支持的剧本版本');
	const items = obj.items;
	if (!Array.isArray(items) || items.length === 0) throw new Error('剧本中没有旁白条目');
	for (const it of items) {
		if (it === null || typeof it !== 'object') throw new Error('剧本条目格式不正确');
		const t = (it as Record<string, unknown>).type;
		const n = (it as Record<string, unknown>).narration;
		if (typeof t !== 'string' || !VALID_TYPES.has(t))
			throw new Error(`未知的步骤类型：${String(t)}`);
		if (typeof n !== 'string' || n.trim().length === 0) throw new Error('旁白文本不能为空');
	}
	return {
		version: 1,
		name: typeof obj.name === 'string' ? obj.name : undefined,
		items: items as DemoScriptItem[]
	};
}

/** 序列化为下载用的 JSON 文本 */
export function serializeScript(items: DemoScriptItem[], name?: string): string {
	return JSON.stringify({ version: 1, name, items }, null, 2);
}

/** 读取当前引擎的剧本覆盖（无则 null） */
export function loadScriptOverride(engineName: string): DemoScriptItem[] | null {
	try {
		const raw = localStorage.getItem(scriptStorageKey(engineName));
		if (!raw) return null;
		return parseScript(raw).items;
	} catch {
		return null; // 损坏数据按无覆盖处理
	}
}

/** 保存/清除剧本覆盖（null 表示重置为引擎默认） */
export function saveScriptOverride(engineName: string, items: DemoScriptItem[] | null): void {
	try {
		if (items === null) {
			localStorage.removeItem(scriptStorageKey(engineName));
		} else {
			localStorage.setItem(scriptStorageKey(engineName), serializeScript(items));
		}
	} catch {
		// 存储失败静默（如隐私模式）
	}
}
